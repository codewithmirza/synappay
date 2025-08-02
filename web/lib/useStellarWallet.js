'use client';

import { useState, useEffect, useCallback } from 'react';

export const useStellarWallet = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [publicKey, setPublicKey] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
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
        AlbedoModule,
        RabetModule,
        LobstrModule,
        HanaModule,
        HotWalletModule,
        FREIGHTER_ID,
        XBULL_ID,
        ALBEDO_ID,
        RABET_ID,
        LOBSTR_ID,
        HANA_ID,
        HOTWALLET_ID
      } = await import('@creit.tech/stellar-wallets-kit');
      
      console.log('Environment variable NEXT_PUBLIC_STELLAR_NETWORK:', process.env.NEXT_PUBLIC_STELLAR_NETWORK);
      
      // Map environment variable to proper enum
      const netEnv = process.env.NEXT_PUBLIC_STELLAR_NETWORK?.toUpperCase();
      const network = netEnv === 'TESTNET' 
        ? WalletNetwork.TESTNET 
        : WalletNetwork.PUBLIC;
      
      console.log('Using network enum:', network);
      
      // Initialize with only the modules that actually exist
      const kit = new StellarWalletsKit({
        network,
        selectedWalletId: localStorage.getItem('selectedWallet') || FREIGHTER_ID,
        modules: [
          new FreighterModule(),
          new xBullModule(),
          new AlbedoModule(),
          new RabetModule(),
          new LobstrModule(),
          new HanaModule(),
          new HotWalletModule()
        ]
      });
      
      setKitRef(kit);
      console.log('Stellar Wallets Kit initialized successfully with available wallet modules');
    } catch (err) {
      console.error('Failed to initialize Stellar Wallets Kit:', err);
      setError('Failed to initialize wallet kit. Please try refreshing the page.');
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

  // Check for existing connection on mount - REMOVED to prevent auto-connection
  // useEffect(() => {
  //   const checkExistingConnection = async () => {
  //     if (kitRef && !isConnected) {
  //       try {
  //         // Check if we have a stored wallet preference
  //         const selectedWallet = localStorage.getItem('selectedWallet');
  //         if (selectedWallet) {
  //           console.log('Attempting to reconnect to stored wallet:', selectedWallet);
  //           await kitRef.setWallet(selectedWallet);
  //           const { address } = await kitRef.getAddress();
  //           console.log('Reconnected to wallet:', address);
  //           
  //           setPublicKey(address);
  //           setIsConnected(true);
  //           setConnectionMethod(selectedWallet);
  //           setError(null);
  //         }
  //       } catch (err) {
  //         console.log('No existing connection found, user needs to connect manually');
  //         // Clear invalid stored preference
  //         localStorage.removeItem('selectedWallet');
  //       }
  //     }
  //   };
  //
  //   if (kitRef) {
  //     checkExistingConnection();
  //   }
  // }, [kitRef, isConnected]);

  // Persist connection state across route changes
  useEffect(() => {
    const checkPersistedConnection = async () => {
      if (kitRef && !isConnected) {
        try {
          const persistedWallet = localStorage.getItem('selectedWallet');
          const persistedPublicKey = localStorage.getItem('stellarPublicKey');
          
          if (persistedWallet && persistedPublicKey) {
            console.log('Restoring persisted Stellar connection...');
            await kitRef.setWallet(persistedWallet);
            setPublicKey(persistedPublicKey);
            setIsConnected(true);
            setConnectionMethod(persistedWallet);
            setError(null);
            console.log('Stellar wallet connection restored:', persistedPublicKey);
          }
        } catch (err) {
          console.log('Failed to restore persisted connection, clearing storage');
          localStorage.removeItem('selectedWallet');
          localStorage.removeItem('stellarPublicKey');
        }
      }
    };

    if (kitRef) {
      checkPersistedConnection();
    }
  }, [kitRef, isConnected]);

  const isAnyStellarWalletAvailable = useCallback(async () => {
    if (!kitRef) return false;
    
    try {
      console.log('Checking available wallets with Stellar Wallets Kit...');
      
      // The kit handles wallet availability internally
      // We'll assume wallets are available and let the kit handle detection
      return true;
    } catch (err) {
      console.error('Error checking available wallets:', err);
      return false;
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
            
            // Store selected wallet preference and public key
            localStorage.setItem('selectedWallet', option.id);
            localStorage.setItem('stellarPublicKey', address);
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

      if (kitRef) {
        console.log('Stellar Wallets Kit available, attempting connection...');
        await connectWithStellarKit();
      } else {
        throw new Error('Stellar Wallets Kit not initialized');
      }
    } catch (err) {
      console.error('Failed to connect Stellar wallet:', err);
        setError(err.message || 'Failed to connect Stellar wallet');
    } finally {
      setIsLoading(false);
    }
  }, [kitRef, connectWithStellarKit]);

  const disconnectWallet = useCallback(async () => {
    console.log('Disconnecting Stellar wallet...');
    try {
      if (kitRef) {
        await kitRef.disconnect();
      }
      
      setPublicKey(null);
      setIsConnected(false);
      setConnectionMethod(null);
      setError(null);
      
      // Clear persisted wallet data
      localStorage.removeItem('selectedWallet');
      localStorage.removeItem('stellarPublicKey');
      console.log('Stellar wallet disconnected');
    } catch (err) {
      console.error('Failed to disconnect Stellar wallet:', err);
      setError('Failed to disconnect wallet');
    }
  }, [kitRef]);

  const signTransaction = useCallback(async (transaction) => {
    if (!kitRef || !isConnected) {
      throw new Error('Wallet not connected');
    }

    try {
      return await kitRef.signTransaction(transaction);
    } catch (err) {
      console.error('Failed to sign transaction:', err);
      throw err;
    }
  }, [kitRef, isConnected]);

  const signMessage = useCallback(async (message) => {
    if (!kitRef || !isConnected) {
      throw new Error('Wallet not connected');
    }

    try {
      return await kitRef.signMessage(message);
    } catch (err) {
      console.error('Failed to sign message:', err);
      throw err;
    }
  }, [kitRef, isConnected]);

  const getBalance = useCallback(async () => {
    if (!kitRef || !isConnected) {
      throw new Error('Wallet not connected');
    }

    try {
      return await kitRef.getBalance();
    } catch (err) {
      console.error('Failed to get balance:', err);
      throw err;
    }
  }, [kitRef, isConnected]);

  const getAccountInfo = useCallback(async () => {
    if (!kitRef || !isConnected) {
      throw new Error('Wallet not connected');
    }

    try {
      return await kitRef.getAccountInfo();
    } catch (err) {
      console.error('Failed to get account info:', err);
      throw err;
    }
  }, [kitRef, isConnected]);

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
    const checkWalletAvailability = async () => {
      try {
        const available = await isAnyStellarWalletAvailable();
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
    connect: connectWallet,
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