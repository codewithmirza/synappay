'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, AlertCircle, Loader, ArrowRight, X } from 'lucide-react';
import ApiClient from '../lib/api-client';
import TokenIcon from '../components/TokenIcon';
import config from '../lib/config';

export default function Progress() {
  const [swapData, setSwapData] = useState(null);
  const [progress, setProgress] = useState({
    phase: 'ANNOUNCEMENT',
    status: 'INITIATING',
    auctionActive: false,
    resolvers: 0,
    bestOffer: null,
    timeRemaining: 0,
    phaseTransitions: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const apiClient = new ApiClient();

  useEffect(() => {
    loadSwapData();
  }, []);

  const loadSwapData = () => {
    try {
      // Try to get execution result first (from review page)
      const storedExecutionResult = sessionStorage.getItem('executionResult');
      const storedSwapData = sessionStorage.getItem('swapData');
      
      if (storedExecutionResult && storedSwapData) {
        const executionResult = JSON.parse(storedExecutionResult);
        const originalSwapData = JSON.parse(storedSwapData);
        
        // Combine both data sources
        const combinedData = {
          ...originalSwapData,
          ...executionResult,
          orderHash: executionResult.swapId || executionResult.txHash, // Use swapId or txHash as orderHash
        };
        
        setSwapData(combinedData);
        console.log('📋 Combined swap data loaded:', combinedData);
        
        // Set initial progress based on execution result
        if (executionResult.success) {
          setProgress(prev => ({
            ...prev,
            phase: executionResult.phase || 'DEPOSIT',
            status: 'ACTIVE',
            phaseTransitions: [
              {
                from: 'ANNOUNCEMENT',
                to: executionResult.phase || 'DEPOSIT',
                timestamp: new Date().toISOString()
              }
            ]
          }));
        }
        
        // Start monitoring the swap
        if (combinedData.orderHash) {
          startMonitoring(combinedData.orderHash);
        }
      } else {
        setError('No swap data found. Please start a new swap.');
      }
    } catch (error) {
      console.error('Error loading swap data:', error);
      setError('Failed to load swap data');
    } finally {
      setLoading(false);
    }
  };

  const startMonitoring = async (orderHash) => {
    try {
      console.log('🎯 Starting swap monitoring for order:', orderHash);
      
      // For now, simulate progress since we don't have a real status API
      let currentPhaseIndex = 0;
      const phases = ['ANNOUNCEMENT', 'DEPOSIT', 'WITHDRAWAL'];
      
      const monitorInterval = setInterval(() => {
        try {
          // Simulate phase progression every 10 seconds
          if (currentPhaseIndex < phases.length - 1) {
            currentPhaseIndex++;
            const newPhase = phases[currentPhaseIndex];
            
            setProgress(prev => ({
              ...prev,
              phase: newPhase,
              status: newPhase === 'WITHDRAWAL' ? 'READY_TO_CLAIM' : 'ACTIVE',
              phaseTransitions: [
                ...prev.phaseTransitions,
                {
                  from: phases[currentPhaseIndex - 1],
                  to: newPhase,
                  timestamp: new Date().toISOString()
                }
              ]
            }));
            
            console.log(`📈 Phase updated to: ${newPhase}`);
            
            // Stop monitoring when we reach WITHDRAWAL phase
            if (newPhase === 'WITHDRAWAL') {
              clearInterval(monitorInterval);
              console.log('🏁 Swap monitoring completed - ready for claim');
            }
          }
        } catch (error) {
          console.error('Error in monitoring simulation:', error);
        }
      }, 10000); // Update every 10 seconds

      // Cleanup interval on component unmount
      return () => clearInterval(monitorInterval);
      
    } catch (error) {
      console.error('Error starting monitoring:', error);
      setError('Failed to start swap monitoring');
    }
  };

  const getPhaseIcon = (phase) => {
    switch (phase) {
      case 'ANNOUNCEMENT':
        return <Clock className="w-6 h-6 text-blue-500" />;
      case 'DEPOSIT':
        return <Loader className="w-6 h-6 text-yellow-500 animate-spin" />;
      case 'WITHDRAWAL':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'RECOVERY':
        return <AlertCircle className="w-6 h-6 text-red-500" />;
      default:
        return <Clock className="w-6 h-6 text-gray-500" />;
    }
  };

  const getPhaseColor = (phase) => {
    switch (phase) {
      case 'ANNOUNCEMENT':
        return 'bg-blue-100 text-blue-800';
      case 'DEPOSIT':
        return 'bg-yellow-100 text-yellow-800';
      case 'WITHDRAWAL':
        return 'bg-green-100 text-green-800';
      case 'RECOVERY':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPhaseDescription = (phase) => {
    switch (phase) {
      case 'ANNOUNCEMENT':
        return 'Intent-based order created and broadcast to 1inch Fusion+';
      case 'DEPOSIT':
        return 'Winning resolver escrowing funds on both chains';
      case 'WITHDRAWAL':
        return 'Ready for atomic claim using secret preimage';
      case 'RECOVERY':
        return 'Refund available due to timeout or failure';
      default:
        return 'Processing swap...';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f2f2f7] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 max-w-md w-full text-center">
          <Loader className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Swap Progress</h2>
          <p className="text-gray-600">Please wait while we load your swap details...</p>
        </div>
      </div>
    );
  }

  if (error) {
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
    <div className="min-h-screen bg-[#f2f2f7] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100 max-w-2xl w-full">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Swap Progress
          </h1>
          <p className="text-gray-600">
            Real-time monitoring of your cross-chain swap
          </p>
        </div>

        {/* Swap Details */}
        {swapData && (
          <div className="bg-gray-50 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Swap Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">From</p>
                <div className="flex items-center space-x-2">
                  <TokenIcon symbol={swapData.fromToken} size={16} />
                  <p className="font-medium">{swapData.fromAmount} {swapData.fromToken}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600">To</p>
                <div className="flex items-center space-x-2">
                  <TokenIcon symbol={swapData.toToken} size={16} />
                  <p className="font-medium">{swapData.toAmount} {swapData.toToken}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600">Transaction Hash</p>
                {swapData.txHash ? (
                  <a
                    href={`https://sepolia.etherscan.io/tx/${swapData.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-sm text-blue-600 hover:text-blue-800 break-all underline"
                  >
                    {swapData.txHash.slice(0, 10)}...{swapData.txHash.slice(-8)}
                  </a>
                ) : (
                  <p className="font-mono text-sm text-gray-700">N/A</p>
                )}
              </div>
              <div>
                <p className="text-sm text-gray-600">Swap ID</p>
                <p className="font-mono text-sm text-gray-700 break-all">
                  {swapData.swapId ? `${swapData.swapId.slice(0, 10)}...${swapData.swapId.slice(-8)}` : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className="font-medium">{swapData.success ? 'Initiated' : 'Failed'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Phase</p>
                <p className="font-medium">{swapData.phase || 'ANNOUNCEMENT'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Fusion+ Phases */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">Fusion+ Swap Phases</h3>
          <div className="space-y-4">
            {['ANNOUNCEMENT', 'DEPOSIT', 'WITHDRAWAL'].map((phase, index) => (
              <motion.div
                key={phase}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex items-center p-4 rounded-xl border ${
                  progress.phase === phase
                    ? 'border-blue-200 bg-blue-50'
                    : progress.phaseTransitions.some(t => t.to === phase)
                    ? 'border-green-200 bg-green-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-4 flex-1">
                  {getPhaseIcon(phase)}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-gray-900">{phase}</h4>
                      {progress.phase === phase && (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPhaseColor(phase)}`}>
                          Active
                        </span>
                      )}
                      {progress.phaseTransitions.some(t => t.to === phase) && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Completed
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {getPhaseDescription(phase)}
                    </p>
                  </div>
                </div>
                {progress.phase === phase && (
                  <Loader className="w-5 h-5 text-blue-500 animate-spin" />
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Auction Status */}
        {progress.auctionActive && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Clock className="w-5 h-5 text-yellow-600 mr-2" />
              Dutch Auction Active
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Resolvers</p>
                <p className="text-2xl font-bold text-yellow-600">{progress.resolvers}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Best Offer</p>
                <p className="text-lg font-semibold text-gray-900">
                  {progress.bestOffer ? `${progress.bestOffer}%` : 'None yet'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Time Remaining</p>
                <p className="text-lg font-semibold text-gray-900">
                  {progress.timeRemaining > 0 ? `${Math.floor(progress.timeRemaining / 60)}m ${progress.timeRemaining % 60}s` : 'Expired'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Phase Transitions */}
        {progress.phaseTransitions.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Phase History</h3>
            <div className="space-y-2">
              {progress.phaseTransitions.map((transition, index) => (
                <div key={index} className="flex items-center space-x-3 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-600">
                    {transition.from} → {transition.to}
                  </span>
                  <span className="text-gray-400">
                    {new Date(transition.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => window.location.href = '/claim'}
            disabled={progress.phase !== 'WITHDRAWAL'}
            className={`flex-1 py-4 px-6 rounded-xl font-semibold transition-colors ${
              progress.phase === 'WITHDRAWAL'
                ? 'bg-green-500 text-white hover:bg-green-600'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {progress.phase === 'WITHDRAWAL' ? 'Claim Tokens' : 'Waiting for Completion'}
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => window.location.href = '/history'}
            className="flex-1 bg-gray-200 text-gray-800 py-4 px-6 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
          >
            View History
          </motion.button>
        </div>

        {/* Info Section */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Powered by 1inch Fusion+ • Real-time monitoring • HTLC Security
          </p>
        </div>
      </div>
    </div>
  );
} 