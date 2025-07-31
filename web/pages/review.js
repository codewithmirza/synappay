'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import ApiClient from '../lib/api-client';
import config from '../lib/config';

export default function Review() {
  const [swapData, setSwapData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [swapResult, setSwapResult] = useState(null);

  const apiClient = new ApiClient();

  useEffect(() => {
    const storedData = sessionStorage.getItem('swapData');
    if (storedData) {
      setSwapData(JSON.parse(storedData));
    } else {
      // Redirect back to swap if no data
      window.location.href = '/swap';
    }
  }, []);

  const handleSwapTokens = async () => {
    if (!swapData) return;

    setLoading(true);
    setError(null);

    try {
      // Create the cross-chain swap
      const result = await apiClient.createSwap({
        swapType: swapData.swapType,
        fromToken: swapData.fromToken,
        toToken: swapData.toToken,
        amount: swapData.fromAmount,
        receiver: swapData.walletAddress, // For demo, using sender as receiver
        slippage: swapData.slippage
      });

      if (result.success) {
        setSwapResult(result.data);
        setSuccess(true);
        
        // Store swap result for progress page
        sessionStorage.setItem('swapResult', JSON.stringify(result.data));
        
        // Redirect to progress page after a short delay
        setTimeout(() => {
          window.location.href = '/progress';
        }, 2000);
      } else {
        setError(result.error || 'Failed to create swap');
      }
    } catch (error) {
      console.error('Swap creation error:', error);
      setError('Failed to create swap. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    handleSwapTokens();
  };

  const handleBack = () => {
    window.location.href = '/swap';
  };

  if (!swapData) {
    return (
      <div className="min-h-screen bg-[#f2f2f7] flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading swap details...</p>
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
          <div className="space-y-4">
            {/* Swap Direction */}
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">{swapData.fromToken[0]}</span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">You Pay</p>
                  <p className="font-semibold">{swapData.fromAmount} {swapData.fromToken}</p>
                </div>
              </div>
              <ArrowLeft className="w-5 h-5 text-gray-400" />
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">{swapData.toToken[0]}</span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">You Receive</p>
                  <p className="font-semibold">{swapData.toAmount} {swapData.toToken}</p>
                </div>
              </div>
            </div>

            {/* Swap Type */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Swap Type</span>
              <span className="text-sm font-medium">
                {swapData.swapType === 'ETH_TO_STELLAR' ? 'ETH → XLM' : 'XLM → ETH'}
              </span>
            </div>

            {/* Exchange Rate */}
            {swapData.quote && (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Exchange Rate</span>
                <span className="text-sm font-medium">
                  1 {swapData.fromToken} = {swapData.quote.exchangeRate?.toFixed(6) || 'N/A'} {swapData.toToken}
                </span>
              </div>
            )}

            {/* Slippage */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Slippage Tolerance</span>
              <span className="text-sm font-medium">{swapData.slippage}%</span>
            </div>

            {/* Network Fee */}
            {swapData.quote && (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Network Fee</span>
                <span className="text-sm font-medium">
                  ~${swapData.quote.estimatedGas || 'Unknown'}
                </span>
              </div>
            )}

            {/* Contract Address */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">HTLC Contract</span>
              <span className="text-sm font-medium text-gray-500">
                {swapData.contractAddress?.slice(0, 8)}...{swapData.contractAddress?.slice(-6)}
              </span>
            </div>

            {/* Wallet Address */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Your Wallet</span>
              <span className="text-sm font-medium text-gray-500">
                {swapData.walletAddress?.slice(0, 8)}...{swapData.walletAddress?.slice(-6)}
              </span>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-sm text-green-700">Swap created successfully!</span>
            </div>
            {swapResult && (
              <div className="mt-2 text-sm text-green-600">
                <p>Swap ID: {swapResult.swapId?.slice(0, 16)}...</p>
                <p>Redirecting to progress page...</p>
              </div>
            )}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
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
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-4">
          <motion.button
            onClick={handleBack}
            disabled={loading}
            className="flex-1 py-4 px-6 rounded-xl font-semibold text-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Back
          </motion.button>

          <motion.button
            onClick={handleSwapTokens}
            disabled={loading || success}
            className={`flex-1 py-4 px-6 rounded-xl font-semibold text-lg transition-all ${
              loading || success
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-500 text-white hover:bg-blue-600 active:scale-95'
            }`}
            whileHover={!loading && !success ? { scale: 1.02 } : {}}
            whileTap={!loading && !success ? { scale: 0.98 } : {}}
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <Loader className="w-5 h-5 animate-spin" />
                <span>Creating Swap...</span>
              </div>
            ) : success ? (
              'Swap Created!'
            ) : (
              'Confirm Swap'
            )}
          </motion.button>
        </div>

        {/* Info Section */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            This creates a secure HTLC on both chains
          </p>
        </div>
      </div>
    </div>
  );
} 