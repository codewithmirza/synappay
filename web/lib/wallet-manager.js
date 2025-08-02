import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { useStellarWallet } from './stellar-wallet-hook';

/**
 * React hook for unified wallet management
 * Combines Wagmi and Stellar Wallet Kit functionality
 */
export function useWalletManager() {
  // Wagmi hooks for Ethereum
  const { address: ethAddress, isConnected: ethConnected, chainId: ethChainId } = useAccount();
  const { connect: connectEth, isPending: ethLoading } = useConnect();
  const { disconnect: disconnectEth } = useDisconnect();

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

  // Computed states
  const bothConnected = ethConnected && stellarConnected;
  const canSwap = bothConnected && ethChainId === 11155111; // Sepolia testnet
  const isLoading = ethLoading || stellarLoading;

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
    console.warn('Network switching not implemented yet');
  };

  const connectEthereum = async () => {
    try {
      await connectEth();
    } catch (error) {
      console.error('Failed to connect Ethereum wallet:', error);
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

  return {
    // Ethereum state
    ethConnected,
    ethAddress,
    ethChainId,
    ethLoading,
    ethChain: null, // Removed useNetwork for now
    ethError: null, // Add error handling if needed

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
    switchLoading: false
  };
} 