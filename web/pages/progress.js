'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, AlertCircle, Zap, Shield, Coins, ArrowRight, ArrowLeft, Home } from 'lucide-react';
import { useWalletManager } from '../lib/wallet-manager';
import TokenIcon from '../components/TokenIcon';

const SWAP_STEPS = [
  {
    id: 'intent',
    title: 'Create Intent',
    description: 'Broadcasting swap order to 1inch Fusion+ network',
    icon: Zap
  },
  {
    id: 'lock_eth',
    title: 'Lock Ethereum Assets',
    description: 'Depositing tokens into HTLC contract on Ethereum',
    icon: Shield
  },
  {
    id: 'lock_stellar',
    title: 'Lock Stellar Assets',
    description: 'Depositing tokens into HTLC contract on Stellar',
    icon: Shield
  },
  {
    id: 'execute',
    title: 'Execute Swap',
    description: 'Atomic execution across both chains',
    icon: Zap
  },
  {
    id: 'complete',
    title: 'Complete',
    description: 'Tokens delivered to destination wallets',
    icon: CheckCircle
  }
];

export default function Progress() {
  const {
    ethConnected,
    stellarConnected,
    bothConnected,
    ethAddress,
    stellarPublicKey,
    formatEthAddress,
    formatStellarAddress
  } = useWalletManager();

  const [swapId, setSwapId] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [swapStatus, setSwapStatus] = useState('pending');
  const [swapDetails, setSwapDetails] = useState(null);
  const [error, setError] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(3600); // 1 hour in seconds

  // Get swap ID from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('swapId');
    setSwapId(id);
  }, []);

  // Simulate swap progress
  useEffect(() => {
    if (!swapId) return;

    const interval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev < SWAP_STEPS.length - 1) {
          return prev + 1;
        } else {
          setSwapStatus('completed');
          clearInterval(interval);
          return prev;
        }
      });
    }, 3000); // Move to next step every 3 seconds

    return () => clearInterval(interval);
  }, [swapId]);

  // Countdown timer
  useEffect(() => {
    if (timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          setSwapStatus('timeout');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining]);

  // Mock swap details
  useEffect(() => {
    setSwapDetails({
      fromToken: 'ETH',
      toToken: 'XLM',
      amount: 0.1,
      quote: 1000,
      fromAddress: ethAddress,
      toAddress: stellarPublicKey,
      hashlock: '0x' + Math.random().toString(16).substr(2, 64),
      timelock: Math.floor(Date.now() / 1000) + timeRemaining
    });
  }, [ethAddress, stellarPublicKey, timeRemaining]);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStepStatus = (stepIndex) => {
    if (stepIndex < currentStep) return 'completed';
    if (stepIndex === currentStep) return 'active';
    return 'pending';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'active': return 'text-blue-600';
      case 'pending': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusBg = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-50 border-green-200';
      case 'active': return 'bg-blue-50 border-blue-200';
      case 'pending': return 'bg-gray-50 border-gray-200';
      default: return 'bg-gray-50 border-gray-200';
    }
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
                Please connect both Ethereum and Stellar wallets to track your swap progress
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
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <Home className="w-4 h-4" />
                <span>Home</span>
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
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Swap Progress</h1>
            <p className="text-gray-600">Real-time tracking of your cross-chain atomic swap</p>
          </div>

          {/* Swap Status Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
          >
            {/* Status Header */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Swap #{swapId}</h3>
                  <p className="text-gray-600 capitalize">Status: {swapStatus}</p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">Time Remaining</div>
                  <div className="text-2xl font-bold text-blue-600">{formatTime(timeRemaining)}</div>
                </div>
              </div>
            </div>

            {/* Swap Details */}
            {swapDetails && (
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-center space-x-8">
                  <div className="text-center">
                    <TokenIcon symbol={swapDetails.fromToken} size={40} className="mx-auto mb-2" />
                    <div className="text-xl font-bold text-gray-900">{swapDetails.amount}</div>
                    <div className="text-sm text-gray-600">{swapDetails.fromToken}</div>
                    <div className="text-xs text-gray-500 mt-1">{formatEthAddress(swapDetails.fromAddress)}</div>
                  </div>
                  
                  <div className="p-3 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full">
                    <ArrowRight className="w-6 h-6 text-blue-600" />
                  </div>
                  
                  <div className="text-center">
                    <TokenIcon symbol={swapDetails.toToken} size={40} className="mx-auto mb-2" />
                    <div className="text-xl font-bold text-gray-900">{swapDetails.quote}</div>
                    <div className="text-sm text-gray-600">{swapDetails.toToken}</div>
                    <div className="text-xs text-gray-500 mt-1">{formatStellarAddress(swapDetails.toAddress)}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Progress Steps */}
            <div className="p-6">
              <div className="space-y-4">
                {SWAP_STEPS.map((step, index) => {
                  const status = getStepStatus(index);
                  const Icon = step.icon;
                  
                  return (
                    <motion.div
                      key={step.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`border rounded-xl p-4 ${getStatusBg(status)}`}
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${status === 'completed' ? 'bg-green-100' : status === 'active' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                          {status === 'completed' ? (
                            <CheckCircle className="w-6 h-6 text-green-600" />
                          ) : status === 'active' ? (
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                          ) : (
                            <Icon className={`w-6 h-6 ${getStatusColor(status)}`} />
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <h4 className={`font-semibold text-lg ${getStatusColor(status)}`}>
                            {step.title}
                          </h4>
                          <p className="text-gray-600">{step.description}</p>
                        </div>
                        
                        {status === 'active' && (
                          <div className="text-xs text-blue-600 bg-blue-100 px-3 py-1 rounded-full font-medium">
                            In Progress
                          </div>
                        )}
                        
                        {status === 'completed' && (
                          <div className="text-xs text-green-600 bg-green-100 px-3 py-1 rounded-full font-medium">
                            Completed
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="p-6 border-t border-gray-100">
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <span className="text-red-700">{error}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Status Messages */}
            {swapStatus === 'timeout' && (
              <div className="p-6 border-t border-gray-100">
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-5 h-5 text-yellow-600" />
                    <span className="text-yellow-700">Swap timed out. You can refund your tokens.</span>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="p-6 border-t border-gray-100">
              <div className="flex space-x-4">
                <button
                  onClick={() => window.location.href = '/history'}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                >
                  View History
                </button>
                
                {swapStatus === 'completed' ? (
                  <button
                    onClick={() => window.location.href = '/swap'}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all flex items-center justify-center space-x-2 font-medium hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    <Coins className="w-4 h-4" />
                    <span>Start New Swap</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => window.location.href = '/swap'}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all flex items-center justify-center space-x-2 font-medium hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    <Coins className="w-4 h-4" />
                    <span>Start New Swap</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}