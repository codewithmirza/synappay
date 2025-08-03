'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Clock, AlertCircle, Zap, Shield, Coins, ArrowRight, RefreshCw, ExternalLink, Copy } from 'lucide-react';
import { useWalletManager } from '../lib/wallet-manager';
import UnifiedLayout from '../components/UnifiedLayout';
import TokenIcon from '../components/TokenIcon';
import apiClient from '../lib/api-client';
import { SynappayBridge } from '../lib/Synappay-bridge';

const SWAP_STEPS = [
  {
    id: 'init',
    title: 'Initialize Swap',
    description: 'Creating cross-chain swap request',
    icon: Zap,
    color: 'blue'
  },
  {
    id: 'ethereum_locked',
    title: 'Ethereum Lock',
    description: 'Tokens locked via 1inch Fusion+',
    icon: Shield,
    color: 'green'
  },
  {
    id: 'stellar_locked',
    title: 'Stellar HTLC',
    description: 'Claimable balance created',
    icon: Shield,
    color: 'purple'
  },
  {
    id: 'completed',
    title: 'Swap Complete',
    description: 'Tokens claimed successfully',
    icon: CheckCircle,
    color: 'emerald'
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
  const [timeRemaining, setTimeRemaining] = useState(3600);
  const [isClaiming, setIsClaiming] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Get swap ID from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('swapId');
    setSwapId(id);
  }, []);

  // Track swap progress
  useEffect(() => {
    if (!swapId) return;

    const trackProgress = async () => {
      try {
        const status = await SynappayBridge.getSwapStatus(swapId);
        if (status) {
          setSwapDetails(status.request);
          setSwapStatus(status.request.status);
          setTimeRemaining(status.timeRemaining);
          
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

    trackProgress();
    const interval = setInterval(trackProgress, 5000);
    return () => clearInterval(interval);
  }, [swapId]);

  // Countdown timer
  useEffect(() => {
    if (timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining]);

  const handleClaimTokens = async () => {
    if (!swapId) return;

    try {
      setIsClaiming(true);
      setError(null);

      await SynappayBridge.claimTokens(swapId);
      
      // Refresh status
      const status = await SynappayBridge.getSwapStatus(swapId);
      if (status) {
        setSwapDetails(status.request);
        setSwapStatus(status.request.status);
        setCurrentStep(3); // Completed
      }
    } catch (error) {
      console.error('Failed to claim tokens:', error);
      setError('Failed to claim tokens. Please try again.');
    } finally {
      setIsClaiming(false);
    }
  };

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
      case 'completed': return 'text-emerald-600';
      case 'active': return 'text-blue-600';
      case 'pending': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusBg = (status) => {
    switch (status) {
      case 'completed': return 'bg-emerald-100 border-emerald-200';
      case 'active': return 'bg-blue-100 border-blue-200';
      case 'pending': return 'bg-gray-100 border-gray-200';
      default: return 'bg-gray-100 border-gray-200';
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  if (!swapId) {
    return (
      <UnifiedLayout
        title="Swap Progress"
        subtitle="No swap ID provided"
        showWalletButton={true}
      >
        <div className="text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h3 className="text-lg font-semibold text-gray-900">Invalid Swap</h3>
          <p className="text-gray-600">No swap ID found in URL parameters.</p>
          <button
            onClick={() => window.location.href = '/swap'}
            className="bg-black text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-800 transition-all"
          >
            Start New Swap
          </button>
        </div>
      </UnifiedLayout>
    );
  }

  return (
    <UnifiedLayout
      title="Swap Progress"
      subtitle={`Tracking swap ${swapId?.slice(0, 8)}...`}
      showWalletButton={true}
    >
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Progress Steps */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="space-y-6">
            {SWAP_STEPS.map((step, index) => {
              const status = getStepStatus(index);
              const Icon = step.icon;
              
              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-start space-x-4 p-4 rounded-lg border ${getStatusBg(status)}`}
                >
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                    status === 'completed' ? 'bg-emerald-500 text-white' :
                    status === 'active' ? 'bg-blue-500 text-white' :
                    'bg-gray-300 text-gray-500'
                  }`}>
                    {status === 'completed' ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-semibold ${getStatusColor(status)}`}>
                      {step.title}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {step.description}
                    </p>
                    
                    {status === 'active' && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-2"
                      >
                        <div className="flex items-center space-x-2 text-sm text-blue-600">
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Processing...</span>
                        </div>
                      </motion.div>
                    )}
                  </div>
                  
                  {index < SWAP_STEPS.length - 1 && (
                    <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                      <ArrowRight className={`w-4 h-4 ${
                        status === 'completed' ? 'text-emerald-500' : 'text-gray-300'
                      }`} />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Swap Details */}
        {swapDetails && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Swap Details</h3>
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                {showDetails ? 'Hide' : 'Show'} Details
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <TokenIcon symbol={swapDetails.fromToken} className="w-5 h-5" />
                  <span className="font-medium">{swapDetails.fromToken}</span>
                </div>
                <div className="text-2xl font-bold">
                  {parseFloat(swapDetails.amount).toFixed(6)}
                </div>
                <div className="text-sm text-gray-500">
                  {formatEthAddress(swapDetails.userAddress)}
                </div>
              </div>
              
              <div className="space-y-2 text-right">
                <div className="flex items-center justify-end space-x-2">
                  <span className="font-medium">{swapDetails.toToken}</span>
                  <TokenIcon symbol={swapDetails.toToken} className="w-5 h-5" />
                </div>
                <div className="text-2xl font-bold">
                  {swapDetails.toAmount ? parseFloat(swapDetails.toAmount).toFixed(6) : 'Calculating...'}
                </div>
                <div className="text-sm text-gray-500">
                  {formatStellarAddress(swapDetails.stellarAddress)}
                </div>
              </div>
            </div>

            <AnimatePresence>
              {showDetails && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3 pt-4 border-t border-gray-200"
                >
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Swap ID:</span>
                      <div className="flex items-center space-x-2 mt-1">
                        <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                          {swapId}
                        </code>
                        <button
                          onClick={() => copyToClipboard(swapId)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600">Status:</span>
                      <div className="mt-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          swapStatus === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                          swapStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {swapStatus}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Countdown Timer */}
        {timeRemaining > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-yellow-50 border border-yellow-200 rounded-xl p-4"
          >
            <div className="flex items-center justify-center space-x-2">
              <Clock className="w-5 h-5 text-yellow-600" />
              <span className="text-yellow-800 font-medium">Time Remaining:</span>
              <span className="text-yellow-800 font-mono text-lg">
                {formatTime(timeRemaining)}
              </span>
            </div>
            <p className="text-sm text-yellow-700 text-center mt-2">
              Complete the swap before time expires to avoid automatic refund
            </p>
          </motion.div>
        )}

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 rounded-xl p-4"
          >
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-red-700">{error}</span>
            </div>
          </motion.div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-4">
          <button
            onClick={() => window.location.href = '/swap'}
            className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-all"
          >
            New Swap
          </button>
          
          {swapStatus === 'stellar_locked' && (
            <button
              onClick={handleClaimTokens}
              disabled={isClaiming}
              className="flex-1 bg-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-emerald-700 transition-all disabled:opacity-50"
            >
              {isClaiming ? (
                <div className="flex items-center justify-center space-x-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Claiming...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <Coins className="w-4 h-4" />
                  <span>Claim Tokens</span>
                </div>
              )}
            </button>
          )}
        </div>
      </div>
    </UnifiedLayout>
  );
}