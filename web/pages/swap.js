'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle, AlertCircle, Loader, Shield, Zap, Star, ArrowLeft, RefreshCw, Wallet } from 'lucide-react';
import OneInchClient from '../lib/1inch-client';
import ApiClient from '../lib/api-client';
import { useCombinedWallet } from '../lib/useCombinedWallet';
import WalletConnectionButton from '../components/WalletConnectionButton';
import config from '../lib/config';
import Image from 'next/image';

export default function Swap() {
  const {
    ethConnected,
    ethAddress,
    ethChainId,
    ethLoading,
    ethError,
    connectEth,
    disconnectEth,
    switchToSepolia,
    isCorrectEthNetwork,
    formatEthAddress,
    
    stellarConnected,
    stellarPublicKey,
    stellarLoading,
    stellarError,
    connectStellar,
    disconnectStellar,
    formatStellarAddress,
    
    bothConnected,
    canSwap,
    isLoading,
    error
  } = useCombinedWallet();

  // Initialize 1inch client
  const oneInchClient = new OneInchClient();

  const [fromToken, setFromToken] = useState('ETH');
  const [toToken, setToToken] = useState('USDC');
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [swapError, setSwapError] = useState(null);
  const [slippage, setSlippage] = useState(1);
  const [showNetworkAlert, setShowNetworkAlert] = useState(false);

  // Check network on connection
  useEffect(() => {
    if (ethConnected && !isCorrectEthNetwork()) {
      setShowNetworkAlert(true);
    } else {
      setShowNetworkAlert(false);
    }
  }, [ethConnected, isCorrectEthNetwork]);

  const handleAmountChange = async (value) => {
    setFromAmount(value);
    setToAmount('');
    setQuote(null);
    setSwapError(null);

    if (!value || parseFloat(value) <= 0) return;

    try {
      setLoading(true);
      const quoteData = await oneInchClient.getQuote(
        fromToken,
        toToken,
        value,
        11155111 // Sepolia chain ID
      );
      setQuote(quoteData);
      setToAmount(quoteData.toTokenAmount || quoteData.toAmount || '0');
    } catch (error) {
      console.error('Failed to get quote:', error);
      setSwapError('Failed to get quote. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTokenSwap = () => {
    setFromToken(toToken);
    setToToken(fromToken);
    setFromAmount(toAmount);
    setToAmount('');
    setQuote(null);
    setSwapError(null);
  };

  const handleRetry = () => {
    setSwapError(null);
    if (fromAmount) {
      handleAmountChange(fromAmount);
    }
  };

  const handleReviewSwap = () => {
    if (!quote || !bothConnected) return;

    const swapData = {
      fromToken,
      toToken,
      fromAmount,
      toAmount,
      ethAddress,
      stellarPublicKey,
      quote,
      slippage,
      swapType: 'cross-chain',
      contractAddress: config.ethereum.htlcContractAddress
    };

    sessionStorage.setItem('swapData', JSON.stringify(swapData));
    window.location.href = '/review';
  };

  const handleNetworkSwitch = async () => {
    try {
      await switchToSepolia();
      setShowNetworkAlert(false);
    } catch (error) {
      console.error('Failed to switch network:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f2f2f7] via-white to-[#f8f9fa]">
      {/* Header */}
      <div className="fixed top-4 left-4 z-50">
        <button
          onClick={() => window.history.back()}
          className="flex items-center space-x-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-xl shadow-lg hover:bg-white transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Back</span>
        </button>
      </div>

      {/* Wallet Connection Button - Fixed Top Right */}
      <div className="fixed top-4 right-4 z-50">
        <WalletConnectionButton />
      </div>

      {/* Main Content */}
      <div className="min-h-screen flex items-center justify-center p-4 pt-20">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-[30px] shadow-[0px_20px_60px_0px_rgba(0,0,0,0.1)] p-8 md:p-12 max-w-[500px] w-full"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Cross-Chain Swap</h1>
            <p className="text-gray-600">Swap between Ethereum and Stellar networks</p>
          </div>

          {/* Network Alert */}
          {showNetworkAlert && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6"
            >
              <div className="flex items-center space-x-2 mb-2">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <span className="text-amber-800 font-medium">Network Mismatch</span>
              </div>
              <p className="text-amber-700 text-sm mb-3">
                Please switch to Sepolia testnet to continue
              </p>
              <button
                onClick={handleNetworkSwitch}
                className="bg-amber-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-amber-700 transition-colors"
              >
                Switch to Sepolia
              </button>
            </motion.div>
          )}

          {/* Stacked Chain Cards */}
          {bothConnected && !showNetworkAlert && (
            <div className="space-y-6">
              {/* Ethereum Card (Top) */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6 relative"
              >
                {/* Chain Logo & Label */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-lg">Ξ</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Ethereum</h3>
                      <p className="text-sm text-gray-600">Sepolia Testnet</p>
                    </div>
                  </div>
                  {/* Balance Display */}
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Balance</p>
                    <p className="font-semibold text-gray-900">0.0 {fromToken}</p>
                  </div>
                </div>

                {/* Token Selector & Amount Input */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <select
                      value={fromToken}
                      onChange={(e) => setFromToken(e.target.value)}
                      className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="ETH">ETH</option>
                      <option value="WETH">WETH</option>
                      <option value="USDC">USDC</option>
                      <option value="DAI">DAI</option>
                      <option value="LINK">LINK</option>
                    </select>
                  </div>
                  <input
                    type="number"
                    value={fromAmount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    placeholder="0.0"
                    className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-2xl font-semibold text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </motion.div>

              {/* 3D Swap Arrows */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="flex justify-center"
              >
                <button
                  onClick={handleTokenSwap}
                  className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  <ArrowRight className="w-6 h-6 text-white" />
                </button>
              </motion.div>

              {/* Stellar Card (Bottom) */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-2xl p-6 relative"
              >
                {/* Chain Logo & Label */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-lg">★</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Stellar</h3>
                      <p className="text-sm text-gray-600">Testnet</p>
                    </div>
                  </div>
                  {/* Balance Display */}
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Balance</p>
                    <p className="font-semibold text-gray-900">0.0 {toToken}</p>
                  </div>
                </div>

                {/* Token Selector & Amount Input */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <select
                      value={toToken}
                      onChange={(e) => setToToken(e.target.value)}
                      className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="USDC">USDC</option>
                      <option value="ETH">ETH</option>
                      <option value="WETH">WETH</option>
                      <option value="DAI">DAI</option>
                      <option value="LINK">LINK</option>
                    </select>
                  </div>
                  <input
                    type="text"
                    value={toAmount}
                    readOnly
                    placeholder="0.0"
                    className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-2xl font-semibold text-gray-900 placeholder-gray-400 focus:outline-none"
                  />
                </div>
              </motion.div>

              {/* Best Price Badge */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex justify-end"
              >
                <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                  Best price via 1inch (Live)
                </div>
              </motion.div>

              {/* Review Swap Button */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <button
                  onClick={handleReviewSwap}
                  disabled={!fromAmount || !toAmount || loading}
                  className="w-full bg-black text-white py-4 rounded-xl font-semibold hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all transform hover:scale-105 flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      <span>Getting Quote...</span>
                    </>
                  ) : (
                    <>
                      <Shield className="w-5 h-5" />
                      <span>Review Swap</span>
                    </>
                  )}
                </button>
              </motion.div>

              {/* Error Display */}
              {swapError && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 border border-red-200 rounded-xl p-4"
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <span className="text-red-800 font-medium">Error</span>
                  </div>
                  <p className="text-red-700 text-sm mb-3">{swapError}</p>
                  <button
                    onClick={handleRetry}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700 transition-colors"
                  >
                    Retry
                  </button>
                </motion.div>
              )}
            </div>
          )}

          {/* Not Connected State */}
          {!bothConnected && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-6"
            >
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                <Wallet className="w-8 h-8 text-gray-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Connect Your Wallets
                </h3>
                <p className="text-gray-600">
                  Please connect both Ethereum and Stellar wallets to start swapping
                </p>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
} 