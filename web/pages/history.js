'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, ArrowUpRight, ArrowDownRight, Eye, EyeOff } from 'lucide-react';
import ApiClient from '../lib/api-client';
import config from '../lib/config';

// Image assets from Figma
const imgFrame = "http://localhost:3845/assets/ca89c627b59121acdb35167a0882371eb28979b3.svg";
const imgFrame1 = "http://localhost:3845/assets/95fac634a56edbc6057ef1bae35e34985f052c3b.svg";
const imgFrame2 = "http://localhost:3845/assets/bbd9b960c82d03bb6e236bc3312929e27758d260.svg";

export default function History() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, active, completed, expired, refunded
  const [showDetails, setShowDetails] = useState({});

  // Mock maker address (in real app, this would come from wallet connection)
  const makerAddress = '0x1234567890123456789012345678901234567890';

  useEffect(() => {
    fetchOrderHistory();
  }, []);

  const fetchOrderHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/order-history?maker=${makerAddress}`);
      const data = await response.json();
      
      if (data.success) {
        setTransactions(data.orders);
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch order history');
        // Fallback to mock data
        setTransactions(getMockTransactions());
      }
    } catch (error) {
      setError('Network error while fetching history');
      console.error('Error fetching order history:', error);
      // Fallback to mock data
      setTransactions(getMockTransactions());
    } finally {
      setLoading(false);
    }
  };

  const getMockTransactions = () => [
    {
      orderHash: '0x1a2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890',
      maker: makerAddress,
      makerAsset: '0x0000000000000000000000000000000000000000', // ETH
      takerAsset: '0xa0b86a33e6441b8c4c8c8c8c8c8c8c8c8c8c8c8', // USDC
      makingAmount: '2500000000000000000', // 2.5 ETH
      takingAmount: '7125800000', // 7,125.80 USDC
      createdAt: Date.now() - 86400000, // 1 day ago
      status: { current: 'FILLED', description: 'Swap completed successfully' },
      auction: { isActive: false, resolverCount: 3, bestOffer: 0.15, finalResolver: '0xabc123...' },
      fill: { wasFilled: true, wasExpired: false, wasRefunded: false, finalPrice: 2850.32, slippage: 0.15 },
      pricing: { initialPrice: 2850.32, finalPrice: 2850.32, slippage: 0.15, priceImpact: 0.05 }
    },
    {
      orderHash: '0x2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890ab',
      maker: makerAddress,
      makerAsset: '0xa0b86a33e6441b8c4c8c8c8c8c8c8c8c8c8c8c8', // USDC
      takerAsset: '0x0000000000000000000000000000000000000000', // ETH
      makingAmount: '5000000000', // 5,000 USDC
      takingAmount: '1750000000000000000', // 1.75 ETH
      createdAt: Date.now() - 3600000, // 1 hour ago
      status: { current: 'ACTIVE', description: 'Waiting for resolver' },
      auction: { isActive: true, resolverCount: 1, bestOffer: 0.25 },
      fill: { wasFilled: false, wasExpired: false, wasRefunded: false },
      pricing: { initialPrice: 2857.14, finalPrice: null, slippage: 0, priceImpact: 0 }
    },
    {
      orderHash: '0x3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890abcd',
      maker: makerAddress,
      makerAsset: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', // WBTC
      takerAsset: 'XLM',
      makingAmount: '10000000', // 0.1 WBTC
      takingAmount: '15420500000', // 15,420.50 XLM
      createdAt: Date.now() - 172800000, // 2 days ago
      status: { current: 'EXPIRED', description: 'Auction expired - Refund available' },
      auction: { isActive: false, resolverCount: 0, bestOffer: null },
      fill: { wasFilled: false, wasExpired: true, wasRefunded: true },
      pricing: { initialPrice: 154205, finalPrice: null, slippage: 0, priceImpact: 0 }
    },
    {
      orderHash: '0x4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890abcde',
      maker: makerAddress,
      makerAsset: 'XLM',
      takerAsset: '0xdac17f958d2ee523a2206206994597c13d831ec7', // USDT
      makingAmount: '25000000000', // 25,000 XLM
      takingAmount: '2847320000', // 2,847.32 USDT
      createdAt: Date.now() - 259200000, // 3 days ago
      status: { current: 'FILLED', description: 'Swap completed successfully' },
      auction: { isActive: false, resolverCount: 2, bestOffer: 0.12, finalResolver: '0xdef456...' },
      fill: { wasFilled: true, wasExpired: false, wasRefunded: false, finalPrice: 0.1139, slippage: 0.12 },
      pricing: { initialPrice: 0.1139, finalPrice: 0.1139, slippage: 0.12, priceImpact: 0.03 }
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'FILLED': return 'text-green-600 bg-green-100';
      case 'ACTIVE': return 'text-blue-600 bg-blue-100';
      case 'EXPIRED': return 'text-red-600 bg-red-100';
      case 'REFUNDED': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'FILLED': return 'Completed';
      case 'ACTIVE': return 'Active';
      case 'EXPIRED': return 'Expired';
      case 'REFUNDED': return 'Refunded';
      default: return 'Unknown';
    }
  };

  const getAssetSymbol = (assetAddress) => {
    const assetMap = {
      '0x0000000000000000000000000000000000000000': 'ETH',
      '0xa0b86a33e6441b8c4c8c8c8c8c8c8c8c8c8c8c8': 'USDC',
      '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599': 'WBTC',
      '0xdac17f958d2ee523a2206206994597c13d831ec7': 'USDT',
      'XLM': 'XLM'
    };
    return assetMap[assetAddress] || 'UNKNOWN';
  };

  const formatAmount = (amount, asset) => {
    const assetSymbol = getAssetSymbol(asset);
    const numericAmount = parseFloat(amount) / Math.pow(10, 18); // Assuming 18 decimals for most tokens
    
    if (assetSymbol === 'USDC' || assetSymbol === 'USDT') {
      return `${(parseFloat(amount) / Math.pow(10, 6)).toLocaleString()} ${assetSymbol}`;
    } else if (assetSymbol === 'WBTC') {
      return `${(parseFloat(amount) / Math.pow(10, 8)).toLocaleString()} ${assetSymbol}`;
    } else if (assetSymbol === 'XLM') {
      return `${(parseFloat(amount) / Math.pow(10, 7)).toLocaleString()} ${assetSymbol}`;
    } else {
      return `${numericAmount.toLocaleString()} ${assetSymbol}`;
    }
  };

  const toggleDetails = (orderHash) => {
    setShowDetails(prev => ({
      ...prev,
      [orderHash]: !prev[orderHash]
    }));
  };

  const filteredTransactions = transactions.filter(tx => {
    if (filter === 'all') return true;
    return tx.status.current.toLowerCase() === filter;
  });

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-[#f2f2f7] flex items-center justify-center p-4">
      <div className="bg-[#ffffff] rounded-[30px] shadow-[0px_4px_20px_0px_rgba(0,0,0,0.08)] p-6 md:p-8 max-w-[800px] w-full">
        
        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <span className="text-red-800 font-medium">{error}</span>
              </div>
              <button
                onClick={fetchOrderHistory}
                className="text-red-600 hover:text-red-800 font-medium"
              >
                Retry
              </button>
            </div>
          </motion.div>
        )}

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-semibold text-black mb-2">Transaction History</h1>
          <p className="text-gray-600">View your past and active swaps</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex justify-center mb-6">
          <div className="flex bg-gray-100 rounded-lg p-1">
            {[
              { key: 'all', label: 'All' },
              { key: 'active', label: 'Active' },
              { key: 'completed', label: 'Completed' },
              { key: 'expired', label: 'Expired' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filter === tab.key
                    ? 'bg-white text-black shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Transactions List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-gray-300 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading transactions...</p>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-gray-600">No transactions found</p>
            </div>
          ) : (
            filteredTransactions.map((tx, index) => (
              <motion.div
                key={tx.orderHash}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-50 rounded-[20px] p-6"
              >
                {/* Transaction Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">Ξ</span>
                      </div>
                      <span className="font-medium">
                        {formatAmount(tx.makingAmount, tx.makerAsset)} → {formatAmount(tx.takingAmount, tx.takerAsset)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(tx.status.current)}`}>
                      {getStatusText(tx.status.current)}
                    </span>
                    <button
                      onClick={() => toggleDetails(tx.orderHash)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg
                        className={`w-5 h-5 transition-transform ${showDetails[tx.orderHash] ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Transaction Details */}
                <div className="text-sm text-gray-600 mb-3">
                  {formatDate(tx.createdAt)} • {tx.orderHash.slice(0, 8)}...{tx.orderHash.slice(-8)}
                </div>

                {/* Expandable Details */}
                {showDetails[tx.orderHash] && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 pt-4 border-t border-gray-200 space-y-3"
                  >
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Initial Price:</span>
                        <span className="ml-2 font-medium">
                          {tx.pricing.initialPrice ? `$${tx.pricing.initialPrice.toLocaleString()}` : '--'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Final Price:</span>
                        <span className="ml-2 font-medium">
                          {tx.pricing.finalPrice ? `$${tx.pricing.finalPrice.toLocaleString()}` : '--'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Slippage:</span>
                        <span className="ml-2 font-medium">
                          {tx.pricing.slippage ? `${tx.pricing.slippage}%` : '--'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Price Impact:</span>
                        <span className="ml-2 font-medium">
                          {tx.pricing.priceImpact ? `${tx.pricing.priceImpact}%` : '--'}
                        </span>
                      </div>
                    </div>

                    {/* Auction Details */}
                    {tx.auction && (
                      <div className="bg-gray-100 rounded-lg p-3">
                        <h4 className="font-medium mb-2">Auction Details</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-gray-600">Resolvers:</span>
                            <span className="ml-2 font-medium">{tx.auction.resolverCount || 0}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Best Offer:</span>
                            <span className="ml-2 font-medium">
                              {tx.auction.bestOffer ? `${tx.auction.bestOffer}%` : '--'}
                            </span>
                          </div>
                          {tx.auction.finalResolver && (
                            <div className="col-span-2">
                              <span className="text-gray-600">Final Resolver:</span>
                              <span className="ml-2 font-mono text-xs">{tx.auction.finalResolver}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </motion.div>
            ))
          )}
        </div>

        {/* Action Button */}
        <div className="mt-8 text-center">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => window.location.href = '/swap'}
            className="bg-black text-white px-8 py-3 rounded-[20px] text-lg font-medium hover:bg-gray-800 transition-colors"
          >
            New Swap
          </motion.button>
        </div>
      </div>
    </div>
  );
} 