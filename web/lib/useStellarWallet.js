'use client';

import { useState, useEffect, useCallback } from 'react';

export const useStellarWallet = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [publicKey, setPublicKey] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Check if Freighter is available
  const isFreighterAvailable = useCallback(() => {
    return typeof window !== 'undefined' && window.freighterApi;
  }, []);

  // Connect to Freighter
  const connectWallet = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!isFreighterAvailable()) {
        throw new Error('Freighter wallet not detected. Please install Freighter extension.');
      }

      const connected = await window.freighterApi.isConnected();
      if (!connected) {
        throw new Error('Freighter not connected. Please connect your wallet.');
      }

      const key = await window.freighterApi.getPublicKey();
      setPublicKey(key);
      setIsConnected(true);
      
      return { success: true, publicKey: key };
    } catch (err) {
      console.error('Failed to connect Stellar wallet:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [isFreighterAvailable]);

  // Disconnect from Freighter
  const disconnectWallet = useCallback(async () => {
    try {
      setIsLoading(true);
      setPublicKey(null);
      setIsConnected(false);
      setError(null);
    } catch (err) {
      console.error('Failed to disconnect Stellar wallet:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Sign transaction
  const signTransaction = useCallback(async (transaction) => {
    try {
      if (!isConnected) {
        throw new Error('Stellar wallet not connected');
      }

      const signedTransaction = await window.freighterApi.signTransaction(
        transaction.toXDR(),
        { network: 'testnet' }
      );
      return signedTransaction;
    } catch (err) {
      console.error('Failed to sign Stellar transaction:', err);
      setError(err.message);
      throw err;
    }
  }, [isConnected]);

  // Sign message
  const signMessage = useCallback(async (message) => {
    try {
      if (!isConnected) {
        throw new Error('Stellar wallet not connected');
      }

      const signature = await window.freighterApi.signMessage(message);
      return signature;
    } catch (err) {
      console.error('Failed to sign Stellar message:', err);
      setError(err.message);
      throw err;
    }
  }, [isConnected]);

  // Format address
  const formatAddress = useCallback((address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }, []);

  // Check if on correct network (testnet)
  const isOnCorrectNetwork = useCallback(() => {
    return isConnected; // For now, assume testnet if connected
  }, [isConnected]);

  return {
    // State
    isConnected,
    publicKey,
    isLoading,
    error,
    
    // Actions
    connect: connectWallet,
    disconnect: disconnectWallet,
    signTransaction,
    signMessage,
    
    // Utilities
    isFreighterAvailable,
    isOnCorrectNetwork,
    formatAddress,
  };
}; 