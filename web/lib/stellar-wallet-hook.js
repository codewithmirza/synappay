import { useState, useEffect, useCallback } from 'react';
import {
  StellarWalletsKit,
  WalletNetwork,
  allowAllModules,
  XBULL_ID,
  FreighterModule,
  xBullModule
} from '@creit.tech/stellar-wallets-kit';

// Create a singleton instance
let stellarKit = null;

const createStellarKit = () => {
  if (!stellarKit) {
    stellarKit = new StellarWalletsKit({
      network: WalletNetwork.TESTNET,
      selectedWalletId: XBULL_ID,
      modules: [
        new xBullModule(),
        new FreighterModule(),
      ]
    });
  }
  return stellarKit;
};

export function useStellarWallet() {
  const [connected, setConnected] = useState(false);
  const [publicKey, setPublicKey] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const kit = createStellarKit();

  const connect = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      await kit.openModal({
        onWalletSelected: async (option) => {
          try {
            kit.setWallet(option.id);
            const { address } = await kit.getAddress();
            setPublicKey(address);
            setConnected(true);
          } catch (err) {
            setError(err.message);
            setConnected(false);
          }
        },
        onClosed: (err) => {
          if (err) {
            setError(err.message);
          }
          setLoading(false);
        },
        onError: (err) => {
          setError(err.message);
          setLoading(false);
        }
      });
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }, [kit]);

  const disconnect = useCallback(async () => {
    try {
      await kit.disconnect();
      setConnected(false);
      setPublicKey(null);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }, [kit]);

  // Check if already connected on mount
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const { address } = await kit.getAddress();
        if (address) {
          setPublicKey(address);
          setConnected(true);
        }
      } catch (err) {
        // Not connected, which is fine
      }
    };
    
    checkConnection();
  }, [kit]);

  return {
    connected,
    publicKey,
    loading,
    error,
    connect,
    disconnect
  };
} 