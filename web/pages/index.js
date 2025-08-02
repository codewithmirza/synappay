'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Wallet, Shield, Zap, CheckCircle, AlertCircle, RefreshCw, Coins, Target, Lock, Zap as ZapIcon, Gift } from 'lucide-react';
import { useWalletManager } from '../lib/wallet-manager';
import UnifiedLayout from '../components/UnifiedLayout';
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
  } = useWalletManager();

  const [showNetworkAlert, setShowNetworkAlert] = useState(false);

  // Debug logging
  useEffect(() => {
    console.log('Landing Page State:', {
      ethConnected,
      stellarConnected,
      bothConnected,
      canSwap,
      ethAddress: ethAddress ? formatEthAddress(ethAddress) : 'None',
      stellarPublicKey: stellarPublicKey ? formatStellarAddress(stellarPublicKey) : 'None'
    });
  }, [ethConnected, stellarConnected, bothConnected, canSwap, ethAddress, stellarPublicKey, formatEthAddress, formatStellarAddress]);

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

  const userFlowSteps = [
    {
      icon: Target,
      title: "Create Intent",
      description: "Specify your swap amount and desired tokens"
    },
    {
      icon: Lock,
      title: "Lock Assets", 
      description: "Assets are locked in HTLC contracts on both chains"
    },
    {
      icon: ZapIcon,
      title: "Execute Swap",
      description: "Atomic execution ensures both sides complete or fail"
    },
    {
      icon: Gift,
      title: "Receive Tokens",
      description: "Get your swapped tokens on the destination chain"
    }
  ];

  return (
    <UnifiedLayout
      title={
        <div className="space-y-4">
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
          
          <div>
            <h2 className="text-4xl md:text-5xl font-bold leading-tight text-[#000000] font-inter">
              Cross-Chain
              <span className="block text-[#000000] opacity-30">
                Atomic Swaps
              </span>
            </h2>
            
            <p className="text-lg md:text-xl text-gray-600 leading-relaxed max-w-md mx-auto mt-4">
              Trustless ETH ↔️ XLM transfers powered by 1inch Fusion+ and HTLC security
            </p>
          </div>
        </div>
      }
      subtitle={null}
      showWalletButton={true}
    >
      <div className="space-y-8">
        {/* Debug info */}
        <div className="text-xs text-gray-500 bg-gray-100 p-2 rounded">
          ETH: {ethConnected ? 'Connected' : 'Not Connected'} | 
          Stellar: {stellarConnected ? 'Connected' : 'Not Connected'} | 
          Both: {bothConnected ? 'Yes' : 'No'}
        </div>
        
        {/* Start Swap Button - Centered when both wallets connected */}
        {bothConnected && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-center"
          >
            <button
              onClick={() => window.location.href = '/swap'}
              className="bg-black text-white px-8 py-4 rounded-xl font-semibold hover:bg-gray-800 transition-all transform hover:scale-105 flex items-center justify-center space-x-3 mx-auto"
            >
              <Coins className="w-5 h-5" />
              <span>Start Your First Swap</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>
        )}

        {/* User Flow Steps */}
        <AnimatePresence>
          {bothConnected ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="space-y-6"
            >
              {/* Success Message */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-green-50 border border-green-200 rounded-xl p-6 text-center"
              >
                <div className="flex items-center justify-center mb-3">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-green-800 font-semibold text-lg mb-2">
                  🎉 Wallets Connected Successfully!
                </h3>
                <p className="text-green-700 text-sm">
                  You're ready to start cross-chain swaps between Ethereum and Stellar
                </p>
              </motion.div>

              {/* User Flow Steps */}
              <div className="grid grid-cols-2 gap-4 mt-6">
                {userFlowSteps.map((step, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + index * 0.1, duration: 0.6 }}
                    className="bg-gray-50 rounded-xl p-4 text-center"
                  >
                    <div className="flex items-center justify-center mb-2">
                      <step.icon className="w-6 h-6 text-blue-600" />
                    </div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-1">
                      {step.title}
                    </h4>
                    <p className="text-xs text-gray-600 leading-tight">
                      {step.description}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-center space-y-6"
            >
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                <Wallet className="w-8 h-8 text-gray-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Connect Your Wallets
                </h3>
                <p className="text-gray-600">
                  Use the wallet connection button in the top-right corner to connect both Ethereum and Stellar wallets
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </UnifiedLayout>
  );
} 