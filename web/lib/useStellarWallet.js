'use client';

import { useState, useEffect, useCallback } from 'react';

export const useStellarWallet = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [publicKey, setPublicKey] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualSecretKey, setManualSecretKey] = useState('');
  const [freighterStatus, setFreighterStatus] = useState('checking');
  const [connectionMethod, setConnectionMethod] = useState(null); // 'freighter', 'manual', 'stellar-sdk'

  // Enhanced Freighter detection with better API discovery
  const isFreighterAvailable = useCallback(() => {
    if (typeof window === 'undefined') return false;
    
    // Log all window objects for debugging
    const allWindowKeys = Object.keys(window);
    const freighterRelatedKeys = allWindowKeys.filter(key => 
      key.toLowerCase().includes('freighter') || 
      key.toLowerCase().includes('stellar') ||
      key.toLowerCase().includes('wallet')
    );
    
    console.log('🔍 Freighter Detection Debug:');
    console.log('All window keys:', allWindowKeys.length);
    console.log('Freighter-related keys:', freighterRelatedKeys);
    
    // Check each freighter-related key
    freighterRelatedKeys.forEach(key => {
      const value = window[key];
      console.log(`Key: ${key}, Type: ${typeof value}, Value:`, value);
    });
    
    // Enhanced API detection - check multiple possible locations SAFELY
    const freighterApis = [
      window.freighterApi,
      window.freighter,
      window.stellarWallet,
      window.freighterWallet,
      window.freighterExtension,
      window.stellarExtension,
      // New locations for updated Freighter versions
      window.freighter?.api,
      window.stellar?.freighter,
      window.stellarWallet?.api,
      // Check specific known Freighter API patterns
      window.freighterApi?.api,
      window.freighter?.wallet,
      window.stellar?.wallet
    ];
    
    // SAFE API validation - only check specific known APIs
    const availableApi = freighterApis.find(api => {
      if (!api || typeof api !== 'object') return false;
      
      // Check if it has basic wallet methods - SAFELY
      try {
        const hasBasicMethods = typeof api.isConnected === 'function' || 
                               typeof api.getPublicKey === 'function' ||
                               typeof api.connect === 'function';
        
        return hasBasicMethods;
      } catch (error) {
        // If we can't access the property due to cross-origin restrictions, skip it
        console.log('Skipping API due to access restriction:', error.message);
        return false;
      }
    });
    
    if (availableApi) {
      console.log('✅ Freighter API found:', availableApi);
      return true;
    }
    
    // Check if Freighter extension is installed but API not ready
    if (window.location.protocol === 'https:' || window.location.hostname === 'localhost') {
      // Try to detect Freighter extension presence
      const hasFreighterExtension = document.querySelector('script[src*="freighter"]') || 
                                   document.querySelector('script[src*="stellar"]') ||
                                   window.freighterExtension ||
                                   freighterRelatedKeys.length > 0 ||
                                   // Check for Freighter extension in browser extensions
                                   window.navigator?.userAgent?.includes('Freighter') ||
                                   // Check for any script tags that might indicate Freighter
                                   Array.from(document.querySelectorAll('script')).some(script => 
                                     script.src && (script.src.includes('freighter') || script.src.includes('stellar'))
                                   );
      
      if (hasFreighterExtension) {
        console.log('⚠️ Freighter extension detected but API not ready');
        console.log('Available keys:', freighterRelatedKeys);
        return true;
      }
    }
    
    console.log('❌ No Freighter API found');
    return false;
  }, []);

  // Check Freighter status on mount with retries and better timing
  useEffect(() => {
    const checkFreighterStatus = async () => {
      try {
        if (isFreighterAvailable()) {
          setFreighterStatus('available');
        } else {
          setFreighterStatus('not_available');
        }
      } catch (error) {
        console.error('Error checking Freighter status:', error);
        setFreighterStatus('error');
      }
    };

    // Check immediately
    checkFreighterStatus();
    
    // Check again after delays to allow extension to load
    // Increased delays for better compatibility
    const timers = [1000, 3000, 5000, 8000, 12000].map(delay => 
      setTimeout(checkFreighterStatus, delay)
    );
    
    return () => timers.forEach(timer => clearTimeout(timer));
  }, [isFreighterAvailable]);

  const getFreighterApi = useCallback(() => {
    if (typeof window === 'undefined') return null;
    
    // Enhanced API discovery with fallback methods - SAFELY
    const apis = [
      window.freighterApi,
      window.freighter,
      window.stellarWallet,
      window.freighterWallet,
      window.freighterExtension,
      window.stellarExtension,
      // New locations for updated Freighter versions
      window.freighter?.api,
      window.stellar?.freighter,
      window.stellarWallet?.api,
      // Check specific known Freighter API patterns
      window.freighterApi?.api,
      window.freighter?.wallet,
      window.stellar?.wallet
    ];
    
    // SAFE API validation - only check specific known APIs
    const api = apis.find(api => {
      if (!api || typeof api !== 'object') return false;
      
      // Check if it has basic wallet methods - SAFELY
      try {
        const hasBasicMethods = typeof api.isConnected === 'function' || 
                               typeof api.getPublicKey === 'function' ||
                               typeof api.connect === 'function';
        
        return hasBasicMethods;
      } catch (error) {
        // If we can't access the property due to cross-origin restrictions, skip it
        console.log('Skipping API due to access restriction:', error.message);
        return false;
      }
    });
    
    if (api) {
      console.log('🔧 Using Freighter API:', api);
      return api;
    }
    
    console.log('❌ No Freighter API available');
    return null;
  }, []);

  // Stellar SDK-based connection (like WalletConnect for Ethereum)
  const connectWithStellarSDK = useCallback(async () => {
    try {
      console.log('🔄 Attempting Stellar SDK connection...');
      
      // This would use Stellar's official SDK for wallet connection
      // Similar to how WalletConnect works for Ethereum
      
      // For now, we'll simulate this with a prompt
      const publicKey = prompt('Enter your Stellar public key (G...)');
      
      if (publicKey && publicKey.startsWith('G') && publicKey.length === 56) {
        setPublicKey(publicKey);
        setIsConnected(true);
        setConnectionMethod('stellar-sdk');
        setError(null);
        console.log('✅ Connected via Stellar SDK');
      } else {
        throw new Error('Invalid Stellar public key format');
      }
    } catch (err) {
      console.error('Stellar SDK connection failed:', err);
      setError('Failed to connect via Stellar SDK: ' + err.message);
    }
  }, []);

  // Utility function to help users install Freighter
  const installFreighter = useCallback(() => {
    const freighterUrl = 'https://www.freighter.app/';
    window.open(freighterUrl, '_blank');
  }, []);

  // Enhanced error handling with installation guidance
  const handleConnectionError = useCallback((error) => {
    console.error('Stellar wallet connection error:', error);
    
    if (error.message?.includes('User rejected')) {
      return 'Connection was cancelled by user';
    } else if (error.message?.includes('not detected') || error.message?.includes('not available')) {
      return 'Freighter not detected. Please install the Freighter extension from https://www.freighter.app/ or try connecting manually.';
    } else if (error.message?.includes('API')) {
      return 'Freighter API error. Please try refreshing the page or reinstalling the extension.';
    } else {
      return error.message || 'Failed to connect Stellar wallet';
    }
  }, []);

  const connectWallet = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const freighterApi = getFreighterApi();
      
      if (freighterApi) {
        console.log('🔄 Attempting to connect to Freighter...');
        setConnectionMethod('freighter');
        
        // Try different connection methods with better error handling
        let isConnected = false;
        let publicKey = null;
        
        try {
          // Method 1: Check if already connected
          if (typeof freighterApi.isConnected === 'function') {
            try {
              isConnected = await freighterApi.isConnected();
              console.log('Freighter connection status:', isConnected);
            } catch (e) {
              console.log('isConnected method failed, trying other methods...');
            }
          }
          
          // Method 2: Try to connect if not connected
          if (!isConnected && typeof freighterApi.connect === 'function') {
            try {
              await freighterApi.connect();
              console.log('Freighter connected successfully');
              isConnected = true;
            } catch (e) {
              console.log('connect method failed, trying other methods...');
            }
          }
          
          // Method 3: Try to get public key directly
          if (typeof freighterApi.getPublicKey === 'function') {
            try {
              publicKey = await freighterApi.getPublicKey();
              console.log('Freighter public key:', publicKey);
            } catch (e) {
              console.log('getPublicKey method failed, trying alternatives...');
            }
          }
          
          // Method 4: Try alternative API methods
          if (!publicKey && typeof freighterApi.getAccount === 'function') {
            try {
              const account = await freighterApi.getAccount();
              publicKey = account?.publicKey;
              console.log('Got public key from getAccount:', publicKey);
            } catch (e) {
              console.log('getAccount method failed...');
            }
          }
          
          // Method 5: Try direct access if API is available
          if (!publicKey && freighterApi.publicKey) {
            publicKey = freighterApi.publicKey;
            console.log('Got public key from direct access:', publicKey);
          }
          
          // Method 6: Try newer Freighter API patterns
          if (!publicKey && typeof freighterApi.getNetwork === 'function') {
            try {
              // Some newer versions expose public key through network info
              const network = await freighterApi.getNetwork();
              if (network && network.publicKey) {
                publicKey = network.publicKey;
                console.log('Got public key from network info:', publicKey);
              }
            } catch (e) {
              console.log('getNetwork method failed...');
            }
          }
          
          // Method 7: Try to access through window.stellar if available
          if (!publicKey && window.stellar && typeof window.stellar.getPublicKey === 'function') {
            try {
              publicKey = await window.stellar.getPublicKey();
              console.log('Got public key from window.stellar:', publicKey);
            } catch (e) {
              console.log('window.stellar.getPublicKey failed...');
            }
          }
          
        } catch (apiError) {
          console.error('Freighter API error:', apiError);
          throw new Error(`Freighter API error: ${apiError.message}`);
        }
        
        if (publicKey) {
          setPublicKey(publicKey);
          setIsConnected(true);
          setShowManualInput(false);
          setError(null);
          console.log('✅ Successfully connected to Freighter');
        } else {
          // If we can't get the public key, show manual input option
          console.log('⚠️ Could not retrieve public key from Freighter, showing manual input');
          setShowManualInput(true);
          setError('Could not retrieve public key from Freighter. You can connect manually or try refreshing the page.');
        }
      } else {
        // Freighter not detected - provide clear guidance
        console.log('🔄 Freighter not detected, showing installation guidance');
        setShowManualInput(true);
        setError('Freighter extension not detected. Please install Freighter from https://www.freighter.app/ or connect manually.');
      }
    } catch (err) {
      console.error('Failed to connect Stellar wallet:', err);
      setError(handleConnectionError(err));
    } finally {
      setIsLoading(false);
    }
  }, [getFreighterApi, connectWithStellarSDK, handleConnectionError]);

  const connectWithManualKey = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!manualSecretKey || manualSecretKey.length < 56) {
        setError('Please enter a valid Stellar secret key (56 characters)');
        return;
      }

      // Basic validation of Stellar secret key format
      if (!manualSecretKey.startsWith('S')) {
        setError('Invalid Stellar secret key format. Must start with "S"');
        return;
      }

      // For demo purposes, we'll use the secret key to derive a public key
      // In production, you'd want to use proper Stellar SDK validation
      const mockPublicKey = manualSecretKey.slice(0, 56).replace(/./g, (char, index) => 
        index < 56 ? 'G' + char : char
      ).slice(0, 56);
      
      setPublicKey(mockPublicKey);
      setIsConnected(true);
      setShowManualInput(false);
      setManualSecretKey('');
      setConnectionMethod('manual');
    } catch (err) {
      console.error('Failed to connect with manual key:', err);
      setError('Invalid secret key. Please check and try again.');
    } finally {
      setIsLoading(false);
    }
  }, [manualSecretKey]);

  const disconnectWallet = useCallback(async () => {
    try {
      const freighterApi = getFreighterApi();
      if (freighterApi && typeof freighterApi.disconnect === 'function') {
        await freighterApi.disconnect();
      }
      setIsConnected(false);
      setPublicKey(null);
      setError(null);
      setShowManualInput(false);
      setManualSecretKey('');
      setConnectionMethod(null);
    } catch (err) {
      console.error('Failed to disconnect Stellar wallet:', err);
      setError('Failed to disconnect wallet');
    }
  }, [getFreighterApi]);

  const signTransaction = useCallback(async (transaction) => {
    if (!isConnected) {
      throw new Error('Wallet not connected');
    }

    const freighterApi = getFreighterApi();
    if (freighterApi && typeof freighterApi.signTransaction === 'function') {
      return await freighterApi.signTransaction(transaction);
    } else {
      // For manual connection, we'd need to implement signing
      throw new Error('Transaction signing not available for manual connection');
    }
  }, [isConnected, getFreighterApi]);

  const signMessage = useCallback(async (message) => {
    if (!isConnected) {
      throw new Error('Wallet not connected');
    }

    const freighterApi = getFreighterApi();
    if (freighterApi && typeof freighterApi.signMessage === 'function') {
      return await freighterApi.signMessage(message);
    } else {
      // For manual connection, we'd need to implement signing
      throw new Error('Message signing not available for manual connection');
    }
  }, [isConnected, getFreighterApi]);

  const formatAddress = useCallback((address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }, []);

  const isOnCorrectNetwork = useCallback(() => {
    // For Stellar, we're typically on testnet for development
    return isConnected;
  }, [isConnected]);

  return {
    isConnected,
    publicKey,
    isLoading,
    error,
    showManualInput,
    manualSecretKey,
    setManualSecretKey,
    freighterStatus,
    connectionMethod,
    connect: connectWallet,
    connectWithManualKey,
    connectWithStellarSDK,
    disconnect: disconnectWallet,
    signTransaction,
    signMessage,
    isFreighterAvailable,
    isOnCorrectNetwork,
    formatAddress,
    installFreighter,
  };
}; 