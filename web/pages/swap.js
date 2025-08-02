'use client';

import { useState, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { useWalletKit } from '@stellar/wallet-kit';
import { SwapService } from '../lib/swap-service.js';
import { FusionPlusClient } from '../lib/fusion-plus-client.js';
import { StellarHTLCManager } from '../lib/stellar-htlc-manager.js';
import TokenSelector from '../components/TokenSelector';
import TokenIcon from '../components/TokenIcon';
import WalletConnectionButton from '../components/WalletConnectionButton';
import { ethers } from 'ethers';

export default function Swap() {
  // Wallet states
  const { address: ethereumAddress, isConnected: isEthereumConnected } = useAccount();
  const { connect: connectEthereum } = useConnect();
  const { disconnect: disconnectWagmi } = useDisconnect();
  const { connect: connectStellar, connected: isStellarConnected, publicKey: stellarAddress } = useWalletKit();

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

    if (!value || !isEthereumConnected || !isStellarConnected) {
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
    if (!swapService || !ethereumAddress || !stellarAddress) {
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

      // Create swap intent
      const swapIntent = await swapService.createSwapIntent({
        fromChain: swapDirection === 'ethereum-to-stellar' ? 'ethereum' : 'stellar',
        toChain: swapDirection === 'ethereum-to-stellar' ? 'stellar' : 'ethereum',
        fromToken,
        toToken,
        amount: ethers.utils.parseEther(amount),
        fromAddress: swapDirection === 'ethereum-to-stellar' ? ethereumAddress : stellarAddress,
        toAddress: swapDirection === 'ethereum-to-stellar' ? stellarAddress : ethereumAddress,
      });

      // Execute swap based on direction
      let result;
      if (swapDirection === 'ethereum-to-stellar') {
        result = await swapService.executeEthToStellarSwap({
          ...swapIntent,
          fromToken: getTokenAddress(fromToken),
          toToken: getTokenAddress(toToken),
          amount: ethers.utils.parseEther(amount),
          fromAddress: ethereumAddress,
          toAddress: stellarAddress,
        });
      } else {
        result = await swapService.executeStellarToEthSwap({
          ...swapIntent,
          fromToken: getTokenAddress(fromToken),
          toToken: getTokenAddress(toToken),
          amount: ethers.utils.parseEther(amount),
          fromAddress: stellarAddress,
          toAddress: ethereumAddress,
        });
      }

      setSwapStatus({
        swapId: swapIntent.swapId,
        status: 'EXECUTING',
        message: 'Swap is being executed on both chains...',
      });

      // Start monitoring
      swapService.startMonitoring(swapIntent.swapId, (status) => {
        setSwapStatus({
          ...status,
          message: getStatusMessage(status.status),
        });
      });

    } catch (error) {
      console.error('Error executing swap:', error);
      setError(error.message || 'Failed to execute swap');
    } finally {
      setLoading(false);
    }
  };

  const getTokenAddress = (symbol) => {
    const addresses = {
      'ETH': '0x0000000000000000000000000000000000000000',
      'USDC': '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
      'XLM': 'XLM', // Native Stellar asset
    };
    return addresses[symbol] || symbol;
  };

  const getStatusMessage = (status) => {
    switch (status) {
      case 'PENDING':
        return 'Creating swap intent...';
      case 'EXECUTING':
        return 'Executing swap on both chains...';
      case 'COMPLETED':
        return 'Swap completed successfully!';
      case 'REFUNDED':
        return 'Swap was refunded';
      default:
        return 'Processing...';
    }
  };

  const formatAmount = (amount, decimals = 6) => {
    return parseFloat(amount).toFixed(decimals);
  };

  const canExecuteSwap = () => {
    return isEthereumConnected && isStellarConnected && amount && quote && !loading;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Cross-Chain Swap
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Swap between Ethereum and Stellar using 1inch Fusion+ and HTLCs
          </p>
        </div>

        {/* Wallet Connection */}
        <div className="mb-8">
          <WalletConnectionButton />
        </div>

        {/* Swap Interface */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            {/* Swap Direction */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Swap Direction
                </h3>
                <button
                  onClick={handleTokenSwap}
                  className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                </button>
              </div>

              {/* Chain Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* From Chain */}
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                  <div className="flex items-center mb-4">
                    <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-3">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold">From</h4>
                      <p className="text-sm opacity-90">
                        {swapDirection === 'ethereum-to-stellar' ? 'Ethereum' : 'Stellar'}
                      </p>
                    </div>
                  </div>
                  
                  <TokenSelector
                    value={fromToken}
                    onChange={setFromToken}
                    className="mb-3"
                  />
                  
                  <input
                    type="number"
                    placeholder="0.0"
                    value={amount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    className="w-full bg-white bg-opacity-20 rounded-lg px-4 py-3 text-white placeholder-white placeholder-opacity-70 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
                  />
                </div>

                {/* To Chain */}
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
                  <div className="flex items-center mb-4">
                    <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-3">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold">To</h4>
                      <p className="text-sm opacity-90">
                        {swapDirection === 'ethereum-to-stellar' ? 'Stellar' : 'Ethereum'}
                      </p>
                    </div>
                  </div>
                  
                  <TokenSelector
                    value={toToken}
                    onChange={setToToken}
                    className="mb-3"
                  />
                  
                  <div className="w-full bg-white bg-opacity-20 rounded-lg px-4 py-3 text-white">
                    {quote ? (
                      <div className="text-center">
                        <div className="text-lg font-semibold">
                          {formatAmount(ethers.utils.formatEther(quote.toTokenAmount))}
                        </div>
                        <div className="text-sm opacity-90">
                          ≈ ${formatAmount(quote.toTokenUSD || 0)}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-white text-opacity-70">
                        Enter amount to see quote
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Quote Details */}
            {quote && (
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Quote Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Rate:</span>
                    <span className="ml-2 text-gray-900 dark:text-white">
                      1 {fromToken} = {formatAmount(quote.rate || 0)} {toToken}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Slippage:</span>
                    <span className="ml-2 text-gray-900 dark:text-white">
                      {quote.slippage || 0.1}%
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Gas Fee:</span>
                    <span className="ml-2 text-gray-900 dark:text-white">
                      {formatAmount(quote.gas || 0)} ETH
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Protocol:</span>
                    <span className="ml-2 text-gray-900 dark:text-white">
                      {quote.protocol || '1inch Fusion+'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span className="text-red-700 dark:text-red-400">{error}</span>
                </div>
              </div>
            )}

            {/* Swap Status */}
            {swapStatus && (
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse mr-3"></div>
                  <div>
                    <div className="font-semibold text-blue-900 dark:text-blue-100">
                      {swapStatus.message}
                    </div>
                    <div className="text-sm text-blue-700 dark:text-blue-300">
                      Swap ID: {swapStatus.swapId}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Execute Button */}
            <button
              onClick={handleExecuteSwap}
              disabled={!canExecuteSwap() || loading}
              className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200 ${
                canExecuteSwap() && !loading
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                  : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </div>
              ) : (
                'Execute Swap'
              )}
            </button>

            {/* Info */}
            <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
              <p>This swap uses 1inch Fusion+ for Ethereum and HTLCs for Stellar</p>
              <p className="mt-1">Atomic execution ensures both chains succeed or both fail</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 