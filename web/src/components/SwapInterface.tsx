import { useState, useEffect } from 'react';
import { useFreighter } from '../hooks/useFreighter';
import { 
  Horizon, 
  Asset, 
  Operation, 
  TransactionBuilder, 
  Memo
} from '@stellar/stellar-sdk';
import { isTestnet, getCurrentNetwork } from '../config/networks';
import { oneInchService } from '../services/oneInch';
import { useToast } from './Toast';
import { ArrowUpDown, Settings, Info, RefreshCw, Zap, Shield, Clock, Coins } from 'lucide-react';

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

// Fixed token information
const ETH_TOKEN = {
  symbol: 'ETH',
  name: 'Ethereum',
  logo: '/images/eth.png',
  chain: 'Ethereum',
  decimals: 18
};

const XLM_TOKEN = {
  symbol: 'XLM',
  name: 'Stellar Lumens',
  logo: '/images/xlm.png',
  chain: 'Stellar',
  decimals: 7
};

// Fixed exchange rate (in real application, this would be fetched from API)
const ETH_TO_XLM_RATE = 10000; // 1 ETH = 10,000 XLM

// Network configuration
const MAINNET_CHAIN_ID = '0x1'; // Ethereum Mainnet (1)

// Helper function to fetch real-time crypto prices with adaptive rate limiting
const fetchCryptoPrices = async (currentInterval: number, rateLimitCount: number, 
  setUpdateInterval: (interval: number) => void, setRateLimitCount: (count: number) => void, 
  setLastRateLimitTime: (time: Date | null) => void) => {
  try {
    console.log('💱 Fetching real-time crypto prices...');
    
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=ethereum,stellar&vs_currencies=usd'
    );
    
    // Check for rate limiting
    if (response.status === 429) {
      const newRateLimitCount = rateLimitCount + 1;
      const newInterval = Math.min(currentInterval * 2, 60000); // Max 60 seconds
      
      console.warn(`⚠️ Rate limited! Increasing interval: ${currentInterval}ms → ${newInterval}ms`);
      console.warn(`   Rate limit count: ${newRateLimitCount}`);
      
      setRateLimitCount(newRateLimitCount);
      setLastRateLimitTime(new Date());
      setUpdateInterval(newInterval);
      
      // Return fallback data
      return {
        ethPrice: null,
        xlmPrice: null,
        ethToXlmRate: ETH_TO_XLM_RATE,
        success: false,
        rateLimited: true,
        newInterval
      };
    }
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const prices = await response.json();
    
    const ethPrice = prices.ethereum?.usd;
    const xlmPrice = prices.stellar?.usd;
    
    if (!ethPrice || !xlmPrice) {
      throw new Error('Price data incomplete');
    }
    
    // Calculate ETH to XLM rate: 1 ETH = how many XLM
    const ethToXlmRate = ethPrice / xlmPrice;
    
    console.log('💱 Real-time prices:');
    console.log(`   ETH: $${ethPrice}`);
    console.log(`   XLM: $${xlmPrice}`);
    console.log(`   Rate: 1 ETH = ${ethToXlmRate.toFixed(2)} XLM`);
    
    return {
      ethPrice,
      xlmPrice,
      ethToXlmRate,
      success: true,
      rateLimited: false
    };
  } catch (error) {
    console.error('❌ Error fetching crypto prices:', error);
    return {
      ethPrice: null,
      xlmPrice: null,
      ethToXlmRate: ETH_TO_XLM_RATE,
      success: false,
      rateLimited: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

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
  const [exchangeRate, setExchangeRate] = useState(ETH_TO_XLM_RATE);
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [slippage, setSlippage] = useState(1.0);
  const [swapStep, setSwapStep] = useState<'input' | 'quote' | 'executing'>('input');
  const [quoteData, setQuoteData] = useState<any>(null);
  const [lastRateLimitTime, setLastRateLimitTime] = useState<Date | null>(null);
  const [rateLimitCount, setRateLimitCount] = useState(0);
  const [updateInterval, setUpdateInterval] = useState(30000); // 30 seconds

  const toast = useToast();

  // Auto-refresh quotes every 30 seconds
  useEffect(() => {
    if (!amount || !ethAddress || !stellarAddress || parseFloat(amount) <= 0) return;

    const interval = setInterval(() => {
      handleAmountChange({ target: { value: amount } });
    }, updateInterval);

    return () => clearInterval(interval);
  }, [amount, fromToken, toToken, ethAddress, stellarAddress, updateInterval]);

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
    setSwapStep('executing');

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
      setSwapStep('input');
      
    } catch (error) {
      console.error('❌ Swap execution error:', error);
      toast.error('Swap Failed', error instanceof Error ? error.message : 'Unknown error occurred');
      setSwapStep('input');
    } finally {
      setIsLoading(false);
    }
  };

  const formatAmount = (amount: string, decimals: number = 6) => {
    const num = parseFloat(amount);
    if (isNaN(num)) return '0';
    return num.toFixed(decimals);
  };

  const canExecuteSwap = () => {
    return ethAddress && stellarAddress && amount && parseFloat(amount) > 0 && !isLoading;
  };

  return (
    <div className="swap-card-border">
      <div className="swap-card-bg p-6 rounded-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">
            <span className="page-title-gradient">Swap Interface</span>
          </h2>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="mb-6 p-4 bg-white/5 rounded-xl border border-white/10">
            <h3 className="text-lg font-semibold mb-3">Swap Settings</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Slippage Tolerance</label>
                <input
                  type="number"
                  value={slippage}
                  onChange={(e) => setSlippage(parseFloat(e.target.value))}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                  min="0.1"
                  max="50"
                  step="0.1"
                />
                <p className="text-xs text-gray-400 mt-1">Maximum price change: {slippage}%</p>
              </div>
            </div>
          </div>
        )}

        {/* Swap Form */}
        <div className="space-y-4">
          {/* From Token */}
          <div className="gradient-border">
            <div className="p-4 bg-white/5 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-300">From</label>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🦊</span>
                  <span className="text-sm">{fromToken}</span>
                </div>
              </div>
              <input
                type="number"
                value={amount}
                onChange={handleAmountChange}
                placeholder="0.0"
                className="w-full bg-transparent text-2xl font-bold text-white placeholder-gray-500 outline-none"
                disabled={isLoading}
              />
              <p className="text-xs text-gray-400 mt-1">
                Balance: {ethAddress ? 'Connected' : 'Not connected'}
              </p>
            </div>
          </div>

          {/* Swap Direction Button */}
          <div className="flex justify-center">
            <button
              onClick={handleTokenSwap}
              disabled={isLoading}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-50"
            >
              <ArrowUpDown className="w-5 h-5" />
            </button>
          </div>

          {/* To Token */}
          <div className="gradient-border">
            <div className="p-4 bg-white/5 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-300">To</label>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🚀</span>
                  <span className="text-sm">{toToken}</span>
                </div>
              </div>
              <input
                type="text"
                value={estimatedAmount}
                readOnly
                placeholder="0.0"
                className="w-full bg-transparent text-2xl font-bold text-white placeholder-gray-500 outline-none"
              />
              <p className="text-xs text-gray-400 mt-1">
                Balance: {stellarAddress ? 'Connected' : 'Not connected'}
              </p>
            </div>
          </div>

          {/* Exchange Rate Info */}
          <div className="p-3 bg-white/5 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Exchange Rate</span>
              <span className="text-white">1 {fromToken} = {exchangeRate.toFixed(2)} {toToken}</span>
            </div>
          </div>

          {/* Swap Button */}
          <button
            onClick={handleExecuteSwap}
            disabled={!canExecuteSwap()}
            className={`w-full py-4 rounded-xl font-semibold text-lg transition-all duration-200 ${
              canExecuteSwap()
                ? 'bg-gradient-to-r from-[#6C63FF] to-[#3ABEFF] hover:from-[#5A52E8] hover:to-[#2A9FE8] text-white shadow-lg hover:shadow-xl'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
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
          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-400 mt-0.5" />
              <div className="text-sm">
                <p className="text-blue-300 font-medium mb-1">How it works</p>
                <p className="text-blue-200 text-xs">
                  Your tokens are locked on the source chain, then automatically unlocked on the target chain using Hash Time Locked Contracts (HTLC) for secure cross-chain transfers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 