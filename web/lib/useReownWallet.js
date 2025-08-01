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

  const walletConnectConnector = connectors.find(
    connector => connector.id === 'walletConnect'
  );

  const connectWallet = useCallback(async () => {
    if (!walletConnectConnector) {
      setError('WalletConnect connector not available');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      await connect({ connector: walletConnectConnector });
    } catch (err) {
      console.error('Wallet connection failed:', err);
      
      // Handle specific error types
      if (err.message?.includes('403') || err.message?.includes('Forbidden')) {
        setError('WalletConnect service temporarily unavailable. Please try again.');
      } else if (err.message?.includes('User rejected')) {
        setError('Connection was cancelled by user');
      } else {
        setError(err.message || 'Failed to connect wallet');
      }
    } finally {
      setIsLoading(false);
    }
  }, [connect, walletConnectConnector]);

  const disconnectWallet = useCallback(async () => {
    try {
      await disconnect();
      setError(null);
    } catch (err) {
      console.error('Wallet disconnection failed:', err);
      setError('Failed to disconnect wallet');
    }
  }, [disconnect]);

  const switchToSepolia = useCallback(async () => {
    if (!isConnected) {
      setError('Wallet not connected');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      await switchChain({ chainId: sepolia.id });
    } catch (err) {
      console.error('Network switch failed:', err);
      
      if (err.message?.includes('User rejected')) {
        setError('Network switch was cancelled by user');
      } else {
        setError('Failed to switch to Sepolia network');
      }
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, chainId, switchChain]);

  const isOnCorrectNetwork = useCallback(() => {
    return chainId === sepolia.id;
  }, [chainId]);

  const formatAddress = useCallback((address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }, []);

  // Clear error when wallet connects successfully
  useEffect(() => {
    if (isConnected && !isLoading) {
      setError(null);
    }
  }, [isConnected, isLoading]);

  return {
    isConnected,
    address,
    chainId,
    isLoading,
    error,
    connect: connectWallet,
    disconnect: disconnectWallet,
    switchToSepolia,
    isOnCorrectNetwork,
    formatAddress,
  };
}; 