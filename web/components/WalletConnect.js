'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, ChevronDown, CheckCircle, AlertCircle, X, Zap, Shield } from 'lucide-react';
import { walletConnectionService } from '../lib/wallet-connection-service';

export default function WalletConnect() {
  const [walletStatus, setWalletStatus] = useState({
    ethereumConnected: false,
    stellarConnected: false,
    bothConnected: false,
    ethereumAccount: null,
    stellarAccount: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);

  // Update wallet status
  useEffect(() => {
    const updateStatus = () => {
      const status = walletConnectionService.getStatus();
      setWalletStatus(status);
    };

    updateStatus();
    const interval = setInterval(updateStatus, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleConnectEthereum = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await walletConnectionService.connectEthereum();
      if (result.success) {
        console.log('✅ MetaMask connected:', result);
        setShowDropdown(false);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectStellar = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await walletConnectionService.connectStellar();
      if (result.success) {
        console.log('✅ Freighter connected:', result);
        setShowDropdown(false);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      walletConnectionService.disconnect();
      setShowDropdown(false);
    } catch (error) {
      console.error('Failed to disconnect wallets:', error);
    }
  };

  const ethConnected = walletStatus.ethereumConnected;
  const stellarConnected = walletStatus.stellarConnected;
  const bothConnected = walletStatus.bothConnected;
  const ethAddress = walletStatus.ethereumAccount;
  const stellarAddress = walletStatus.stellarAccount;

  return (
    <div className="relative">
      {/* Main Wallet Button */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className={`
          flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all
          ${bothConnected 
            ? 'bg-green-500 text-white hover:bg-green-600' 
            : 'bg-black text-white hover:bg-gray-800'
          }
        `}
      >
        <Wallet className="w-4 h-4" />
        <span>
          {bothConnected ? 'Wallets Connected' : 'Connect Wallets'}
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full mt-2 right-0 w-80 bg-white rounded-xl shadow-lg border border-gray-200 p-4 z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Wallet Connection</h3>
              <button
                onClick={() => setShowDropdown(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <span className="text-sm text-red-700">{error}</span>
                </div>
              </div>
            )}

            {/* Ethereum Wallet */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Zap className="w-4 h-4 text-orange-600" />
                  </div>
                  <span className="font-medium text-gray-900">Ethereum</span>
                </div>
                {ethConnected && <CheckCircle className="w-4 h-4 text-green-600" />}
              </div>
              
              {ethConnected ? (
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="text-sm text-green-700">
                    {walletConnectionService.formatEthAddress(ethAddress)}
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleConnectEthereum}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Connecting...' : 'Connect MetaMask'}
                </button>
              )}
            </div>

            {/* Stellar Wallet */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Shield className="w-4 h-4 text-purple-600" />
                  </div>
                  <span className="font-medium text-gray-900">Stellar</span>
                </div>
                {stellarConnected && <CheckCircle className="w-4 h-4 text-green-600" />}
              </div>
              
              {stellarConnected ? (
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="text-sm text-green-700">
                    {walletConnectionService.formatStellarAddress(stellarAddress)}
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleConnectStellar}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Connecting...' : 'Connect Freighter'}
                </button>
              )}
            </div>

            {/* Status */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">
                {bothConnected ? (
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Ready for cross-chain swaps</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-yellow-600" />
                    <span>Connect both wallets to start swapping</span>
                  </div>
                )}
              </div>
            </div>

            {/* Disconnect Button */}
            {bothConnected && (
              <button
                onClick={handleDisconnect}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Disconnect All
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 