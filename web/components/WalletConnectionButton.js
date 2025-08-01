'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, ChevronDown, CheckCircle, AlertCircle, Coins, Star } from 'lucide-react';
import { useCombinedWallet } from '../lib/useCombinedWallet';

export default function WalletConnectionButton() {
  const [showDropdown, setShowDropdown] = useState(false);
  const {
    // Ethereum wallet
    ethConnected,
    ethAddress,
    ethChainId,
    ethLoading,
    ethError,
    connectEth,
    disconnectEth,
    switchToSepolia,
    isCorrectEthNetwork,
    formatEthAddress,
    
    // Stellar wallet
    stellarConnected,
    stellarPublicKey,
    stellarLoading,
    stellarError,
    connectStellar,
    disconnectStellar,
    formatStellarAddress,
    
    // Combined state
    bothConnected,
    canSwap,
    isLoading,
    error
  } = useCombinedWallet();

  const handleConnectEth = async () => {
    try {
      await connectEth();
    } catch (error) {
      console.error('Failed to connect Ethereum wallet:', error);
    }
  };

  const handleConnectStellar = async () => {
    try {
      await connectStellar();
    } catch (error) {
      console.error('Failed to connect Stellar wallet:', error);
    }
  };

  const handleDisconnect = async () => {
    await disconnectEth();
    await disconnectStellar();
  };

  const handleNetworkSwitch = async () => {
    try {
      await switchToSepolia();
    } catch (error) {
      console.error('Failed to switch network:', error);
    }
  };

  const getButtonContent = () => {
    if (isLoading) {
      return { text: 'Connecting...', icon: Wallet, className: 'bg-gray-100 text-gray-600' };
    }
    
    if (bothConnected) {
      return { text: 'Connected', icon: CheckCircle, className: 'bg-green-100 text-green-800' };
    }
    
    if (ethConnected || stellarConnected) {
      return { text: 'Partial', icon: AlertCircle, className: 'bg-amber-100 text-amber-800' };
    }
    
    return { text: 'Connect Wallet', icon: Wallet, className: 'bg-black text-white hover:bg-gray-800' };
  };

  const buttonContent = getButtonContent();

  return (
    <div className="relative">
      <motion.button
        onClick={() => setShowDropdown(!showDropdown)}
        className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${buttonContent.className}`}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <buttonContent.icon className="w-4 h-4" />
        <span className="text-sm">{buttonContent.text}</span>
        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`} />
      </motion.button>

      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 p-4 z-50"
          >
            {/* Ethereum Wallet Section */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-900">Ethereum Wallet</h3>
                {ethConnected ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-gray-400" />
                )}
              </div>
              
              {ethConnected ? (
                <div className="space-y-2">
                  <p className="text-xs text-gray-600 font-mono">{formatEthAddress(ethAddress)}</p>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      isCorrectEthNetwork() ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {isCorrectEthNetwork() ? 'Sepolia' : 'Wrong Network'}
                    </span>
                    {!isCorrectEthNetwork() && (
                      <button
                        onClick={handleNetworkSwitch}
                        className="text-xs text-blue-600 hover:text-blue-700"
                      >
                        Switch
                      </button>
                    )}
                  </div>
                  <button
                    onClick={disconnectEth}
                    className="text-xs text-red-600 hover:text-red-700"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleConnectEth}
                  disabled={ethLoading}
                  className="w-full bg-black text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  {ethLoading ? 'Connecting...' : 'Connect Ethereum'}
                </button>
              )}
              
              {ethError && (
                <p className="text-xs text-red-600 mt-1">{ethError}</p>
              )}
            </div>

            {/* Stellar Wallet Section */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-900">Stellar Wallet</h3>
                {stellarConnected ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-gray-400" />
                )}
              </div>
              
              {stellarConnected ? (
                <div className="space-y-2">
                  <p className="text-xs text-gray-600 font-mono">{formatStellarAddress(stellarPublicKey)}</p>
                  <button
                    onClick={disconnectStellar}
                    className="text-xs text-red-600 hover:text-red-700"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleConnectStellar}
                  disabled={stellarLoading}
                  className="w-full bg-black text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  {stellarLoading ? 'Connecting...' : 'Connect Stellar'}
                </button>
              )}
              
              {stellarError && (
                <p className="text-xs text-red-600 mt-1">{stellarError}</p>
              )}
            </div>

            {/* Status Section */}
            <div className="border-t border-gray-200 pt-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900">Status</span>
                {bothConnected ? (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Ready to Swap</span>
                ) : (
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">Connect Both Wallets</span>
                )}
              </div>
              
              {bothConnected && (
                <button
                  onClick={() => window.location.href = '/swap'}
                  className="w-full bg-black text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                >
                  Start Swapping
                </button>
              )}
            </div>

            {/* Error Display */}
            {error && (
              <div className="border-t border-gray-200 pt-3">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <span className="text-xs text-red-600">{error}</span>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Backdrop */}
      {showDropdown && (
        <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
      )}
    </div>
  );
} 