'use client';

import { useState, useEffect } from 'react';
import { walletConnectionService } from '../lib/wallet-connection-service';
import UnifiedLayout from '../components/UnifiedLayout';
import { CheckCircle, AlertCircle, ArrowRight, Wallet } from 'lucide-react';

export default function Home() {
  const [walletStatus, setWalletStatus] = useState({
    ethereumConnected: false,
    stellarConnected: false,
    account: null,
    chainId: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Update wallet status
    const updateStatus = () => {
      const status = walletConnectionService.getStatus();
      setWalletStatus(status);
    };

    updateStatus();
    const interval = setInterval(updateStatus, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleConnectEthereum = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await walletConnectionService.connectEthereum();
      if (result.success) {
        console.log('✅ MetaMask connected:', result);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectStellar = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await walletConnectionService.connectStellar();
      if (result.success) {
        console.log('✅ Freighter connected:', result);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const bothConnected = walletStatus.ethereumConnected && walletStatus.stellarConnected;

  return (
    <UnifiedLayout>
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">SynapPay</h1>
            <p className="text-lg text-gray-600">Cross-chain atomic swaps between Ethereum and Stellar</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold flex items-center">
                <Wallet className="w-5 h-5 mr-2" />
                Connect Wallets
              </h2>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-700">Ethereum (MetaMask)</h3>
                <p className="text-sm text-gray-600 mb-2">
                  Status: {walletStatus.ethereumConnected ? '✅ Connected' : '❌ Not Connected'}
                </p>
                {walletStatus.account && (
                  <p className="text-sm text-gray-600 mb-2">
                    Address: {walletStatus.account.slice(0, 6)}...{walletStatus.account.slice(-4)}
                  </p>
                )}
                <button
                  onClick={handleConnectEthereum}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Connecting...' : 'Connect Ethereum'}
                </button>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-700">Stellar (Freighter)</h3>
                <p className="text-sm text-gray-600 mb-2">
                  Status: {walletStatus.stellarConnected ? '✅ Connected' : '❌ Not Connected'}
                </p>
                <button
                  onClick={handleConnectStellar}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
                >
                  {loading ? 'Connecting...' : 'Connect Stellar'}
                </button>
              </div>
            </div>
            
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Quick Actions</h2>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-blue-700">Start Swapping</h3>
                <p className="text-sm text-blue-600 mb-3">
                  Connect both wallets to start cross-chain swaps
                </p>
                <button
                  onClick={() => window.location.href = '/swap'}
                  disabled={!bothConnected}
                  className={`w-full px-4 py-2 rounded flex items-center justify-center space-x-2 ${
                    bothConnected 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <span>Go to Swap</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-medium text-green-700">View History</h3>
                <p className="text-sm text-green-600 mb-3">
                  Check your previous swap transactions
                </p>
                <button
                  onClick={() => window.location.href = '/history'}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  View History
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                <span className="text-red-700">{error}</span>
              </div>
            </div>
          )}

          {bothConnected && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                <span className="text-green-700">Both wallets connected! You can now start swapping.</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </UnifiedLayout>
  );
}