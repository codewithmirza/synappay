'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle, AlertCircle, Loader, Shield, Zap, Star, ArrowRight } from 'lucide-react';
import { useCombinedWallet } from '../lib/useCombinedWallet';
import config from '../lib/config';

export default function Review() {
  const {
    ethConnected,
    ethAddress,
    stellarConnected,
    stellarPublicKey,
    formatEthAddress,
    formatStellarAddress
  } = useCombinedWallet();

  const [swapData, setSwapData] = useState(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Get swap data from sessionStorage
    const storedData = sessionStorage.getItem('swapData');
    if (storedData) {
      const parsedData = JSON.parse(storedData);
      console.log('📋 Swap data loaded:', parsedData);
      setSwapData(parsedData);
    }
  }, []);

  const handleSwapTokens = async () => {
    if (!swapData) {
      setError('No swap data found');
      return;
    }

    setIsExecuting(true);
    setError(null);

    try {
      console.log('🚀 Executing cross-chain swap...');

      const response = await fetch('/api/execute-swap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fromToken: swapData.fromToken,
          toToken: swapData.toToken,
          fromAmount: swapData.fromAmount,
          toAmount: swapData.toAmount,
          ethAddress: swapData.ethAddress,
          stellarPublicKey: swapData.stellarPublicKey,
          swapType: swapData.swapType,
          contractAddress: swapData.contractAddress,
          slippage: swapData.slippage
        }),
      });

      const result = await response.json();

      if (result.success) {
        setExecutionResult(result);
        console.log('✅ Swap executed successfully:', result);
        
        // Store execution result for progress page
        sessionStorage.setItem('executionResult', JSON.stringify(result));
        
        // Navigate to progress page
        setTimeout(() => {
          window.location.href = '/progress';
        }, 2000);
      } else {
        setError(result.error || 'Swap execution failed');
        console.error('❌ Swap execution failed:', result.error);
      }
    } catch (error) {
      setError('Network error. Please try again.');
      console.error('❌ Network error:', error);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    setExecutionResult(null);
  };

  const handleBack = () => {
    window.history.back();
  };

  if (!swapData) {
    return (
      <div className="min-h-screen bg-[#f2f2f7] flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Swap Data</h2>
          <p className="text-gray-600 mb-4">Please go back and create a swap first.</p>
          <button
            onClick={handleBack}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f2f2f7] via-white to-[#f8f9fa]">
      {/* Header */}
      <div className="fixed top-4 left-4 z-50">
        <button
          onClick={handleBack}
          className="flex items-center space-x-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-xl shadow-lg hover:bg-white transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Back</span>
        </button>
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Review Swap</h1>
            <p className="text-gray-600">Confirm your cross-chain transaction</p>
          </div>

          {/* Swap Details Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6 mb-6"
          >
            {/* From Chain */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Ethereum (Sepolia)</h3>
                  <p className="text-sm text-gray-600">{formatEthAddress(swapData?.ethAddress)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">You Pay</p>
                <p className="font-semibold text-gray-900">
                  {swapData?.fromAmount || '0'} {swapData?.fromToken || 'ETH'}
                </p>
              </div>
            </div>

            {/* Arrow */}
            <div className="flex justify-center mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <ArrowRight className="w-4 h-4 text-white" />
              </div>
            </div>

            {/* To Chain */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Stellar (Testnet)</h3>
                  <p className="text-sm text-gray-600">{formatStellarAddress(swapData?.stellarPublicKey)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">You Receive</p>
                <p className="font-semibold text-gray-900">
                  {swapData?.toAmount || '0'} {swapData?.toToken || 'XLM'}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Quote Details */}
          {swapData?.quote && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6"
            >
              <h3 className="font-semibold text-gray-900 mb-3">Swap Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Exchange Rate</span>
                  <span className="font-medium text-gray-900">
                    1 {swapData.fromToken} = {swapData.quote?.toTokenAmount ? (swapData.quote.toTokenAmount / swapData.quote.fromTokenAmount).toFixed(6) : 'N/A'} {swapData.toToken}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Price Impact</span>
                  <span className="font-medium text-green-600">
                    {swapData.quote?.priceImpact || swapData.priceImpact || 0}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Network Fee</span>
                  <span className="font-medium text-gray-900">
                    ~${swapData.quote?.estimatedGas || swapData.estimatedGas || 'Unknown'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Slippage</span>
                  <span className="font-medium text-gray-900">{swapData.slippage || 1}%</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Security Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6"
          >
            <div className="flex items-center space-x-2 mb-2">
              <Shield className="w-5 h-5 text-green-600" />
              <span className="font-semibold text-green-800">HTLC Security</span>
            </div>
            <p className="text-sm text-green-700">
              Your swap is secured by Hash Time-Locked Contracts (HTLC) ensuring atomic cross-chain execution.
            </p>
          </motion.div>

          {/* Error Display */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6"
            >
              <div className="flex items-center space-x-2 mb-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span className="text-red-800 font-medium">Error</span>
              </div>
              <p className="text-red-700 text-sm">{error}</p>
            </motion.div>
          )}

          {/* Success Message */}
          {executionResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6"
            >
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-green-800 font-medium">Swap Initiated</span>
              </div>
              <p className="text-green-700 text-sm">
                Your cross-chain swap has been initiated. Redirecting to progress page...
              </p>
            </motion.div>
          )}

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-3"
          >
            {!executionResult && (
              <button
                onClick={handleSwapTokens}
                disabled={isExecuting}
                className="w-full bg-black text-white py-4 rounded-xl font-semibold hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all transform hover:scale-105 flex items-center justify-center space-x-2"
              >
                {isExecuting ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Executing Swap...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    <span>Execute Swap</span>
                  </>
                )}
              </button>
            )}

            {error && (
              <button
                onClick={handleRetry}
                className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-200 transition-all"
              >
                Try Again
              </button>
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
} 