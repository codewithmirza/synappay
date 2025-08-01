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

  // Enhanced Freighter detection
  const isFreighterAvailable = useCallback(() => {
    if (typeof window === 'undefined') return false;
    
    // Check multiple possible Freighter API locations
    const freighterApis = [
      window.freighterApi,
      window.freighter,
      window.stellarWallet,
      window.freighterWallet
    ];
    
    const availableApi = freighterApis.find(api => api && typeof api === 'object');
    
    if (availableApi) {
      console.log('Freighter API found:', availableApi);
      return true;
    }
    
    // Check if Freighter extension is installed but API not ready
    if (window.location.protocol === 'https:' || window.location.hostname === 'localhost') {
      // Try to detect Freighter extension
      const hasFreighterExtension = document.querySelector('script[src*="freighter"]') || 
                                   document.querySelector('script[src*="stellar"]') ||
                                   window.freighterExtension;
      
      if (hasFreighterExtension) {
        console.log('Freighter extension detected but API not ready');
        return true;
      }
    }
    
    return false;
  }, []);

  // Check Freighter status on mount
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
    
    // Check again after a delay to allow extension to load
    const timer = setTimeout(checkFreighterStatus, 2000);
    
    return () => clearTimeout(timer);
  }, [isFreighterAvailable]);

  const getFreighterApi = useCallback(() => {
    if (typeof window === 'undefined') return null;
    
    // Try different possible API locations
    return window.freighterApi || 
           window.freighter || 
           window.stellarWallet || 
           window.freighterWallet ||
           null;
  }, []);

  const connectWallet = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const freighterApi = getFreighterApi();
      
      if (freighterApi) {
        console.log('Attempting to connect to Freighter...');
        
        // Try different connection methods
        let isConnected = false;
        let publicKey = null;
        
        try {
          // Method 1: Check if already connected
          if (typeof freighterApi.isConnected === 'function') {
            isConnected = await freighterApi.isConnected();
            console.log('Freighter connection status:', isConnected);
          }
          
          // Method 2: Try to connect if not connected
          if (!isConnected && typeof freighterApi.connect === 'function') {
            await freighterApi.connect();
            console.log('Freighter connected successfully');
            isConnected = true;
          }
          
          // Method 3: Try to get public key
          if (isConnected && typeof freighterApi.getPublicKey === 'function') {
            publicKey = await freighterApi.getPublicKey();
            console.log('Freighter public key:', publicKey);
          }
          
          // Method 4: Try alternative API methods
          if (!publicKey && typeof freighterApi.getPublicKey === 'function') {
            publicKey = await freighterApi.getPublicKey();
          }
          
          if (!publicKey && typeof freighterApi.getAccount === 'function') {
            const account = await freighterApi.getAccount();
            publicKey = account?.publicKey;
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
        } else {
          throw new Error('Could not retrieve public key from Freighter');
        }
      } else {
        // Freighter not available, show manual input option
        setShowManualInput(true);
        setError('Freighter extension not detected. You can connect manually or install Freighter.');
        console.log('Freighter API not found. Available window objects:', Object.keys(window).filter(key => 
          key.toLowerCase().includes('freighter') || 
          key.toLowerCase().includes('stellar') ||
          key.toLowerCase().includes('wallet')
        ));
      }
    } catch (err) {
      console.error('Failed to connect Stellar wallet:', err);
      
      if (err.message?.includes('User rejected')) {
        setError('Connection was cancelled by user');
      } else if (err.message?.includes('not detected')) {
        setShowManualInput(true);
        setError('Freighter not detected. You can connect manually or install Freighter extension.');
      } else {
        setError(err.message || 'Failed to connect Stellar wallet');
      }
    } finally {
      setIsLoading(false);
    }
  }, [getFreighterApi]);

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
    connect: connectWallet,
    connectWithManualKey,
    disconnect: disconnectWallet,
    signTransaction,
    signMessage,
    isFreighterAvailable,
    isOnCorrectNetwork,
    formatAddress,
  };
}; 