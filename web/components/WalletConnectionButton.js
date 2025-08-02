'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Wallet, AlertCircle, Download, RefreshCw, Info, Coins, ArrowRight } from 'lucide-react';
import { useCombinedWallet } from '../lib/useCombinedWallet';

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
  } = useCombinedWallet();

  const [showDropdown, setShowDropdown] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

  const handleConnectEth = async () => {
    try {
      await connectEth();
    } catch (error) {
      console.error('Failed to connect Ethereum wallet:', error);
    }
  };

  const handleConnectStellar = async () => {
    console.log('Stellar connect button clicked');
    try {
      console.log('Calling connectStellar...');
      await connectStellar();
      console.log('connectStellar completed');
    } catch (error) {
      console.error('Failed to connect Stellar wallet:', error);
    }
  };

  const handleSwitchToSepolia = async () => {
    console.log('Switch to Sepolia button clicked');
    try {
      console.log('Calling switchToSepolia...');
      await switchToSepolia();
      console.log('switchToSepolia completed');
    } catch (error) {
      console.error('Failed to switch to Sepolia:', error);
    }
  };

  const handleDisconnect = async () => {
    try {
      await Promise.all([
        disconnectEth().catch(err => console.error('ETH disconnect error:', err)),
        disconnectStellar().catch(err => console.error('Stellar disconnect error:', err))
      ]);
    } catch (error) {
      console.error('Failed to disconnect wallets:', error);
    }
  };

  const getConnectionStatus = () => {
    if (bothConnected) return 'Both Connected';
    if (ethConnected && stellarConnected) return 'Both Connected';
    if (ethConnected) return 'ETH Only';
    if (stellarConnected) return 'Stellar Only';
    return 'Not Connected';
  };

  const getStatusColor = () => {
    if (bothConnected) return 'text-green-600';
    if (ethConnected || stellarConnected) return 'text-yellow-600';
    return 'text-gray-500';
  };

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowDropdown(!showDropdown)}
        className={`
          flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all
          ${bothConnected 
            ? 'bg-green-100 text-green-700 border border-green-200' 
            : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
          }
        `}
      >
        <Wallet size={18} />
        <span>{getConnectionStatus()}</span>
        {isLoading && <RefreshCw size={16} className="animate-spin" />}
      </motion.button>

      {showDropdown && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50"
        >
          <div className="space-y-4">
            {/* Debug Section */}
            <div className="border-b border-gray-200 pb-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 text-sm">Debug Info</h3>
                <button
                  onClick={() => setShowDebug(!showDebug)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <Info size={14} />
                </button>
              </div>
              {showDebug && (
                <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                  <div><strong>Ethereum Connected:</strong> {ethConnected ? 'Yes' : 'No'}</div>
                  <div><strong>Stellar Connected:</strong> {stellarConnected ? 'Yes' : 'No'}</div>
                  <div><strong>Both Connected:</strong> {bothConnected ? 'Yes' : 'No'}</div>
                  <div><strong>Can Swap:</strong> {canSwap ? 'Yes' : 'No'}</div>
                  <div><strong>ETH Chain ID:</strong> {ethChainId || 'Not Connected'}</div>
                  <div><strong>Correct ETH Network:</strong> {isCorrectEthNetwork() ? 'Yes' : 'No'}</div>
                  <div><strong>Protocol:</strong> {typeof window !== 'undefined' ? window.location.protocol : 'N/A'}</div>
                  <div><strong>Hostname:</strong> {typeof window !== 'undefined' ? window.location.hostname : 'N/A'}</div>
                </div>
              )}
            </div>

            {/* Ethereum Wallet Section */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Ethereum Wallet</h3>
              {ethConnected ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Address:</span>
                    <span className="text-sm font-mono">{formatEthAddress(ethAddress)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Network:</span>
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm ${isCorrectEthNetwork() ? 'text-green-600' : 'text-red-600'}`}>
                        {isCorrectEthNetwork() ? 'Sepolia' : `Chain ID: ${ethChainId || 'Unknown'}`}
                      </span>
                      {!isCorrectEthNetwork() && (
                        <button
                          onClick={handleSwitchToSepolia}
                          disabled={ethLoading}
                          className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50 font-medium"
                        >
                          {ethLoading ? 'Switching...' : 'Switch to Sepolia'}
                        </button>
                      )}
                    </div>
                  </div>
                  {!isCorrectEthNetwork() && (
                    <div className="text-xs text-gray-500 bg-yellow-50 p-2 rounded">
                      ⚠️ SynapPay requires Sepolia testnet for cross-chain swaps
                    </div>
                  )}
                  {ethError && (
                    <div className="flex items-center space-x-2 text-red-600 text-sm">
                      <AlertCircle size={14} />
                      <span>{ethError}</span>
                    </div>
                  )}
                  <button
                    onClick={disconnectEth}
                    disabled={ethLoading}
                    className="w-full px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50"
                  >
                    {ethLoading ? 'Disconnecting...' : 'Disconnect ETH'}
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <button
                    onClick={handleConnectEth}
                    disabled={ethLoading}
                    className="w-full px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
                  >
                    {ethLoading ? 'Connecting...' : 'Connect Ethereum'}
                  </button>
                  {ethError && (
                    <div className="flex items-center space-x-2 text-red-600 text-sm">
                      <AlertCircle size={14} />
                      <span>{ethError}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Stellar Wallet Section */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Stellar Wallet</h3>
              {stellarConnected ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Address:</span>
                    <span className="text-sm font-mono">{formatStellarAddress(stellarPublicKey)}</span>
                  </div>
                  {stellarError && (
                    <div className="flex items-center space-x-2 text-red-600 text-sm">
                      <AlertCircle size={14} />
                      <span>{stellarError}</span>
                    </div>
                  )}
                  <button
                    onClick={disconnectStellar}
                    disabled={stellarLoading}
                    className="w-full px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50"
                  >
                    {stellarLoading ? 'Disconnecting...' : 'Disconnect Stellar'}
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <button
                    onClick={handleConnectStellar}
                    disabled={stellarLoading}
                    className="w-full px-3 py-2 text-sm bg-purple-100 text-purple-700 rounded hover:bg-purple-200 disabled:opacity-50"
                  >
                    {stellarLoading ? 'Connecting...' : 'Connect Stellar'}
                  </button>
                  {stellarError && (
                    <div className="flex items-center space-x-2 text-red-600 text-sm">
                      <AlertCircle size={14} />
                      <span>{stellarError}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Combined Actions */}
            {bothConnected && (
              <div className="pt-2 border-t border-gray-200">
                <div className="space-y-2">
                  <button
                    onClick={handleDisconnect}
                    disabled={isLoading}
                    className="w-full px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
                  >
                    {isLoading ? 'Disconnecting...' : 'Disconnect All'}
                  </button>
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="pt-2 border-t border-gray-200">
                <div className="flex items-center space-x-2 text-red-600 text-sm">
                  <AlertCircle size={14} />
                  <span>{error}</span>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Click outside to close */}
      {showDropdown && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
} 