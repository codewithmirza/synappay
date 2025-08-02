'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Shield, Clock, CheckCircle, AlertCircle, Zap, Coins } from 'lucide-react';
import { useWalletManager } from '../lib/wallet-manager';
import UnifiedLayout from '../components/UnifiedLayout';

export default function Review() {
  const {
    ethConnected,
    stellarConnected,
    bothConnected,
    ethAddress,
    stellarPublicKey,
    formatEthAddress,
    formatStellarAddress
  } = useWalletManager();

  const [swapDetails, setSwapDetails] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState(null);

  // Get swap details from URL params or session storage
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const fromToken = urlParams.get('fromToken') || 'ETH';
    const toToken = urlParams.get('toToken') || 'XLM';
    const amount = urlParams.get('amount') || '0.1';
    const quote = urlParams.get('quote') || '1000';
    const rate = urlParams.get('rate') || '10000';

    setSwapDetails({
      fromToken,
      toToken,
      amount: parseFloat(amount),
      quote: parseFloat(quote),
      rate: parseFloat(rate),
      fromAddress: ethAddress,
      toAddress: stellarPublicKey,
      hashlock: '0x' + Math.random().toString(16).substr(2, 64),
      timelock: Math.floor(Date.now() / 1000) + 3600, // 1 hour
      fees: {
        ethereum: 0.001,
        stellar: 0.00001
      }
    });
  }, [ethAddress, stellarPublicKey]);

  const handleConfirmSwap = async () => {
    if (!swapDetails || !bothConnected) return;

    try {
      setConfirming(true);
      setError(null);

      // Simulate swap execution
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Redirect to progress page
      window.location.href = `/progress?swapId=${Date.now()}`;
    } catch (error) {
      console.error('Swap confirmation failed:', error);
      setError('Failed to confirm swap. Please try again.');
      setConfirming(false);
    }
  };

  const handleCancel = () => {
    window.location.href = '/swap';
  };

  if (!bothConnected) {
    return (
      <UnifiedLayout
        title="Connect Wallets First"
        subtitle="Please connect both Ethereum and Stellar wallets to review your swap"
        showWalletButton={true}
      >
        <div className="text-center space-y-6">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
            <Coins className="w-8 h-8 text-gray-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Wallets Not Connected
            </h3>
            <p className="text-gray-600">
              Use the wallet connection button in the top-right corner to connect both wallets
            </p>
          </div>
        </div>
      </UnifiedLayout>
    );
  }

  if (!swapDetails) {
    return (
      <UnifiedLayout
        title="Loading Swap Details"
        subtitle="Please wait while we load your swap information"
        showWalletButton={true}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </UnifiedLayout>
    );
  }

  return (
    <UnifiedLayout
      title="Review Your Swap"
      subtitle="Confirm your cross-chain atomic swap details"
      showWalletButton={true}
    >
      <div className="space-y-6">
        {/* Swap Summary */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-4">Swap Summary</h3>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{swapDetails.amount}</div>
              <div className="text-sm text-blue-700">{swapDetails.fromToken}</div>
              <div className="text-xs text-blue-600 mt-1">{formatEthAddress(swapDetails.fromAddress)}</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{swapDetails.quote}</div>
              <div className="text-sm text-blue-700">{swapDetails.toToken}</div>
              <div className="text-xs text-blue-600 mt-1">{formatStellarAddress(swapDetails.toAddress)}</div>
            </div>
          </div>

          <div className="text-center">
            <div className="text-sm text-blue-600">
              Rate: 1 {swapDetails.fromToken} = {swapDetails.rate} {swapDetails.toToken}
            </div>
          </div>
        </div>

        {/* HTLC Security Information */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Shield className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-semibold text-green-800">HTLC Security</h3>
          </div>
          
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-green-700">Hashlock:</span>
              <span className="font-mono text-green-600">{swapDetails.hashlock.substring(0, 16)}...</span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-700">Timelock:</span>
              <span className="text-green-600">1 hour</span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-700">Atomic Execution:</span>
              <span className="text-green-600">Both succeed or both fail</span>
            </div>
          </div>
        </div>

        {/* Fee Information */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Fees & Network Costs</h3>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Ethereum Gas Fee:</span>
              <span className="text-gray-800">{swapDetails.fees.ethereum} ETH</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Stellar Network Fee:</span>
              <span className="text-gray-800">{swapDetails.fees.stellar} XLM</span>
            </div>
            <div className="border-t pt-2">
              <div className="flex justify-between font-semibold">
                <span className="text-gray-800">Total Estimated Cost:</span>
                <span className="text-gray-800">~${(swapDetails.fees.ethereum * 2000 + swapDetails.fees.stellar * 0.1).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-4">
          <button
            onClick={handleCancel}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          
          <button
            onClick={handleConfirmSwap}
            disabled={confirming}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
          >
            {confirming ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Confirming...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                <span>Confirm Swap</span>
              </>
            )}
          </button>
        </div>

        {/* Security Notice */}
        <div className="text-center text-xs text-gray-500">
          <p>By confirming this swap, you agree to the terms of our atomic swap protocol.</p>
          <p>Your funds are protected by cryptographic hashlocks and timelocks.</p>
        </div>
      </div>
    </UnifiedLayout>
  );
} 