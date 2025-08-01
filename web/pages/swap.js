'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, RefreshCw, AlertCircle, CheckCircle, Wallet, Shield, Zap, Star } from 'lucide-react';
import OneInchClient from '../lib/1inch-client';
import ApiClient from '../lib/api-client';
import { useCombinedWallet } from '../lib/useCombinedWallet';
import WalletConnectionButton from '../components/WalletConnectionButton';
import config from '../lib/config';
import Image from 'next/image';

export default function Swap() {
  const {
    // Ethereum wallet
    ethConnected,
    ethAddress,
    ethChainId,
    ethLoading,
    ethError,
    connectEth,
    disconnectEth,
    formatEthAddress,
    isCorrectEthNetwork,
    switchToSepolia,
    
    // Stellar wallet
    stellarConnected,
    stellarPublicKey,
    stellarLoading,
    stellarError,
    connectStellar,
    disconnectStellar,
    formatStellarAddress,
    isCorrectStellarNetwork,
    
    // Combined state
    bothConnected,
    canSwap,
    isLoading,
    error
  } = useCombinedWallet();

  const [fromToken, setFromToken] = useState('ETH');
  const [toToken, setToToken] = useState('XLM');
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [swapError, setSwapError] = useState(null);
  const [slippage, setSlippage] = useState(1);
  const [swapType, setSwapType] = useState('ETH_TO_STELLAR');
  const [showNetworkAlert, setShowNetworkAlert] = useState(false);

  const oneInchClient = new OneInchClient();
  const apiClient = new ApiClient();

  // Token addresses for Sepolia testnet
  const tokenAddresses = {
    'ETH': '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    'USDC': '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
    'USDT': '0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0',
    'DAI': '0x3e622317f8C93f7328350cF0B56d9eD4C620C5d6'
  };

  // Check network on connection
  useEffect(() => {
    if (ethConnected && !isCorrectEthNetwork()) {
      setShowNetworkAlert(true);
    } else {
      setShowNetworkAlert(false);
    }
  }, [ethConnected, isCorrectEthNetwork]);

  useEffect(() => {
    // Update swap type based on token selection
    if (fromToken === 'ETH' && toToken === 'XLM') {
      setSwapType('ETH_TO_STELLAR');
    } else if (fromToken === 'XLM' && toToken === 'ETH') {
      setSwapType('STELLAR_TO_ETH');
    }
  }, [fromToken, toToken]);

  const getQuote = async () => {
    if (!fromAmount || parseFloat(fromAmount) <= 0) return;

    setLoading(true);
    setSwapError(null);

    try {
      // Try to get quote from backend first
      const quoteData = await apiClient.getBestRate(fromToken, toToken, fromAmount);
      
      if (quoteData.success) {
        setQuote(quoteData.data);
        
        // Calculate output amount
        const outputDecimals = config.tokens.decimals[toToken] || 18;
        const outputAmount = parseFloat(quoteData.data.outputAmount) / Math.pow(10, outputDecimals);
        setToAmount(outputAmount.toFixed(6));
      } else {
        // Fallback to 1inch client
        const fromAddress = tokenAddresses[fromToken];
        const toAddress = tokenAddresses[toToken];
        
        if (!fromAddress || !toAddress) {
          throw new Error('Unsupported token pair');
        }
        
        // Convert amount to wei (18 decimals for ETH, 6 for USDC)
        const decimals = config.tokens.decimals[fromToken] || 18;
        const amountInWei = (parseFloat(fromAmount) * Math.pow(10, decimals)).toString();

        const quoteData = await oneInchClient.getQuote(
          fromAddress,
          toAddress,
          amountInWei
        );

        setQuote(quoteData);
        
        // Calculate output amount
        const outputDecimals = config.tokens.decimals[toToken] || 18;
        const outputAmount = parseFloat(quoteData.dstAmount) / Math.pow(10, outputDecimals);
        setToAmount(outputAmount.toFixed(6));
      }

    } catch (error) {
      console.error('Error getting quote:', error);
      setSwapError('Failed to get quote. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (fromAmount && parseFloat(fromAmount) > 0) {
        getQuote();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [fromAmount, fromToken, toToken]);

  const handleAmountChange = (value) => {
    setFromAmount(value);
    setToAmount('');
    setQuote(null);
  };

  const handleTokenSwap = () => {
    setFromToken(toToken);
    setToToken(fromToken);
    setFromAmount(toAmount);
    setToAmount('');
    setQuote(null);
  };

  const validateInput = () => {
    if (!fromAmount || parseFloat(fromAmount) <= 0) {
      return 'Please enter a valid amount';
    }
    if (!bothConnected) {
      return 'Please connect both Ethereum and Stellar wallets';
    }
    if (!quote) {
      return 'Please wait for quote to load';
    }
    if (parseFloat(fromAmount) < config.ui.minSwapAmount) {
      return `Minimum swap amount is ${config.ui.minSwapAmount} ${fromToken}`;
    }
    if (parseFloat(fromAmount) > config.ui.maxSwapAmount) {
      return `Maximum swap amount is ${config.ui.maxSwapAmount} ${fromToken}`;
    }
    return null;
  };

  const handleReviewSwap = async () => {
    const validationError = validateInput();
    if (validationError) {
      setSwapError(validationError);
      return;
    }

    // Navigate to review page with swap data
    const swapData = {
      fromToken,
      toToken,
      fromAmount,
      toAmount,
      quote,
      slippage,
      ethAddress,
      stellarPublicKey,
      swapType,
      contractAddress: config.ethereum.htlcContractAddress
    };

    // Store in sessionStorage for review page
    sessionStorage.setItem('swapData', JSON.stringify(swapData));
    window.location.href = '/review';
  };

  const handleRetry = () => {
    setSwapError(null);
    if (fromAmount && parseFloat(fromAmount) > 0) {
      getQuote();
    }
  };

  return (
    <div className="min-h-screen bg-[#f2f2f7]">
      {/* Top Navigation with Wallet Connection */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <Image 
                src="/icon.png" 
                alt="SynapPay Icon" 
                width={32} 
                height={32}
                className="w-8 h-8"
              />
              <Image 
                src="/synappay-logo.svg" 
                alt="SynapPay" 
                width={120} 
                height={32}
                className="h-8"
              />
            </div>

            {/* Wallet Connection Button */}
            <WalletConnectionButton />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-16 flex items-center justify-center p-4">
        <div className="p-6 md:p-8 max-w-[600px] w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-[32px] font-bold text-gray-900 mb-2">
              Cross-Chain Swap
            </h1>
            <p className="text-base md:text-[16px] text-gray-600">
              ETH ↔ XLM with 1inch Fusion+ & HTLC Security
            </p>
            {config.ethereum.htlcContractAddress && (
              <p className="text-sm text-gray-500 mt-2">
                Contract: {config.ethereum.htlcContractAddress.slice(0, 10)}...{config.ethereum.htlcContractAddress.slice(-8)}
              </p>
            )}
          </div>

          {/* Wallet Connection Status */}
          {!bothConnected ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-2xl p-6 mb-6"
            >
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center space-x-2">
                  <Wallet className="w-6 h-6 text-blue-600" />
                  <h3 className="text-lg font-semibold text-blue-900">Connect Your Wallets</h3>
                </div>
                <p className="text-blue-700 text-sm">
                  Use the wallet connection button in the top-right corner to connect both Ethereum and Stellar wallets
                </p>
              </div>
            </motion.div>
          ) : showNetworkAlert ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-6"
            >
              <div className="flex items-center space-x-2 mb-3">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <h3 className="text-lg font-semibold text-amber-900">Wrong Network</h3>
              </div>
              <p className="text-amber-700 text-sm mb-4">
                Please switch to Sepolia testnet to use SynapPay
              </p>
              <button
                onClick={switchToSepolia}
                className="bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors"
              >
                Switch to Sepolia
              </button>
            </motion.div>
          ) : null}

          {/* Connected Wallets Info */}
          {bothConnected && !showNetworkAlert && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-6"
            >
              <div className="space-y-3">
                {/* Ethereum Wallet */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-green-900">Ethereum Connected</p>
                      <p className="text-xs text-green-700 font-mono">{formatEthAddress(ethAddress)}</p>
                    </div>
                  </div>
                </div>
                
                {/* Stellar Wallet */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Star className="w-5 h-5 text-yellow-600" />
                    <div>
                      <p className="text-sm font-medium text-green-900">Stellar Connected</p>
                      <p className="text-xs text-green-700 font-mono">{formatStellarAddress(stellarPublicKey)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Swap Form */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            {/* From Token */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                You Pay
              </label>
              <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl">
                <div className="flex-1">
                  <input
                    type="number"
                    value={fromAmount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    placeholder="0.0"
                    className="w-full bg-transparent text-2xl font-semibold text-gray-900 placeholder-gray-400 focus:outline-none"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">{fromToken[0]}</span>
                  </div>
                  <select
                    value={fromToken}
                    onChange={(e) => setFromToken(e.target.value)}
                    className="bg-transparent text-lg font-semibold text-gray-900 focus:outline-none"
                  >
                    <option value="ETH">ETH</option>
                    <option value="XLM">XLM</option>
                    <option value="USDC">USDC</option>
                    <option value="USDT">USDT</option>
                    <option value="DAI">DAI</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Swap Button */}
            <div className="flex justify-center mb-6">
              <button
                onClick={handleTokenSwap}
                className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
              >
                <ArrowRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* To Token */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                You Receive
              </label>
              <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl">
                <div className="flex-1">
                  <input
                    type="text"
                    value={toAmount}
                    readOnly
                    placeholder="0.0"
                    className="w-full bg-transparent text-2xl font-semibold text-gray-900 placeholder-gray-400 focus:outline-none"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">{toToken[0]}</span>
                  </div>
                  <select
                    value={toToken}
                    onChange={(e) => setToToken(e.target.value)}
                    className="bg-transparent text-lg font-semibold text-gray-900 focus:outline-none"
                  >
                    <option value="XLM">XLM</option>
                    <option value="ETH">ETH</option>
                    <option value="USDC">USDC</option>
                    <option value="USDT">USDT</option>
                    <option value="DAI">DAI</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Quote Details */}
            {quote && (
              <div className="mb-6 p-4 bg-blue-50 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Rate</span>
                  <span className="text-sm font-semibold text-gray-900">
                    1 {fromToken} = {quote.exchangeRate?.toFixed(6) || 'N/A'} {toToken}
                  </span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Price Impact</span>
                  <span className="text-sm font-semibold text-green-600">
                    {quote.priceImpact || 0}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Network Fee</span>
                  <span className="text-sm font-semibold text-gray-900">
                    ~${quote.estimatedGas || 'Unknown'}
                  </span>
                </div>
                {quote.route && (
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm font-medium text-gray-700">Route</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {quote.route}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Slippage Settings */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Slippage Tolerance
              </label>
              <div className="flex space-x-2">
                {[0.5, 1, 2].map((value) => (
                  <button
                    key={value}
                    onClick={() => setSlippage(value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      slippage === value
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {value}%
                  </button>
                ))}
              </div>
            </div>

            {/* Error Message */}
            {swapError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <span className="text-sm text-red-700">{swapError}</span>
                </div>
                <button
                  onClick={handleRetry}
                  className="mt-2 text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  Try again
                </button>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="flex items-center space-x-2">
                  <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />
                  <span className="text-sm text-blue-700">Getting best quote...</span>
                </div>
              </div>
            )}

            {/* Review Button */}
            <motion.button
              onClick={handleReviewSwap}
              disabled={loading || !quote || !canSwap}
              className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all ${
                loading || !quote || !canSwap
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 active:scale-95'
              }`}
              whileHover={!loading && quote && canSwap ? { scale: 1.02 } : {}}
              whileTap={!loading && quote && canSwap ? { scale: 0.98 } : {}}
            >
              {loading ? 'Loading...' : 
               !bothConnected ? 'Connect Wallets' :
               !canSwap ? 'Check Networks' :
               !quote ? 'Enter Amount' : 'Review Swap'}
            </motion.button>
          </div>

          {/* Info Section */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Powered by 1inch Fusion+ • HTLC Security • Cross-Chain
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 