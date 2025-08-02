'use client';

import { useState } from 'react';
import { ChevronDown, Wallet, CheckCircle, AlertCircle } from 'lucide-react';
import { useWalletManager } from '../lib/wallet-manager';

export default function WalletConnectionButton() {
  const {
    ethConnected,
    ethAddress,
    ethChainId,
    ethLoading,
    ethError,
    connectEth,
    disconnectEth,
    switchToSepolia,
    formatEthAddress,
    isCorrectEthNetwork,
    
    stellarConnected,
    stellarPublicKey,
    stellarLoading,
    stellarError,
    connectStellar,
    disconnectStellar,
    formatStellarAddress,
    
    bothConnected,
    canSwap,
    isLoading,
    error
  } = useWalletManager();

  const [showDropdown, setShowDropdown] = useState(false);

  const handleConnectEth = async () => {
    try {
      await connectEth();
      setShowDropdown(false);
    } catch (error) {
      console.error('Failed to connect Ethereum wallet:', error);
    }
  };

  const handleConnectStellar = async () => {
    try {
      await connectStellar();
      setShowDropdown(false);
    } catch (error) {
      console.error('Failed to connect Stellar wallet:', error);
    }
  };

  const handleSwitchToSepolia = async () => {
    try {
      await switchToSepolia();
      setShowDropdown(false);
    } catch (error) {
      console.error('Failed to switch network:', error);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectEth();
      await disconnectStellar();
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
              {/* Ethereum Section */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Ethereum</h3>
                <div className="space-y-2">
                  {ethConnected ? (
                    <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-green-700">{formatEthAddress(ethAddress)}</span>
                      </div>
                      <span className="text-xs text-green-600">Connected</span>
                    </div>
                  ) : (
                    <button
                      onClick={handleConnectEth}
                      disabled={ethLoading}
                      className="w-full flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      {ethLoading ? 'Connecting...' : 'Connect Ethereum'}
                    </button>
                  )}
                  
                  {ethConnected && !isCorrectEthNetwork() && (
                    <button
                      onClick={handleSwitchToSepolia}
                      className="w-full px-3 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 text-sm"
                    >
                      Switch to Sepolia
                    </button>
                  )}
                </div>
              </div>

              {/* Stellar Section */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Stellar</h3>
                <div className="space-y-2">
                  {stellarConnected ? (
                    <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-green-700">{formatStellarAddress(stellarPublicKey)}</span>
                      </div>
                      <span className="text-xs text-green-600">Connected</span>
                    </div>
                  ) : (
                    <button
                      onClick={handleConnectStellar}
                      disabled={stellarLoading}
                      className="w-full flex items-center justify-center px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
                    >
                      {stellarLoading ? 'Connecting...' : 'Connect Stellar'}
                    </button>
                  )}
                </div>
              </div>

              {/* Error Display */}
              {(ethError || stellarError) && (
                <div className="p-2 bg-red-50 border border-red-200 rounded">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <span className="text-sm text-red-700">
                      {ethError || stellarError}
                    </span>
                  </div>
                </div>
              )}

              {/* Disconnect Button */}
              {(ethConnected || stellarConnected) && (
                <button
                  onClick={handleDisconnect}
                  className="w-full px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
                >
                  Disconnect All
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
} 