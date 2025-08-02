import { useAccount, useDisconnect, useSwitchChain } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import { useStellarWallet } from './stellar-wallet-hook';

/**
 * React hook for unified wallet management
 * Combines Wagmi and Stellar Wallet Kit functionality
 */
export function useWalletManager() {
  // Wagmi hooks for Ethereum
  const { address: ethAddress, isConnected: ethConnected, chainId: ethChainId } = useAccount();
  const { disconnect: disconnectEth } = useDisconnect();
  const { switchChain, isPending: switchLoading } = useSwitchChain();
  
  // Reown AppKit hook
  const { open: openAppKit } = useAppKit();

  // Stellar Wallet Kit hooks
  const { 
    connected: stellarConnected,
    publicKey: stellarPublicKey,
    loading: stellarLoading,
    error: stellarError,
    connect: connectStellar,
    disconnect: disconnectStellar,
    supportedWallets: stellarSupportedWallets,
    selectedWalletId: stellarSelectedWalletId
  } = useStellarWallet();

  // Computed states - ensure proper boolean values
  const bothConnected = Boolean(ethConnected && stellarConnected && ethAddress && stellarPublicKey);
  const canSwap = Boolean(bothConnected && ethChainId === 11155111); // Sepolia testnet
  const isLoading = Boolean(stellarLoading);

  // Helper functions
  const formatEthAddress = (address) => {
    if (!address) return 'Not Connected';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatStellarAddress = (address) => {
    if (!address) return 'Not Connected';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getStellarWalletName = () => {
    if (!stellarSelectedWalletId) return 'Not Connected';
    const wallet = stellarSupportedWallets.find(w => w.id === stellarSelectedWalletId);
    return wallet ? wallet.name : 'Unknown Wallet';
  };

  const isCorrectEthNetwork = () => {
    return ethChainId === 11155111; // Sepolia testnet
  };

  const switchToSepolia = async () => {
    try {
      console.log('Switching to Sepolia network...');
      await switchChain({ chainId: 11155111 }); // Sepolia chain ID
    } catch (error) {
      console.error('Failed to switch to Sepolia:', error);
      throw error;
    }
  };

  const connectEthereum = async () => {
    try {
      console.log('Opening Reown AppKit modal...');
      await openAppKit();
    } catch (error) {
      console.error('Failed to open Ethereum wallet modal:', error);
      throw error;
    }
  };

  const connectStellarWallet = async () => {
    try {
      await connectStellar();
    } catch (error) {
      console.error('Failed to connect Stellar wallet:', error);
      throw error;
    }
  };

  const disconnectAll = async () => {
    try {
      await Promise.all([
        disconnectEth(),
        disconnectStellar()
      ]);
    } catch (error) {
      console.error('Failed to disconnect wallets:', error);
      throw error;
    }
  };

  // Debug logging with more detail
  console.log('Wallet Manager State:', {
    ethConnected: Boolean(ethConnected),
    stellarConnected: Boolean(stellarConnected),
    bothConnected: Boolean(bothConnected),
    canSwap: Boolean(canSwap),
    ethAddress: ethAddress ? formatEthAddress(ethAddress) : 'None',
    stellarPublicKey: stellarPublicKey ? formatStellarAddress(stellarPublicKey) : 'None',
    ethChainId,
    stellarSelectedWalletId,
    isLoading: Boolean(isLoading)
  });

  return {
    // Ethereum state
    ethConnected,
    ethAddress,
    ethChainId,
    ethLoading: false,
    ethChain: null,
    ethError: null,

    // Stellar state
    stellarConnected,
    stellarPublicKey,
    stellarLoading,
    stellarError,
    stellarSupportedWallets,
    stellarSelectedWalletId,

    // Combined state
    bothConnected,
    canSwap,
    isLoading,

    // Helper functions
    formatEthAddress,
    formatStellarAddress,
    getStellarWalletName,
    isCorrectEthNetwork,

    // Connection functions
    connectEth: connectEthereum,
    connectStellar: connectStellarWallet,
    disconnectEth,
    disconnectStellar,
    disconnectAll,

    // Network switching
    switchToSepolia,
    switchLoading
  };
} 