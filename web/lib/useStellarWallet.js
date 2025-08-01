'use client';

import { useState, useEffect, useCallback } from 'react';

// StellarSnap bridge function based on official documentation
const callMetaStellar = async (method, params = {}) => {
  if (typeof window !== 'undefined' && window.ethereum) {
    try {
      if (method === 'connect') {
        return await window.ethereum.request({
          method: 'wallet_requestSnaps',
          params: {
            ['npm:stellar-snap']: {}
          },
        });
      }
      
      const rpcPacket = {
        method: 'wallet_invokeSnap',
        params: {
          snapId: 'npm:stellar-snap',
          request: { method, params }
        }
      };
      
      return await window.ethereum.request(rpcPacket);
    } catch (error) {
      console.error(`StellarSnap ${method} error:`, error);
      throw error;
    }
  } else {
    throw new Error('MetaMask not available');
  }
};

export const useStellarWallet = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [publicKey, setPublicKey] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualSecretKey, setManualSecretKey] = useState('');
  const [connectionMethod, setConnectionMethod] = useState(null);
  const [stellarSnapStatus, setStellarSnapStatus] = useState('checking');

  // Check if MetaMask and StellarSnap are available
  const isMetaMaskAvailable = useCallback(() => {
    return typeof window !== 'undefined' && !!window.ethereum;
  }, []);

  const isStellarSnapAvailable = useCallback(async () => {
    if (!isMetaMaskAvailable()) return false;
    
    try {
      const clientVersion = await window.ethereum.request({ method: "web3_clientVersion" });
      const isFlask = clientVersion.includes("flask");
      return isFlask;
    } catch (error) {
      console.error('Error checking MetaMask Flask:', error);
      return false;
    }
  }, [isMetaMaskAvailable]);

  // Connect with StellarSnap
  const connectWithStellarSnap = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const flaskAvailable = await isStellarSnapAvailable();
      if (!flaskAvailable) {
        throw new Error('MetaMask Flask is required for StellarSnap. Please install MetaMask Flask.');
      }

      await callMetaStellar('connect');
      const address = await callMetaStellar('getAddress');
      
      setPublicKey(address);
      setIsConnected(true);
      setConnectionMethod('stellar-snap');
      setStellarSnapStatus('connected');
      setError(null);
    } catch (err) {
      console.error('Failed to connect with StellarSnap:', err);
      setError(err.message || 'Failed to connect with StellarSnap');
      setStellarSnapStatus('error');
    } finally {
      setIsLoading(false);
    }
  }, [isStellarSnapAvailable]);

  // Manual connection with secret key
  const connectWithManualKey = useCallback(async () => {
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
    } catch (err) {
      console.error('Failed to connect with manual key:', err);
      setError('Invalid secret key. Please check and try again.');
    } finally {
      setIsLoading(false);
    }
  }, [manualSecretKey]);

  // Main connect function
  const connectWallet = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const flaskAvailable = await isStellarSnapAvailable();
      if (flaskAvailable) {
        await connectWithStellarSnap();
      } else {
        // Fallback to manual input
        setShowManualInput(true);
        setConnectionMethod('manual');
      }
    } catch (err) {
      console.error('Failed to connect Stellar wallet:', err);
      setError('Failed to connect Stellar wallet');
    } finally {
      setIsLoading(false);
    }
  }, [isStellarSnapAvailable, connectWithStellarSnap]);

  // Disconnect wallet
  const disconnectWallet = useCallback(async () => {
    try {
      setIsConnected(false);
      setPublicKey(null);
      setError(null);
      setShowManualInput(false);
      setManualSecretKey('');
      setConnectionMethod(null);
      setStellarSnapStatus('not_available');
    } catch (err) {
      console.error('Failed to disconnect Stellar wallet:', err);
      setError('Failed to disconnect wallet');
    }
  }, []);

  // Sign transaction
  const signTransaction = useCallback(async (transaction) => {
    if (!isConnected) {
      throw new Error('Wallet not connected');
    }

    if (connectionMethod === 'stellar-snap') {
      return await callMetaStellar('signTransaction', { transaction });
    } else {
      throw new Error('Transaction signing not available for manual connection');
    }
  }, [isConnected, connectionMethod]);

  // Sign message
  const signMessage = useCallback(async (message) => {
    if (!isConnected) {
      throw new Error('Wallet not connected');
    }

    if (connectionMethod === 'stellar-snap') {
      return await callMetaStellar('signStr', { message });
    } else {
      throw new Error('Message signing not available for manual connection');
    }
  }, [isConnected, connectionMethod]);

  // Get balance
  const getBalance = useCallback(async () => {
    if (!isConnected) {
      throw new Error('Wallet not connected');
    }

    if (connectionMethod === 'stellar-snap') {
      return await callMetaStellar('getBalance', { testnet: true });
    } else {
      throw new Error('Balance not available for manual connection');
    }
  }, [isConnected, connectionMethod]);

  // Get account info
  const getAccountInfo = useCallback(async () => {
    if (!isConnected) {
      throw new Error('Wallet not connected');
    }

    if (connectionMethod === 'stellar-snap') {
      return await callMetaStellar('getAccountInfo', { address: publicKey });
    } else {
      throw new Error('Account info not available for manual connection');
    }
  }, [isConnected, connectionMethod, publicKey]);

  const formatAddress = useCallback((address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }, []);

  const isOnCorrectNetwork = useCallback(() => {
    return isConnected;
  }, [isConnected]);

  const installStellarSnap = useCallback(() => {
    window.open('https://github.com/paulfears/StellarSnap', '_blank');
  }, []);

  // Check StellarSnap availability on mount
  useEffect(() => {
    const checkStellarSnap = async () => {
      try {
        const available = await isStellarSnapAvailable();
        setStellarSnapStatus(available ? 'available' : 'not_available');
      } catch (error) {
        console.error('Error checking StellarSnap:', error);
        setStellarSnapStatus('not_available');
      }
    };

    checkStellarSnap();
  }, [isStellarSnapAvailable]);

  return {
    isConnected,
    publicKey,
    isLoading,
    error,
    showManualInput,
    manualSecretKey,
    setManualSecretKey,
    stellarSnapStatus,
    connectionMethod,
    connect: connectWallet,
    connectWithManualKey,
    connectWithStellarSnap,
    disconnect: disconnectWallet,
    signTransaction,
    signMessage,
    getBalance,
    getAccountInfo,
    isMetaMaskAvailable,
    isStellarSnapAvailable,
    isOnCorrectNetwork,
    formatAddress,
    installStellarSnap,
  };
}; 