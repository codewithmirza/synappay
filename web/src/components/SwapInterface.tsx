import { useState, useEffect } from 'react';
import { useToast } from './Toast';
import { ArrowUpDown, Settings, Info, RefreshCw, ChevronDown } from 'lucide-react';
import TokenIcon, { ETH_TOKEN, XLM_TOKEN } from './TokenIcon';

// Web3 imports for contract interaction
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      selectedAddress?: string;
    };
  }
}

interface SwapInterfaceProps {
  ethAddress: string;
  stellarAddress: string;
}

// Fixed exchange rate (in real application, this would be fetched from API)
const ETH_TO_XLM_RATE = 10000; // 1 ETH = 10,000 XLM

const saveTransactionToHistory = (transaction: {
  orderId: string;
  txHash: string;
  direction: 'eth-to-xlm' | 'xlm-to-eth';
  amount: string;
  estimatedAmount: string;
  ethAddress: string;
  stellarAddress: string;
  ethTxHash?: string;
  stellarTxHash?: string;
  status?: 'pending' | 'completed' | 'failed' | 'cancelled';
}) => {
  try {
    const history = JSON.parse(localStorage.getItem('synappay_transactions') || '[]');
    history.unshift({
      ...transaction,
      timestamp: Date.now(),
      id: transaction.orderId
    });
    
    // Keep only last 50 transactions
    if (history.length > 50) {
      history.splice(50);
    }
    
    localStorage.setItem('synappay_transactions', JSON.stringify(history));
    console.log('💾 Transaction saved to history:', transaction.orderId);
  } catch (error) {
    console.error('❌ Error saving transaction to history:', error);
  }
};

const updateTransactionStatus = (orderId: string, status: 'pending' | 'completed' | 'failed' | 'cancelled', additionalData?: any) => {
  try {
    const history = JSON.parse(localStorage.getItem('synappay_transactions') || '[]');
    const transactionIndex = history.findIndex((tx: any) => tx.orderId === orderId);
    
    if (transactionIndex !== -1) {
      history[transactionIndex] = {
        ...history[transactionIndex],
        status,
        ...additionalData
      };
      
      localStorage.setItem('synappay_transactions', JSON.stringify(history));
      console.log(`📝 Transaction ${orderId} status updated to: ${status}`);
    }
  } catch (error) {
    console.error('❌ Error updating transaction status:', error);
  }
};

