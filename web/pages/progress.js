'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, AlertCircle, Zap, Shield, Coins, ArrowRight } from 'lucide-react';
import { useWalletManager } from '../lib/wallet-manager';
import UnifiedLayout from '../components/UnifiedLayout';
import TokenIcon from '../components/TokenIcon';
import apiClient from '../lib/api-client';
import { SynappayBridge } from '../lib/Synappay-bridge';

const Synappay_STEPS = [
  {
    id: 'init',
    title: 'Initialize Swap',
    description: 'Creating cross-chain swap request with hashlock',
    icon: Zap
  },
  {
    id: 'ethereum_locked',
    title: 'Ethereum Lock',
    description: 'Tokens locked via 1inch Fusion+ escrow',
    icon: Shield
  },
  {
    id: 'stellar_locked',
    title: 'Stellar HTLC',
    description: 'Claimable balance created on Stellar network',
    icon: Shield
  },
  {
    id: 'completed',
    title: 'Swap Complete',
    description: 'Tokens claimed on destination chain',
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

  // Track Synappay swap progress
  useEffect(() => {
    if (!swapId) return;

    const trackProgress = async () => {
      try {
        const status = await SynappayBridge.getSwapStatus(swapId);
        if (status) {
          setSwapDetails(status.request);
          setSwapStatus(status.request.status);
          setTimeRemaining(status.timeRemaining);
          
          // Map Synappay steps to progress
          const stepMap = {
            'init': 0,
            'ethereum_locked': 1,
            'stellar_locked': 2,
            'completed': 3
          };
          setCurrentStep(stepMap[status.step] || 0);
        }
      } catch (error) {
        console.error('Failed to track swap progress:', error);
        setError('Failed to load swap status');
      }
    };

    // Initial load
    trackProgress();

    // Poll for updates every 5 seconds
    const interval = setInterval(trackProgress, 5000);
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

  // Handle claim tokens action (Synappay flow)
  const handleClaimTokens = async () => {
    if (!swapId || !swapDetails) return;

    try {
      setError(null);
      
      // For testnet, we'll simulate the claim process
      // In production, this would require wallet signing
      const mockKeypair = { publicKey: () => stellarPublicKey };
      
      const claimResult = await SynappayBridge.claimTokens(swapId, mockKeypair);
      console.log('Tokens claimed:', claimResult);
      
      // Update status
      setSwapStatus('completed');
      setCurrentStep(3);
      
    } catch (error) {
      console.error('Failed to claim tokens:', error);
      setError('Failed to claim tokens. Please try again.');
    }
  };
  }, [swapId, ethAddress, stellarPublicKey, timeRemaining]);

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
          <button
            onClick={() => window.location.href = '/'}
            className="bg-black text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-800 transition-all"
          >
            Go to Home Page
          </button>
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
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-blue-800">Swap #{swapId}</h3>
              <p className="text-sm text-blue-600 capitalize">Status: {swapStatus}</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-blue-600">Time Remaining</div>
              <div className="text-xl font-bold text-blue-800">{formatTime(timeRemaining)}</div>
            </div>
          </div>

          {/* Swap Summary */}
          {swapDetails && (
            <div className="flex items-center justify-center space-x-6 pt-4 border-t border-blue-200">
              <div className="text-center">
                <TokenIcon symbol={swapDetails.fromToken} size={32} className="mx-auto mb-1" />
                <div className="text-lg font-bold text-gray-900">{swapDetails.amount}</div>
                <div className="text-xs text-gray-600">{swapDetails.fromToken}</div>
              </div>
              
              <ArrowRight className="w-5 h-5 text-blue-600" />
              
              <div className="text-center">
                <TokenIcon symbol={swapDetails.toToken} size={32} className="mx-auto mb-1" />
                <div className="text-lg font-bold text-gray-900">{swapDetails.quote}</div>
                <div className="text-xs text-gray-600">{swapDetails.toToken}</div>
              </div>
            </div>
          )}
        </div>

        {/* Progress Timeline */}
        <div className="space-y-3">
          {Synappay_STEPS.map((step, index) => {
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
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${status === 'completed' ? 'bg-green-100' : status === 'active' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                    {status === 'completed' ? (
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    ) : status === 'active' ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    ) : (
                      <Icon className={`w-6 h-6 ${getStatusColor(status)}`} />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h4 className={`font-semibold ${getStatusColor(status)}`}>
                      {step.title}
                    </h4>
                    <p className="text-sm text-gray-600">{step.description}</p>
                  </div>
                  
                  {status === 'active' && (
                    <div className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                      In Progress
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
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
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
          >
            View History
          </button>
          
          {swapStatus === 'locked' && currentStep >= 2 && (
            <button
              onClick={handleClaimTokens}
              className="flex-1 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center space-x-2 font-medium"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Claim Tokens</span>
            </button>
          )}

          {swapStatus === 'completed' && (
            <button
              onClick={() => window.location.href = '/swap'}
              className="flex-1 px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors flex items-center justify-center space-x-2 font-medium"
            >
              <Coins className="w-4 h-4" />
              <span>Start New Swap</span>
            </button>
          )}
        </div>

        {/* Status Messages */}
        {swapStatus === 'timeout' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
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