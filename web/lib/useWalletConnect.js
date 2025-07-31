import { useState, useEffect, useCallback } from 'react';
import { walletConnectManager, openWalletModal, closeWalletModal } from './walletconnect';

export const useWalletConnect = () => {
  const [connectionState, setConnectionState] = useState({
    isConnected: false,
    address: null,
    chainId: null,
    provider: null
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initialize wallet connection on mount
  useEffect(() => {
    const initializeWallet = async () => {
      try {
        setIsLoading(true);
        await walletConnectManager.initialize();
        setConnectionState(walletConnectManager.getConnectionState());
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    initializeWallet();

    // Subscribe to wallet state changes
    const unsubscribe = walletConnectManager.addListener((state) => {
      setConnectionState(state);
      setError(null);
    });

    return unsubscribe;
  }, []);

  // Connect wallet
  const connect = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await walletConnectManager.connect();
      
      if (result.success) {
        setConnectionState(walletConnectManager.getConnectionState());
        return { success: true, address: result.address };
      } else {
        setError(result.error);
        return { success: false, error: result.error };
      }
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Disconnect wallet
  const disconnect = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await walletConnectManager.disconnect();
      
      if (result.success) {
        setConnectionState(walletConnectManager.getConnectionState());
        return { success: true };
      } else {
        setError(result.error);
        return { success: false, error: result.error };
      }
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Sign message
  const signMessage = useCallback(async (message) => {
    try {
      setError(null);
      const signature = await walletConnectManager.signMessage(message);
      return { success: true, signature };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, []);

  // Send transaction
  const sendTransaction = useCallback(async (transaction) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const hash = await walletConnectManager.sendTransaction(transaction);
      return { success: true, hash };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Open modal
  const openModal = useCallback(() => {
    openWalletModal();
  }, []);

  // Close modal
  const closeModal = useCallback(() => {
    closeWalletModal();
  }, []);

  // Format address for display
  const formatAddress = useCallback((address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }, []);

  // Check if wallet is on correct network (Sepolia)
  const isCorrectNetwork = useCallback(() => {
    return connectionState.chainId === '0xaa36a7' || connectionState.chainId === 11155111;
  }, [connectionState.chainId]);

  // Switch to Sepolia network
  const switchToSepolia = useCallback(async () => {
    try {
      if (!connectionState.provider) {
        throw new Error('Wallet not connected');
      }

      await connectionState.provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xaa36a7' }] // Sepolia chain ID
      });

      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, [connectionState.provider]);

  return {
    // State
    isConnected: connectionState.isConnected,
    address: connectionState.address,
    chainId: connectionState.chainId,
    provider: connectionState.provider,
    isLoading,
    error,
    
    // Actions
    connect,
    disconnect,
    signMessage,
    sendTransaction,
    openModal,
    closeModal,
    
    // Utilities
    formatAddress,
    isCorrectNetwork,
    switchToSepolia
  };
}; 