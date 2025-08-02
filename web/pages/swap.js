'use client';

import { useState, useEffect } from 'react';
import { useWalletManager } from '../lib/wallet-manager';
import { SwapService } from '../lib/swap-service.js';
import { FusionPlusClient } from '../lib/fusion-plus-client.js';
import { StellarHTLCManager } from '../lib/stellar-htlc-manager.js';
import TokenSelector from '../components/TokenSelector';
import TokenIcon from '../components/TokenIcon';
import WalletConnectionButton from '../components/WalletConnectionButton';
import { ethers } from 'ethers';

export default function Swap() {
  // Wallet states using unified manager
  const { 
    ethConnected, 
    ethAddress, 
    stellarConnected, 
    stellarPublicKey,
    bothConnected 
  } = useWalletManager();

  // Swap states
  const [swapDirection, setSwapDirection] = useState('ethereum-to-stellar'); // or 'stellar-to-ethereum'
  const [fromToken, setFromToken] = useState('ETH');
  const [toToken, setToToken] = useState('XLM');
  const [amount, setAmount] = useState('');
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [swapStatus, setSwapStatus] = useState(null);

  // Services
  const [swapService, setSwapService] = useState(null);
  const [fusionClient, setFusionClient] = useState(null);

  useEffect(() => {
    initializeServices();
  }, []);

  const initializeServices = async () => {
    try {
      const service = new SwapService();
      await service.initialize();
      setSwapService(service);

      const client = new FusionPlusClient();
      setFusionClient(client);
    } catch (error) {
      console.error('Failed to initialize services:', error);
      setError('Failed to initialize swap services');
    }
  };

  const handleAmountChange = async (value) => {
    setAmount(value);
    setError(null);

    if (!value || !ethConnected || !stellarConnected) {
      setQuote(null);
      return;
    }

    try {
      setLoading(true);
      
      // Get quote from 1inch Fusion+
      const quoteData = await fusionClient.getQuote(
        getTokenAddress(fromToken),
        getTokenAddress(toToken),
        ethers.utils.parseEther(value)
      );
      
      setQuote(quoteData);
    } catch (error) {
      console.error('Error getting quote:', error);
      setError('Failed to get quote. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTokenSwap = () => {
    setSwapDirection(swapDirection === 'ethereum-to-stellar' ? 'stellar-to-ethereum' : 'ethereum-to-stellar');
    setFromToken(toToken);
    setToToken(fromToken);
    setQuote(null);
    setError(null);
  };

  const handleExecuteSwap = async () => {
    if (!swapService || !ethAddress || !stellarPublicKey) {
      setError('Please connect both wallets');
      return;
    }

    if (!amount || !quote) {
      setError('Please enter an amount and get a quote');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const swapParams = {
        fromToken,
        toToken,
        amount: ethers.utils.parseEther(amount),
        fromAddress: ethAddress,
        toAddress: stellarPublicKey,
        direction: swapDirection
      };

      const swapId = await swapService.createSwapIntent(swapParams);
      setSwapStatus('created');
      
      // Execute the swap
      if (swapDirection === 'ethereum-to-stellar') {
        await swapService.executeEthToStellarSwap(swapParams);
      } else {
        await swapService.executeStellarToEthSwap(swapParams);
      }
      
      setSwapStatus('executed');
    } catch (error) {
      console.error('Error executing swap:', error);
      setError('Failed to execute swap. Please try again.');
      setSwapStatus('failed');
    } finally {
      setLoading(false);
    }
  };

  const getTokenAddress = (symbol) => {
    // Token addresses for Sepolia testnet
    const addresses = {
      'ETH': '0x0000000000000000000000000000000000000000', // Native ETH
      'WETH': '0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9',
      'USDC': '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
      'USDT': '0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0',
      'DAI': '0x68194a729C2450ad26072b3D33ADaCbcef39D574'
    };
    return addresses[symbol] || addresses['ETH'];
  };

  const getStatusMessage = (status) => {
    const messages = {
      'created': 'Swap intent created',
      'executed': 'Swap executed successfully',
      'failed': 'Swap failed',
      'pending': 'Swap in progress...'
    };
    return messages[status] || '';
  };

  const formatAmount = (amount, decimals = 6) => {
    return parseFloat(amount).toFixed(decimals);
  };

  const canExecuteSwap = () => {
    return bothConnected && amount && quote && !loading;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Cross-Chain Swap
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Swap tokens between Ethereum and Stellar networks
          </p>
        </div>

        {/* Wallet Connection */}
        <div className="max-w-md mx-auto mb-8">
          <WalletConnectionButton />
        </div>

        {/* Swap Interface */}
        {bothConnected ? (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
              {/* Swap Direction */}
              <div className="flex items-center justify-center mb-8">
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mb-2">
                      <TokenIcon symbol={fromToken} size={24} />
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{fromToken}</span>
                  </div>
                  
                  <button
                    onClick={handleTokenSwap}
                    className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                  </button>
                  
                  <div className="text-center">
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center mb-2">
                      <TokenIcon symbol={toToken} size={24} />
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{toToken}</span>
                  </div>
                </div>
              </div>

              {/* Token Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    From Token
                  </label>
                  <TokenSelector
                    value={fromToken}
                    onChange={setFromToken}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    To Token
                  </label>
                  <TokenSelector
                    value={toToken}
                    onChange={setToToken}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Amount Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Amount
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  disabled={loading}
                />
              </div>

              {/* Quote Display */}
              {quote && (
                <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Quote
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">You Pay:</span>
                      <span className="font-medium">{formatAmount(ethers.utils.formatEther(quote.fromTokenAmount))} {fromToken}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">You Receive:</span>
                      <span className="font-medium">{formatAmount(ethers.utils.formatEther(quote.toTokenAmount))} {toToken}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Rate:</span>
                      <span className="font-medium">1 {fromToken} = {formatAmount(quote.rate)} {toToken}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Display */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              {/* Status Display */}
              {swapStatus && (
                <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-blue-600 dark:text-blue-400">{getStatusMessage(swapStatus)}</p>
                </div>
              )}

              {/* Execute Button */}
              <button
                onClick={handleExecuteSwap}
                disabled={!canExecuteSwap()}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : 'Execute Swap'}
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md mx-auto">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Connect Your Wallets
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Please connect both Ethereum and Stellar wallets to start swapping
              </p>
              <WalletConnectionButton />
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 