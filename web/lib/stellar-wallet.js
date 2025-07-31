import StellarSdk from 'stellar-sdk';

class StellarWalletManager {
    constructor() {
        this.server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org');
        this.network = 'testnet';
        this.isConnected = false;
        this.publicKey = null;
        this.secretKey = null;
        this.listeners = new Set();
        
        // Supported Stellar wallets
        this.supportedWallets = {
            'freighter': 'Freighter',
            'albedo': 'Albedo',
            'xbull': 'xBull',
            'rabet': 'Rabet',
            'walletconnect': 'WalletConnect'
        };
    }

    /**
     * Initialize Stellar wallet connection
     */
    async initialize() {
        try {
            // Check if Freighter is available
            if (typeof window !== 'undefined' && window.freighterApi) {
                await this.connectFreighter();
            } else {
                console.log('⚠️ Freighter not detected, using manual keypair');
                return false;
            }
            return true;
        } catch (error) {
            console.error('Failed to initialize Stellar wallet:', error);
            return false;
        }
    }

    /**
     * Connect to Freighter wallet
     */
    async connectFreighter() {
        try {
            if (!window.freighterApi) {
                throw new Error('Freighter not installed');
            }

            // Request connection
            const publicKey = await window.freighterApi.getPublicKey();
            
            if (!publicKey) {
                throw new Error('User rejected connection');
            }

            this.publicKey = publicKey;
            this.isConnected = true;
            
            console.log('✅ Connected to Freighter wallet:', publicKey);
            
            // Set up event listeners
            this.setupFreighterListeners();
            
            this.notifyListeners();
            return { success: true, publicKey };
        } catch (error) {
            console.error('Failed to connect to Freighter:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Connect using manual keypair
     */
    async connectManual(secretKey) {
        try {
            const keypair = StellarSdk.Keypair.fromSecret(secretKey);
            this.publicKey = keypair.publicKey();
            this.secretKey = secretKey;
            this.isConnected = true;
            
            console.log('✅ Connected with manual keypair:', this.publicKey);
            
            this.notifyListeners();
            return { success: true, publicKey: this.publicKey };
        } catch (error) {
            console.error('Failed to connect with manual keypair:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Disconnect wallet
     */
    async disconnect() {
        this.isConnected = false;
        this.publicKey = null;
        this.secretKey = null;
        
        console.log('🔌 Stellar wallet disconnected');
        
        this.notifyListeners();
        return { success: true };
    }

    /**
     * Get account balance
     */
    async getBalance(assetCode = 'XLM') {
        try {
            if (!this.publicKey) {
                throw new Error('Wallet not connected');
            }

            const account = await this.server.loadAccount(this.publicKey);
            
            if (assetCode === 'XLM') {
                const nativeBalance = account.balances.find(b => b.asset_type === 'native');
                return {
                    success: true,
                    balance: nativeBalance ? nativeBalance.balance : '0',
                    assetCode: 'XLM'
                };
            } else {
                const assetBalance = account.balances.find(b => 
                    b.asset_code === assetCode
                );
                return {
                    success: true,
                    balance: assetBalance ? assetBalance.balance : '0',
                    assetCode: assetCode
                };
            }
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Sign transaction
     */
    async signTransaction(transaction) {
        try {
            if (!this.isConnected) {
                throw new Error('Wallet not connected');
            }

            if (window.freighterApi && this.publicKey) {
                // Use Freighter for signing
                const signedTx = await window.freighterApi.signTransaction(
                    transaction.toXDR(),
                    {
                        network: this.network
                    }
                );
                return StellarSdk.TransactionBuilder.fromXDR(signedTx, this.network);
            } else if (this.secretKey) {
                // Use manual keypair for signing
                const keypair = StellarSdk.Keypair.fromSecret(this.secretKey);
                transaction.sign(keypair);
                return transaction;
            } else {
                throw new Error('No signing method available');
            }
        } catch (error) {
            throw new Error(`Failed to sign transaction: ${error.message}`);
        }
    }

    /**
     * Sign message (for HTLC integration)
     */
    async signMessage(message) {
        try {
            if (!this.isConnected) {
                throw new Error('Wallet not connected');
            }

            if (window.freighterApi) {
                // Use Freighter for message signing
                const signature = await window.freighterApi.signMessage(message);
                return signature;
            } else if (this.secretKey) {
                // Manual message signing
                const keypair = StellarSdk.Keypair.fromSecret(this.secretKey);
                const messageBytes = new TextEncoder().encode(message);
                const signature = keypair.sign(messageBytes);
                return signature.toString('hex');
            } else {
                throw new Error('No signing method available');
            }
        } catch (error) {
            throw new Error(`Failed to sign message: ${error.message}`);
        }
    }

    /**
     * Create HTLC transaction
     */
    async createHTLC(receiverPublicKey, amount, assetCode, assetIssuer, hashlock, timelock) {
        try {
            if (!this.isConnected) {
                throw new Error('Wallet not connected');
            }

            const account = await this.server.loadAccount(this.publicKey);
            
            // Create HTLC operation
            const htlcOperation = StellarSdk.Operation.createClaimableBalance({
                claimants: [
                    new StellarSdk.Claimant(
                        receiverPublicKey,
                        StellarSdk.Predicate.hashX(hashlock)
                    ),
                    new StellarSdk.Claimant(
                        this.publicKey,
                        StellarSdk.Predicate.not(
                            StellarSdk.Predicate.beforeRelativeTime(timelock)
                        )
                    )
                ],
                asset: assetCode === 'XLM' 
                    ? StellarSdk.Asset.native()
                    : new StellarSdk.Asset(assetCode, assetIssuer),
                amount: amount.toString()
            });

            // Build transaction
            const transaction = new StellarSdk.TransactionBuilder(account, {
                fee: StellarSdk.BASE_FEE,
                networkPassphrase: StellarSdk.Networks.TESTNET
            })
            .addOperation(htlcOperation)
            .setTimeout(30)
            .build();

            // Sign and submit
            const signedTransaction = await this.signTransaction(transaction);
            const result = await this.server.submitTransaction(signedTransaction);

            return {
                success: true,
                transactionHash: result.hash,
                balanceId: this.extractBalanceId(result)
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Claim HTLC with preimage
     */
    async claimHTLC(balanceId, preimage) {
        try {
            if (!this.isConnected) {
                throw new Error('Wallet not connected');
            }

            const account = await this.server.loadAccount(this.publicKey);
            
            // Create claim operation
            const claimOperation = StellarSdk.Operation.claimClaimableBalance({
                balanceId: balanceId
            });

            // Build transaction
            const transaction = new StellarSdk.TransactionBuilder(account, {
                fee: StellarSdk.BASE_FEE,
                networkPassphrase: StellarSdk.Networks.TESTNET
            })
            .addOperation(claimOperation)
            .setTimeout(30)
            .build();

            // Sign and submit
            const signedTransaction = await this.signTransaction(transaction);
            const result = await this.server.submitTransaction(signedTransaction);

            return {
                success: true,
                transactionHash: result.hash
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Refund HTLC (after timelock)
     */
    async refundHTLC(balanceId) {
        try {
            if (!this.isConnected) {
                throw new Error('Wallet not connected');
            }

            const account = await this.server.loadAccount(this.publicKey);
            
            // Create claim operation (as original sender)
            const claimOperation = StellarSdk.Operation.claimClaimableBalance({
                balanceId: balanceId
            });

            // Build transaction
            const transaction = new StellarSdk.TransactionBuilder(account, {
                fee: StellarSdk.BASE_FEE,
                networkPassphrase: StellarSdk.Networks.TESTNET
            })
            .addOperation(claimOperation)
            .setTimeout(30)
            .build();

            // Sign and submit
            const signedTransaction = await this.signTransaction(transaction);
            const result = await this.server.submitTransaction(signedTransaction);

            return {
                success: true,
                transactionHash: result.hash
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get HTLC balance details
     */
    async getHTLCBalance(balanceId) {
        try {
            const balance = await this.server.claimableBalances()
                .claimableBalance(balanceId)
                .call();

            return {
                success: true,
                balance: balance
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Extract balance ID from transaction result
     */
    extractBalanceId(transactionResult) {
        const operations = transactionResult.result_meta_xdr;
        // Parse operations to find the created claimable balance ID
        // This is a simplified implementation
        return transactionResult.hash; // Placeholder
    }

    /**
     * Set up Freighter event listeners
     */
    setupFreighterListeners() {
        if (window.freighterApi) {
            window.freighterApi.on('networkChanged', (network) => {
                console.log('Network changed:', network);
                this.notifyListeners();
            });

            window.freighterApi.on('accountChanged', (publicKey) => {
                console.log('Account changed:', publicKey);
                this.publicKey = publicKey;
                this.notifyListeners();
            });
        }
    }

    /**
     * Get connection state
     */
    getConnectionState() {
        return {
            isConnected: this.isConnected,
            publicKey: this.publicKey,
            network: this.network
        };
    }

    /**
     * Add state change listener
     */
    addListener(callback) {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }

    /**
     * Notify all listeners
     */
    notifyListeners() {
        const state = this.getConnectionState();
        this.listeners.forEach(callback => callback(state));
    }

    /**
     * Format public key for display
     */
    formatPublicKey(publicKey) {
        if (!publicKey) return '';
        return `${publicKey.slice(0, 6)}...${publicKey.slice(-4)}`;
    }

    /**
     * Check if wallet is on correct network
     */
    isCorrectNetwork() {
        return this.network === 'testnet';
    }

    /**
     * Switch network (if supported)
     */
    async switchNetwork(network) {
        try {
            if (window.freighterApi) {
                await window.freighterApi.selectNetwork(network);
                this.network = network;
                this.notifyListeners();
                return { success: true };
            } else {
                throw new Error('Network switching not supported');
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

// Create and export singleton instance
export const stellarWalletManager = new StellarWalletManager();

// Export helper functions
export const connectStellarWallet = () => stellarWalletManager.initialize();
export const disconnectStellarWallet = () => stellarWalletManager.disconnect();
export const getStellarBalance = (assetCode) => stellarWalletManager.getBalance(assetCode); 