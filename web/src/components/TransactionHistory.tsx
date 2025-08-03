import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, AlertCircle, ExternalLink, Copy, Filter } from 'lucide-react';
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
    <div className="swap-card-border">
      <div className="swap-card-bg p-6 rounded-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">
            <span className="page-title-gradient">Transaction History</span>
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <Filter className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mb-6 p-4 bg-white/5 rounded-xl border border-white/10">
            <div className="flex items-center gap-4 mb-4">
              <span className="text-sm font-medium">Filter by status:</span>
              <div className="flex gap-2">
                {(['all', 'pending', 'completed', 'failed'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilter(status)}
                    className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                      filter === status
                        ? 'bg-gradient-to-r from-[#6C63FF] to-[#3ABEFF] text-white'
                        : 'bg-white/10 text-gray-300 hover:bg-white/20'
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={exportHistory}
                className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg text-sm transition-colors"
              >
                Export History
              </button>
              <button
                onClick={clearHistory}
                className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg text-sm transition-colors"
              >
                Clear History
              </button>
            </div>
          </div>
        )}

        {/* Transaction List */}
        <div className="space-y-4">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-4">
                <Clock className="w-12 h-12 mx-auto mb-2" />
                <p className="text-lg font-medium">No transactions found</p>
                <p className="text-sm">Your transaction history will appear here</p>
              </div>
            </div>
          ) : (
            filteredTransactions.map((tx: Transaction) => (
              <div
                key={tx.id}
                className="p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(tx.status)}
                    <div>
                      <div className="flex items-center gap-2">
                        <TokenIcon 
                          token={tx.direction === 'eth-to-xlm' ? ETH_TOKEN : XLM_TOKEN} 
                          size={20} 
                        />
                        <h3 className="font-semibold text-white">
                          {tx.direction === 'eth-to-xlm' ? 'ETH → XLM' : 'XLM → ETH'}
                        </h3>
                        <TokenIcon 
                          token={tx.direction === 'eth-to-xlm' ? XLM_TOKEN : ETH_TOKEN} 
                          size={20} 
                        />
                      </div>
                      <p className="text-sm text-gray-400">
                        {formatDate(tx.timestamp)}
                      </p>
                    </div>
                  </div>
                  <span className={`text-sm font-medium ${getStatusColor(tx.status)}`}>
                    {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Amount</p>
                    <div className="flex items-center gap-2">
                      <TokenIcon 
                        token={tx.direction === 'eth-to-xlm' ? ETH_TOKEN : XLM_TOKEN} 
                        size={16} 
                      />
                      <p className="text-white font-medium">
                        {tx.amount} {tx.direction === 'eth-to-xlm' ? 'ETH' : 'XLM'}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Estimated</p>
                    <div className="flex items-center gap-2">
                      <TokenIcon 
                        token={tx.direction === 'eth-to-xlm' ? XLM_TOKEN : ETH_TOKEN} 
                        size={16} 
                      />
                      <p className="text-white font-medium">
                        {tx.estimatedAmount} {tx.direction === 'eth-to-xlm' ? 'XLM' : 'ETH'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">ETH Address:</span>
                    <div className="flex items-center gap-1">
                      <span className="text-white">{formatAddress(tx.ethAddress)}</span>
                      <button
                        onClick={() => copyToClipboard(tx.ethAddress)}
                        className="p-1 hover:bg-white/10 rounded transition-colors"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Stellar Address:</span>
                    <div className="flex items-center gap-1">
                      <span className="text-white">{formatAddress(tx.stellarAddress)}</span>
                      <button
                        onClick={() => copyToClipboard(tx.stellarAddress)}
                        className="p-1 hover:bg-white/10 rounded transition-colors"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Transaction Hashes */}
                {(tx.ethTxHash || tx.stellarTxHash) && (
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <div className="space-y-2">
                      {tx.ethTxHash && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-400">ETH TX:</span>
                          <div className="flex items-center gap-1">
                            <span className="text-white">{formatAddress(tx.ethTxHash)}</span>
                            <button
                              onClick={() => openExplorer(tx.ethTxHash!, 'ethereum')}
                              className="p-1 hover:bg-white/10 rounded transition-colors"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      )}
                      {tx.stellarTxHash && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-400">Stellar TX:</span>
                          <div className="flex items-center gap-1">
                            <span className="text-white">{formatAddress(tx.stellarTxHash)}</span>
                            <button
                              onClick={() => openExplorer(tx.stellarTxHash!, 'stellar')}
                              className="p-1 hover:bg-white/10 rounded transition-colors"
                            >
                              <ExternalLink className="w-3 h-3" />
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
          <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">
                Showing {filteredTransactions.length} of {transactions.length} transactions
              </span>
              <span className="text-white">
                Filter: {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 