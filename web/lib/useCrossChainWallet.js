import { useState, useEffect, useCallback } from 'react';
import { useWalletConnect } from './useWalletConnect';
import { stellarWalletManager } from './stellar-wallet';

export const useCrossChainWallet = () => {
    // Ethereum wallet state
    const {
        isConnected: ethConnected,
        address: ethAddress,
        chainId: ethChainId,
        isLoading: ethLoading,
        error: ethError,
        connect: connectEth,
        disconnect: disconnectEth,
        formatAddress: formatEthAddress,
        isCorrectNetwork: isCorrectEthNetwork,
        switchToSepolia
    } = useWalletConnect();

    // Stellar wallet state
    const [stellarState, setStellarState] = useState({
        isConnected: false,
        publicKey: null,
        network: 'testnet',
        isLoading: false,
        error: null
    });

    // Combined state
    const [combinedState, setCombinedState] = useState({
        ethConnected: false,
        stellarConnected: false,
        bothConnected: false,
        canSwap: false
    });

    // Initialize Stellar wallet
    useEffect(() => {
        const initializeStellar = async () => {
            try {
                setStellarState(prev => ({ ...prev, isLoading: true }));
                await stellarWalletManager.initialize();
                
                // Subscribe to Stellar wallet changes
                const unsubscribe = stellarWalletManager.addListener((state) => {
                    setStellarState({
                        isConnected: state.isConnected,
                        publicKey: state.publicKey,
                        network: state.network,
                        isLoading: false,
                        error: null
                    });
                });

                return unsubscribe;
            } catch (error) {
                setStellarState(prev => ({
                    ...prev,
                    isLoading: false,
                    error: error.message
                }));
            }
        };

        initializeStellar();
    }, []);

    // Update combined state when either wallet changes
    useEffect(() => {
        const bothConnected = ethConnected && stellarState.isConnected;
        const canSwap = bothConnected && 
                       isCorrectEthNetwork() && 
                       stellarState.network === 'testnet';

        setCombinedState({
            ethConnected,
            stellarConnected: stellarState.isConnected,
            bothConnected,
            canSwap
        });
    }, [ethConnected, stellarState.isConnected, stellarState.network, isCorrectEthNetwork]);

    // Connect Stellar wallet
    const connectStellar = useCallback(async () => {
        try {
            setStellarState(prev => ({ ...prev, isLoading: true, error: null }));
            
            const result = await stellarWalletManager.connectFreighter();
            
            if (result.success) {
                setStellarState(prev => ({
                    ...prev,
                    isConnected: true,
                    publicKey: result.publicKey,
                    isLoading: false,
                    error: null
                }));
                return { success: true, publicKey: result.publicKey };
            } else {
                setStellarState(prev => ({
                    ...prev,
                    isLoading: false,
                    error: result.error
                }));
                return { success: false, error: result.error };
            }
        } catch (error) {
            setStellarState(prev => ({
                ...prev,
                isLoading: false,
                error: error.message
            }));
            return { success: false, error: error.message };
        }
    }, []);

    // Connect Stellar with manual keypair
    const connectStellarManual = useCallback(async (secretKey) => {
        try {
            setStellarState(prev => ({ ...prev, isLoading: true, error: null }));
            
            const result = await stellarWalletManager.connectManual(secretKey);
            
            if (result.success) {
                setStellarState(prev => ({
                    ...prev,
                    isConnected: true,
                    publicKey: result.publicKey,
                    isLoading: false,
                    error: null
                }));
                return { success: true, publicKey: result.publicKey };
            } else {
                setStellarState(prev => ({
                    ...prev,
                    isLoading: false,
                    error: result.error
                }));
                return { success: false, error: result.error };
            }
        } catch (error) {
            setStellarState(prev => ({
                ...prev,
                isLoading: false,
                error: error.message
            }));
            return { success: false, error: error.message };
        }
    }, []);

    // Disconnect Stellar wallet
    const disconnectStellar = useCallback(async () => {
        try {
            const result = await stellarWalletManager.disconnect();
            
            if (result.success) {
                setStellarState({
                    isConnected: false,
                    publicKey: null,
                    network: 'testnet',
                    isLoading: false,
                    error: null
                });
            }
            
            return result;
        } catch (error) {
            return { success: false, error: error.message };
        }
    }, []);

    // Get Stellar balance
    const getStellarBalance = useCallback(async (assetCode = 'XLM') => {
        try {
            return await stellarWalletManager.getBalance(assetCode);
        } catch (error) {
            return { success: false, error: error.message };
        }
    }, []);

    // Format Stellar public key
    const formatStellarAddress = useCallback((publicKey) => {
        if (!publicKey) return '';
        return `${publicKey.slice(0, 6)}...${publicKey.slice(-4)}`;
    }, []);

    // Check if Stellar is on correct network
    const isCorrectStellarNetwork = useCallback(() => {
        return stellarState.network === 'testnet';
    }, [stellarState.network]);

    // Switch Stellar network
    const switchStellarNetwork = useCallback(async (network) => {
        try {
            const result = await stellarWalletManager.switchNetwork(network);
            return result;
        } catch (error) {
            return { success: false, error: error.message };
        }
    }, []);

    // Create HTLC on Stellar
    const createStellarHTLC = useCallback(async (receiverPublicKey, amount, assetCode, assetIssuer, hashlock, timelock) => {
        try {
            return await stellarWalletManager.createHTLC(
                receiverPublicKey,
                amount,
                assetCode,
                assetIssuer,
                hashlock,
                timelock
            );
        } catch (error) {
            return { success: false, error: error.message };
        }
    }, []);

    // Claim HTLC on Stellar
    const claimStellarHTLC = useCallback(async (balanceId, preimage) => {
        try {
            return await stellarWalletManager.claimHTLC(balanceId, preimage);
        } catch (error) {
            return { success: false, error: error.message };
        }
    }, []);

    // Refund HTLC on Stellar
    const refundStellarHTLC = useCallback(async (balanceId) => {
        try {
            return await stellarWalletManager.refundHTLC(balanceId);
        } catch (error) {
            return { success: false, error: error.message };
        }
    }, []);

    // Get HTLC balance on Stellar
    const getStellarHTLCBalance = useCallback(async (balanceId) => {
        try {
            return await stellarWalletManager.getHTLCBalance(balanceId);
        } catch (error) {
            return { success: false, error: error.message };
        }
    }, []);

    // Sign message on Stellar
    const signStellarMessage = useCallback(async (message) => {
        try {
            return await stellarWalletManager.signMessage(message);
        } catch (error) {
            return { success: false, error: error.message };
        }
    }, []);

    return {
        // Ethereum wallet
        ethConnected,
        ethAddress,
        ethChainId,
        ethLoading,
        ethError,
        connectEth,
        disconnectEth,
        formatEthAddress,
        isCorrectEthNetwork,
        switchToSepolia,

        // Stellar wallet
        stellarConnected: stellarState.isConnected,
        stellarPublicKey: stellarState.publicKey,
        stellarNetwork: stellarState.network,
        stellarLoading: stellarState.isLoading,
        stellarError: stellarState.error,
        connectStellar,
        connectStellarManual,
        disconnectStellar,
        getStellarBalance,
        formatStellarAddress,
        isCorrectStellarNetwork,
        switchStellarNetwork,

        // HTLC operations
        createStellarHTLC,
        claimStellarHTLC,
        refundStellarHTLC,
        getStellarHTLCBalance,
        signStellarMessage,

        // Combined state
        bothConnected: combinedState.bothConnected,
        canSwap: combinedState.canSwap,

        // Loading states
        isLoading: ethLoading || stellarState.isLoading,
        
        // Error handling
        error: ethError || stellarState.error
    };
}; 