'use client';

import { useState, useEffect, useCallback } from 'react';
import { useReownWallet } from './useReownWallet';
import { useStellarWallet } from './useStellarWallet';

export const useCombinedWallet = () => {
  // Ethereum wallet (Reown/WalletConnect)
  const {
    isConnected: ethConnected,
    address: ethAddress,
    chainId: ethChainId,
    isLoading: ethLoading,
    error: ethError,
    connect: connectEth,
    disconnect: disconnectEth,
    switchToSepolia,
    isOnCorrectNetwork: isCorrectEthNetwork,
    formatAddress: formatEthAddress,
  } = useReownWallet();

  // Stellar wallet (Freighter)
  const {
    isConnected: stellarConnected,
    publicKey: stellarPublicKey,
    isLoading: stellarLoading,
    error: stellarError,
    connect: connectStellar,
    disconnect: disconnectStellar,
    isFreighterAvailable,
    isOnCorrectNetwork: isCorrectStellarNetwork,
    formatAddress: formatStellarAddress,
  } = useStellarWallet();

  // Combined state
  const [combinedState, setCombinedState] = useState({
    bothConnected: false,
    canSwap: false,
    isLoading: false,
    error: null,
  });

  // Update combined state when either wallet changes
  useEffect(() => {
    const bothConnected = ethConnected && stellarConnected;
    const canSwap = bothConnected && 
                   isCorrectEthNetwork() && 
                   isCorrectStellarNetwork();

    setCombinedState({
      bothConnected,
      canSwap,
      isLoading: ethLoading || stellarLoading,
      error: ethError || stellarError,
    });
  }, [
    ethConnected, 
    stellarConnected, 
    ethLoading, 
    stellarLoading, 
    ethError, 
    stellarError,
    isCorrectEthNetwork,
    isCorrectStellarNetwork,
  ]);

  // Connect both wallets
  const connectBothWallets = useCallback(async () => {
    try {
      setCombinedState(prev => ({ ...prev, isLoading: true, error: null }));

      // Connect Ethereum first
      if (!ethConnected) {
        await connectEth();
      }

      // Connect Stellar second
      if (!stellarConnected) {
        await connectStellar();
      }

      return { success: true };
    } catch (error) {
      console.error('Failed to connect both wallets:', error);
      setCombinedState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error.message 
      }));
      throw error;
    }
  }, [ethConnected, stellarConnected, connectEth, connectStellar]);

  // Disconnect both wallets
  const disconnectBothWallets = useCallback(async () => {
    try {
      setCombinedState(prev => ({ ...prev, isLoading: true }));

      if (ethConnected) {
        await disconnectEth();
      }

      if (stellarConnected) {
        await disconnectStellar();
      }
    } catch (error) {
      console.error('Failed to disconnect wallets:', error);
      setCombinedState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error.message 
      }));
    }
  }, [ethConnected, stellarConnected, disconnectEth, disconnectStellar]);

  return {
    // Ethereum wallet
    ethConnected,
    ethAddress,
    ethChainId,
    ethLoading,
    ethError,
    connectEth,
    disconnectEth,
    switchToSepolia,
    isCorrectEthNetwork,
    formatEthAddress,

    // Stellar wallet
    stellarConnected,
    stellarPublicKey,
    stellarLoading,
    stellarError,
    connectStellar,
    disconnectStellar,
    isFreighterAvailable,
    isCorrectStellarNetwork,
    formatStellarAddress,

    // Combined state
    bothConnected: combinedState.bothConnected,
    canSwap: combinedState.canSwap,
    isLoading: combinedState.isLoading,
    error: combinedState.error,

    // Combined actions
    connectBoth: connectBothWallets,
    disconnectBoth: disconnectBothWallets,
  };
}; 