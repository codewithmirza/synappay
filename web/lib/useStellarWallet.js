'use client';

import { useState, useEffect, useCallback } from 'react';

export const useStellarWallet = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [publicKey, setPublicKey] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualSecretKey, setManualSecretKey] = useState('');
  const [connectionMethod, setConnectionMethod] = useState(null);
  const [freighterStatus, setFreighterStatus] = useState('checking');

  // Check if Freighter is available
  const isFreighterAvailable = useCallback(() => {
    const available = typeof window !== 'undefined' && window.freighterApi;
    console.log('Freighter available check:', available);
    return available;
  }, []);

  // Connect with Freighter
  const connectWithFreighter = useCallback(async () => {
    console.log('Attempting to connect with Freighter...');
    try {
      setIsLoading(true);
      setError(null);

      if (!isFreighterAvailable()) {
        console.log('Freighter not available, throwing error');
        throw new Error('Freighter extension not found');
      }

      console.log('Freighter API found, attempting connection...');
      const freighter = window.freighterApi;
      
      // Check if Freighter is connected
      const isConnected = await freighter.isConnected();
      console.log('Freighter isConnected check:', isConnected);
      
      if (!isConnected) {
        console.log('Connecting to Freighter...');
        await freighter.connect();
      }

      // Get public key
      console.log('Getting public key from Freighter...');
      const publicKey = await freighter.getPublicKey();
      console.log('Freighter public key:', publicKey);
      
      setPublicKey(publicKey);
      setIsConnected(true);
      setConnectionMethod('freighter');
      setError(null);
      console.log('Freighter connection successful');
    } catch (err) {
      console.error('Failed to connect with Freighter:', err);
      setError(`Freighter connection failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [isFreighterAvailable]);

  // Manual connection with secret key
  const connectWithManualKey = useCallback(async () => {
    console.log('Attempting manual connection with secret key...');
    try {
      setIsLoading(true);
      setError(null);

      if (!manualSecretKey || manualSecretKey.length < 56) {
        setError('Please enter a valid Stellar secret key (56 characters)');
        return;
      }

      if (!manualSecretKey.startsWith('S')) {
        setError('Invalid Stellar secret key format. Must start with "S"');
        return;
      }

      // For now, we'll use the secret key as the public key
      // In production, you'd want to use proper Stellar SDK validation
      setPublicKey(manualSecretKey);
      setIsConnected(true);
      setShowManualInput(false);
      setManualSecretKey('');
      setConnectionMethod('manual');
      setError(null);
      console.log('Manual connection successful');
    } catch (err) {
      console.error('Failed to connect with manual key:', err);
      setError('Invalid secret key. Please check and try again.');
    } finally {
      setIsLoading(false);
    }
  }, [manualSecretKey]);

  // Main connect function
  const connectWallet = useCallback(async () => {
    console.log('Stellar connectWallet called');
    try {
      setIsLoading(true);
      setError(null);

      // Try Freighter first
      if (isFreighterAvailable()) {
        console.log('Freighter available, attempting connection...');
        await connectWithFreighter();
        return;
      }
      
      console.log('Freighter not available, showing manual input...');
      // Fallback to manual input
      setShowManualInput(true);
      setConnectionMethod('manual');
    } catch (err) {
      console.error('Failed to connect Stellar wallet:', err);
      setError('Failed to connect Stellar wallet');
    } finally {
      setIsLoading(false);
    }
  }, [isFreighterAvailable, connectWithFreighter]);

  // Disconnect wallet
  const disconnectWallet = useCallback(async () => {
    console.log('Disconnecting Stellar wallet...');
    try {
      if (connectionMethod === 'freighter' && isFreighterAvailable()) {
        await window.freighterApi.disconnect();
      }
      
      setIsConnected(false);
      setPublicKey(null);
      setError(null);
      setShowManualInput(false);
      setManualSecretKey('');
      setConnectionMethod(null);
      console.log('Stellar wallet disconnected');
    } catch (err) {
      console.error('Failed to disconnect Stellar wallet:', err);
      setError('Failed to disconnect wallet');
    }
  }, [connectionMethod, isFreighterAvailable]);

  // Sign transaction
  const signTransaction = useCallback(async (transaction) => {
    if (!isConnected) {
      throw new Error('Wallet not connected');
    }

    if (connectionMethod === 'freighter' && isFreighterAvailable()) {
      return await window.freighterApi.signTransaction(transaction);
    } else {
      throw new Error('Transaction signing not available for manual connection');
    }
  }, [isConnected, connectionMethod, isFreighterAvailable]);

  // Sign message
  const signMessage = useCallback(async (message) => {
    if (!isConnected) {
      throw new Error('Wallet not connected');
    }

    if (connectionMethod === 'freighter' && isFreighterAvailable()) {
      return await window.freighterApi.signMessage(message);
    } else {
      throw new Error('Message signing not available for manual connection');
    }
  }, [isConnected, connectionMethod, isFreighterAvailable]);

  // Get balance
  const getBalance = useCallback(async () => {
    if (!isConnected) {
      throw new Error('Wallet not connected');
    }

    if (connectionMethod === 'freighter' && isFreighterAvailable()) {
      return await window.freighterApi.getBalance();
    } else {
      throw new Error('Balance not available for manual connection');
    }
  }, [isConnected, connectionMethod, isFreighterAvailable]);

  // Get account info
  const getAccountInfo = useCallback(async () => {
    if (!isConnected) {
      throw new Error('Wallet not connected');
    }

    if (connectionMethod === 'freighter' && isFreighterAvailable()) {
      return await window.freighterApi.getAccountInfo();
    } else {
      throw new Error('Account info not available for manual connection');
    }
  }, [isConnected, connectionMethod, isFreighterAvailable]);

  const formatAddress = useCallback((address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }, []);

  const isOnCorrectNetwork = useCallback(() => {
    return isConnected;
  }, [isConnected]);

  const installStellarSnap = useCallback(() => {
    window.open('https://freighter.app/', '_blank');
  }, []);

  // Check Freighter availability on mount
  useEffect(() => {
    const checkFreighterAvailability = () => {
      const available = isFreighterAvailable();
      console.log('Checking Freighter availability:', available);
      setFreighterStatus(available ? 'available' : 'not_available');
    };

    // Check immediately
    checkFreighterAvailability();

    // Check again after a short delay to handle async loading
    const timer = setTimeout(checkFreighterAvailability, 1000);
    
    return () => clearTimeout(timer);
  }, [isFreighterAvailable]);

  return {
    isConnected,
    publicKey,
    isLoading,
    error,
    showManualInput,
    manualSecretKey,
    setManualSecretKey,
    stellarSnapStatus: freighterStatus,
    connectionMethod,
    selectedWalletId: connectionMethod === 'freighter' ? 'freighter' : null,
    connect: connectWallet,
    connectWithManualKey,
    connectWithStellarKit: connectWithFreighter, // Alias for compatibility
    disconnect: disconnectWallet,
    signTransaction,
    signMessage,
    getBalance,
    getAccountInfo,
    isOnCorrectNetwork,
    formatAddress,
    installStellarSnap,
  };
}; 