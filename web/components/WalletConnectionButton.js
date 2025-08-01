'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, ChevronDown, CheckCircle, AlertCircle, Coins, Star, Download, Key, X, Info } from 'lucide-react';
import { useCombinedWallet } from '../lib/useCombinedWallet';

export default function WalletConnectionButton() {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showStellarManual, setShowStellarManual] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  
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
    showManualInput,
    manualSecretKey,
    setManualSecretKey,
    connectStellar,
    connectWithManualKey,
    disconnectStellar,
    isFreighterAvailable,
    freighterStatus,
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

  const handleManualStellarConnect = async () => {
    try {
      await connectWithManualKey();
      setShowStellarManual(false);
    } catch (error) {
      console.error('Failed to connect with manual key:', error);
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

  // Debug information
  const getDebugInfo = () => {
    if (typeof window === 'undefined') return {};
    
    return {
      windowKeys: Object.keys(window).filter(key => 
        key.toLowerCase().includes('freighter') || 
        key.toLowerCase().includes('stellar') ||
        key.toLowerCase().includes('wallet')
      ),
      freighterApi: !!window.freighterApi,
      freighter: !!window.freighter,
      stellarWallet: !!window.stellarWallet,
      freighterWallet: !!window.freighterWallet,
      userAgent: navigator.userAgent,
      protocol: window.location.protocol,
      hostname: window.location.hostname
    };
  };

  const debugInfo = getDebugInfo();

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
            className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-lg border border-gray-200 p-6 z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Wallet Connection</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowDebug(!showDebug)}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Debug Info"
                >
                  <Info className="w-4 h-4 text-gray-500" />
                </button>
                <button
                  onClick={() => setShowDropdown(false)}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Debug Information */}
            {showDebug && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Debug Info</h4>
                <div className="space-y-1 text-xs">
                  <div><strong>Freighter Status:</strong> {freighterStatus}</div>
                  <div><strong>Freighter API:</strong> {debugInfo.freighterApi ? '✅' : '❌'}</div>
                  <div><strong>Window Keys:</strong> {debugInfo.windowKeys.join(', ') || 'None'}</div>
                  <div><strong>Protocol:</strong> {debugInfo.protocol}</div>
                  <div><strong>Hostname:</strong> {debugInfo.hostname}</div>
                </div>
              </div>
            )}

            {/* Ethereum Wallet Section */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Wallet className="w-5 h-5 text-blue-600" />
                  <h4 className="font-semibold text-gray-900">Ethereum Wallet</h4>
                </div>
                {ethConnected ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-gray-400" />
                )}
              </div>
              
              {ethConnected ? (
                <div className="space-y-3">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">Connected Address</p>
                    <p className="font-mono text-sm text-gray-900">{formatEthAddress(ethAddress)}</p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Network</span>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        isCorrectEthNetwork() ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {isCorrectEthNetwork() ? 'Sepolia' : 'Wrong Network'}
                      </span>
                      {!isCorrectEthNetwork() && (
                        <button
                          onClick={handleNetworkSwitch}
                          className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Switch
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <button
                    onClick={disconnectEth}
                    className="w-full text-sm text-red-600 hover:text-red-700 font-medium"
                  >
                    Disconnect Ethereum
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <button
                    onClick={handleConnectEth}
                    disabled={ethLoading}
                    className="w-full bg-black text-white px-4 py-3 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    {ethLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Connecting...</span>
                      </>
                    ) : (
                      <>
                        <Wallet className="w-4 h-4" />
                        <span>Connect Ethereum</span>
                      </>
                    )}
                  </button>
                  
                  <div className="text-xs text-gray-500 text-center">
                    Supports MetaMask, Trust Wallet, Rainbow, and more
                  </div>
                </div>
              )}
              
              {ethError && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-xs text-red-600">{ethError}</p>
                </div>
              )}
            </div>

            {/* Stellar Wallet Section */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Star className="w-5 h-5 text-purple-600" />
                  <h4 className="font-semibold text-gray-900">Stellar Wallet</h4>
                </div>
                {stellarConnected ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-gray-400" />
                )}
              </div>
              
              {stellarConnected ? (
                <div className="space-y-3">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">Connected Address</p>
                    <p className="font-mono text-sm text-gray-900">{formatStellarAddress(stellarPublicKey)}</p>
                  </div>
                  
                  <button
                    onClick={disconnectStellar}
                    className="w-full text-sm text-red-600 hover:text-red-700 font-medium"
                  >
                    Disconnect Stellar
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Freighter Status */}
                  <div className={`rounded-lg p-3 ${
                    freighterStatus === 'available' ? 'bg-green-50 border border-green-200' :
                    freighterStatus === 'not_available' ? 'bg-amber-50 border border-amber-200' :
                    'bg-gray-50 border border-gray-200'
                  }`}>
                    <div className="flex items-center space-x-2 mb-2">
                      <Info className="w-4 h-4 text-gray-600" />
                      <span className="text-sm font-medium text-gray-900">
                        Freighter Status: {freighterStatus === 'available' ? 'Available' : 
                                        freighterStatus === 'not_available' ? 'Not Available' : 
                                        'Checking...'}
                      </span>
                    </div>
                    {freighterStatus === 'not_available' && (
                      <p className="text-xs text-gray-600 mb-3">
                        Install Freighter extension for the best experience
                      </p>
                    )}
                    {freighterStatus === 'available' && (
                      <p className="text-xs text-green-700 mb-3">
                        Freighter extension detected and ready
                      </p>
                    )}
                    <a
                      href="https://www.freighter.app/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-amber-600 text-white px-3 py-1 rounded text-xs hover:bg-amber-700 transition-colors inline-flex items-center space-x-1"
                    >
                      <Download className="w-3 h-3" />
                      <span>Install Freighter</span>
                    </a>
                  </div>
                  
                  <div className="space-y-2">
                    <button
                      onClick={handleConnectStellar}
                      disabled={stellarLoading || freighterStatus === 'not_available'}
                      className="w-full bg-black text-white px-4 py-3 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                    >
                      {stellarLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Connecting...</span>
                        </>
                      ) : (
                        <>
                          <Star className="w-4 h-4" />
                          <span>Connect Stellar (Freighter)</span>
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={() => setShowStellarManual(true)}
                      className="w-full bg-gray-100 text-gray-700 px-4 py-3 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
                    >
                      <Key className="w-4 h-4" />
                      <span>Connect Manually</span>
                    </button>
                  </div>
                </div>
              )}
              
              {stellarError && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-xs text-red-600">{stellarError}</p>
                </div>
              )}
            </div>

            {/* Manual Stellar Input Modal */}
            <AnimatePresence>
              {showStellarManual && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                  onClick={() => setShowStellarManual(false)}
                >
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-white rounded-xl p-6 w-96 max-w-sm"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Manual Stellar Connection</h3>
                      <button
                        onClick={() => setShowStellarManual(false)}
                        className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Stellar Secret Key
                        </label>
                        <input
                          type="password"
                          value={manualSecretKey}
                          onChange={(e) => setManualSecretKey(e.target.value)}
                          placeholder="S... (56 characters)"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Enter your Stellar secret key (starts with "S")
                        </p>
                      </div>
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={handleManualStellarConnect}
                          disabled={!manualSecretKey || manualSecretKey.length < 56}
                          className="flex-1 bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
                        >
                          Connect
                        </button>
                        <button
                          onClick={() => setShowStellarManual(false)}
                          className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Status Section */}
            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-900">Connection Status</span>
                {bothConnected ? (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Ready to Swap</span>
                ) : (
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">Connect Both Wallets</span>
                )}
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Ethereum</span>
                  <span className={ethConnected ? 'text-green-600' : 'text-red-600'}>
                    {ethConnected ? 'Connected' : 'Not Connected'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Stellar</span>
                  <span className={stellarConnected ? 'text-green-600' : 'text-red-600'}>
                    {stellarConnected ? 'Connected' : 'Not Connected'}
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
                  onClick={() => window.location.href = '/swap'}
                  className="w-full mt-3 bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                >
                  Start Swapping
                </button>
              )}
            </div>

            {/* Error Display */}
            {error && (
              <div className="border-t border-gray-200 pt-4">
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