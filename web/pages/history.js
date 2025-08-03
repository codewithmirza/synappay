'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, AlertCircle, ExternalLink, Coins, ArrowRight, Filter } from 'lucide-react';
import { walletConnectionService } from '../lib/wallet-connection-service';
import UnifiedLayout from '../components/UnifiedLayout';
import TokenIcon from '../components/TokenIcon';
import apiClient from '../lib/api-client';
import { historyService } from '../lib/history-service';

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
  const walletStatus = walletConnectionService.getStatus();
  const {
    ethereumConnected: ethConnected,
    stellarConnected,
    bothConnected,
    ethereumAccount: ethAddress,
    stellarAccount: stellarPublicKey
  } = walletStatus;
  
  const formatEthAddress = walletConnectionService.formatEthAddress;
  const formatStellarAddress = walletConnectionService.formatStellarAddress;

  const [swaps, setSwaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const loadSwapHistory = async () => {
      try {
        // Use real history service
        const realHistory = historyService.getSwapHistory();
        
        if (realHistory.length > 0) {
          setSwaps(realHistory);
        } else {
          // Fallback to mock data only if no real history exists
          setSwaps(MOCK_SWAPS);
        }
      } catch (error) {
        console.error('Failed to load swap history:', error);
        setSwaps(MOCK_SWAPS); // Fallback to mock data
      } finally {
        setLoading(false);
      }
    };

    // Load history regardless of wallet connection status
    loadSwapHistory();
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

  // Remove wallet connection requirement - history should be accessible to all users

  return (
    <UnifiedLayout
      title="Swap History"
      subtitle="Track all your cross-chain atomic swaps"
      showWalletButton={true}
    >
      <div className="space-y-6">
        {/* Filter Tabs */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-900">Filter by Status</span>
          </div>
          <div className="flex space-x-2 bg-gray-100 rounded-xl p-1">
            {['all', 'completed', 'pending', 'failed'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === status
                    ? 'bg-white text-black shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
            <p className="text-gray-600">Loading swap history...</p>
          </div>
        )}

        {/* Swap List */}
        {!loading && (
          <div className="space-y-4">
            {getFilteredSwaps().length === 0 ? (
              <div className="text-center py-8">
                <Coins className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Swaps Found</h3>
                <p className="text-gray-600 mb-6">
                  {filter === 'all' 
                    ? "You haven't made any swaps yet." 
                    : `No ${filter} swaps found.`}
                </p>
                <button
                  onClick={() => window.location.href = '/swap'}
                  className="bg-black text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-800 transition-all"
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
                    className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-full ${getStatusColor(swap.status)}`}>
                          <StatusIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">Swap #{swap.id}</h3>
                          <p className="text-sm text-gray-500">{formatTimestamp(swap.timestamp)}</p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-sm text-gray-600">Rate</div>
                        <div className="font-semibold text-gray-900">
                          1 {swap.fromToken} = {swap.rate.toLocaleString()} {swap.toToken}
                        </div>
                      </div>
                    </div>

                    {/* Swap Details */}
                    <div className="flex items-center justify-center space-x-6 mb-4">
                      <div className="text-center">
                        <TokenIcon symbol={swap.fromToken} size={32} className="mx-auto mb-1" />
                        <div className="text-lg font-bold text-gray-900">{formatAmount(swap.amount)}</div>
                        <div className="text-xs text-gray-600">{swap.fromToken}</div>
                      </div>
                      
                      <ArrowRight className="w-5 h-5 text-gray-400" />
                      
                      <div className="text-center">
                        <TokenIcon symbol={swap.toToken} size={32} className="mx-auto mb-1" />
                        <div className="text-lg font-bold text-gray-900">{formatAmount(swap.quote)}</div>
                        <div className="text-xs text-gray-600">{swap.toToken}</div>
                      </div>
                    </div>

                    {/* Transaction Links */}
                    <div className="flex items-center justify-between text-sm pt-4 border-t border-gray-200">
                      <div className="flex space-x-4">
                        <button
                          onClick={() => openExplorer(swap.txHash, 'ethereum')}
                          className="flex items-center space-x-1 text-blue-600 hover:text-blue-700"
                        >
                          <span>Ethereum TX</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                        
                        <button
                          onClick={() => openExplorer(swap.stellarTxHash, 'stellar')}
                          className="flex items-center space-x-1 text-blue-600 hover:text-blue-700"
                        >
                          <span>Stellar TX</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                      
                      {swap.status === 'pending' && (
                        <button
                          onClick={() => window.location.href = `/progress?swapId=${swap.id}`}
                          className="flex items-center space-x-1 text-blue-600 hover:text-blue-700"
                        >
                          <span>Track Progress</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {/* Error Message */}
                    {swap.error && (
                      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <AlertCircle className="w-4 h-4 text-red-600" />
                          <span className="text-sm text-red-700">{swap.error}</span>
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-4">
          <button
            onClick={() => window.location.href = '/swap'}
            className="flex-1 px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors flex items-center justify-center space-x-2 font-medium"
          >
            <Coins className="w-4 h-4" />
            <span>Start New Swap</span>
          </button>
        </div>
      </div>
    </UnifiedLayout>
  );
}