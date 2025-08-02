'use client';

import { useState } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { useWalletKit } from '@stellar/wallet-kit';
import WalletConnectionButton from '../components/WalletConnectionButton';
import Link from 'next/link';

export default function Home() {
  const { address: ethereumAddress, isConnected: isEthereumConnected } = useAccount();
  const { connect: connectEthereum } = useConnect();
  const { disconnect: disconnectWagmi } = useDisconnect();
  const { connect: connectStellar, connected: isStellarConnected, publicKey: stellarAddress } = useWalletKit();

  const canStartSwap = isEthereumConnected && isStellarConnected;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="mb-6">
            <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-4">
              SynapPay
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Extending 1inch Fusion+ to Stellar for seamless cross-chain atomic swaps
            </p>
          </div>
          
          <div className="flex justify-center space-x-4 mb-8">
            <div className="bg-blue-100 dark:bg-blue-900/20 px-4 py-2 rounded-full">
              <span className="text-blue-800 dark:text-blue-200 font-medium">1inch Fusion+</span>
            </div>
            <div className="bg-purple-100 dark:bg-purple-900/20 px-4 py-2 rounded-full">
              <span className="text-purple-800 dark:text-purple-200 font-medium">Stellar Soroban</span>
            </div>
            <div className="bg-green-100 dark:bg-green-900/20 px-4 py-2 rounded-full">
              <span className="text-green-800 dark:text-green-200 font-medium">HTLC Security</span>
            </div>
          </div>
        </div>

        {/* Wallet Connection */}
        <div className="max-w-md mx-auto mb-12">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                Connect Your Wallets
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Connect both Ethereum and Stellar wallets to start swapping
              </p>
            </div>
            
            <WalletConnectionButton />
            
            {/* Connection Status */}
            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3 ${isEthereumConnected ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Ethereum</span>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {isEthereumConnected ? 'Connected' : 'Not Connected'}
                </span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3 ${isStellarConnected ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Stellar</span>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {isStellarConnected ? 'Connected' : 'Not Connected'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Start Swap Button */}
        {canStartSwap && (
          <div className="text-center">
            <Link href="/swap">
              <button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200">
                Start Cross-Chain Swap
              </button>
            </Link>
          </div>
        )}

        {/* Features */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              1inch Fusion+ Integration
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Leverage 1inch's intent-based swaps with Dutch auction pricing for optimal execution
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Stellar Soroban Smart Contracts
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Native HTLC support with hashlock and timelock functionality on Stellar
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Atomic Cross-Chain Swaps
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Trustless swaps where both chains succeed or both fail, ensuring security
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-8">
            How It Works
          </h2>
          
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                  1
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Create Intent</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  User creates a swap intent with desired tokens and amounts
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                  2
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Lock Assets</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Assets are locked in HTLCs on both Ethereum and Stellar
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                  3
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Execute Swap</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Anyone can fulfill the swap by providing counterparty assets
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-indigo-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                  4
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Complete</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Secret revelation unlocks assets on both chains atomically
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 text-center text-gray-600 dark:text-gray-400">
          <p>Built with ❤️ for the ETHGlobal Unite DeFi Hackathon</p>
          <p className="mt-2 text-sm">
            Extending Fusion+ to Stellar • Cross-Chain Innovation • Trustless Swaps
          </p>
        </div>
      </div>
    </div>
  );
} 