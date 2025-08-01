'use client';

import { useState, useEffect, useCallback } from 'react';
import { useReownWallet } from './useReownWallet';
import { useStellarWallet } from './useStellarWallet';

export const useCombinedWallet = () => {
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

  const {
    isConnected: stellarConnected,
    publicKey: stellarPublicKey,
    isLoading: stellarLoading,
    error: stellarError,
    showManualInput,
    manualSecretKey,
    setManualSecretKey,
    connect: connectStellar,
    connectWithManualKey,
    disconnect: disconnectStellar,
    signTransaction: signStellarTransaction,
    signMessage: signStellarMessage,
    isFreighterAvailable,
    isOnCorrectNetwork: isCorrectStellarNetwork,
    formatAddress: formatStellarAddress,
  } = useStellarWallet();

  const [combinedState, setCombinedState] = useState({
    bothConnected: false,
    canSwap: false,
    isLoading: false,
    error: null
  });

  // Update combined state when individual wallet states change
  useEffect(() => {
    const bothConnected = ethConnected && stellarConnected;
    const canSwap = bothConnected && isCorrectEthNetwork() && isCorrectStellarNetwork();
    const isLoading = ethLoading || stellarLoading;
    const error = ethError || stellarError;

    setCombinedState({
      bothConnected,
      canSwap,
      isLoading,
      error
    });
  }, [
    ethConnected, stellarConnected, ethLoading, stellarLoading,
    ethError, stellarError, isCorrectEthNetwork, isCorrectStellarNetwork
  ]);

  const connectBothWallets = useCallback(async () => {
    try {
      // Try to connect both wallets
      await Promise.all([
        connectEth().catch(err => console.error('ETH connection failed:', err)),
        connectStellar().catch(err => console.error('Stellar connection failed:', err))
      ]);
    } catch (error) {
      console.error('Failed to connect both wallets:', error);
    }
  }, [connectEth, connectStellar]);

  const disconnectBothWallets = useCallback(async () => {
    try {
      await Promise.all([
        disconnectEth().catch(err => console.error('ETH disconnection failed:', err)),
        disconnectStellar().catch(err => console.error('Stellar disconnection failed:', err))
      ]);
    } catch (error) {
      console.error('Failed to disconnect both wallets:', error);
    }
  }, [disconnectEth, disconnectStellar]);

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
    showManualInput,
    manualSecretKey,
    setManualSecretKey,
    connectStellar,
    connectWithManualKey,
    disconnectStellar,
    signStellarTransaction,
    signStellarMessage,
    isFreighterAvailable,
    isCorrectStellarNetwork,
    formatStellarAddress,

    // Combined state
    ...combinedState,
    connectBothWallets,
    disconnectBothWallets,
  };
}; 