'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, Wallet, CheckCircle, AlertCircle, X } from 'lucide-react';
import { workingWalletService } from '../lib/working-wallet-service';

export default function WalletConnectionButton() {
  const [walletStatus, setWalletStatus] = useState({
    ethereumConnected: false,
    stellarConnected: false,
    account: null,
    chainId: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Update wallet status
  useEffect(() => {
    const updateStatus = () => {
      const status = workingWalletService.getStatus();
      setWalletStatus(status);
    };

    updateStatus();
    const interval = setInterval(updateStatus, 1000);
    return () => clearInterval(interval);
  }, []);

  const ethConnected = walletStatus.ethereumConnected;
  const stellarConnected = walletStatus.stellarConnected;
  const ethAddress = walletStatus.account;
  const bothConnected = ethConnected && stellarConnected;
  const isLoading = loading;

  const [showDropdown, setShowDropdown] = useState(false);

  const handleConnectEth = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await workingWalletService.connectEthereum();
      if (result.success) {
        console.log('Ethereum connected:', result);
        setShowDropdown(false);
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
      const result = await workingWalletService.connectStellar();
      if (result.success) {
        console.log('Stellar connected:', result);
        setShowDropdown(false);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      workingWalletService.disconnect();
      setShowDropdown(false);
    } catch (error) {
      console.error('Failed to disconnect wallets:', error);
    }
  };

  const getConnectionStatus = () => {
    if (bothConnected) return 'Both Connected';
    if (ethConnected) return 'ETH Connected';
    if (stellarConnected) return 'Stellar Connected';
    return 'Not Connected';
  };

  const getStatusColor = () => {
    if (bothConnected) return 'text-green-600';
    if (ethConnected || stellarConnected) return 'text-yellow-600';
    return 'text-gray-600';
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        disabled={isLoading}
        className={`
          flex items-center space-x-2 px-4 py-2 rounded-lg border transition-all
          ${bothConnected 
            ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100' 
            : ethConnected || stellarConnected
            ? 'bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100'
            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
          }
          ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <Wallet className="w-4 h-4" />
        <span className="text-sm font-medium">{getConnectionStatus()}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
      </button>

      {showDropdown && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowDropdown(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                <h3 className="text-sm font-semibold text-gray-900">Wallet Connections</h3>
                <button
                  onClick={() => setShowDropdown(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              {/* Ethereum Section */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Ethereum</h3>
                <div className="space-y-2">
                  {ethConnected ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                                                     <span className="text-sm text-green-700">{workingWalletService.formatEthAddress(ethAddress)}</span>
                        </div>
                        <span className="text-xs text-green-600">Connected</span>
                      </div>
                      

                      
                      <button
                        onClick={handleDisconnect}
                        className="w-full px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                      >
                        Disconnect ETH
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleConnectEth}
                      disabled={loading}
                      className="w-full flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      {loading ? 'Connecting...' : 'Connect Ethereum Wallet'}
                    </button>
                  )}
                </div>
              </div>

              {/* Stellar Section */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Stellar</h3>
                <div className="space-y-2">
                  {stellarConnected ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <div className="flex flex-col">
                            <span className="text-sm text-green-700">Stellar Connected</span>
                            <span className="text-xs text-green-600">Freighter</span>
                          </div>
                        </div>
                        <span className="text-xs text-green-600">Connected</span>
                      </div>
                      
                      <button
                        onClick={handleDisconnect}
                        className="w-full px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                      >
                        Disconnect Stellar
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleConnectStellar}
                      disabled={loading}
                      className="w-full flex items-center justify-center px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
                    >
                      {loading ? 'Connecting...' : 'Connect Stellar'}
                    </button>
                  )}
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <div className="p-2 bg-red-50 border border-red-200 rounded">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <span className="text-sm text-red-700">
                      {error}
                    </span>
                  </div>
                </div>
              )}

              {/* Disconnect All Button */}
              {(ethConnected || stellarConnected) && (
                <button
                  onClick={handleDisconnect}
                  className="w-full px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
                >
                  Disconnect All Wallets
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
} 