'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, AlertCircle, ExternalLink, Coins, ArrowRight, Home, Filter } from 'lucide-react';
import { useWalletManager } from '../lib/wallet-manager';
import TokenIcon from '../components/TokenIcon';

// Mock swap history data
const MOCK_SWAPS = [
  {
    id: '1703123456789',
    fromToken: 'ETH',
    toToken: 'XLM',
    amount: 0.1,
    quote: 1000,
    status: 'completed',
    timestamp: Date.now() - 3600000, // 1 hour ago
    txHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    stellarTxHash: 'GBMGLDJYSIONFRENVDZ2DPUFENK6EMKHK6B7LL5T4LTXCXN5ZP5HFGCB',
    rate: 10000
  },
  {
    id: '1703123456788',
    fromToken: 'XLM',
    toToken: 'ETH',
    amount: 500,
    quote: 0.05,
    status: 'pending',
    timestamp: Date.now() - 1800000, // 30 minutes ago
    txHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    stellarTxHash: 'GBMGLDJYSIONFRENVDZ2DPUFENK6EMKHK6B7LL5T4LTXCXN5ZP5HFGCB',
    rate: 0.0001
  },
  {
    id: '1703123456787',
    fromToken: 'ETH',
    toToken: 'XLM',
    amount: 0.2,
    quote: 2000,
    status: 'failed',
    timestamp: Date.now() - 7200000, // 2 hours ago
    txHash: '0x7890abcdef1234567890abcdef1234567890abcdef1234567890abcdef123456',
    stellarTxHash: 'GBMGLDJYSIONFRENVDZ2DPUFENK6EMKHK6B7LL5T4LTXCXN5ZP5HFGCB',
    rate: 10000,
    error: 'Insufficient liquidity'
  }
];

export default function History() {
  const {
    ethConnected,
    stellarConnected,
    bothConnected,
    ethAddress,
    stellarPublicKey,
    formatEthAddress,
    formatStellarAddress
  } = useWalletManager();

  const [swaps, setSwaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setSwaps(MOCK_SWAPS);
      setLoading(false);
    }, 1000);
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-blue-600 bg-blue-100';
      case 'failed': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'pending': return Clock;
      case 'failed': return AlertCircle;
      default: return Clock;
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatAmount = (amount, decimals = 6) => {
    return parseFloat(amount).toFixed(decimals);
  };

  const getFilteredSwaps = () => {
    if (filter === 'all') return swaps;
    return swaps.filter(swap => swap.status === filter);
  };

  const openExplorer = (txHash, network) => {
    let url;
    if (network === 'ethereum') {
      url = `https://sepolia.etherscan.io/tx/${txHash}`;
    } else {
      url = `https://stellar.expert/explorer/testnet/tx/${txHash}`;
    }
    window.open(url, '_blank');
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
                Please connect both Ethereum and Stellar wallets to view your swap history
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
              <button
                onClick={() => window.location.href = '/swap'}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                Swap
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Swap History</h1>
            <p className="text-gray-600">Track all your cross-chain atomic swaps</p>
          </div>

          {/* Filter Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6"
          >
            <div className="flex items-center space-x-2 mb-4">
              <Filter className="w-5 h-5 text-gray-600" />
              <span className="font-medium text-gray-900">Filter by Status</span>
            </div>
            <div className="flex space-x-2 bg-gray-100 rounded-xl p-1">
              {['all', 'completed', 'pending', 'failed'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === status
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Loading State */}
          {loading && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading swap history...</p>
            </div>
          )}

          {/* Swap List */}
          {!loading && (
            <div className="space-y-4">
              {getFilteredSwaps().length === 0 ? (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
                  <Coins className="w-16 h-16 text-gray-400 mx-auto mb-6" />
                  <h3 className="text-xl font-bold text-gray-900 mb-4">No Swaps Found</h3>
                  <p className="text-gray-600 mb-8">
                    {filter === 'all' 
                      ? "You haven't made any swaps yet." 
                      : `No ${filter} swaps found.`}
                  </p>
                  <button
                    onClick={() => window.location.href = '/swap'}
                    className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    Start Your First Swap
                  </button>
                </div>
              ) : (
                getFilteredSwaps().map((swap, index) => {
                  const StatusIcon = getStatusIcon(swap.status);
                  
                  return (
                    <motion.div
                      key={swap.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow"
                    >
                      <div className="p-6">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center space-x-4">
                            <div className={`p-3 rounded-full ${getStatusColor(swap.status)}`}>
                              <StatusIcon className="w-6 h-6" />
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-gray-900">Swap #{swap.id}</h3>
                              <p className="text-sm text-gray-500">{formatTimestamp(swap.timestamp)}</p>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-sm text-gray-600">Exchange Rate</div>
                            <div className="font-semibold text-gray-900">
                              1 {swap.fromToken} = {swap.rate.toLocaleString()} {swap.toToken}
                            </div>
                          </div>
                        </div>

                        {/* Swap Details */}
                        <div className="flex items-center justify-center space-x-8 mb-6">
                          <div className="text-center">
                            <TokenIcon symbol={swap.fromToken} size={40} className="mx-auto mb-2" />
                            <div className="text-xl font-bold text-gray-900">{formatAmount(swap.amount)}</div>
                            <div className="text-sm text-gray-600">{swap.fromToken}</div>
                          </div>
                          
                          <div className="p-3 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full">
                            <ArrowRight className="w-6 h-6 text-blue-600" />
                          </div>
                          
                          <div className="text-center">
                            <TokenIcon symbol={swap.toToken} size={40} className="mx-auto mb-2" />
                            <div className="text-xl font-bold text-gray-900">{formatAmount(swap.quote)}</div>
                            <div className="text-sm text-gray-600">{swap.toToken}</div>
                          </div>
                        </div>

                        {/* Error Message */}
                        {swap.error && (
                          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                            <div className="flex items-center space-x-2">
                              <AlertCircle className="w-5 h-5 text-red-600" />
                              <span className="text-red-700 font-medium">{swap.error}</span>
                            </div>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                          <div className="flex space-x-4">
                            <button
                              onClick={() => openExplorer(swap.txHash, 'ethereum')}
                              className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors"
                            >
                              <span className="text-sm font-medium">Ethereum TX</span>
                              <ExternalLink className="w-4 h-4" />
                            </button>
                            
                            <button
                              onClick={() => openExplorer(swap.stellarTxHash, 'stellar')}
                              className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors"
                            >
                              <span className="text-sm font-medium">Stellar TX</span>
                              <ExternalLink className="w-4 h-4" />
                            </button>
                          </div>
                          
                          {swap.status === 'pending' && (
                            <button
                              onClick={() => window.location.href = `/progress?swapId=${swap.id}`}
                              className="flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                            >
                              <span className="text-sm font-medium">Track Progress</span>
                              <ArrowRight className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          )}

          {/* Action Button */}
          <div className="text-center">
            <button
              onClick={() => window.location.href = '/swap'}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all flex items-center justify-center space-x-3 mx-auto hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <Coins className="w-5 h-5" />
              <span>Start New Swap</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}