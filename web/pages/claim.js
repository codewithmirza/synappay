'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle, Loader, ArrowLeft, ExternalLink } from 'lucide-react';

export default function Claim() {
  const [swapData, setSwapData] = useState(null);
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimResult, setClaimResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadSwapData();
  }, []);

  const loadSwapData = () => {
    try {
      const storedExecutionResult = sessionStorage.getItem('executionResult');
      const storedSwapData = sessionStorage.getItem('swapData');
      
      if (storedExecutionResult && storedSwapData) {
        const executionResult = JSON.parse(storedExecutionResult);
        const originalSwapData = JSON.parse(storedSwapData);
        
        const combinedData = {
          ...originalSwapData,
          ...executionResult,
        };
        
        setSwapData(combinedData);
        console.log('📋 Claim data loaded:', combinedData);
      } else {
        setError('No swap data found. Please start a new swap.');
      }
    } catch (error) {
      console.error('Error loading swap data:', error);
      setError('Failed to load swap data');
    }
  };

  const handleClaim = async () => {
    if (!swapData) {
      setError('No swap data available');
      return;
    }

    setIsClaiming(true);
    setError(null);

    try {
      console.log('🎯 Claiming tokens with secret:', swapData.secret);
      
      // For demo purposes, simulate successful claim
      setTimeout(() => {
        setClaimResult({
          success: true,
          txHash: '0x' + Math.random().toString(16).substr(2, 64),
          message: 'Tokens successfully claimed!'
        });
        setIsClaiming(false);
      }, 3000);
      
    } catch (error) {
      setError('Failed to claim tokens: ' + error.message);
      setIsClaiming(false);
    }
  };

  const handleBack = () => {
    window.history.back();
  };

  if (error && !swapData) {
    return (
      <div className="min-h-screen bg-[#f2f2f7] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 max-w-md w-full text-center">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => window.location.href = '/swap'}
            className="bg-blue-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-600 transition-colors"
          >
            Start New Swap
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f2f2f7]">
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Claim Tokens</h1>
            <p className="text-gray-600">Complete your cross-chain swap</p>
          </div>

          {/* Swap Summary */}
          {swapData && (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-4">Swap Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">From</span>
                  <span className="font-medium">{swapData.fromAmount} {swapData.fromToken}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">To</span>
                  <span className="font-medium">{swapData.toAmount} {swapData.toToken}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Transaction</span>
                  <a
                    href={`https://sepolia.etherscan.io/tx/${swapData.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                  >
                    <span>{swapData.txHash?.slice(0, 8)}...{swapData.txHash?.slice(-6)}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* HTLC Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">HTLC Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-blue-700">Hashlock</span>
                <span className="font-mono text-blue-800">
                  {swapData?.hashlock?.slice(0, 10)}...{swapData?.hashlock?.slice(-8)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">Secret Available</span>
                <span className="text-green-600 font-medium">✓ Yes</span>
              </div>
            </div>
          </div>

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
          {claimResult && claimResult.success && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6"
            >
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-green-800 font-medium">Success!</span>
              </div>
              <p className="text-green-700 text-sm mb-2">{claimResult.message}</p>
              <a
                href={`https://sepolia.etherscan.io/tx/${claimResult.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-600 text-sm hover:text-green-800 flex items-center space-x-1"
              >
                <span>View transaction</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </motion.div>
          )}

          {/* Action Button */}
          {!claimResult && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleClaim}
              disabled={isClaiming}
              className="w-full bg-green-500 text-white py-4 rounded-xl font-semibold hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2"
            >
              {isClaiming ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Claiming Tokens...</span>
                </>
              ) : (
                <span>Claim {swapData?.toAmount} {swapData?.toToken}</span>
              )}
            </motion.button>
          )}

          {/* Success Actions */}
          {claimResult && claimResult.success && (
            <div className="space-y-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => window.location.href = '/swap'}
                className="w-full bg-blue-500 text-white py-4 rounded-xl font-semibold hover:bg-blue-600 transition-all"
              >
                Start New Swap
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => window.location.href = '/history'}
                className="w-full bg-gray-200 text-gray-800 py-3 rounded-xl font-medium hover:bg-gray-300 transition-all"
              >
                View History
              </motion.button>
            </div>
          )}

          {/* Info */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Powered by HTLC • Secure • Trustless
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}