export default function SwapInterface({ ethAddress, stellarAddress }: SwapInterfaceProps) {
  const [fromToken, setFromToken] = useState('ETH');
  const [toToken, setToToken] = useState('XLM');
  const [amount, setAmount] = useState('');
  const [estimatedAmount, setEstimatedAmount] = useState('');
  const [exchangeRate] = useState(ETH_TO_XLM_RATE);
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [slippage, setSlippage] = useState(1.0);

  const toast = useToast();

  // Get current token objects
  const getFromToken = () => fromToken === 'ETH' ? ETH_TOKEN : XLM_TOKEN;
  const getToToken = () => toToken === 'ETH' ? ETH_TOKEN : XLM_TOKEN;

  // Auto-refresh quotes every 30 seconds
  useEffect(() => {
    if (!amount || !ethAddress || !stellarAddress || parseFloat(amount) <= 0) return;

    const interval = setInterval(() => {
      handleAmountChange({ target: { value: amount } } as React.ChangeEvent<HTMLInputElement>);
    }, 30000);

    return () => clearInterval(interval);
  }, [amount, fromToken, toToken, ethAddress, stellarAddress]);

  const handleAmountChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAmount(value);

    if (!value || parseFloat(value) <= 0) {
      setEstimatedAmount('');
      return;
    }

    try {
      const numAmount = parseFloat(value);
      const estimated = numAmount * exchangeRate;
      setEstimatedAmount(estimated.toFixed(7));
    } catch (error) {
      console.error('Error calculating estimated amount:', error);
    }
  };

  const handleTokenSwap = () => {
    setFromToken(toToken);
    setToToken(fromToken);
    setAmount('');
    setEstimatedAmount('');
  };

  const handleExecuteSwap = async () => {
    if (!ethAddress || !stellarAddress) {
      toast.error('Wallets Not Connected', 'Please connect both MetaMask and Freighter wallets');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Invalid Amount', 'Please enter a valid amount');
      return;
    }

    setIsLoading(true);

    try {
      console.log('🚀 Starting cross-chain swap...');
      
      // Generate unique order ID
      const orderId = `swap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Save transaction to history
      saveTransactionToHistory({
        orderId,
        txHash: orderId,
        direction: fromToken === 'ETH' ? 'eth-to-xlm' : 'xlm-to-eth',
        amount,
        estimatedAmount,
        ethAddress,
        stellarAddress,
        status: 'pending'
      });

      // Simulate swap execution (in real implementation, this would interact with contracts)
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Update transaction status
      updateTransactionStatus(orderId, 'completed', {
        ethTxHash: `0x${Math.random().toString(36).substr(2, 64)}`,
        stellarTxHash: `${Math.random().toString(36).substr(2, 64)}`
      });

      toast.success('Swap Completed!', `Successfully swapped ${amount} ${fromToken} to ${estimatedAmount} ${toToken}`);
      
      // Reset form
      setAmount('');
      setEstimatedAmount('');
      
    } catch (error) {
      console.error('❌ Swap execution error:', error);
      toast.error('Swap Failed', error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const canExecuteSwap = () => {
    return ethAddress && stellarAddress && amount && parseFloat(amount) > 0 && !isLoading;
  };

  return (
    <div className="flex justify-center items-center min-h-screen p-4 bg-white">
      <div className="w-full max-w-md">
        {/* Main Swap Card */}
        <div className="bg-white rounded-3xl p-6 shadow-2xl border border-gray-200">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Swap</h2>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-all duration-200"
            >
              <Settings className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Settings Panel */}
          {showSettings && (
            <div className="mb-6 p-4 bg-gray-50 rounded-2xl border border-gray-200">
              <h3 className="text-lg font-semibold mb-3 text-gray-900">Swap Settings</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">Slippage Tolerance</label>
                  <input
                    type="number"
                    value={slippage}
                    onChange={(e) => setSlippage(parseFloat(e.target.value))}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200"
                    min="0.1"
                    max="50"
                    step="0.1"
                  />
                  <p className="text-xs text-gray-500 mt-2">Maximum price change: {slippage}%</p>
                </div>
              </div>
            </div>
          )}

          {/* Swap Form */}
          <div className="space-y-4">
            {/* From Token */}
            <div className="relative">
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 hover:border-gray-300 transition-all duration-200">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-700">From</label>
                  <button className="flex items-center gap-2 p-2 rounded-xl bg-white hover:bg-gray-100 transition-all duration-200 border border-gray-200">
                    <TokenIcon token={getFromToken()} size={20} />
                    <span className="text-sm font-medium text-gray-900">{fromToken}</span>
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
                <input
                  type="number"
                  value={amount}
                  onChange={handleAmountChange}
                  placeholder="0.0"
                  className="w-full bg-transparent text-2xl font-bold text-gray-900 placeholder-gray-400 outline-none focus:ring-0"
                  disabled={isLoading}
                />
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-gray-500">
                    Balance: {ethAddress ? 'Connected' : 'Not connected'}
                  </p>
                  <button className="text-xs text-blue-600 hover:text-blue-700 transition-colors">
                    Max
                  </button>
                </div>
              </div>
            </div>

            {/* Swap Direction Button */}
            <div className="flex justify-center -my-2 relative z-10">
              <button
                onClick={handleTokenSwap}
                disabled={isLoading}
                className="p-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 shadow-lg hover:shadow-xl hover:scale-105 border-4 border-white"
              >
                <ArrowUpDown className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* To Token */}
            <div className="relative">
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 hover:border-gray-300 transition-all duration-200">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-700">To</label>
                  <button className="flex items-center gap-2 p-2 rounded-xl bg-white hover:bg-gray-100 transition-all duration-200 border border-gray-200">
                    <TokenIcon token={getToToken()} size={20} />
                    <span className="text-sm font-medium text-gray-900">{toToken}</span>
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
                <input
                  type="text"
                  value={estimatedAmount}
                  readOnly
                  placeholder="0.0"
                  className="w-full bg-transparent text-2xl font-bold text-gray-900 placeholder-gray-400 outline-none focus:ring-0"
                />
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-gray-500">
                    Balance: {stellarAddress ? 'Connected' : 'Not connected'}
                  </p>
                  <div className="text-xs text-gray-500">
                    ≈ $0.00
                  </div>
                </div>
              </div>
            </div>

            {/* Exchange Rate Info */}
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Exchange Rate</span>
                <div className="flex items-center gap-2">
                  <TokenIcon token={getFromToken()} size={16} />
                  <span className="text-gray-900">1 {fromToken} = {exchangeRate.toFixed(2)} {toToken}</span>
                  <TokenIcon token={getToToken()} size={16} />
                </div>
              </div>
            </div>

            {/* Swap Button */}
            <button
              onClick={handleExecuteSwap}
              disabled={!canExecuteSwap()}
              className={`w-full py-4 rounded-2xl font-semibold text-lg transition-all duration-200 ${
                canExecuteSwap()
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl hover:scale-[1.02]'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Executing Swap...
                </div>
              ) : (
                'Execute Swap'
              )}
            </button>

            {/* Info Panel */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="text-blue-800 font-medium mb-1">How it works</p>
                  <p className="text-blue-700 text-xs leading-relaxed">
                    Your tokens are locked on the source chain, then automatically unlocked on the target chain using Hash Time Locked Contracts (HTLC) for secure cross-chain transfers.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 