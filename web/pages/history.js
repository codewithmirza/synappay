import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Download, Eye, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import Layout from '../components/Layout';
import { cn, formatAddress, formatAmount, getStatusBadge, getAssetIcon } from '../lib/utils';

export default function History() {
  const [swaps, setSwaps] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');

  // Mock data for demonstration
  useEffect(() => {
    const mockSwaps = [
      {
        id: '0x1234567890abcdef',
        direction: 'eth_to_stellar',
        amount: 0.5,
        asset: 'ETH',
        receiver: 'GABCDEF1234567890',
        status: 'COMPLETED',
        fusionStatus: 'FILLED',
        createdAt: new Date(Date.now() - 86400000), // 1 day ago
        completedAt: new Date(Date.now() - 82800000), // 23 hours ago
        fusionOrderHash: '0xabcdef1234567890'
      },
      {
        id: '0xabcdef1234567890',
        direction: 'stellar_to_eth',
        amount: 500,
        asset: 'XLM',
        receiver: '0x9876543210fedcba',
        status: 'ACTIVE',
        fusionStatus: 'AUCTION_ACTIVE',
        createdAt: new Date(Date.now() - 3600000), // 1 hour ago
        completedAt: null,
        fusionOrderHash: '0x1234567890abcdef'
      },
      {
        id: '0x9876543210fedcba',
        direction: 'eth_to_stellar',
        amount: 1.2,
        asset: 'ETH',
        receiver: 'GZYXWVUT987654321',
        status: 'REFUNDED',
        fusionStatus: 'EXPIRED',
        createdAt: new Date(Date.now() - 172800000), // 2 days ago
        completedAt: null,
        fusionOrderHash: '0xfedcba0987654321'
      }
    ];

    setSwaps(mockSwaps);
    setIsLoading(false);
  }, []);

  const filteredSwaps = swaps.filter(swap => {
    const matchesSearch = swap.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         swap.receiver.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || swap.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const sortedSwaps = [...filteredSwaps].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(b.createdAt) - new Date(a.createdAt);
      case 'amount':
        return b.amount - a.amount;
      case 'status':
        return a.status.localeCompare(b.status);
      default:
        return 0;
    }
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'ACTIVE':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'REFUNDED':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'EXPIRED':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Swap History</h1>
              <p className="text-muted-foreground">
                Track all your cross-chain swaps and their current status
              </p>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn btn-outline mt-4 sm:mt-0 flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Export CSV</span>
            </motion.button>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card mb-6"
        >
          <div className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by swap ID or receiver address..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10"
                />
              </div>

              {/* Status Filter */}
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="input min-w-[120px]"
                >
                  <option value="all">All Status</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="ACTIVE">Active</option>
                  <option value="REFUNDED">Refunded</option>
                  <option value="EXPIRED">Expired</option>
                </select>
              </div>

              {/* Sort */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="input min-w-[100px]"
                >
                  <option value="date">Date</option>
                  <option value="amount">Amount</option>
                  <option value="status">Status</option>
                </select>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
        >
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-primary">{swaps.length}</div>
            <div className="text-sm text-muted-foreground">Total Swaps</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {swaps.filter(s => s.status === 'COMPLETED').length}
            </div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {swaps.filter(s => s.status === 'ACTIVE').length}
            </div>
            <div className="text-sm text-muted-foreground">Active</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-red-600">
              {swaps.filter(s => s.status === 'REFUNDED').length}
            </div>
            <div className="text-sm text-muted-foreground">Refunded</div>
          </div>
        </motion.div>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="text-left p-4 font-medium">Swap ID</th>
                  <th className="text-left p-4 font-medium">Direction</th>
                  <th className="text-left p-4 font-medium">Amount</th>
                  <th className="text-left p-4 font-medium">Receiver</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-left p-4 font-medium">Created</th>
                  <th className="text-left p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedSwaps.map((swap, index) => (
                  <motion.tr
                    key={swap.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="border-b hover:bg-muted/30 transition-colors"
                  >
                    <td className="p-4">
                      <div className="font-mono text-sm">{formatAddress(swap.id)}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{getAssetIcon(swap.asset)}</span>
                        <span className="font-medium">
                          {swap.direction === 'eth_to_stellar' ? 'ETH → Stellar' : 'Stellar → ETH'}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium">{formatAmount(swap.amount)} {swap.asset}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-mono text-sm">{formatAddress(swap.receiver)}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(swap.status)}
                        <span className={cn(
                          "badge",
                          getStatusBadge(swap.status)
                        )}>
                          {swap.status}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-muted-foreground">
                        {formatDate(swap.createdAt)}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => window.location.href = `/progress/${swap.id}`}
                          className="btn btn-ghost btn-sm"
                        >
                          <Eye className="h-4 w-4" />
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {sortedSwaps.length === 0 && (
            <div className="text-center py-12">
              <div className="text-muted-foreground mb-4">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No swaps found</h3>
                <p className="text-sm">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Try adjusting your search or filters'
                    : 'Create your first swap to see it here'
                  }
                </p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Pagination */}
        {sortedSwaps.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex items-center justify-between mt-6"
          >
            <div className="text-sm text-muted-foreground">
              Showing {sortedSwaps.length} of {swaps.length} swaps
            </div>
            
            <div className="flex items-center space-x-2">
              <button className="btn btn-outline btn-sm" disabled>
                Previous
              </button>
              <span className="text-sm font-medium">1</span>
              <button className="btn btn-outline btn-sm" disabled>
                Next
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </Layout>
  );
} 