'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, ChevronDown, CheckCircle, AlertCircle, Coins, Star } from 'lucide-react';
import { useCombinedWallet } from '../lib/useCombinedWallet';

export default function WalletConnectionButton() {
  const [showDropdown, setShowDropdown] = useState(false);
  
  const {
    // Ethereum
    ethConnected,
    ethAddress,
    ethLoading,
    ethError,
    connectEth,
    disconnectEth,
    switchToSepolia,
    isCorrectEthNetwork,
    formatEthAddress,
    
    // Stellar
    stellarConnected,
    stellarPublicKey,
    stellarLoading,
    stellarError,
    connectStellar,
    disconnectStellar,
    isFreighterAvailable,
    formatStellarAddress,
    
    // Combined
    bothConnected,
    canSwap,
    isLoading,
    error,
  } = useCombinedWallet();

  const handleConnectEth = async () => {
    try {
      await connectEth();
    } catch (error) {
      console.error('Ethereum connection failed:', error);
    }
  };

  const handleConnectStellar = async () => {
    try {
      await connectStellar();
    } catch (error) {
      console.error('Stellar connection failed:', error);
    }
  };

  const handleDisconnect = async () => {
    await disconnectEth();
    await disconnectStellar();
    setShowDropdown(false);
  };

  const handleNetworkSwitch = async () => {
    try {
      await switchToSepolia();
    } catch (error) {
      console.error('Network switch failed:', error);
    }
  };

  // Determine button state and content
  const getButtonContent = () => {
    if (bothConnected) {
      return {
        text: 'Wallets Connected',
        icon: <CheckCircle className="w-4 h-4" />,
        className: 'bg-green-500 hover:bg-green-600 text-white',
      };
    } else if (ethConnected || stellarConnected) {
      return {
        text: 'Partially Connected',
        icon: <AlertCircle className="w-4 h-4" />,
        className: 'bg-yellow-500 hover:bg-yellow-600 text-white',
      };
    } else {
      return {
        text: 'Connect Wallets',
        icon: <Wallet className="w-4 h-4" />,
        className: 'bg-blue-500 hover:bg-blue-600 text-white',
      };
    }
  };

  const buttonContent = getButtonContent();

  return (
    <div className="relative">
      {/* Main Button */}
      <motion.button
        onClick={() => setShowDropdown(!showDropdown)}
        disabled={isLoading}
        className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${buttonContent.className} disabled:opacity-50`}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {buttonContent.icon}
        <span>{buttonContent.text}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
      </motion.button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 p-4 z-50"
          >
            {/* Header */}
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Wallet Connection</h3>
              <p className="text-sm text-gray-600">Connect your Ethereum and Stellar wallets</p>
            </div>

            {/* Ethereum Wallet Section */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Wallet className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-gray-900">Ethereum Wallet</span>
                </div>
                {ethConnected && <CheckCircle className="w-4 h-4 text-green-600" />}
              </div>
              
              {ethConnected ? (
                <div className="space-y-2">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-600">Connected Address</p>
                    <p className="font-mono text-sm text-gray-900">{formatEthAddress(ethAddress)}</p>
                  </div>
                  
                  {!isCorrectEthNetwork() && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <div className="flex items-center space-x-2 mb-2">
                        <AlertCircle className="w-4 h-4 text-amber-600" />
                        <span className="text-sm font-medium text-amber-900">Wrong Network</span>
                      </div>
                      <p className="text-xs text-amber-700 mb-2">Please switch to Sepolia testnet</p>
                      <button
                        onClick={handleNetworkSwitch}
                        className="bg-amber-600 text-white px-3 py-1 rounded text-xs hover:bg-amber-700 transition-colors"
                      >
                        Switch to Sepolia
                      </button>
                    </div>
                  )}
                  
                  <button
                    onClick={disconnectEth}
                    className="w-full bg-red-500 text-white px-3 py-2 rounded-lg text-sm hover:bg-red-600 transition-colors"
                  >
                    Disconnect Ethereum
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleConnectEth}
                  disabled={ethLoading}
                  className="w-full bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {ethLoading ? 'Connecting...' : 'Connect Ethereum'}
                </button>
              )}
            </div>

            {/* Stellar Wallet Section */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Star className="w-4 h-4 text-purple-600" />
                  <span className="font-medium text-gray-900">Stellar Wallet</span>
                </div>
                {stellarConnected && <CheckCircle className="w-4 h-4 text-green-600" />}
              </div>
              
              {stellarConnected ? (
                <div className="space-y-2">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-600">Connected Address</p>
                    <p className="font-mono text-sm text-gray-900">{formatStellarAddress(stellarPublicKey)}</p>
                  </div>
                  
                  <button
                    onClick={disconnectStellar}
                    className="w-full bg-red-500 text-white px-3 py-2 rounded-lg text-sm hover:bg-red-600 transition-colors"
                  >
                    Disconnect Stellar
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {!isFreighterAvailable() && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <div className="flex items-center space-x-2 mb-2">
                        <AlertCircle className="w-4 h-4 text-amber-600" />
                        <span className="text-sm font-medium text-amber-900">Freighter Not Detected</span>
                      </div>
                      <p className="text-xs text-amber-700 mb-2">Please install Freighter extension</p>
                      <a
                        href="https://www.freighter.app/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-amber-600 text-white px-3 py-1 rounded text-xs hover:bg-amber-700 transition-colors inline-block"
                      >
                        Install Freighter
                      </a>
                    </div>
                  )}
                  
                  <button
                    onClick={handleConnectStellar}
                    disabled={stellarLoading || !isFreighterAvailable()}
                    className="w-full bg-purple-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-purple-700 transition-colors disabled:opacity-50"
                  >
                    {stellarLoading ? 'Connecting...' : 'Connect Stellar'}
                  </button>
                </div>
              )}
            </div>

            {/* Status Section */}
            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900">Status</span>
                {canSwap && <CheckCircle className="w-4 h-4 text-green-600" />}
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Both Connected</span>
                  <span className={bothConnected ? 'text-green-600' : 'text-red-600'}>
                    {bothConnected ? 'Yes' : 'No'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Ready to Swap</span>
                  <span className={canSwap ? 'text-green-600' : 'text-red-600'}>
                    {canSwap ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
              
              {bothConnected && (
                <button
                  onClick={handleDisconnect}
                  className="w-full mt-3 bg-gray-500 text-white px-3 py-2 rounded-lg text-sm hover:bg-gray-600 transition-colors"
                >
                  Disconnect All
                </button>
              )}
            </div>

            {/* Error Display */}
            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <span className="text-sm text-red-800 font-medium">Connection Error</span>
                </div>
                <p className="text-xs text-red-700 mt-1">{error}</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
} 