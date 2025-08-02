'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ExternalLink, Clock, CheckCircle, AlertCircle } from 'lucide-react';

export default function History() {
  const [swapHistory, setSwapHistory] = useState([]);

  useEffect(() => {
    loadSwapHistory();
  }, []);

  const loadSwapHistory = () => {
    try {
      // For demo purposes, load from sessionStorage
      const storedExecutionResult = sessionStorage.getItem('executionResult');
      const storedSwapData = sessionStorage.getItem('swapData');
      
      if (storedExecutionResult && storedSwapData) {
        const executionResult = JSON.parse(storedExecutionResult);
        const originalSwapData = JSON.parse(storedSwapData);
        
        const historyItem = {
          id: executionResult.swapId || '1',
          ...originalSwapData,
          ...executionResult,
          timestamp: new Date().toISOString(),
          status: 'completed'
        };
        
        setSwapHistory([historyItem]);
      }
    } catch (error) {
      console.error('Error loading swap history:', error);
    }
  };

  const handleBack = () => {
    window.history.back();
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

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
          className="bg-white rounded-[30px] shadow-[0px_20px_60px_0px_rgba(0,0,0,0.1)] p-8 md:p-12 max-w-4xl w-full"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Swap History</h1>
            <p className="text-gray-600">Your cross-chain transaction history</p>
          </div>

          {/* History List */}
          {swapHistory.length > 0 ? (
            <div className="space-y-4">
              {swapHistory.map((swap, index) => (
                <motion.div
                  key={swap.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-gray-50 border border-gray-200 rounded-xl p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(swap.status)}
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {swap.fromAmount} {swap.fromToken} → {swap.toAmount} {swap.toToken}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {new Date(swap.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(swap.status)}`}>
                      {swap.status.charAt(0).toUpperCase() + swap.status.slice(1)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">From Chain</p>
                      <p className="font-medium">Ethereum (Sepolia)</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">To Chain</p>
                      <p className="font-medium">Stellar (Testnet)</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Swap ID</p>
                      <p className="font-mono text-sm">
                        {swap.swapId ? `${swap.swapId.slice(0, 10)}...${swap.swapId.slice(-8)}` : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Transaction</p>
                      {swap.txHash ? (
                        <a
                          href={`https://sepolia.etherscan.io/tx/${swap.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                        >
                          <span>{swap.txHash.slice(0, 10)}...{swap.txHash.slice(-8)}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <p className="font-mono text-sm text-gray-500">N/A</p>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    {swap.txHash && (
                      <a
                        href={`https://sepolia.etherscan.io/tx/${swap.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center space-x-1"
                      >
                        <span>View on Etherscan</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Swaps Yet</h3>
              <p className="text-gray-600 mb-6">Your cross-chain swap history will appear here</p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => window.location.href = '/swap'}
                className="bg-blue-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-600 transition-colors"
              >
                Start Your First Swap
              </motion.button>
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              Powered by SynapPay • Cross-Chain • Secure
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}