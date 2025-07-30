import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import toast, { Toaster } from 'react-hot-toast';
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

export default function Home() {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [swapDirection, setSwapDirection] = useState('eth_to_stellar');
  const [amount, setAmount] = useState('');
  const [receiver, setReceiver] = useState('');
  const [asset, setAsset] = useState('XLM');
  const [timelock, setTimelock] = useState(3600);
  const [isLoading, setIsLoading] = useState(false);
  const [activeSwaps, setActiveSwaps] = useState([]);
  const [systemStatus, setSystemStatus] = useState(null);

  // Connect wallet
  const connectWallet = async () => {
    try {
      if (typeof window.ethereum !== 'undefined') {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const account = accounts[0];
        setWalletAddress(account);
        setIsConnected(true);
        toast.success('Wallet connected successfully!');
      } else {
        toast.error('Please install MetaMask!');
      }
    } catch (error) {
      toast.error('Failed to connect wallet');
      console.error(error);
    }
  };

  // Create swap
  const createSwap = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!amount || !receiver) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    const loadingToast = toast.loading('Creating swap...');

    try {
      // Call real API endpoint
      const response = await fetch('/api/swaps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          direction: swapDirection,
          amount: parseFloat(amount),
          receiver: receiver,
          asset: asset,
          timelock: timelock,
          walletAddress: walletAddress
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        const newSwap = {
          id: result.swapId,
          direction: swapDirection,
          amount: amount,
          receiver: receiver,
          asset: asset,
          status: 'ACTIVE',
          createdAt: Date.now(),
          fusionStatus: result.fusionStatus || 'AUCTION_ACTIVE',
          fusionOrderHash: result.fusionOrderHash
        };

        setActiveSwaps(prev => [...prev, newSwap]);
        toast.success('Swap created successfully!', { id: loadingToast });
        
        // Reset form
        setAmount('');
        setReceiver('');
      } else {
        throw new Error(result.error || 'Failed to create swap');
      }
    } catch (error) {
      toast.error(`Failed to create swap: ${error.message}`, { id: loadingToast });
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Monitor swap status
  useEffect(() => {
    const interval = setInterval(async () => {
      // Update active swaps with real status from API
      const updatedSwaps = await Promise.all(
        activeSwaps.map(async (swap) => {
          try {
            const response = await fetch(`/api/swaps/${swap.id}`);
            if (response.ok) {
              const data = await response.json();
              return {
                ...swap,
                status: data.status,
                fusionStatus: data.fusionStatus,
                lastUpdated: Date.now()
              };
            }
            return swap;
          } catch (error) {
            console.error('Failed to update swap status:', error);
            return swap;
          }
        })
      );
      
      setActiveSwaps(updatedSwaps);
    }, 5000);

    return () => clearInterval(interval);
  }, [activeSwaps]);

  // Get system status
  useEffect(() => {
    const fetchSystemStatus = async () => {
      try {
        const response = await fetch('/api/status');
        if (response.ok) {
          const data = await response.json();
          setSystemStatus(data);
        }
      } catch (error) {
        console.error('Failed to fetch system status:', error);
      }
    };

    fetchSystemStatus();
    const interval = setInterval(fetchSystemStatus, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-gray-900">SynapPay</h1>
                <p className="text-sm text-gray-500">Cross-Chain Swaps with 1inch Fusion+</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {!isConnected ? (
                <button
                  onClick={connectWallet}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Connect Wallet
                </button>
              ) : (
                <div className="flex items-center space-x-2">
                  <div className="text-sm text-gray-600">
                    {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                  </div>
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Swap Form */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Create Cross-Chain Swap</h2>
            
            <div className="space-y-6">
              {/* Swap Direction */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Swap Direction
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setSwapDirection('eth_to_stellar')}
                    className={`p-3 rounded-lg border-2 transition-colors ${
                      swapDirection === 'eth_to_stellar'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-sm font-medium">ETH → Stellar</div>
                    <div className="text-xs text-gray-500">Ethereum to Stellar</div>
                  </button>
                  <button
                    onClick={() => setSwapDirection('stellar_to_eth')}
                    className={`p-3 rounded-lg border-2 transition-colors ${
                      swapDirection === 'stellar_to_eth'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-sm font-medium">Stellar → ETH</div>
                    <div className="text-xs text-gray-500">Stellar to Ethereum</div>
                  </button>
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Receiver */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Receiver Address
                </label>
                <input
                  type="text"
                  value={receiver}
                  onChange={(e) => setReceiver(e.target.value)}
                  placeholder={swapDirection === 'eth_to_stellar' ? 'G...' : '0x...'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Asset */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Asset
                </label>
                <select
                  value={asset}
                  onChange={(e) => setAsset(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="XLM">XLM (Native)</option>
                  <option value="USDC">USDC</option>
                  <option value="USDT">USDT</option>
                </select>
              </div>

              {/* Timelock */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Timelock (seconds)
                </label>
                <input
                  type="number"
                  value={timelock}
                  onChange={(e) => setTimelock(parseInt(e.target.value))}
                  min="300"
                  max="86400"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Minimum: 300s (5 min), Maximum: 86400s (24 hours)
                </p>
              </div>

              {/* Create Swap Button */}
              <button
                onClick={createSwap}
                disabled={isLoading || !isConnected}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <ArrowPathIcon className="h-5 w-5 animate-spin mr-2" />
                    Creating Swap...
                  </>
                ) : (
                  'Create Swap'
                )}
              </button>
            </div>
          </div>

          {/* Active Swaps */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Active Swaps</h2>
            
            {activeSwaps.length === 0 ? (
              <div className="text-center py-8">
                <InformationCircleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No active swaps</p>
                <p className="text-sm text-gray-400">Create a swap to see it here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeSwaps.map((swap) => (
                  <div key={swap.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900">
                          {swap.direction === 'eth_to_stellar' ? 'ETH → Stellar' : 'Stellar → ETH'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {swap.amount} {swap.asset}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        {swap.fusionStatus === 'FILLED' ? (
                          <CheckCircleIcon className="h-4 w-4 text-green-500" />
                        ) : (
                          <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500" />
                        )}
                        <span className="text-xs font-medium text-gray-600">
                          {swap.fusionStatus}
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-500 space-y-1">
                      <div>Receiver: {swap.receiver.slice(0, 10)}...{swap.receiver.slice(-8)}</div>
                      <div>Created: {new Date(swap.createdAt).toLocaleString()}</div>
                      <div>Swap ID: {swap.id.slice(0, 10)}...</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* System Status */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">System Status</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{activeSwaps.length}</div>
              <div className="text-sm text-gray-500">Active Swaps</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {activeSwaps.filter(s => s.fusionStatus === 'FILLED').length}
              </div>
              <div className="text-sm text-gray-500">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {activeSwaps.filter(s => s.fusionStatus === 'AUCTION_ACTIVE').length}
              </div>
              <div className="text-sm text-gray-500">In Auction</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {activeSwaps.filter(s => s.direction === 'eth_to_stellar').length}
              </div>
              <div className="text-sm text-gray-500">ETH → Stellar</div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="ml-3 text-lg font-medium text-gray-900">1inch Fusion+</h3>
            </div>
            <p className="text-gray-600">
              Intent-based orders with Dutch auction for optimal pricing and liquidity.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="ml-3 text-lg font-medium text-gray-900">HTLC Security</h3>
            </div>
            <p className="text-gray-600">
              Hash Time Locked Contracts ensure atomic swaps with no counterparty risk.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <h3 className="ml-3 text-lg font-medium text-gray-900">Real-time Monitoring</h3>
            </div>
            <p className="text-gray-600">
              Live status updates and auction progress tracking for all swaps.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
} 