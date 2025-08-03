'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, RefreshCw, CheckCircle, AlertCircle, Settings, Info, ChevronDown, ArrowUpDown, Zap } from 'lucide-react';
import { useWalletManager } from '../lib/wallet-manager';
import UnifiedLayout from '../components/UnifiedLayout';
import TokenIcon from '../components/TokenIcon';
import priceService from '../lib/price-service';
import apiClient from '../lib/api-client';
import { SynappayBridge } from '../lib/Synappay-bridge';

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

  // Auto-refresh quotes every 30 seconds like Synappay
  useEffect(() => {
    if (!amount || !bothConnected || parseFloat(amount) <= 0) return;

    const interval = setInterval(() => {
      handleAmountChange(amount);
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [amount, fromToken, toToken, bothConnected]);

  const handleAmountChange = async (value) => {
    setAmount(value);
    setError(null);

    if (!value || !bothConnected || parseFloat(value) <= 0) {
      setQuote(null);
      return;
    }

    try {
      setLoading(true);

      // Get Synappay-style cross-chain quote
      const fromChain = fromToken === 'ETH' ? 'ethereum' : 'stellar';
      const toChain = toToken === 'ETH' ? 'ethereum' : 'stellar';
      
      const SynappayQuote = await SynappayBridge.getSwapQuote(
        fromChain, 
        toChain, 
        fromToken, 
        toToken, 
        value
      );
      
      setQuote({
        fromTokenAmount: SynappayQuote.fromAmount,
        toTokenAmount: SynappayQuote.toAmount,
        fromTokenDecimals: fromToken === 'ETH' ? 18 : 7,
        toTokenDecimals: toToken === 'ETH' ? 18 : 7,
        rate: parseFloat(SynappayQuote.toAmount) / parseFloat(SynappayQuote.fromAmount),
        spread: '0.1%',
        priceImpact: SynappayQuote.priceImpact,
        timestamp: Date.now(),
        route: SynappayQuote.route,
        timeEstimate: SynappayQuote.timeEstimate,
        estimatedGas: SynappayQuote.estimatedGas
      });

    } catch (error) {
      console.error('Error getting Synappay quote:', error);
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

  const handleExecuteSwap = async () => {
    if (!quote || !amount || !bothConnected) {
      setError('Please ensure wallets are connected and quote is available.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Initiate Synappay-style cross-chain swap
      const swapRequest = await SynappayBridge.initiateSwap({
        fromChain: fromToken === 'ETH' ? 'ethereum' : 'stellar',
        toChain: toToken === 'ETH' ? 'ethereum' : 'stellar',
        fromToken,
        toToken,
        amount,
        userAddress: ethAddress,
        stellarAddress: stellarPublicKey
      });

      console.log('Synappay swap initiated:', swapRequest);

      // For Ethereum -> Stellar swaps, create the Ethereum lock first
      if (fromToken === 'ETH') {
        console.log('Creating Ethereum lock via 1inch Fusion+...');
        // This would require the user's private key or wallet signing
        // For now, we'll simulate the process
        await SynappayBridge.createEthereumLock(swapRequest.id, 'mock_private_key');
      }

      // Redirect to progress page to continue the Synappay flow
      window.location.href = `/progress?swapId=${swapRequest.id}`;
      
    } catch (error) {
      console.error('Failed to execute Synappay swap:', error);
      setError('Failed to execute swap. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount, decimals = 6) => {
    return parseFloat(amount).toFixed(decimals);
  };

  const canExecuteSwap = () => {
    return bothConnected && amount && quote && !loading && parseFloat(amount) > 0;
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
          <button
            onClick={() => window.location.href = '/'}
            className="bg-black text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-800 transition-all"
          >
            Go to Home Page
          </button>
        </div>
      </UnifiedLayout>
    );
  }

  return (
    <UnifiedLayout
      title="Cross-Chain Swap"
      subtitle="Swap tokens between Ethereum and Stellar networks with atomic security"
      showWalletButton={true}
    >
      <div className="space-y-6">
        {/* Settings Panel */}
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gray-50 rounded-xl p-4 border border-gray-200"
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
        <div className="space-y-4">
          {/* From Token */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">From</label>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500">Balance: 0.0</span>
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                >
                  <Settings className="w-4 h-4 text-gray-600" />
                </button>
              </div>
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
              className="p-3 bg-white border-2 border-gray-200 hover:border-gray-300 rounded-full transition-all shadow-sm hover:shadow-md"
            >
              <ArrowUpDown className="w-5 h-5 text-gray-600" />
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
                    1 {fromToken} = {formatAmount(quote.rate, 6)} {toToken}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Spread</span>
                  <span className="font-medium text-gray-900">{quote.spread}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Price Impact</span>
                  <span className="font-medium text-gray-900">{quote.priceImpact}%</span>
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

          {/* Execute Swap Button */}
          <button
            onClick={handleExecuteSwap}
            disabled={!canExecuteSwap()}
            className={`
              w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all flex items-center justify-center space-x-2
              ${canExecuteSwap()
                ? 'bg-black text-white hover:bg-gray-800 shadow-lg hover:shadow-xl transform hover:scale-[1.02]'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }
            `}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Zap className="w-5 h-5" />
                <span>Execute Swap</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>

        {/* Connection Status */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
          <div className="bg-green-50 border border-green-200 rounded-xl p-3">
            <div className="flex items-center space-x-2 mb-1">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="font-medium text-green-800 text-sm">Ethereum</span>
            </div>
            <p className="text-xs text-green-700">{formatEthAddress(ethAddress)}</p>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-xl p-3">
            <div className="flex items-center space-x-2 mb-1">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="font-medium text-green-800 text-sm">Stellar</span>
            </div>
            <p className="text-xs text-green-700">{formatStellarAddress(stellarPublicKey)}</p>
          </div>
        </div>
      </div>
    </UnifiedLayout>
  );
}