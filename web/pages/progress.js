'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, AlertCircle, Zap, Shield, Coins, ArrowRight } from 'lucide-react';
import { useWalletManager } from '../lib/wallet-manager';
import UnifiedLayout from '../components/UnifiedLayout';

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
      case 'completed': return 'bg-green-100 border-green-200';
      case 'active': return 'bg-blue-100 border-blue-200';
      case 'pending': return 'bg-gray-100 border-gray-200';
      default: return 'bg-gray-100 border-gray-200';
    }
  };

  if (!bothConnected) {
    return (
      <UnifiedLayout
        title="Connect Wallets First"
        subtitle="Please connect both Ethereum and Stellar wallets to track your swap"
        showWalletButton={true}
      >
        <div className="text-center space-y-6">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
            <Coins className="w-8 h-8 text-gray-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Wallets Not Connected
            </h3>
            <p className="text-gray-600">
              Use the wallet connection button in the top-right corner to connect both wallets
            </p>
          </div>
        </div>
      </UnifiedLayout>
    );
  }

  return (
    <UnifiedLayout
      title="Swap Progress"
      subtitle="Real-time tracking of your cross-chain atomic swap"
      showWalletButton={true}
    >
      <div className="space-y-6">
        {/* Swap ID and Status */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-blue-800">Swap #{swapId}</h3>
              <p className="text-sm text-blue-600">Status: {swapStatus}</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-blue-600">Time Remaining</div>
              <div className="text-lg font-bold text-blue-800">{formatTime(timeRemaining)}</div>
            </div>
          </div>
        </div>

        {/* Progress Timeline */}
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
                className={`border rounded-lg p-4 ${getStatusBg(status)}`}
              >
                <div className="flex items-center space-x-4">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${getStatusColor(status)}`}>
                    {status === 'completed' ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : status === 'active' ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-current"></div>
                    ) : (
                      <Icon className="w-6 h-6" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h4 className={`font-semibold ${getStatusColor(status)}`}>
                      {step.title}
                    </h4>
                    <p className="text-sm text-gray-600">{step.description}</p>
                  </div>
                  
                  {status === 'active' && (
                    <div className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                      In Progress
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Swap Details */}
        {swapDetails && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Swap Details</h3>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div className="text-sm text-gray-600">From</div>
                <div className="font-semibold">{swapDetails.amount} {swapDetails.fromToken}</div>
                <div className="text-xs text-gray-500">{formatEthAddress(swapDetails.fromAddress)}</div>
              </div>
              
              <div>
                <div className="text-sm text-gray-600">To</div>
                <div className="font-semibold">{swapDetails.quote} {swapDetails.toToken}</div>
                <div className="text-xs text-gray-500">{formatStellarAddress(swapDetails.toAddress)}</div>
              </div>
            </div>
            
            <div className="text-xs text-gray-500">
              <div>Hashlock: {swapDetails.hashlock.substring(0, 16)}...</div>
              <div>Timelock: {new Date(swapDetails.timelock * 1000).toLocaleString()}</div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-4">
          <button
            onClick={() => window.location.href = '/history'}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            View History
          </button>
          
          {swapStatus === 'completed' && (
            <button
              onClick={() => window.location.href = '/swap'}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
            >
              <Coins className="w-4 h-4" />
              <span>Start New Swap</span>
            </button>
          )}
        </div>

        {/* Status Messages */}
        {swapStatus === 'timeout' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-yellow-600" />
              <span className="text-yellow-700">Swap timed out. You can refund your tokens.</span>
            </div>
          </div>
        )}
      </div>
    </UnifiedLayout>
  );
} 