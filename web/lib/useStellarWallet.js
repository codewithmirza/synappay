'use client';

import { useState, useEffect, useCallback } from 'react';

export const useStellarWallet = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [publicKey, setPublicKey] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualSecretKey, setManualSecretKey] = useState('');
  const [connectionMethod, setConnectionMethod] = useState(null);
  const [freighterStatus, setFreighterStatus] = useState('checking');

  // Initialize Stellar Wallets Kit
  const [kitRef, setKitRef] = useState(null);

  const initializeKit = useCallback(async () => {
    try {
      console.log('Initializing Stellar Wallets Kit...');
      
      // Dynamic import to handle module resolution issues
      const { 
        StellarWalletsKit, 
        WalletNetwork, 
        FreighterModule,
        xBullModule,
        FREIGHTER_ID,
        XBULL_ID,
        allowAllModules 
      } = await import('@creit.tech/stellar-wallets-kit');
      
      console.log('Environment variable NEXT_PUBLIC_STELLAR_NETWORK:', process.env.NEXT_PUBLIC_STELLAR_NETWORK);
      
      // Map environment variable to proper enum
      const netEnv = process.env.NEXT_PUBLIC_STELLAR_NETWORK?.toUpperCase();
      const network = netEnv === 'TESTNET' 
        ? WalletNetwork.TESTNET 
        : WalletNetwork.PUBLIC;
      
      console.log('Using network enum:', network);
      
      const kit = new StellarWalletsKit({
        network,
        selectedWalletId: localStorage.getItem('selectedWallet') || FREIGHTER_ID,
        modules: [new FreighterModule(), new xBullModule()]
      });
      
      setKitRef(kit);
      console.log('Stellar Wallets Kit initialized successfully');
    } catch (err) {
      console.error('Failed to initialize Stellar Wallets Kit:', err);
      setError('Failed to initialize wallet kit. Falling back to manual input.');
    }
  }, []);

  // Initialize kit on mount
  useEffect(() => {
    // Prevent multiple initializations in development mode
    let mounted = true;
    
    const initKit = async () => {
      if (mounted) {
        await initializeKit();
      }
    };
    
    initKit();
    
    return () => {
      mounted = false;
    };
  }, [initializeKit]);

  const isAnyStellarWalletAvailable = useCallback(() => {
    if (!kitRef) return false;
    
    try {
      // Check if any wallet is available - try different API methods
      console.log('Checking available wallets with kit:', kitRef);
      
      // Try to get available wallets - the method might be different
      if (typeof kitRef.getAvailableWallets === 'function') {
        const availableWallets = kitRef.getAvailableWallets();
        console.log('Available Stellar wallets:', availableWallets);
        return availableWallets && availableWallets.length > 0;
      } else if (typeof kitRef.getWallets === 'function') {
        const wallets = kitRef.getWallets();
        console.log('Available Stellar wallets:', wallets);
        return wallets && wallets.length > 0;
      } else {
        // If we can't check available wallets, assume they're available
        console.log('Cannot check available wallets, assuming available');
        return true;
      }
    } catch (err) {
      console.error('Error checking available wallets:', err);
      // If we can't check, assume wallets are available
      return true;
    }
  }, [kitRef]);

  const connectWithStellarKit = useCallback(async () => {
    if (!kitRef) {
      throw new Error('Stellar Wallets Kit not initialized');
    }

    try {
      console.log('Opening Stellar wallet selection modal...');
      await kitRef.openModal({
        onWalletSelected: async (option) => {
          console.log('Wallet selected:', option);
          try {
            await kitRef.setWallet(option.id);
            const { address } = await kitRef.getAddress();
            console.log('Connected to wallet:', address);
            
            setPublicKey(address);
            setIsConnected(true);
            setConnectionMethod(option.id);
            setError(null);
            
            // Store selected wallet preference
            localStorage.setItem('selectedWallet', option.id);
          } catch (err) {
            console.error('Failed to connect to selected wallet:', err);
            setError(`Failed to connect to ${option.name}: ${err.message}`);
          }
        }
      });
    } catch (err) {
      console.error('Failed to open wallet modal:', err);
      throw new Error('Failed to open wallet selection');
    }
  }, [kitRef]);

  const connectWallet = useCallback(async () => {
    console.log('Stellar connectWallet called');
    try {
      setIsLoading(true);
      setError(null);

      // Try Stellar Wallets Kit first if available
      if (kitRef) {
        console.log('Stellar Wallets Kit available, attempting connection...');
        try {
          await connectWithStellarKit();
          return;
        } catch (kitErr) {
          console.error('Stellar Wallets Kit connection failed:', kitErr);
          // Continue to manual fallback
        }
      }

      console.log('No Stellar wallets available or kit not initialized, showing manual input...');
      // Fallback to manual input
      setShowManualInput(true);
      setConnectionMethod('manual');
    } catch (err) {
      console.error('Failed to connect Stellar wallet:', err);
      setError(err.message || 'Failed to connect Stellar wallet');
      
      // If kit fails, show manual input as fallback
      setShowManualInput(true);
      setConnectionMethod('manual');
    } finally {
      setIsLoading(false);
    }
  }, [kitRef, connectWithStellarKit]);

  // Manual connection with secret key
  const connectWithManualKey = useCallback(async (secretKey) => {
    console.log('Attempting manual connection with secret key...');
    try {
      setIsLoading(true);
      setError(null);
      
      // Validate secret key format
      if (!secretKey.startsWith('S') || secretKey.length !== 56) {
        throw new Error('Invalid secret key format. Must start with "S" and be 56 characters long.');
      }

      // For manual connection, we'll just store the secret key
      // In a real implementation, you'd validate it against the network
      setPublicKey(secretKey); // In production, derive public key from secret
      setIsConnected(true);
      setConnectionMethod('manual');
      setError(null);
      console.log('Manual connection successful');
    } catch (err) {
      console.error('Failed to connect with manual key:', err);
      setError(`Manual connection failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const disconnectWallet = useCallback(async () => {
    console.log('Disconnecting Stellar wallet...');
    try {
      if (kitRef && connectionMethod !== 'manual') {
        await kitRef.disconnect();
      }
      
      setPublicKey(null);
      setIsConnected(false);
      setShowManualInput(false);
      setManualSecretKey('');
      setConnectionMethod(null);
      setError(null);
      console.log('Stellar wallet disconnected');
    } catch (err) {
      console.error('Failed to disconnect Stellar wallet:', err);
      setError('Failed to disconnect wallet');
    }
  }, [kitRef, connectionMethod]);

  const signTransaction = useCallback(async (transaction) => {
    if (!kitRef || !isConnected) {
      throw new Error('Wallet not connected');
    }

    try {
      if (connectionMethod === 'manual') {
        throw new Error('Manual connection does not support transaction signing');
      }
      
      return await kitRef.signTransaction(transaction);
    } catch (err) {
      console.error('Failed to sign transaction:', err);
      throw err;
    }
  }, [kitRef, isConnected, connectionMethod]);

  const signMessage = useCallback(async (message) => {
    if (!kitRef || !isConnected) {
      throw new Error('Wallet not connected');
    }

    try {
      if (connectionMethod === 'manual') {
        throw new Error('Manual connection does not support message signing');
      }
      
      return await kitRef.signMessage(message);
    } catch (err) {
      console.error('Failed to sign message:', err);
      throw err;
    }
  }, [kitRef, isConnected, connectionMethod]);

  const getBalance = useCallback(async () => {
    if (!kitRef || !isConnected) {
      throw new Error('Wallet not connected');
    }

    try {
      if (connectionMethod === 'manual') {
        throw new Error('Manual connection does not support balance checking');
      }
      
      return await kitRef.getBalance();
    } catch (err) {
      console.error('Failed to get balance:', err);
      throw err;
    }
  }, [kitRef, isConnected, connectionMethod]);

  const getAccountInfo = useCallback(async () => {
    if (!kitRef || !isConnected) {
      throw new Error('Wallet not connected');
    }

    try {
      if (connectionMethod === 'manual') {
        throw new Error('Manual connection does not support account info');
      }
      
      return await kitRef.getAccountInfo();
    } catch (err) {
      console.error('Failed to get account info:', err);
      throw err;
    }
  }, [kitRef, isConnected, connectionMethod]);

  const isOnCorrectNetwork = useCallback(() => {
    // For Stellar, we're always on the correct network (testnet/mainnet)
    return true;
  }, []);

  const formatAddress = useCallback((address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }, []);

  const installStellarSnap = () => {
    window.open('https://stellarwalletskit.dev/', '_blank');
  };

  // Check wallet availability on mount
  useEffect(() => {
    const checkWalletAvailability = () => {
      try {
        const available = isAnyStellarWalletAvailable();
        console.log('Checking Stellar wallet availability:', available);
        setFreighterStatus(available ? 'available' : 'not_available');
      } catch (err) {
        console.error('Error in wallet availability check:', err);
        setFreighterStatus('not_available');
      }
    };

    if (kitRef) {
      // Check immediately
      checkWalletAvailability();

      // Check again after a short delay to handle async loading
      const timer = setTimeout(checkWalletAvailability, 1000);
      return () => clearTimeout(timer);
    }
  }, [kitRef, isAnyStellarWalletAvailable]);

  return {
    isConnected,
    publicKey,
    isLoading,
    error,
    showManualInput,
    manualSecretKey,
    setManualSecretKey,
    connect: connectWallet,
    connectWithManualKey,
    disconnect: disconnectWallet,
    signTransaction,
    signMessage,
    getBalance,
    getAccountInfo,
    isFreighterAvailable: isAnyStellarWalletAvailable,
    isOnCorrectNetwork,
    formatAddress,
    installStellarSnap,
  };
}; 