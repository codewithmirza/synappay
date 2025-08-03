import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, AlertCircle, ExternalLink, Copy, Filter, Download, Trash2 } from 'lucide-react';
import { useToast } from './Toast';
import TokenIcon, { ETH_TOKEN, XLM_TOKEN } from './TokenIcon';

interface TransactionHistoryProps {
  ethAddress: string;
  stellarAddress: string;
}

interface Transaction {
  id: string;
  orderId: string;
  txHash: string;
  direction: 'eth-to-xlm' | 'xlm-to-eth';
  amount: string;
  estimatedAmount: string;
  ethAddress: string;
  stellarAddress: string;
  ethTxHash?: string;
  stellarTxHash?: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  timestamp: number;
}

export default function TransactionHistory({ ethAddress, stellarAddress }: TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'failed'>('all');
  const [showFilters, setShowFilters] = useState(false);

  const toast = useToast();

  // Load transactions from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('synappay_transactions');
      if (stored) {
        const parsed = JSON.parse(stored);
        setTransactions(parsed);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  }, []);

  // Auto-refresh transactions
  useEffect(() => {
    const interval = setInterval(() => {
      try {
        const stored = localStorage.getItem('synappay_transactions');
        if (stored) {
          const parsed = JSON.parse(stored);
          setTransactions(parsed);
        }
      } catch (error) {
        console.error('Error refreshing transactions:', error);
      }
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, []);

  // Filter transactions by connected addresses
  const filteredTransactions = transactions.filter((tx: Transaction) => {
    // First filter by status
    if (filter !== 'all' && tx.status !== filter) return false;
    
    // Then filter by connected addresses (if both are connected)
    if (ethAddress && stellarAddress) {
      return tx.ethAddress === ethAddress && tx.stellarAddress === stellarAddress;
    }
    
    // If only one wallet is connected, show transactions for that wallet
    if (ethAddress) {
      return tx.ethAddress === ethAddress;
    }
    
    if (stellarAddress) {
      return tx.stellarAddress === stellarAddress;
    }
    
    // If no wallets connected, show all transactions
    return true;
  });

  const getStatusIcon = (status: Transaction['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-400" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-400 animate-pulse" />;
      case 'cancelled':
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: Transaction['status']) => {
    switch (status) {
      case 'completed':
        return 'text-green-400';
      case 'failed':
        return 'text-red-400';
      case 'pending':
        return 'text-yellow-400';
      case 'cancelled':
        return 'text-gray-400';
    }
  };

  const getStatusBgColor = (status: Transaction['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/10 border-green-500/20';
      case 'failed':
        return 'bg-red-500/10 border-red-500/20';
      case 'pending':
        return 'bg-yellow-500/10 border-yellow-500/20';
      case 'cancelled':
        return 'bg-gray-500/10 border-gray-500/20';
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const formatAddress = (address: string) => {
    if (!address) return 'N/A';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied!', 'Address copied to clipboard');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast.error('Copy Failed', 'Failed to copy address');
    }
  };

  const openExplorer = (txHash: string, chain: 'ethereum' | 'stellar') => {
    const explorerUrl = chain === 'ethereum' 
      ? `https://etherscan.io/tx/${txHash}`
      : `https://stellarchain.io/tx/${txHash}`;
    
    window.open(explorerUrl, '_blank');
  };

  const clearHistory = () => {
    if (window.confirm('Are you sure you want to clear all transaction history?')) {
      localStorage.removeItem('synappay_transactions');
      setTransactions([]);
      toast.info('History Cleared', 'All transaction history has been cleared');
    }
  };

  const exportHistory = () => {
    try {
      const dataStr = JSON.stringify(transactions, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `synappay-transactions-${Date.now()}.json`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('Exported!', 'Transaction history exported successfully');
    } catch (error) {
      console.error('Error exporting history:', error);
      toast.error('Export Failed', 'Failed to export transaction history');
    }
  };

  return (
    <div className="flex justify-center items-start min-h-screen p-4 bg-white">
      <div className="w-full max-w-4xl">
        {/* Main History Card */}
        <div className="bg-white rounded-3xl p-6 shadow-2xl border border-gray-200">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Transaction History</h2>
            <div className="flex items-center gap-3">
              <button
                onClick={exportHistory}
                className="p-2 rounded-xl bg-blue-100 hover:bg-blue-200 text-blue-700 transition-all duration-200"
                title="Export History"
              >
                <Download className="w-5 h-5" />
              </button>
              <button
                onClick={clearHistory}
                className="p-2 rounded-xl bg-red-100 hover:bg-red-200 text-red-700 transition-all duration-200"
                title="Clear History"
              >
                <Trash2 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Filter className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mb-6 p-4 bg-gray-50 rounded-2xl border border-gray-200">
              <div className="flex items-center gap-4 mb-4">
                <span className="text-sm font-medium text-gray-700">Filter by status:</span>
                <div className="flex gap-2">
                  {(['all', 'pending', 'completed', 'failed'] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => setFilter(status)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                        filter === status
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                          : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Transaction List */}
          <div className="space-y-4">
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Clock className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-xl font-medium text-gray-500 mb-2">No transactions found</p>
                  <p className="text-sm text-gray-400">Your transaction history will appear here</p>
                </div>
              </div>
            ) : (
              filteredTransactions.map((tx: Transaction) => (
                <div
                  key={tx.id}
                  className={`p-6 rounded-2xl border transition-all duration-200 hover:shadow-lg ${
                    tx.status === 'completed' ? 'bg-green-50 border-green-200' :
                    tx.status === 'failed' ? 'bg-red-50 border-red-200' :
                    tx.status === 'pending' ? 'bg-yellow-50 border-yellow-200' :
                    'bg-gray-50 border-gray-200'
                  }`}
                >
                  {/* Transaction Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(tx.status)}
                        <div>
                          <div className="flex items-center gap-3">
                            <TokenIcon 
                              token={tx.direction === 'eth-to-xlm' ? ETH_TOKEN : XLM_TOKEN} 
                              size={24} 
                            />
                            <h3 className="text-lg font-bold text-gray-900">
                              {tx.direction === 'eth-to-xlm' ? 'ETH → XLM' : 'XLM → ETH'}
                            </h3>
                            <TokenIcon 
                              token={tx.direction === 'eth-to-xlm' ? XLM_TOKEN : ETH_TOKEN} 
                              size={24} 
                            />
                          </div>
                          <p className="text-sm text-gray-500 mt-1">
                            {formatDate(tx.timestamp)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        tx.status === 'completed' ? 'text-green-700 bg-green-100' :
                        tx.status === 'failed' ? 'text-red-700 bg-red-100' :
                        tx.status === 'pending' ? 'text-yellow-700 bg-yellow-100' :
                        'text-gray-700 bg-gray-100'
                      }`}>
                        {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                      </span>
                    </div>
                  </div>

                  {/* Transaction Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                    <div className="p-4 bg-white rounded-xl border border-gray-200">
                      <p className="text-xs text-gray-600 mb-2 font-medium">Amount</p>
                      <div className="flex items-center gap-3">
                        <TokenIcon 
                          token={tx.direction === 'eth-to-xlm' ? ETH_TOKEN : XLM_TOKEN} 
                          size={20} 
                        />
                        <p className="text-lg font-bold text-gray-900">
                          {tx.amount} {tx.direction === 'eth-to-xlm' ? 'ETH' : 'XLM'}
                        </p>
                      </div>
                    </div>
                    <div className="p-4 bg-white rounded-xl border border-gray-200">
                      <p className="text-xs text-gray-600 mb-2 font-medium">Estimated</p>
                      <div className="flex items-center gap-3">
                        <TokenIcon 
                          token={tx.direction === 'eth-to-xlm' ? XLM_TOKEN : ETH_TOKEN} 
                          size={20} 
                        />
                        <p className="text-lg font-bold text-gray-900">
                          {tx.estimatedAmount} {tx.direction === 'eth-to-xlm' ? 'XLM' : 'ETH'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Addresses */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="p-3 bg-white rounded-xl border border-gray-200">
                      <p className="text-xs text-gray-600 mb-2 font-medium">ETH Address</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-900 font-mono">{formatAddress(tx.ethAddress)}</span>
                        <button
                          onClick={() => copyToClipboard(tx.ethAddress)}
                          className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Copy className="w-4 h-4 text-gray-500" />
                        </button>
                      </div>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-gray-200">
                      <p className="text-xs text-gray-600 mb-2 font-medium">Stellar Address</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-900 font-mono">{formatAddress(tx.stellarAddress)}</span>
                        <button
                          onClick={() => copyToClipboard(tx.stellarAddress)}
                          className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Copy className="w-4 h-4 text-gray-500" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Transaction Hashes */}
                  {(tx.ethTxHash || tx.stellarTxHash) && (
                    <div className="pt-4 border-t border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {tx.ethTxHash && (
                          <div className="p-3 bg-white rounded-xl border border-gray-200">
                            <p className="text-xs text-gray-600 mb-2 font-medium">ETH Transaction</p>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-900 font-mono">{formatAddress(tx.ethTxHash)}</span>
                              <button
                                onClick={() => openExplorer(tx.ethTxHash!, 'ethereum')}
                                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                              >
                                <ExternalLink className="w-4 h-4 text-gray-500" />
                              </button>
                            </div>
                          </div>
                        )}
                        {tx.stellarTxHash && (
                          <div className="p-3 bg-white rounded-xl border border-gray-200">
                            <p className="text-xs text-gray-600 mb-2 font-medium">Stellar Transaction</p>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-900 font-mono">{formatAddress(tx.stellarTxHash)}</span>
                              <button
                                onClick={() => openExplorer(tx.stellarTxHash!, 'stellar')}
                                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                              >
                                <ExternalLink className="w-4 h-4 text-gray-500" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Summary */}
          {filteredTransactions.length > 0 && (
            <div className="mt-6 p-4 bg-gray-50 rounded-2xl border border-gray-200">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">
                  Showing {filteredTransactions.length} of {transactions.length} transactions
                </span>
                <span className="text-gray-900 font-medium">
                  Filter: {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 