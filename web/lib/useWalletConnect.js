import { useState, useEffect, useCallback } from 'react';
import { walletConnectManager, openWalletModal, closeWalletModal } from './walletconnect';

export const useWalletConnect = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initialize wallet connection
  useEffect(() => {
    const initializeWallet = async () => {
      try {
        setIsLoading(true);
        const success = await walletConnectManager.initialize();
        if (success) {
          const state = walletConnectManager.getConnectionState();
          setIsConnected(state.isConnected);
          setAddress(state.address);
          setChainId(state.chainId);
        }
      } catch (error) {
        console.error('Failed to initialize wallet:', error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    initializeWallet();

    // Add listener for state changes
    const handleStateChange = (state) => {
      setIsConnected(state.isConnected);
      setAddress(state.address);
      setChainId(state.chainId);
      setError(null);
    };

    walletConnectManager.addListener(handleStateChange);

    // Cleanup
    return () => {
      // Note: We don't remove listeners in the current implementation
      // as the manager doesn't have a removeListener method
    };
  }, []);

  const connect = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      await walletConnectManager.connect();
    } catch (error) {
      console.error('Failed to connect:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      setIsLoading(true);
      await walletConnectManager.disconnect();
    } catch (error) {
      console.error('Failed to disconnect:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signMessage = useCallback(async (message) => {
    try {
      return await walletConnectManager.signMessage(message);
    } catch (error) {
      console.error('Failed to sign message:', error);
      throw error;
    }
  }, []);

  const sendTransaction = useCallback(async (transaction) => {
    try {
      return await walletConnectManager.sendTransaction(transaction);
    } catch (error) {
      console.error('Failed to send transaction:', error);
      throw error;
    }
  }, []);

  const openModal = useCallback(() => {
    openWalletModal();
  }, []);

  const closeModal = useCallback(() => {
    closeWalletModal();
  }, []);

  const formatAddress = useCallback((address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }, []);

  const isCorrectNetwork = useCallback(() => {
    return chainId === 11155111; // Sepolia testnet
  }, [chainId]);

  const switchToSepolia = useCallback(async () => {
    try {
      if (!walletConnectManager.provider) {
        throw new Error('Wallet not connected');
      }

      await walletConnectManager.provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xaa36a7' }], // Sepolia chainId in hex
      });
    } catch (error) {
      console.error('Failed to switch network:', error);
      throw error;
    }
  }, []);

  return {
    // State
    isConnected,
    address,
    chainId,
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
    switchToSepolia,
  };
}; 