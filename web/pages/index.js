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
      console.error('Failed to switch network:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f2f2f7] via-white to-[#f8f9fa]">
      {/* Wallet Connection Button - Fixed Top Right */}
      <div className="fixed top-4 right-4 z-50">
        <WalletConnectionButton />
      </div>

      {/* Main Content */}
      <div className="flex items-center justify-center p-4">
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
              <div className="flex items-center justify-center space-x-3 mb-4">
                <Image 
                  src="/icon.png" 
                  alt="SynapPay Icon" 
                  width={40} 
                  height={40}
                  className="w-10 h-10"
                />
                <Image 
                  src="/synappay-logo.svg" 
                  alt="SynapPay" 
                  width={140} 
                  height={40}
                  className="h-10"
                />
              </div>
              
              <h2 className="text-4xl md:text-5xl font-bold leading-tight text-[#000000] font-inter">
                Trustless Cross-Chain
                <span className="block text-[#000000] opacity-30">
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