'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Wallet, Shield, Zap, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { useWalletConnect } from '../lib/useWalletConnect';
import config from '../lib/config';

export default function Home() {
  const {
    isConnected,
    address,
    chainId,
    isLoading,
    error,
    connect,
    disconnect,
    openModal,
    formatAddress,
    isCorrectNetwork,
    switchToSepolia
  } = useWalletConnect();

  const [showNetworkAlert, setShowNetworkAlert] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // Check network on connection
  useEffect(() => {
    if (isConnected && !isCorrectNetwork()) {
      setShowNetworkAlert(true);
    } else {
      setShowNetworkAlert(false);
    }
  }, [isConnected, isCorrectNetwork]);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const result = await connect();
      if (result.success) {
        // Navigate to swap page after successful connection
        setTimeout(() => {
          window.location.href = '/swap';
        }, 1500);
      }
    } catch (error) {
      console.error('Connection failed:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleNetworkSwitch = async () => {
    try {
      const result = await switchToSepolia();
      if (result.success) {
        setShowNetworkAlert(false);
      }
    } catch (error) {
      console.error('Network switch failed:', error);
    }
  };

  const handleDisconnect = async () => {
    await disconnect();
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f2f2f7] via-white to-[#f8f9fa] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white rounded-[30px] shadow-[0px_20px_60px_0px_rgba(0,0,0,0.1)] p-8 md:p-16 max-w-[600px] w-full relative overflow-hidden"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-40 h-40 bg-gradient-to-br from-green-500 to-blue-600 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 text-center space-y-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">SynapPay</h1>
            </div>
            
            <h2 className="text-4xl md:text-5xl font-bold leading-tight text-gray-900">
              Trustless Cross-Chain
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                Swap Protocol
              </span>
            </h2>
            
            <p className="text-lg md:text-xl text-gray-600 leading-relaxed max-w-md mx-auto">
              Seamless ETH ↔️ XLM transfers powered by 1inch Fusion+ and HTLC security
            </p>
          </motion.div>

          {/* Connection Status */}
          <AnimatePresence>
            {isConnected ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-green-50 border border-green-200 rounded-2xl p-6 space-y-4"
              >
                <div className="flex items-center justify-center space-x-2">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <span className="text-green-800 font-semibold">Wallet Connected</span>
                </div>
                
                <div className="bg-white rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Address:</span>
                    <span className="font-mono text-sm bg-gray-100 px-3 py-1 rounded-lg">
                      {formatAddress(address)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Network:</span>
                    <span className={`px-3 py-1 rounded-lg text-sm font-medium ${
                      isCorrectNetwork() 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {isCorrectNetwork() ? 'Sepolia' : 'Wrong Network'}
                    </span>
                  </div>
                </div>

                {showNetworkAlert && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-amber-50 border border-amber-200 rounded-xl p-4"
                  >
                    <div className="flex items-center space-x-2 mb-2">
                      <AlertCircle className="w-5 h-5 text-amber-600" />
                      <span className="text-amber-800 font-medium">Network Mismatch</span>
                    </div>
                    <p className="text-amber-700 text-sm mb-3">
                      Please switch to Sepolia testnet to use SynapPay
                    </p>
                    <button
                      onClick={handleNetworkSwitch}
                      className="bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors"
                    >
                      Switch to Sepolia
                    </button>
                  </motion.div>
                )}

                <div className="flex space-x-3">
                  <button
                    onClick={() => window.location.href = '/swap'}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105"
                  >
                    Start Swapping
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </button>
                  
                  <button
                    onClick={handleDisconnect}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                  >
                    Disconnect
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="space-y-6"
              >
                {/* Features */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 text-center">
                    <Shield className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <h3 className="font-semibold text-blue-900">HTLC Security</h3>
                    <p className="text-sm text-blue-700">Trustless atomic swaps</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 text-center">
                    <Zap className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                    <h3 className="font-semibold text-purple-900">1inch Fusion+</h3>
                    <p className="text-sm text-purple-700">Best rates & MEV protection</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 text-center">
                    <Wallet className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <h3 className="font-semibold text-green-900">Multi-Chain</h3>
                    <p className="text-sm text-green-700">ETH ↔ XLM seamless</p>
                  </div>
                </div>

                {/* Connect Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleConnect}
                  disabled={isLoading || isConnecting}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-2xl text-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isLoading || isConnecting ? (
                    <div className="flex items-center justify-center space-x-2">
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>Connecting...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2">
                      <Wallet className="w-5 h-5" />
                      <span>Connect Wallet</span>
                    </div>
                  )}
                </motion.button>

                {/* Error Display */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 border border-red-200 rounded-xl p-4"
                  >
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                      <span className="text-red-800 font-medium">Connection Error</span>
                    </div>
                    <p className="text-red-700 text-sm mt-1">{error}</p>
                  </motion.div>
                )}

                {/* Supported Wallets */}
                <div className="text-center space-y-2">
                  <p className="text-sm text-gray-500">Supported Wallets</p>
                  <div className="flex items-center justify-center space-x-4 text-xs text-gray-400">
                    <span>MetaMask</span>
                    <span>•</span>
                    <span>Trust Wallet</span>
                    <span>•</span>
                    <span>Coinbase</span>
                    <span>•</span>
                    <span>Rainbow</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
} 