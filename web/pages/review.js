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
      setSwapData(JSON.parse(storedData));
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
    <div className="min-h-screen bg-[#f2f2f7] flex items-center justify-center p-4">
      <div className="p-6 md:p-8 max-w-[600px] w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-[32px] font-bold text-gray-900 mb-2">
            Review Swap
          </h1>
          <p className="text-base md:text-[16px] text-gray-600">
            Confirm your cross-chain swap details
          </p>
        </div>

        {/* Swap Details */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <div className="space-y-6">
            {/* Swap Direction */}
            <div className="text-center">
              <div className="flex items-center justify-center space-x-4 mb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">{swapData.fromToken[0]}</span>
                  </div>
                  <span className="text-lg font-semibold">{swapData.fromAmount} {swapData.fromToken}</span>
                </div>
                <ArrowRight className="w-6 h-6 text-gray-400" />
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">{swapData.toToken[0]}</span>
                  </div>
                  <span className="text-lg font-semibold">{swapData.toAmount} {swapData.toToken}</span>
                </div>
              </div>
              <p className="text-sm text-gray-500">
                {swapData.fromToken} → {swapData.toToken} via 1inch Fusion+
              </p>
            </div>

            {/* Quote Details */}
            {swapData.quote && (
              <div className="bg-blue-50 rounded-xl p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Quote Details</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Exchange Rate</span>
                    <span className="text-sm font-semibold">
                      1 {swapData.fromToken} = {(swapData.toAmount / swapData.fromAmount).toFixed(6)} {swapData.toToken}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Price Impact</span>
                    <span className="text-sm font-semibold text-green-600">
                      {swapData.quote.priceImpact || 0}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Slippage</span>
                    <span className="text-sm font-semibold">{swapData.slippage}%</span>
                  </div>
                </div>
              </div>
            )}

            {/* Wallet Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700">Wallet Information</h3>
              
              {/* Ethereum Wallet */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Shield className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Ethereum</p>
                    <p className="text-xs text-gray-600 font-mono">{formatEthAddress(swapData.ethAddress)}</p>
                  </div>
                </div>
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>

              {/* Stellar Wallet */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Star className="w-5 h-5 text-yellow-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Stellar</p>
                    <p className="text-xs text-gray-600 font-mono">{formatStellarAddress(swapData.stellarPublicKey)}</p>
                  </div>
                </div>
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            </div>

            {/* Security Information */}
            <div className="bg-green-50 rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Shield className="w-5 h-5 text-green-600" />
                <h3 className="text-sm font-medium text-green-900">HTLC Security</h3>
              </div>
              <p className="text-xs text-green-700">
                Your swap is protected by Hash Time Locked Contracts (HTLCs) on both chains. 
                Funds are secured and can be refunded if the swap fails.
              </p>
            </div>

            {/* Contract Information */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Contract Details</h3>
              <p className="text-xs text-gray-600 font-mono">
                {swapData.contractAddress}
              </p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl"
          >
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
          </motion.div>
        )}

        {/* Success Message */}
        {executionResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl"
          >
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-sm text-green-700">Swap executed successfully!</span>
            </div>
            <p className="text-xs text-green-600 mt-1">
              Transaction Hash: {executionResult.txHash?.slice(0, 10)}...{executionResult.txHash?.slice(-8)}
            </p>
          </motion.div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-4">
          <button
            onClick={handleBack}
            disabled={isExecuting}
            className="flex-1 py-3 px-6 rounded-xl font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            <ArrowLeft className="w-5 h-5 inline mr-2" />
            Back
          </button>

          <motion.button
            onClick={handleSwapTokens}
            disabled={isExecuting}
            className="flex-1 py-3 px-6 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50"
            whileHover={!isExecuting ? { scale: 1.02 } : {}}
            whileTap={!isExecuting ? { scale: 0.98 } : {}}
          >
            {isExecuting ? (
              <>
                <Loader className="w-5 h-5 inline mr-2 animate-spin" />
                Executing...
              </>
            ) : (
              <>
                <Zap className="w-5 h-5 inline mr-2" />
                Execute Swap
              </>
            )}
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