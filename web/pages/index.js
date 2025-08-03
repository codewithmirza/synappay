'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, CheckCircle, Coins, Target, Lock, Zap, Gift, Wallet } from 'lucide-react';
import { useWalletManager } from '../lib/wallet-manager';
import UnifiedLayout from '../components/UnifiedLayout';
import TokenIcon from '../components/TokenIcon';

export default function Home() {
  const {
    ethConnected,
    stellarConnected,
    bothConnected,
    ethAddress,
    stellarPublicKey,
    formatEthAddress,
    formatStellarAddress
  } = useWalletManager();

  // Debug logging to understand connection state
  console.log('Home Page Debug:', {
    ethConnected: Boolean(ethConnected),
    stellarConnected: Boolean(stellarConnected),
    bothConnected: Boolean(bothConnected),
    ethAddress: ethAddress || 'null',
    stellarPublicKey: stellarPublicKey || 'null'
  });

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
      icon: Zap,
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
            <img
              src="/icon.png"
              alt="SynapPay Icon"
              className="w-10 h-10"
            />
            <img
              src="/synappay-logo.svg"
              alt="SynapPay"
              className="h-8"
            />
          </div>

          <div>
            <h2 className="text-3xl md:text-4xl font-bold leading-tight text-[#000000] font-inter">
              Cross-Chain
              <span className="block text-[#000000] opacity-30">
                Atomic Swaps
              </span>
            </h2>

            <p className="text-base md:text-lg text-gray-600 leading-relaxed max-w-sm mx-auto mt-3">
              Trustless ETH ↔️ XLM transfers powered by 1inch Fusion+ and HTLC security
            </p>
          </div>
        </div>
      }
      subtitle={null}
      showWalletButton={true}
    >
      <div className="space-y-6">
        {/* Start Swap Button - Centered when both wallets connected */}
        {bothConnected && ethAddress && stellarPublicKey && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-center"
          >
            <button
              onClick={() => window.location.href = '/swap'}
              className="bg-black text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-800 transition-all transform hover:scale-105 flex items-center justify-center space-x-2 mx-auto"
            >
              <Coins className="w-4 h-4" />
              <span>Start Your First Swap</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {/* User Flow Steps or Connection Status */}
        <AnimatePresence mode="wait">
          {bothConnected ? (
            <motion.div
              key="connected"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="space-y-4"
            >
              {/* Success Message */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-green-50 border border-green-200 rounded-lg p-4 text-center"
              >
                <div className="flex items-center justify-center mb-2">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-green-800 font-semibold text-base mb-1">
                  🎉 Wallets Connected Successfully!
                </h3>
                <p className="text-green-700 text-xs">
                  You're ready to start cross-chain swaps between Ethereum and Stellar
                </p>
              </motion.div>

              {/* User Flow Steps */}
              <div className="grid grid-cols-2 gap-3 mt-4">
                {userFlowSteps.map((step, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + index * 0.1, duration: 0.6 }}
                    className="bg-gray-50 rounded-lg p-3 text-center"
                  >
                    <div className="flex items-center justify-center mb-2">
                      <step.icon className="w-5 h-5 text-blue-600" />
                    </div>
                    <h4 className="text-xs font-semibold text-gray-900 mb-1">
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
              key="disconnected"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="space-y-4"
            >
              {/* Connection Status */}
              <div className="grid grid-cols-2 gap-3">
                <div className={`p-3 rounded-lg border-2 transition-all ${ethConnected ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                  <div className="text-center">
                    <TokenIcon symbol="ETH" size={24} className="mx-auto mb-2" />
                    <div className="text-sm font-medium text-gray-900">Ethereum</div>
                    {ethConnected ? (
                      <div>
                        <CheckCircle className="w-3 h-3 text-green-600 mx-auto mt-1" />
                        <div className="text-xs text-gray-600 mt-1">{formatEthAddress(ethAddress)}</div>
                      </div>
                    ) : (
                      <div className="w-2 h-2 bg-gray-300 rounded-full mx-auto mt-1" />
                    )}
                  </div>
                </div>

                <div className={`p-3 rounded-lg border-2 transition-all ${stellarConnected ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                  <div className="text-center">
                    <TokenIcon symbol="XLM" size={24} className="mx-auto mb-2" />
                    <div className="text-sm font-medium text-gray-900">Stellar</div>
                    {stellarConnected ? (
                      <div>
                        <CheckCircle className="w-3 h-3 text-green-600 mx-auto mt-1" />
                        <div className="text-xs text-gray-600 mt-1">{formatStellarAddress(stellarPublicKey)}</div>
                      </div>
                    ) : (
                      <div className="w-2 h-2 bg-gray-300 rounded-full mx-auto mt-1" />
                    )}
                  </div>
                </div>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Wallet className="w-6 h-6 text-gray-400" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">
                  Connect Your Wallets
                </h3>
                <p className="text-gray-600 text-xs">
                  Use the wallet connection button in the top-right corner to connect both wallets
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </UnifiedLayout>
  );
}