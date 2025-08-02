'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, AlertCircle, ExternalLink, Coins, ArrowRight } from 'lucide-react';
import { useWalletManager } from '../lib/wallet-manager';
import UnifiedLayout from '../components/UnifiedLayout';

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
      <UnifiedLayout
        title="Connect Wallets First"
        subtitle="Please connect both Ethereum and Stellar wallets to view your swap history"
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
      title="Swap History"
      subtitle="Track all your cross-chain atomic swaps"
      showWalletButton={true}
    >
      <div className="space-y-6">
        {/* Filter Tabs */}
        <div className="flex space-x-2 bg-gray-100 rounded-lg p-1">
          {['all', 'completed', 'pending', 'failed'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === status
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
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
                <p className="text-gray-600">You haven't made any swaps yet.</p>
                <button
                  onClick={() => window.location.href = '/swap'}
                  className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Start Your First Swap
                </button>
              </div>
            ) : (
              getFilteredSwaps().map((swap) => {
                const StatusIcon = getStatusIcon(swap.status);
                
                return (
                  <motion.div
                    key={swap.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-full ${getStatusColor(swap.status)}`}>
                          <StatusIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">Swap #{swap.id}</h3>
                          <p className="text-sm text-gray-500">{formatTimestamp(swap.timestamp)}</p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-sm text-gray-600">Rate</div>
                        <div className="font-semibold text-gray-900">
                          1 {swap.fromToken} = {swap.rate} {swap.toToken}
                        </div>
                      </div>
                    </div>

                    {/* Swap Details */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-sm text-gray-600">From</div>
                        <div className="font-semibold text-gray-900">
                          {formatAmount(swap.amount)} {swap.fromToken}
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-sm text-gray-600">To</div>
                        <div className="font-semibold text-gray-900">
                          {formatAmount(swap.quote)} {swap.toToken}
                        </div>
                      </div>
                    </div>

                    {/* Transaction Links */}
                    <div className="flex items-center justify-between text-sm">
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
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
          >
            <Coins className="w-4 h-4" />
            <span>Start New Swap</span>
          </button>
        </div>
      </div>
    </UnifiedLayout>
  );
} 