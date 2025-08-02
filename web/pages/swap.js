'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowLeft, RefreshCw, CheckCircle, AlertCircle, Coins, Zap, Shield } from 'lucide-react';
import { useWalletManager } from '../lib/wallet-manager';
import UnifiedLayout from '../components/UnifiedLayout';

// Import services with error handling
let SwapService, FusionPlusClient, StellarHTLCManager;

try {
  const swapServiceModule = require('../lib/swap-service');
  SwapService = swapServiceModule.SwapService;
} catch (error) {
  console.warn('SwapService not available:', error);
}

try {
  const fusionPlusModule = require('../lib/fusion-plus-client');
  FusionPlusClient = fusionPlusModule.FusionPlusClient;
} catch (error) {
  console.warn('FusionPlusClient not available:', error);
}

try {
  const stellarHTLCModule = require('../lib/stellar-htlc-manager');
  StellarHTLCManager = stellarHTLCModule.StellarHTLCManager;
} catch (error) {
  console.warn('StellarHTLCManager not available:', error);
}

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
      rate: quote.rate || (quote.toTokenAmount / quote.fromTokenAmount)
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

  const getStatusMessage = (status) => {
    const messages = {
      idle: 'Ready to swap',
      executing: 'Executing swap...',
      completed: 'Swap completed!',
      failed: 'Swap failed'
    };
    return messages[status] || status;
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
            <Coins className="w-8 h-8 text-gray-400" />
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
      title="Cross-Chain Swap"
      subtitle="Swap tokens between Ethereum and Stellar networks"
      showWalletButton={true}
    >
      <div className="space-y-6">
        {/* Connection Status */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="font-semibold text-green-800">Ethereum</span>
            </div>
            <p className="text-sm text-green-700">{formatEthAddress(ethAddress)}</p>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="font-semibold text-green-800">Stellar</span>
            </div>
            <p className="text-sm text-green-700">{formatStellarAddress(stellarPublicKey)}</p>
          </div>
        </div>

        {/* Swap Interface */}
        <div className="space-y-4">
          {/* From Token */}
          <div className="bg-gray-50 rounded-lg p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">From</label>
            <div className="flex items-center space-x-3">
              <div className="flex-1">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  placeholder="0.0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                />
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-gray-900">{fromToken}</span>
                <button
                  onClick={handleTokenSwap}
                  className="p-1 hover:bg-gray-200 rounded"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* To Token */}
          <div className="bg-gray-50 rounded-lg p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
            <div className="flex items-center space-x-3">
              <div className="flex-1">
                <input
                  type="text"
                  value={quote ? formatAmount(quote.toTokenAmount, quote.toTokenDecimals) : ''}
                  placeholder="0.0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                  readOnly
                />
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-gray-900">{toToken}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quote Information */}
        {quote && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-blue-800">Quote</h4>
                <p className="text-sm text-blue-700">
                  Rate: 1 {fromToken} = {formatAmount(quote.toTokenAmount / quote.fromTokenAmount)} {toToken}
                </p>
              </div>
              <button
                onClick={() => handleAmountChange(amount)}
                disabled={loading}
                className="p-2 hover:bg-blue-100 rounded"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        {/* Review Order Button */}
        <button
          onClick={handleReviewOrder}
          disabled={!canReviewOrder()}
          className={`
            w-full py-3 px-6 rounded-lg font-semibold transition-all flex items-center justify-center space-x-2
            ${canReviewOrder()
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }
          `}
        >
          <Shield className="w-5 h-5" />
          <span>Review Order</span>
        </button>

        {/* Status */}
        <div className="text-center">
          <p className="text-sm text-gray-600">{getStatusMessage(swapStatus)}</p>
        </div>
      </div>
    </UnifiedLayout>
  );
} 