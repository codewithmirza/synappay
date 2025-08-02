import { useAccount, useConnect, useDisconnect } from 'wagmi';

/**
 * React hook for unified wallet management
 * Combines Wagmi and Stellar Wallet Kit functionality
 */
export function useWalletManager() {
  // Wagmi hooks for Ethereum
  const { address: ethAddress, isConnected: ethConnected, chainId: ethChainId } = useAccount();
  const { connect: connectEth, isPending: ethLoading } = useConnect();
  const { disconnect: disconnectEth } = useDisconnect();

  // Stellar Wallet Kit hooks - temporarily disabled
  const stellarConnected = false; // Mock: Stellar wallet not connected
  const stellarPublicKey = null; // Mock: No Stellar public key
  const stellarLoading = false; // Mock: Not loading
  const connectStellar = async () => {
    console.warn('Stellar wallet connection not implemented yet');
    return Promise.resolve();
  };
  const disconnectStellar = async () => {
    console.warn('Stellar wallet disconnection not implemented yet');
    return Promise.resolve();
  };

  // Computed states
  const bothConnected = ethConnected && stellarConnected;
  const canSwap = ethConnected && ethChainId === 11155111; // Sepolia testnet (Ethereum only for now)
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

    // Stellar state (mock for now)
    stellarConnected,
    stellarPublicKey,
    stellarLoading,
    stellarError: null, // Add error handling if needed

    // Combined state
    bothConnected,
    canSwap,
    isLoading,

    // Helper functions
    formatEthAddress,
    formatStellarAddress,
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