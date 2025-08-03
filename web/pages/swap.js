'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, RefreshCw, CheckCircle, AlertCircle, Settings, Info, ChevronDown } from 'lucide-react';
import { useWalletManager } from '../lib/wallet-manager';
import UnifiedLayout from '../components/UnifiedLayout';
import TokenIcon from '../components/TokenIcon';

// Import new backend services
import apiClient from '../lib/api-client';
import swapService from '../lib/swap-service-new';

export default function Swap() {
  const {
    ethConnected,
    stellarConnected,
    bothConnected,
    canSwap,
    ethAddress,
    stellarPublicKey,
    formatEthAddress,
    formatStellarAddress
  } = useWalletManager();

  const [swapService, setSwapService] = useState(null);
  const [fusionClient, setFusionClient] = useState(null);
  const [stellarHTLC, setStellarHTLC] = useState(null);
  const [fromToken, setFromToken] = useState('ETH');
  const [toToken, setToToken] = useState('XLM');
  const [amount, setAmount] = useState('');
  const [quote, setQuote] = useState(null);
  const [swapStatus, setSwapStatus] = useState('idle');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [slippage, setSlippage] = useState(1.0);
  const [showSettings, setShowSettings] = useState(false);

  // Initialize services
  useEffect(() => {
    const initializeServices = async () => {
      try {
        if (SwapService) {
          const swap = new SwapService();
          await swap.initialize();
          setSwapService(swap);
        }

        if (FusionPlusClient) {
          const fusion = new FusionPlusClient();
          setFusionClient(fusion);
        }

        if (StellarHTLCManager) {
          const htlc = new StellarHTLCManager();
          await htlc.initialize();
          setStellarHTLC(htlc);
        }
      } catch (error) {
        console.error('Failed to initialize services:', error);
        setError('Failed to initialize swap services. Please try again.');
      }
    };

    if (bothConnected) {
      initializeServices();
    }
  }, [bothConnected]);

  const handleAmountChange = async (value) => {
    setAmount(value);
    setError(null);

    if (!value || !fusionClient || !bothConnected) return;

    try {
      setLoading(true);
      const fromAddress = getTokenAddress(fromToken);
      const toAddress = getTokenAddress(toToken);
      
      const quoteResult = await fusionClient.getQuote(
        fromAddress,
        toAddress,
        value
      );
      
      setQuote(quoteResult);
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

  const getTokenAddress = (symbol) => {
    const addresses = {
      'ETH': '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
      'XLM': 'XLM',
      'USDC': '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
      'USDT': '0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0'
    };
    return addresses[symbol] || symbol;
  };

  const formatAmount = (amount, decimals = 6) => {
    return parseFloat(amount).toFixed(decimals);
  };

  const canReviewOrder = () => {
    return bothConnected && amount && quote && !loading;
  };

  if (!bothConnected) {
    return (
      <UnifiedLayout
        title="Connect Wallets First"
        subtitle="Please connect both Ethereum and Stellar wallets to start swapping"
        showWalletButton={true}
      >
        <div className="text-center space-y-6">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8 text-gray-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Wallets Not Connected
            </h3>
            <p className="text-gray-600">
              Use the wallet connection button in the top-right corner to connect both wallets
            </p>
          </div>
        </div>
      </UnifiedLayout>
    );
  }

  return (
    <UnifiedLayout
      title=""
      subtitle=""
      showWalletButton={true}
    >
      {/* Main Swap Interface - Direct implementation */}
      <div className="max-w-md mx-auto">
        {/* Swap Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Swap</h2>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Settings className="w-5 h-5 text-gray-600" />
              </button>
            </div>
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
                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
              >
                <ArrowRight className="w-5 h-5 text-gray-600" />
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
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }
              `}
            >
              <span>{loading ? 'Getting Quote...' : 'Review Order'}</span>
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
    </UnifiedLayout>
  );
} 