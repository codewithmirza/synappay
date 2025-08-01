'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount, useConnect, useDisconnect, useSwitchChain } from 'wagmi';
import { walletConnect } from 'wagmi/connectors';
import { sepolia } from 'wagmi/chains';

export const useReownWallet = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const { address, isConnected, chainId } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();

  // Get WalletConnect connector
  const walletConnectConnector = connectors.find(
    connector => connector.id === 'walletConnect'
  );

  const connectWallet = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (!walletConnectConnector) {
        throw new Error('WalletConnect connector not available');
      }

      await connect({ connector: walletConnectConnector });
    } catch (err) {
      console.error('Failed to connect wallet:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [connect, walletConnectConnector]);

  const disconnectWallet = useCallback(async () => {
    try {
      setIsLoading(true);
      await disconnect();
    } catch (err) {
      console.error('Failed to disconnect wallet:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [disconnect]);

  const switchToSepolia = useCallback(async () => {
    try {
      if (!isConnected) {
        throw new Error('Wallet not connected');
      }

      if (chainId === sepolia.id) {
        return; // Already on Sepolia
      }

      await switchChain({ chainId: sepolia.id });
    } catch (err) {
      console.error('Failed to switch to Sepolia:', err);
      setError(err.message);
      throw err;
    }
  }, [isConnected, chainId, switchChain]);

  const isOnCorrectNetwork = useCallback(() => {
    return chainId === sepolia.id;
  }, [chainId]);

  const formatAddress = useCallback((address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }, []);

  return {
    // State
    isConnected,
    address,
    chainId,
    isLoading,
    error,
    
    // Actions
    connect: connectWallet,
    disconnect: disconnectWallet,
    switchToSepolia,
    
    // Utilities
    isOnCorrectNetwork,
    formatAddress,
  };
}; 