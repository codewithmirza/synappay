'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import OneInchClient from '../lib/1inch-client';
import ApiClient from '../lib/api-client';
import config from '../lib/config';

export default function Swap() {
  const [fromToken, setFromToken] = useState('ETH');
  const [toToken, setToToken] = useState('XLM');
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [slippage, setSlippage] = useState(1);
  const [walletAddress, setWalletAddress] = useState('');
  const [swapType, setSwapType] = useState('ETH_TO_STELLAR');

  const oneInchClient = new OneInchClient();
  const apiClient = new ApiClient();

  // Token addresses for Sepolia testnet
  const tokenAddresses = {
    'ETH': '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    'USDC': '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
    'USDT': '0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0',
    'DAI': '0x3e622317f8C93f7328350cF0B56d9eD4C620C5d6'
  };

  useEffect(() => {
    // Simulate wallet connection
    setWalletAddress('0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6');
    
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
    setError(null);

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
      setError('Failed to get quote. Please try again.');
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
    if (!walletAddress) {
      return 'Please connect your wallet';
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
      setError(validationError);
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
      walletAddress,
      swapType,
      contractAddress: config.ethereum.htlcContractAddress
    };

    // Store in sessionStorage for review page
    sessionStorage.setItem('swapData', JSON.stringify(swapData));
    window.location.href = '/review';
  };

  const handleRetry = () => {
    setError(null);
    if (fromAmount && parseFloat(fromAmount) > 0) {
      getQuote();
    }
  };

  return (
    <div className="min-h-screen bg-[#f2f2f7] flex items-center justify-center p-4">
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
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <span className="text-sm text-red-700">{error}</span>
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
            disabled={loading || !quote}
            className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all ${
              loading || !quote
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-500 text-white hover:bg-blue-600 active:scale-95'
            }`}
            whileHover={!loading && quote ? { scale: 1.02 } : {}}
            whileTap={!loading && quote ? { scale: 0.98 } : {}}
          >
            {loading ? 'Loading...' : 'Review Swap'}
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
  );
} 