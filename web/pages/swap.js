'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, RefreshCw, CheckCircle, AlertCircle, Settings, Info, ChevronDown, ArrowUpDown, Zap, Shield, Clock, Coins } from 'lucide-react';
import { simpleWalletService } from '../lib/simple-wallet-service';
import UnifiedLayout from '../components/UnifiedLayout';
import TokenIcon from '../components/TokenIcon';
import priceService from '../lib/price-service';
import apiClient from '../lib/api-client';
import { SynappayBridge } from '../lib/Synappay-bridge';

export default function Swap() {
  const [walletStatus, setWalletStatus] = useState({
    ethereumConnected: false,
    stellarConnected: false,
    account: null,
    chainId: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Update wallet status
  useEffect(() => {
    const updateStatus = () => {
      const status = simpleWalletService.getStatus();
      setWalletStatus(status);
    };

    updateStatus();
    const interval = setInterval(updateStatus, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleConnectEthereum = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await simpleWalletService.connectEthereum();
      if (result.success) {
        console.log('Ethereum connected:', result);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectStellar = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await simpleWalletService.connectStellar();
      if (result.success) {
        console.log('Stellar connected:', result);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const bothConnected = walletStatus.ethereumConnected && walletStatus.stellarConnected;
  const ethConnected = walletStatus.ethereumConnected;
  const stellarConnected = walletStatus.stellarConnected;
  const ethAddress = walletStatus.account;
  const stellarPublicKey = walletStatus.account; // This will be updated when Stellar is connected

  const [fromToken, setFromToken] = useState('ETH');
  const [toToken, setToToken] = useState('XLM');
  const [amount, setAmount] = useState('');
  const [quote, setQuote] = useState(null);
  const [swapError, setSwapError] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [slippage, setSlippage] = useState(1.0);
  const [showSettings, setShowSettings] = useState(false);
  const [swapStep, setSwapStep] = useState('input'); // input, quote, intent, executing

  // Auto-refresh quotes every 30 seconds
  useEffect(() => {
    if (!amount || !bothConnected || parseFloat(amount) <= 0) return;

    const interval = setInterval(() => {
      // Create a mock event for the interval call
      const mockEvent = { target: { value: amount } };
      handleAmountChange(mockEvent);
    }, 30000);

    return () => clearInterval(interval);
  }, [amount, fromToken, toToken, bothConnected]);

  const handleAmountChange = async (e) => {
    const value = e.target.value;
    setAmount(value);
    setError(null);
    setSwapStep('input');

    if (!value || !bothConnected || parseFloat(value) <= 0) {
      setQuote(null);
      return;
    }

    try {
      setQuoteLoading(true);
      setSwapStep('quote');

      // Get cross-chain quote
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
      console.error('Error getting quote:', error);
      setSwapError('Failed to get quote. Please try again.');
      setSwapStep('input');
    } finally {
      setQuoteLoading(false);
    }
  };

  const handleTokenSwap = () => {
    setFromToken(toToken);
    setToToken(fromToken);
    setQuote(null);
    setAmount('');
    setSwapStep('input');
  };

  const handleExecuteSwap = async () => {
    if (!quote || !amount || !bothConnected) {
      setError('Please ensure wallets are connected and quote is available.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSwapStep('intent');

      // Create swap intent (like synappay)
      const swapRequest = await SynappayBridge.initiateSwap({
        fromChain: fromToken === 'ETH' ? 'ethereum' : 'stellar',
        toChain: toToken === 'ETH' ? 'ethereum' : 'stellar',
        fromToken,
        toToken,
        amount,
        userAddress: ethAddress,
        stellarAddress: stellarPublicKey
      });

      console.log('Swap intent created:', swapRequest);
      setSwapStep('executing');

      // Execute the actual swap transaction (triggers wallet popup)
      const transactionResult = await SynappayBridge.executeSwap(swapRequest.id);
      
      console.log('Transaction completed:', transactionResult);
      setSwapStep('completed');
      setError(null);
      
      // Show completion for 3 seconds then reset
      setTimeout(() => {
        setSwapStep('input');
        // Keep amount and quote for user convenience
      }, 3000);
      
    } catch (error) {
      console.error('Failed to execute swap:', error);
      setError('Failed to execute swap. Please try again.');
      setSwapStep('quote');
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount, decimals = 6) => {
    return parseFloat(amount).toFixed(decimals);
  };

  const canExecuteSwap = () => {
    // Use the wallet manager's connection status directly
    const walletsConnected = bothConnected;
    
    console.log('Swap Debug:', {
      bothConnected,
      ethConnected,
      stellarConnected,
      walletsConnected,
      ethAddress,
      stellarPublicKey,
      amount: Boolean(amount),
      quote: Boolean(quote),
      loading,
      amountValue: parseFloat(amount) > 0
    });
    
    return walletsConnected && amount && quote && !loading && parseFloat(amount) > 0;
  };

  // Use the wallet manager's connection status directly
  const walletsConnected = bothConnected;

  // Debug logging
  console.log('Swap Page Debug:', {
    ethAddress,
    stellarPublicKey,
    hasEthWallet: Boolean(ethAddress && ethAddress !== 'None' && ethAddress !== 'null' && ethAddress !== 'Not Connected'),
    hasStellarWallet: Boolean(stellarPublicKey && stellarPublicKey !== 'None' && stellarPublicKey !== 'null' && stellarPublicKey !== 'Not Connected'),
    walletsConnected,
    bothConnected,
    ethConnected,
    stellarConnected
  });

  // Always show the main interface, but with wallet connection status

  return (
    <UnifiedLayout
      title="Cross-Chain Swap"
      subtitle={`Swap ${fromToken} to ${toToken} across chains`}
      showWalletButton={true}
    >
      <div className="max-w-md mx-auto space-y-6">
        {/* Wallet Connection Status */}
        {!walletsConnected && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-yellow-800">Connect Wallets</h3>
                <p className="text-xs text-yellow-700">Both wallets required for swapping</p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={connectEth}
                  className={`px-3 py-1 text-xs rounded-lg ${
                    ethConnected 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                  }`}
                >
                  {ethConnected ? '✅ ETH' : 'Connect ETH'}
                </button>
                <button
                  onClick={connectStellar}
                  className={`px-3 py-1 text-xs rounded-lg ${
                    stellarConnected 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-purple-100 text-purple-800 hover:bg-purple-200'
                  }`}
                >
                  {stellarConnected ? '✅ XLM' : 'Connect XLM'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step Indicator */}
        <div className="flex items-center justify-center space-x-2 mb-6">
          <div className={`flex items-center space-x-2 ${swapStep === 'input' ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${swapStep === 'input' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
              1
            </div>
            <span className="text-sm font-medium">Input</span>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400" />
          <div className={`flex items-center space-x-2 ${swapStep === 'quote' ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${swapStep === 'quote' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
              2
            </div>
            <span className="text-sm font-medium">Quote</span>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400" />
          <div className={`flex items-center space-x-2 ${swapStep === 'intent' ? 'text-blue-600' : swapStep === 'completed' ? 'text-green-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              swapStep === 'intent' ? 'bg-blue-600 text-white' : 
              swapStep === 'completed' ? 'bg-green-600 text-white' : 
              'bg-gray-200'
            }`}>
              {swapStep === 'completed' ? '✓' : '3'}
            </div>
            <span className="text-sm font-medium">{swapStep === 'completed' ? 'Complete' : 'Intent'}</span>
          </div>
        </div>

        {/* Swap Interface */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          {/* From Token */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">From</label>
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <TokenIcon symbol={fromToken} className="w-8 h-8" />
              <div className="flex-1">
                <input
                  type="number"
                  value={amount}
                  onChange={handleAmountChange}
                  placeholder="0.0"
                  className="w-full bg-transparent text-lg font-semibold outline-none"
                  disabled={loading}
                />
              </div>
              <div className="text-right">
                <div className="font-semibold">{fromToken}</div>
                <div className="text-xs text-gray-500">
                  {formatEthAddress(ethAddress)}
                </div>
              </div>
            </div>
          </div>

          {/* Swap Button */}
          <div className="flex justify-center">
            <button
              onClick={handleTokenSwap}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
              disabled={loading}
            >
              <ArrowUpDown className="w-5 h-5" />
            </button>
          </div>

          {/* To Token */}
          <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">To</label>
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <TokenIcon symbol={toToken} className="w-8 h-8" />
              <div className="flex-1">
                <div className="text-lg font-semibold">
                  {quote ? formatAmount(quote.toTokenAmount) : '0.0'}
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold">{toToken}</div>
                <div className="text-xs text-gray-500">
                  {formatStellarAddress(stellarPublicKey)}
                </div>
              </div>
            </div>
          </div>

          {/* Quote Details */}
          {quote && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-3 p-4 bg-blue-50 rounded-lg"
            >
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Rate</span>
                <span className="font-medium">1 {fromToken} = {formatAmount(quote.rate)} {toToken}</span>
              </div>
              <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Price Impact</span>
                <span className="font-medium">{quote.priceImpact}%</span>
                </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Estimated Time</span>
                <span className="font-medium">{quote.timeEstimate}</span>
                </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Route</span>
                <span className="font-medium">{quote.route}</span>
              </div>
            </motion.div>
          )}

          {/* Error Display */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-red-50 border border-red-200 rounded-lg"
            >
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            </motion.div>
          )}

          {/* Security Info */}
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <Shield className="w-4 h-4" />
            <span>HTLC secured • Atomic execution</span>
          </div>

          {/* Execute Button */}
          <button
            onClick={handleExecuteSwap}
            disabled={!canExecuteSwap()}
            className={`w-full py-3 px-4 rounded-lg font-semibold transition-all ${
              canExecuteSwap()
                ? 'bg-black text-white hover:bg-gray-800 transform hover:scale-105'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {!walletsConnected && (
              <div className="text-xs mb-1">Connect both wallets first</div>
            )}
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              </div>
            ) : swapStep === 'completed' ? (
              <div className="flex items-center justify-center space-x-2">
                <CheckCircle className="w-4 h-4" />
                <span>Swap Complete!</span>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-2">
                <Zap className="w-4 h-4" />
                <span>Create Intent</span>
              </div>
            )}
          </button>
        </div>

        {/* Settings Panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white rounded-xl border border-gray-200 p-4 space-y-3"
            >
              <h3 className="font-semibold">Swap Settings</h3>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Slippage Tolerance</label>
                <input
                  type="number"
                  value={slippage}
                  onChange={(e) => setSlippage(parseFloat(e.target.value))}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  min="0.1"
                  max="50"
                  step="0.1"
                />
                <span className="text-xs text-gray-500">Transaction will revert if price changes by more than this percentage</span>
            </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Settings Toggle */}
        <div className="flex justify-center">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800"
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </button>
        </div>
      </div>
    </UnifiedLayout>
  );
}