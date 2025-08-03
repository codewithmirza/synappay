import { useState, useEffect, useCallback, useRef } from 'react';
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
import { modalPrevention } from './utils';

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
const BACK_NAVIGATION_KEY = 'stellar_back_navigation';
const MODAL_PREVENTION_KEY = 'stellar_modal_prevention';

export function useStellarWallet() {
  const [connected, setConnected] = useState(false);
  const [publicKey, setPublicKey] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [supportedWallets, setSupportedWallets] = useState([]);
  const [selectedWalletId, setSelectedWalletId] = useState(null);
  const [modalOpened, setModalOpened] = useState(false);
  
  // Use ref to track if modal is currently open to prevent multiple modals
  const modalOpenRef = useRef(false);
  // Use ref to track if we're in restoration mode
  const isRestoringRef = useRef(false);
  // Use ref to track if we're in back navigation
  const isBackNavigationRef = useRef(false);
  // Use ref to track if we should prevent modal
  const preventModalRef = useRef(false);

  const kit = createStellarKit();

  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      console.log('Back navigation detected, preventing modal');
      isBackNavigationRef.current = true;
      preventModalRef.current = true;
      modalPrevention.preventModals(3000); // Prevent modals for 3 seconds
      sessionStorage.setItem(BACK_NAVIGATION_KEY, 'true');
      sessionStorage.setItem(MODAL_PREVENTION_KEY, 'true');
      
      // Hide any visible modals immediately
      if (modalOpenRef.current) {
        setModalOpened(false);
        modalOpenRef.current = false;
      }
    };

    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Restore connection from session storage on mount
  useEffect(() => {
    const restoreConnection = async () => {
      try {
        isRestoringRef.current = true;
        preventModalRef.current = true;
        modalPrevention.preventModals(2000); // Prevent modals during restoration
        
        // Check if we're coming from back navigation
        const isBackNavigation = sessionStorage.getItem(BACK_NAVIGATION_KEY) === 'true';
        const modalPreventionFlag = sessionStorage.getItem(MODAL_PREVENTION_KEY) === 'true';
        
        if (isBackNavigation || modalPreventionFlag) {
          console.log('Skipping restoration due to back navigation or modal prevention');
          sessionStorage.removeItem(BACK_NAVIGATION_KEY);
          sessionStorage.removeItem(MODAL_PREVENTION_KEY);
          isBackNavigationRef.current = true;
          preventModalRef.current = true;
          return;
        }
        
        // Auto-restore wallet connection to maintain state across tabs
        const savedWalletId = sessionStorage.getItem(STELLAR_WALLET_KEY);
        const savedAddress = sessionStorage.getItem(STELLAR_ADDRESS_KEY);
        
        if (savedWalletId && savedAddress) {
          console.log('Restoring Stellar wallet connection:', savedWalletId, savedAddress);
          setSelectedWalletId(savedWalletId);
          setPublicKey(savedAddress);
          setConnected(true);
          console.log('Successfully restored Stellar wallet connection:', savedAddress);
        }
      } catch (err) {
        console.error('Failed to restore wallet connection:', err);
        // Clear invalid session data
        sessionStorage.removeItem(STELLAR_WALLET_KEY);
        sessionStorage.removeItem(STELLAR_ADDRESS_KEY);
      } finally {
        isRestoringRef.current = false;
        // Keep modal prevention active for a short time after restoration
        setTimeout(() => {
          preventModalRef.current = false;
        }, 1000);
      }
    };
    
    restoreConnection();
  }, [kit]);

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

  // Ensure kit is properly initialized and no modal is pending
  useEffect(() => {
    // Small delay to ensure kit is fully initialized
    const timer = setTimeout(() => {
      if (connected && !modalOpenRef.current && !isRestoringRef.current && !isBackNavigationRef.current && !preventModalRef.current && !modalPrevention.isModalPrevented()) {
        console.log('Kit initialization check completed');
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [connected]);

  const connect = useCallback(async () => {
    // Check global modal prevention
    if (modalPrevention.isModalPrevented()) {
      console.log('Skipping modal open due to global modal prevention');
      return;
    }
    
    // Prevent multiple modals using ref instead of state
    if (modalOpenRef.current) {
      console.log('Modal already open, skipping');
      return;
    }
    
    // Don't open modal if we're in restoration mode
    if (isRestoringRef.current) {
      console.log('Skipping modal open during restoration');
      return;
    }
    
    // Don't open modal if we're in back navigation
    if (isBackNavigationRef.current) {
      console.log('Skipping modal open during back navigation');
      return;
    }
    
    // Don't open modal if modal prevention is active
    if (preventModalRef.current) {
      console.log('Skipping modal open due to modal prevention');
      return;
    }
    
    // Don't open modal if already connected
    if (connected && publicKey) {
      console.log('Already connected to Stellar wallet, skipping modal');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setModalOpened(true);
      modalOpenRef.current = true;
      
      await kit.openModal({
        onWalletSelected: async (option) => {
          try {
            console.log('User selected wallet:', option.name, option.id);
            
            // Clear any previous errors
            setError(null);
            
            // Set the wallet in the kit
            kit.setWallet(option.id);
            setSelectedWalletId(option.id);
            
            // Get the address
            const { address } = await kit.getAddress();
            
            // Update state
            setPublicKey(address);
            setConnected(true);
            
            // Save to session storage
            sessionStorage.setItem(STELLAR_WALLET_KEY, option.id);
            sessionStorage.setItem(STELLAR_ADDRESS_KEY, address);
            
            console.log(`Connected to ${option.name} wallet:`, address);
            
            // Close modal
            setModalOpened(false);
            modalOpenRef.current = false;
            setLoading(false);
          } catch (err) {
            console.error('Failed to connect wallet:', err);
            setError(err.message);
            setConnected(false);
            setModalOpened(false);
            modalOpenRef.current = false;
            setLoading(false);
          }
        },
        onClosed: (err) => {
          setModalOpened(false);
          modalOpenRef.current = false;
          setLoading(false);
          if (err) {
            setError(err.message);
            console.error('Modal closed with error:', err);
          }
        },
        onError: (err) => {
          setModalOpened(false);
          modalOpenRef.current = false;
          setError(err.message);
          setLoading(false);
          console.error('Modal error:', err);
        }
      });
    } catch (err) {
      setModalOpened(false);
      modalOpenRef.current = false;
      setError(err.message);
      setLoading(false);
      console.error('Failed to open wallet modal:', err);
    }
  }, [kit, connected, publicKey]); // Added connected and publicKey to prevent modal when already connected

  const disconnect = useCallback(async () => {
    try {
      await kit.disconnect();
      setConnected(false);
      setPublicKey(null);
      setSelectedWalletId(null);
      setError(null);
      setModalOpened(false);
      modalOpenRef.current = false;
      isBackNavigationRef.current = false;
      preventModalRef.current = false;
      modalPrevention.clearPrevention();
      
      // Clear session storage
      sessionStorage.removeItem(STELLAR_WALLET_KEY);
      sessionStorage.removeItem(STELLAR_ADDRESS_KEY);
      sessionStorage.removeItem(BACK_NAVIGATION_KEY);
      sessionStorage.removeItem(MODAL_PREVENTION_KEY);
      
      console.log('Disconnected from Stellar wallet');
    } catch (err) {
      setError(err.message);
      console.error('Failed to disconnect wallet:', err);
    }
  }, [kit]);

  // Verify connection is still valid (but only after initial connection is established)
  useEffect(() => {
    if (connected && selectedWalletId && publicKey) {
      const verifyConnection = async () => {
        try {
          // Set the wallet first before getting address
          kit.setWallet(selectedWalletId);
          const { address } = await kit.getAddress();
          if (address !== publicKey) {
            // Connection changed, update state
            setPublicKey(address);
            sessionStorage.setItem(STELLAR_ADDRESS_KEY, address);
            console.log('Updated Stellar wallet address:', address);
          }
        } catch (err) {
          // Only clear state if we're sure the connection is lost
          console.warn('Stellar wallet verification failed, but keeping connection:', err.message);
          // Don't automatically disconnect - let user manually disconnect if needed
        }
      };
      
      // Add a delay to avoid interfering with initial connection
      const timeoutId = setTimeout(verifyConnection, 2000);
      return () => clearTimeout(timeoutId);
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