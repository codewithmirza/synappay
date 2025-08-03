'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Shield, Clock, CheckCircle, AlertCircle, Zap, Coins, ArrowLeft, ArrowUpDown } from 'lucide-react';
import { useWalletManager } from '../lib/wallet-manager';
import TokenIcon from '../components/TokenIcon';

export default function Review() {
  const {
    ethConnected,
    stellarConnected,
    bothConnected,
    ethAddress,
    stellarPublicKey,
    formatEthAddress,
    formatStellarAddress
  } = useWalletManager();

  const [swapDetails, setSwapDetails] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState(null);

  // Get swap details from URL params or session storage
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const fromToken = urlParams.get('fromToken') || 'ETH';
    const toToken = urlParams.get('toToken') || 'XLM';
    const amount = urlParams.get('amount') || '0.1';
    const quote = urlParams.get('quote') || '1000';
    const rate = urlParams.get('rate') || '10000';

    setSwapDetails({
      fromToken,
      toToken,
      amount: parseFloat(amount),
      quote: parseFloat(quote),
      rate: parseFloat(rate),
      fromAddress: ethAddress,
      toAddress: stellarPublicKey,
      hashlock: '0x' + Math.random().toString(16).substr(2, 64),
      timelock: Math.floor(Date.now() / 1000) + 3600, // 1 hour
      fees: {
        ethereum: 0.001,
        stellar: 0.00001
      }
    });
  }, [ethAddress, stellarPublicKey]);

  const handleConfirmSwap = async () => {
    if (!swapDetails || !bothConnected) return;

    try {
      setConfirming(true);
      setError(null);

      // Simulate swap execution
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Redirect to progress page
      window.location.href = `/progress?swapId=${Date.now()}`;
    } catch (error) {
      console.error('Swap confirmation failed:', error);
      setError('Failed to confirm swap. Please try again.');
      setConfirming(false);
    }
  };

  const handleCancel = () => {
    window.location.href = '/swap';
  };

  if (!bothConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">S</span>
                </div>
                <span className="text-xl font-bold text-gray-900">SynapPay</span>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => window.location.href = '/'}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Home
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Connect Wallets Content */}
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-4">
          <div className="max-w-md w-full">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center"
            >
              <div className="w-16 h-16 bg-gradient-to-r from-red-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Wallets Required</h2>
              <p className="text-gray-600 mb-8">
                Please connect both Ethereum and Stellar wallets to review your swap
              </p>
              
              <button
                onClick={() => window.location.href = '/'}
                className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all"
              >
                Go to Home Page
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  if (!swapDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading swap details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span className="text-xl font-bold text-gray-900">SynapPay</span>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => window.location.href = '/swap'}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Swap</span>
              </button>
              <div className="flex items-center space-x-2 px-3 py-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">Wallets Connected</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-4 py-8">
        <div className="max-w-lg w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-100 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Review Your Swap</h2>
              <p className="text-gray-600">Confirm your cross-chain atomic swap details</p>
            </div>

            <div className="p-6 space-y-6">
              {/* Swap Summary */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
                <div className="flex items-center justify-center mb-6">
                  <div className="flex items-center space-x-4">
                    <div className="text-center">
                      <TokenIcon symbol={swapDetails.fromToken} size={40} className="mx-auto mb-2" />
                      <div className="text-2xl font-bold text-gray-900">{swapDetails.amount}</div>
                      <div className="text-sm text-gray-600">{swapDetails.fromToken}</div>
                    </div>
                    
                    <div className="p-3 bg-white rounded-full shadow-lg">
                      <ArrowUpDown className="w-6 h-6 text-blue-600" />
                    </div>
                    
                    <div className="text-center">
                      <TokenIcon symbol={swapDetails.toToken} size={40} className="mx-auto mb-2" />
                      <div className="text-2xl font-bold text-gray-900">{swapDetails.quote.toFixed(2)}</div>
                      <div className="text-sm text-gray-600">{swapDetails.toToken}</div>
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-sm text-gray-600">
                    Rate: 1 {swapDetails.fromToken} = {swapDetails.rate.toFixed(2)} {swapDetails.toToken}
                  </div>
                </div>
              </div>

              {/* Wallet Addresses */}
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <TokenIcon symbol="ETH" size={24} />
                      <div>
                        <div className="font-medium text-gray-900">From Ethereum</div>
                        <div className="text-sm text-gray-600">{formatEthAddress(swapDetails.fromAddress)}</div>
                      </div>
                    </div>
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <TokenIcon symbol="XLM" size={24} />
                      <div>
                        <div className="font-medium text-gray-900">To Stellar</div>
                        <div className="text-sm text-gray-600">{formatStellarAddress(swapDetails.toAddress)}</div>
                      </div>
                    </div>
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                </div>
              </div>

              {/* Security Information */}
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <Shield className="w-5 h-5 text-green-600" />
                  <h3 className="font-semibold text-green-800">HTLC Security</h3>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-green-700">Atomic Execution:</span>
                    <span className="text-green-600">Both succeed or both fail</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">Timeout Protection:</span>
                    <span className="text-green-600">1 hour safety window</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">Hash Lock:</span>
                    <span className="font-mono text-green-600 text-xs">{swapDetails.hashlock.substring(0, 16)}...</span>
                  </div>
                </div>
              </div>

              {/* Fee Information */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-800 mb-3">Network Fees</h3>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ethereum Gas:</span>
                    <span className="text-gray-800">{swapDetails.fees.ethereum} ETH</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Stellar Network:</span>
                    <span className="text-gray-800">{swapDetails.fees.stellar} XLM</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between font-semibold">
                      <span className="text-gray-800">Est. Total Cost:</span>
                      <span className="text-gray-800">~${(swapDetails.fees.ethereum * 2000 + swapDetails.fees.stellar * 0.1).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

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

              {/* Action Buttons */}
              <div className="flex space-x-4">
                <button
                  onClick={handleCancel}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                
                <button
                  onClick={handleConfirmSwap}
                  disabled={confirming}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2 font-medium hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  {confirming ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Confirming...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      <span>Confirm Swap</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              {/* Security Notice */}
              <div className="text-center text-xs text-gray-500 space-y-1">
                <p>By confirming this swap, you agree to our atomic swap protocol terms.</p>
                <p>Your funds are protected by cryptographic hashlocks and timelocks.</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}