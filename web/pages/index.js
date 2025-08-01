'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Wallet, Shield, Zap, CheckCircle, AlertCircle, RefreshCw, Coins } from 'lucide-react';
import { useCombinedWallet } from '../lib/useCombinedWallet';
import WalletConnectionButton from '../components/WalletConnectionButton';
import config from '../lib/config';
import Image from 'next/image';

export default function Home() {
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

  const [showNetworkAlert, setShowNetworkAlert] = useState(false);

  // Check network on connection
  useEffect(() => {
    if (ethConnected && !isCorrectEthNetwork()) {
      setShowNetworkAlert(true);
    } else {
      setShowNetworkAlert(false);
    }
  }, [ethConnected, isCorrectEthNetwork]);

  const handleNetworkSwitch = async () => {
    try {
      await switchToSepolia();
      setShowNetworkAlert(false);
    } catch (error) {
      console.error('Network switch failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f2f2f7] via-white to-[#f8f9fa]">
      {/* Top Navigation with Wallet Connection */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <Image 
                src="/icon.png" 
                alt="SynapPay Icon" 
                width={32} 
                height={32}
                className="w-8 h-8"
              />
              <Image 
                src="/synappay-logo.svg" 
                alt="SynapPay" 
                width={120} 
                height={32}
                className="h-8"
              />
            </div>

            {/* Wallet Connection Button */}
            <WalletConnectionButton />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-16 flex items-center justify-center p-4">
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
              {bothConnected ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-green-50 border border-green-200 rounded-2xl p-6 space-y-4"
                >
                  <div className="flex items-center justify-center space-x-2">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                    <span className="text-green-800 font-semibold">Both Wallets Connected</span>
                  </div>
                  
                  <div className="bg-white rounded-xl p-4 space-y-3">
                    {/* Ethereum Wallet */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Wallet className="w-4 h-4 text-blue-600" />
                        <span className="text-sm text-gray-600">Ethereum:</span>
                      </div>
                      <span className="font-mono text-sm bg-blue-100 px-3 py-1 rounded-lg">
                        {formatEthAddress(ethAddress)}
                      </span>
                    </div>
                    
                    {/* Stellar Wallet */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Coins className="w-4 h-4 text-purple-600" />
                        <span className="text-sm text-gray-600">Stellar:</span>
                      </div>
                      <span className="font-mono text-sm bg-purple-100 px-3 py-1 rounded-lg">
                        {formatStellarAddress(stellarPublicKey)}
                      </span>
                    </div>
                    
                    {/* Network Status */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Network:</span>
                      <span className={`px-3 py-1 rounded-lg text-sm font-medium ${
                        isCorrectEthNetwork() 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {isCorrectEthNetwork() ? 'Sepolia' : 'Wrong Network'}
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

                  {/* Connection Instructions */}
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-2xl p-6">
                    <div className="text-center space-y-4">
                      <div className="flex items-center justify-center space-x-2">
                        <Wallet className="w-6 h-6 text-blue-600" />
                        <h3 className="text-lg font-semibold text-blue-900">Connect Your Wallets</h3>
                      </div>
                      <p className="text-blue-700 text-sm">
                        Use the wallet connection button in the top-right corner to connect both Ethereum and Stellar wallets
                      </p>
                      
                      <div className="flex flex-col space-y-3">
                        <div className="flex items-center justify-center space-x-2 text-sm text-blue-700">
                          <CheckCircle className="w-4 h-4" />
                          <span>Connect Ethereum wallet (MetaMask, Trust Wallet, etc.)</span>
                        </div>
                        <div className="flex items-center justify-center space-x-2 text-sm text-blue-700">
                          <CheckCircle className="w-4 h-4" />
                          <span>Connect Stellar wallet (Freighter extension)</span>
                        </div>
                        <div className="flex items-center justify-center space-x-2 text-sm text-blue-700">
                          <CheckCircle className="w-4 h-4" />
                          <span>Switch to Sepolia testnet for Ethereum</span>
                        </div>
                      </div>
                    </div>
                  </div>

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
                      <span>Freighter</span>
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
    </div>
  );
} 