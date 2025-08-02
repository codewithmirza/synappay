import { useState, useEffect, useCallback } from 'react';
import {
  StellarWalletsKit,
  WalletNetwork,
  XBULL_ID,
  FREIGHTER_ID,
  ALBEDO_ID,
  RABET_ID,
  LOBSTR_ID,
  HANA_ID,
  HOTWALLET_ID,
  xBullModule,
  FreighterModule,
  AlbedoModule,
  RabetModule,
  LobstrModule,
  HanaModule,
  HotWalletModule
} from '@creit.tech/stellar-wallets-kit';

// Create a singleton instance
let stellarKit = null;

const createStellarKit = () => {
  if (!stellarKit) {
    stellarKit = new StellarWalletsKit({
      network: WalletNetwork.TESTNET,
      selectedWalletId: null, // Don't auto-select any wallet
      modules: [
        new xBullModule(),
        new FreighterModule(),
        new AlbedoModule(),
        new RabetModule(),
        new LobstrModule(),
        new HanaModule(),
        new HotWalletModule(),
      ]
    });
  }
  return stellarKit;
};

// Session storage keys
const STELLAR_WALLET_KEY = 'stellar_wallet_connection';
const STELLAR_ADDRESS_KEY = 'stellar_wallet_address';

export function useStellarWallet() {
  const [connected, setConnected] = useState(false);
  const [publicKey, setPublicKey] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [supportedWallets, setSupportedWallets] = useState([]);
  const [selectedWalletId, setSelectedWalletId] = useState(null);

  const kit = createStellarKit();

  // Restore connection from session storage on mount
  useEffect(() => {
    const restoreConnection = async () => {
      try {
        const savedWalletId = sessionStorage.getItem(STELLAR_WALLET_KEY);
        const savedAddress = sessionStorage.getItem(STELLAR_ADDRESS_KEY);
        
        if (savedWalletId && savedAddress) {
          setSelectedWalletId(savedWalletId);
          setPublicKey(savedAddress);
          setConnected(true);
          console.log('Restored Stellar wallet connection:', savedAddress);
        }
      } catch (err) {
        console.error('Failed to restore wallet connection:', err);
        // Clear invalid session data
        sessionStorage.removeItem(STELLAR_WALLET_KEY);
        sessionStorage.removeItem(STELLAR_ADDRESS_KEY);
      }
    };
    
    restoreConnection();
  }, []);

  // Get supported wallets on mount
  useEffect(() => {
    const getSupportedWallets = async () => {
      try {
        const wallets = await kit.getSupportedWallets();
        setSupportedWallets(wallets);
        console.log('Available Stellar wallets:', wallets.map(w => `${w.name} (${w.isAvailable ? 'Available' : 'Not Available'})`));
      } catch (err) {
        console.error('Failed to get supported wallets:', err);
      }
    };
    
    getSupportedWallets();
  }, [kit]);

  const connect = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      await kit.openModal({
        onWalletSelected: async (option) => {
          try {
            console.log('User selected wallet:', option.name, option.id);
            kit.setWallet(option.id);
            setSelectedWalletId(option.id);
            
            const { address } = await kit.getAddress();
            setPublicKey(address);
            setConnected(true);
            
            // Save to session storage
            sessionStorage.setItem(STELLAR_WALLET_KEY, option.id);
            sessionStorage.setItem(STELLAR_ADDRESS_KEY, address);
            
            console.log(`Connected to ${option.name} wallet:`, address);
          } catch (err) {
            setError(err.message);
            setConnected(false);
            console.error('Failed to connect wallet:', err);
          }
        },
        onClosed: (err) => {
          if (err) {
            setError(err.message);
            console.error('Modal closed with error:', err);
          }
          setLoading(false);
        },
        onError: (err) => {
          setError(err.message);
          setLoading(false);
          console.error('Modal error:', err);
        }
      });
    } catch (err) {
      setError(err.message);
      setLoading(false);
      console.error('Failed to open wallet modal:', err);
    }
  }, [kit]);

  const disconnect = useCallback(async () => {
    try {
      await kit.disconnect();
      setConnected(false);
      setPublicKey(null);
      setSelectedWalletId(null);
      setError(null);
      
      // Clear session storage
      sessionStorage.removeItem(STELLAR_WALLET_KEY);
      sessionStorage.removeItem(STELLAR_ADDRESS_KEY);
      
      console.log('Disconnected from Stellar wallet');
    } catch (err) {
      setError(err.message);
      console.error('Failed to disconnect wallet:', err);
    }
  }, [kit]);

  // Verify connection is still valid
  useEffect(() => {
    if (connected && selectedWalletId) {
      const verifyConnection = async () => {
        try {
          const { address } = await kit.getAddress();
          if (address !== publicKey) {
            // Connection changed, update state
            setPublicKey(address);
            sessionStorage.setItem(STELLAR_ADDRESS_KEY, address);
          }
        } catch (err) {
          // Connection lost, clear state
          console.log('Stellar wallet connection lost');
          setConnected(false);
          setPublicKey(null);
          setSelectedWalletId(null);
          sessionStorage.removeItem(STELLAR_WALLET_KEY);
          sessionStorage.removeItem(STELLAR_ADDRESS_KEY);
        }
      };
      
      verifyConnection();
    }
  }, [connected, selectedWalletId, kit, publicKey]);

  return {
    connected,
    publicKey,
    loading,
    error,
    connect,
    disconnect,
    supportedWallets,
    selectedWalletId
  };
} 