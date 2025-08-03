'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, RefreshCw, CheckCircle, AlertCircle, Settings, Info, ChevronDown, Wallet, ArrowUpDown } from 'lucide-react';
import { useWalletManager } from '../lib/wallet-manager';
import TokenIcon from '../components/TokenIcon';

export default function Swap() {
  const {
    ethConnected,
    stellarConnected,
    bothConnected,
    ethAddress,
    stellarPublicKey,
    formatEthAddress,
    formatStellarAddress
  } = useWalletManager();

  const [fromToken, setFromToken] = useState('ETH');
  const [toToken, setToToken] = useState('XLM');
  const [amount, setAmount] = useState('');
  const [quote, setQuote] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [slippage, setSlippage] = useState(1.0);
  const [showSettings, setShowSettings] = useState(false);

  const handleAmountChange = async (value) => {
    setAmount(value);
    setError(null);

    if (!value || !bothConnected) return;

    try {
      setLoading(true);

      // Mock quote for now - replace with actual API call
      const mockQuote = {
        fromTokenAmount: value,
        toTokenAmount: (parseFloat(value) * 0.95).toString(), // Mock rate
        fromTokenDecimals: 18,
        toTokenDecimals: 7,
        rate: 0.95
      };

      setQuote(mockQuote);
    } catch (error) {
      console.error('Error getting quote:', error);
      setError('Failed to get quote. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTokenSwap = () => {
    setFromToken(toToken);
    setToToken(fromToken);
    setQuote(null);
    setAmount('');
  };

  const handleReviewOrder = () => {
    if (!quote || !amount) {
      setError('Please enter an amount and get a quote first.');
      return;
    }

    // Redirect to review page with swap details
    const params = new URLSearchParams({
      fromToken,
      toToken,
      amount,
      quote: quote.toTokenAmount || quote.quote,
      rate: quote.rate || (quote.toTokenAmount / quote.fromTokenAmount),
      slippage: slippage.toString()
    });

    window.location.href = `/review?${params.toString()}`;
  };



  const formatAmount = (amount, decimals = 6) => {
    return parseFloat(amount).toFixed(decimals);
  };

  const canReviewOrder = () => {
    return bothConnected && amount && quote && !loading;
  };

  if (!bothConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">S</span>
                </div>
                <span className="text-xl font-bold text-gray-900">SynapPay</span>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => window.location.href = '/'}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Home
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Connect Wallets Content */}
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-4">
          <div className="max-w-md w-full">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center"
            >
              <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Wallet className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Connect Your Wallets</h2>
              <p className="text-gray-600 mb-8">
                Connect both Ethereum and Stellar wallets to start cross-chain swapping
              </p>

              <div className="space-y-4">
                <div className={`p-4 rounded-xl border-2 ${ethConnected ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <TokenIcon symbol="ETH" size={24} />
                      <span className="font-medium text-gray-900">Ethereum</span>
                    </div>
                    {ethConnected ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <div className="w-3 h-3 bg-gray-300 rounded-full" />
                    )}
                  </div>
                </div>

                <div className={`p-4 rounded-xl border-2 ${stellarConnected ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <TokenIcon symbol="XLM" size={24} />
                      <span className="font-medium text-gray-900">Stellar</span>
                    </div>
                    {stellarConnected ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <div className="w-3 h-3 bg-gray-300 rounded-full" />
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => window.location.href = '/'}
                className="w-full mt-8 py-3 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all"
              >
                Go to Home Page
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span className="text-xl font-bold text-gray-900">SynapPay</span>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => window.location.href = '/'}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                Home
              </button>
              <div className="flex items-center space-x-2 px-3 py-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">Wallets Connected</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-4 py-8">
        <div className="max-w-md w-full">
          {/* Swap Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Cross-Chain Swap</h2>
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Settings className="w-5 h-5 text-gray-600" />
                </button>
              </div>
              <p className="text-gray-600 mt-2">Swap tokens between Ethereum and Stellar networks</p>
            </div>

            {/* Settings Panel */}
            {showSettings && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-4 bg-gray-50 border-b border-gray-100"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Slippage Tolerance</span>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        value={slippage}
                        onChange={(e) => setSlippage(parseFloat(e.target.value))}
                        className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="0.1"
                        max="50"
                        step="0.1"
                      />
                      <span className="text-sm text-gray-500">%</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Swap Interface */}
            <div className="p-6 space-y-4">
              {/* From Token */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">From</label>
                  <span className="text-xs text-gray-500">Balance: 0.0</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex-1">
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => handleAmountChange(e.target.value)}
                      placeholder="0.0"
                      className="w-full text-2xl font-semibold bg-transparent border-none outline-none placeholder-gray-400"
                      disabled={loading}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <TokenIcon symbol={fromToken} size={32} />
                    <span className="font-semibold text-gray-900">{fromToken}</span>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </div>

              {/* Swap Arrow */}
              <div className="flex justify-center">
                <button
                  onClick={handleTokenSwap}
                  className="p-3 bg-gradient-to-r from-blue-100 to-purple-100 hover:from-blue-200 hover:to-purple-200 rounded-full transition-all border-4 border-white shadow-lg"
                >
                  <ArrowUpDown className="w-5 h-5 text-blue-600" />
                </button>
              </div>

              {/* To Token */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">To</label>
                  <span className="text-xs text-gray-500">Balance: 0.0</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={quote ? formatAmount(quote.toTokenAmount, quote.toTokenDecimals) : ''}
                      placeholder="0.0"
                      className="w-full text-2xl font-semibold bg-transparent border-none outline-none placeholder-gray-400"
                      readOnly
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <TokenIcon symbol={toToken} size={32} />
                    <span className="font-semibold text-gray-900">{toToken}</span>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </div>

              {/* Quote Information */}
              {quote && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-blue-50 rounded-xl p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Info className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">Quote Details</span>
                    </div>
                    <button
                      onClick={() => handleAmountChange(amount)}
                      disabled={loading}
                      className="p-1 hover:bg-blue-100 rounded transition-colors"
                    >
                      <RefreshCw className={`w-4 h-4 text-blue-600 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Rate</span>
                      <span className="font-medium text-gray-900">
                        1 {fromToken} = {formatAmount(quote.toTokenAmount / quote.fromTokenAmount)} {toToken}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Slippage</span>
                      <span className="font-medium text-gray-900">{slippage}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Network Fee</span>
                      <span className="font-medium text-gray-900">~$0.50</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Error Display */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 border border-red-200 rounded-xl p-4"
                >
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <span className="text-red-700 text-sm">{error}</span>
                  </div>
                </motion.div>
              )}

              {/* Swap Button */}
              <button
                onClick={handleReviewOrder}
                disabled={!canReviewOrder()}
                className={`
                w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all flex items-center justify-center space-x-2
                ${canReviewOrder()
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  }
              `}
              >
                <span>{loading ? 'Getting Quote...' : 'Review Swap'}</span>
                {!loading && canReviewOrder() && <ArrowRight className="w-5 h-5" />}
              </button>
            </div>
          </motion.div>

          {/* Connection Status */}
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-semibold text-green-800">Ethereum</span>
              </div>
              <p className="text-sm text-green-700">{formatEthAddress(ethAddress)}</p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-semibold text-green-800">Stellar</span>
              </div>
              <p className="text-sm text-green-700">{formatStellarAddress(stellarPublicKey)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 