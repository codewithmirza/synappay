'use client';

import { useState, useEffect, useCallback } from 'react';

export const useStellarWallet = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [publicKey, setPublicKey] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualSecretKey, setManualSecretKey] = useState('');

  const isFreighterAvailable = useCallback(() => {
    return typeof window !== 'undefined' && window.freighterApi;
  }, []);

  const connectWallet = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (isFreighterAvailable()) {
        // Try Freighter first
        const isConnected = await window.freighterApi.isConnected();
        if (!isConnected) {
          await window.freighterApi.connect();
        }
        
        const publicKey = await window.freighterApi.getPublicKey();
        setPublicKey(publicKey);
        setIsConnected(true);
        setShowManualInput(false);
      } else {
        // Freighter not available, show manual input option
        setShowManualInput(true);
        setError('Freighter extension not detected. You can connect manually or install Freighter.');
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
  }, [isFreighterAvailable]);

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
      if (isFreighterAvailable()) {
        await window.freighterApi.disconnect();
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
  }, [isFreighterAvailable]);

  const signTransaction = useCallback(async (transaction) => {
    if (!isConnected) {
      throw new Error('Wallet not connected');
    }

    if (isFreighterAvailable()) {
      return await window.freighterApi.signTransaction(transaction);
    } else {
      // For manual connection, we'd need to implement signing
      throw new Error('Transaction signing not available for manual connection');
    }
  }, [isConnected, isFreighterAvailable]);

  const signMessage = useCallback(async (message) => {
    if (!isConnected) {
      throw new Error('Wallet not connected');
    }

    if (isFreighterAvailable()) {
      return await window.freighterApi.signMessage(message);
    } else {
      // For manual connection, we'd need to implement signing
      throw new Error('Message signing not available for manual connection');
    }
  }, [isConnected, isFreighterAvailable]);

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