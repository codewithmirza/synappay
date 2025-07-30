const { ethers } = require('ethers');
const FusionClient = require('../fusion/client');
const StellarHTLC = require('../stellar/htlc');
require('dotenv').config();

class CrossChainRelayer {
    constructor() {
        // Initialize Ethereum provider and contract
        this.ethProvider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
        this.ethWallet = new ethers.Wallet(process.env.PRIVATE_KEY, this.ethProvider);
        
        // Initialize Stellar HTLC
        this.stellarHTLC = new StellarHTLC(process.env.STELLAR_HORIZON_URL);
        
        // Initialize Fusion client
        this.fusionClient = new FusionClient(
            process.env.ONEINCH_API_KEY,
            'ethereum',
            process.env.SEPOLIA_RPC_URL
        );
        
        // Load HTLC contract (will be deployed)
        this.htlcContract = null;
        
        // Active swaps tracking with enhanced status
        this.activeSwaps = new Map();
        
        // Event listeners for real-time updates
        this.eventListeners = new Map();
        
        // Status tracking
        this.statusHistory = [];
        
        console.log('🚀 CrossChainRelayer initialized with enhanced Fusion+ integration');
    }

    /**
     * Initialize the relayer with deployed contract address
     * @param {string} htlcContractAddress - Deployed HTLC contract address
     */
    async initialize(htlcContractAddress) {
        try {
            // Load contract ABI (simplified for demo)
            const htlcABI = [
                "function newContract(address _receiver, bytes32 _hashlock, uint256 _timelock) external payable returns (bytes32)",
                "function withdraw(bytes32 _contractId, bytes32 _preimage) external returns (bool)",
                "function refund(bytes32 _contractId) external returns (bool)",
                "function getContract(bytes32 _contractId) external view returns (address, address, uint256, bytes32, uint256, bool, bool, bytes32)",
                "event HTLCNew(bytes32 indexed contractId, address indexed sender, address indexed receiver, uint256 amount, bytes32 hashlock, uint256 timelock)",
                "event HTLCWithdraw(bytes32 indexed contractId)",
                "event HTLCRefund(bytes32 indexed contractId)"
            ];
            
            this.htlcContract = new ethers.Contract(htlcContractAddress, htlcABI, this.ethWallet);
            
            // Set up event listeners
            this.setupEventListeners();
            
            console.log(`✅ Relayer initialized with HTLC contract: ${htlcContractAddress}`);
            this.logStatus('INITIALIZED', `Relayer ready with contract ${htlcContractAddress}`);
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize relayer:', error);
            this.logStatus('ERROR', `Initialization failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Create a new cross-chain swap (ETH -> Stellar) with enhanced Fusion+ integration
     * @param {Object} swapParams - Swap parameters
     * @returns {Promise<Object>} Swap creation result
     */
    async createEthToStellarSwap(swapParams) {
        try {
            const {
                stellarReceiver,
                ethAmount,
                stellarAmount,
                stellarAssetCode,
                stellarAssetIssuer,
                timelock = 3600 // 1 hour default
            } = swapParams;

            // Generate secret and hashlock
            const { secret, hash } = StellarHTLC.generateSecret();
            const hashlock = '0x' + hash;
            const timelockTimestamp = Math.floor(Date.now() / 1000) + timelock;

            console.log('🔄 Creating ETH → Stellar swap with Fusion+ integration...');
            console.log('📊 Swap Parameters:');
            console.log(`   ETH Amount: ${ethAmount} ETH`);
            console.log(`   Stellar Amount: ${stellarAmount} ${stellarAssetCode}`);
            console.log(`   Receiver: ${stellarReceiver}`);
            console.log(`   Timelock: ${timelock} seconds`);
            console.log(`   Secret: ${secret}`);
            console.log(`   Hashlock: ${hashlock}`);

            // Step 1: Create Fusion+ intent-based order
            let fusionOrderHash = null;
            let auctionMonitor = null;
            
            try {
                console.log('🎯 Creating Fusion+ intent-based order...');
                const fusionOrder = await this.fusionClient.createIntentBasedOrder({
                    makerAsset: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', // ETH
                    takerAsset: '0x0000000000000000000000000000000000000000', // Placeholder for Stellar asset
                    makingAmount: ethers.parseEther(ethAmount.toString()),
                    takingAmount: stellarAmount,
                    maker: this.ethWallet.address,
                    receiver: this.ethWallet.address,
                    hashlock: hashlock,
                    timelock: timelock
                });

                if (fusionOrder.success) {
                    fusionOrderHash = fusionOrder.orderHash;
                    console.log('✅ Fusion+ intent-based order created successfully');
                    console.log(`📋 Order Hash: ${fusionOrderHash}`);
                    console.log('🎯 Dutch auction started - monitoring resolver competition...');

                    // Start monitoring Dutch auction
                    auctionMonitor = await this.fusionClient.monitorDutchAuction(
                        fusionOrderHash,
                        (update) => this.handleAuctionUpdate(update)
                    );

                    this.logStatus('FUSION_ORDER_CREATED', `Order ${fusionOrderHash} created and auction started`);
                } else {
                    console.log('⚠️  Fusion+ order failed (testnet limitation):', fusionOrder.error);
                    this.logStatus('FUSION_ORDER_FAILED', fusionOrder.error);
                }
            } catch (error) {
                console.log('⚠️  Fusion+ not available on testnet, proceeding with HTLC-only swap');
                this.logStatus('FUSION_UNAVAILABLE', 'Fusion+ not available on testnet');
            }

            // Step 2: Create Ethereum HTLC
            console.log('🔒 Creating Ethereum HTLC...');
            const ethTx = await this.htlcContract.newContract(
                this.ethWallet.address,
                hashlock,
                timelockTimestamp,
                { value: ethers.parseEther(ethAmount.toString()) }
            );
            
            const ethReceipt = await ethTx.wait();
            const ethContractId = ethReceipt.logs[0].topics[1]; // Extract contract ID from event

            console.log('✅ Ethereum HTLC created successfully');
            console.log(`📋 Contract ID: ${ethContractId}`);

            // Step 3: Create Stellar HTLC
            console.log('⭐ Creating Stellar HTLC...');
            const stellarResult = await this.stellarHTLC.createHTLC(
                process.env.STELLAR_PRIVATE_KEY,
                stellarReceiver,
                stellarAmount.toString(),
                stellarAssetCode,
                stellarAssetIssuer,
                hashlock,
                timelock
            );

            if (!stellarResult.success) {
                throw new Error(`Stellar HTLC creation failed: ${stellarResult.error}`);
            }

            console.log('✅ Stellar HTLC created successfully');
            console.log(`📋 Balance ID: ${stellarResult.balanceId}`);

            // Store swap details with enhanced tracking
            const swapId = ethers.keccak256(ethers.toUtf8Bytes(secret + Date.now()));
            const swapData = {
                id: swapId,
                type: 'ETH_TO_STELLAR',
                secret: secret,
                hashlock: hashlock,
                ethContractId: ethContractId,
                stellarBalanceId: stellarResult.balanceId,
                fusionOrderHash: fusionOrderHash,
                auctionMonitor: auctionMonitor,
                status: 'ACTIVE',
                timelock: timelockTimestamp,
                createdAt: Date.now(),
                statusHistory: [
                    { timestamp: Date.now(), status: 'CREATED', message: 'Swap initiated' },
                    { timestamp: Date.now(), status: 'ETH_HTLC_CREATED', message: `ETH HTLC: ${ethContractId}` },
                    { timestamp: Date.now(), status: 'STELLAR_HTLC_CREATED', message: `Stellar HTLC: ${stellarResult.balanceId}` }
                ],
                fusionStatus: fusionOrderHash ? 'AUCTION_ACTIVE' : 'NOT_AVAILABLE'
            };

            this.activeSwaps.set(swapId, swapData);

            console.log('🎉 Cross-chain swap created successfully!');
            console.log('📋 Final Swap Details:');
            console.log('- Swap ID:', swapId);
            console.log('- Secret:', secret);
            console.log('- ETH Contract ID:', ethContractId);
            console.log('- Stellar Balance ID:', stellarResult.balanceId);
            console.log('- Fusion Order Hash:', fusionOrderHash);
            console.log('- Status: ACTIVE');
            console.log('- Fusion Status:', swapData.fusionStatus);

            this.logStatus('SWAP_CREATED', `Swap ${swapId} created successfully`);

            return {
                success: true,
                swapId: swapId,
                secret: secret,
                ethContractId: ethContractId,
                stellarBalanceId: stellarResult.balanceId,
                fusionOrderHash: fusionOrderHash,
                fusionStatus: swapData.fusionStatus,
                auctionActive: !!fusionOrderHash
            };

        } catch (error) {
            console.error('❌ Failed to create ETH → Stellar swap:', error);
            this.logStatus('ERROR', `Swap creation failed: ${error.message}`);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Handle Fusion+ auction updates
     * @param {Object} update - Auction update data
     */
    handleAuctionUpdate(update) {
        console.log('🔄 Fusion+ Auction Update:', update.type);
        
        switch (update.type) {
            case 'RESOLVER_OFFER':
                console.log('🎯 New resolver offer:');
                console.log(`   Resolver: ${update.offer.resolver}`);
                console.log(`   Price: ${update.offer.price}`);
                console.log(`   Fill Amount: ${update.offer.fillAmount}`);
                this.logStatus('RESOLVER_OFFER', `New offer from ${update.offer.resolver}`);
                break;
                
            case 'AUCTION_COMPLETE':
                console.log('🏁 Auction completed:');
                console.log(`   Final Status: ${update.finalStatus}`);
                console.log(`   Winning Resolver: ${update.winningResolver?.resolver || 'None'}`);
                this.logStatus('AUCTION_COMPLETE', `Auction completed with status: ${update.finalStatus}`);
                break;
                
            case 'STATUS_UPDATE':
                console.log(`📊 Status Update: ${update.status} (${update.resolvers} resolvers)`);
                this.logStatus('STATUS_UPDATE', `Status: ${update.status}, Resolvers: ${update.resolvers}`);
                break;
        }
    }

    /**
     * Create a new cross-chain swap (Stellar -> ETH) with enhanced Fusion+ integration
     * @param {Object} swapParams - Swap parameters
     * @returns {Promise<Object>} Swap creation result
     */
    async createStellarToEthSwap(swapParams) {
        try {
            const {
                ethReceiver,
                stellarAmount,
                ethAmount,
                stellarAssetCode,
                stellarAssetIssuer,
                timelock = 3600
            } = swapParams;

            const { secret, hash } = StellarHTLC.generateSecret();
            const hashlock = '0x' + hash;
            const timelockTimestamp = Math.floor(Date.now() / 1000) + timelock;

            console.log('🔄 Creating Stellar → ETH swap with Fusion+ integration...');
            console.log('📊 Swap Parameters:');
            console.log(`   Stellar Amount: ${stellarAmount} ${stellarAssetCode}`);
            console.log(`   ETH Amount: ${ethAmount} ETH`);
            console.log(`   Receiver: ${ethReceiver}`);
            console.log(`   Timelock: ${timelock} seconds`);

            // Step 1: Create Stellar HTLC
            console.log('⭐ Creating Stellar HTLC...');
            const stellarResult = await this.stellarHTLC.createHTLC(
                process.env.STELLAR_PRIVATE_KEY,
                ethReceiver,
                stellarAmount.toString(),
                stellarAssetCode,
                stellarAssetIssuer,
                hashlock,
                timelock
            );

            if (!stellarResult.success) {
                throw new Error(`Stellar HTLC creation failed: ${stellarResult.error}`);
            }

            console.log('✅ Stellar HTLC created successfully');
            console.log(`📋 Balance ID: ${stellarResult.balanceId}`);

            // Step 2: Create Ethereum HTLC
            console.log('🔒 Creating Ethereum HTLC...');
            const ethTx = await this.htlcContract.newContract(
                ethReceiver,
                hashlock,
                timelockTimestamp,
                { value: ethers.parseEther(ethAmount.toString()) }
            );
            
            const ethReceipt = await ethTx.wait();
            const ethContractId = ethReceipt.logs[0].topics[1];

            console.log('✅ Ethereum HTLC created successfully');
            console.log(`📋 Contract ID: ${ethContractId}`);

            // Step 3: Create Fusion+ intent-based order
            let fusionOrderHash = null;
            let auctionMonitor = null;
            
            try {
                console.log('🎯 Creating Fusion+ intent-based order...');
                const fusionOrder = await this.fusionClient.createIntentBasedOrder({
                    makerAsset: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
                    takerAsset: '0x0000000000000000000000000000000000000000',
                    makingAmount: stellarAmount,
                    takingAmount: ethers.parseEther(ethAmount.toString()),
                    maker: this.ethWallet.address,
                    receiver: this.ethWallet.address,
                    hashlock: hashlock,
                    timelock: timelock
                });

                if (fusionOrder.success) {
                    fusionOrderHash = fusionOrder.orderHash;
                    console.log('✅ Fusion+ intent-based order created successfully');
                    console.log(`📋 Order Hash: ${fusionOrderHash}`);

                    // Start monitoring Dutch auction
                    auctionMonitor = await this.fusionClient.monitorDutchAuction(
                        fusionOrderHash,
                        (update) => this.handleAuctionUpdate(update)
                    );
                } else {
                    console.log('⚠️  Fusion+ order failed (testnet limitation)');
                }
            } catch (error) {
                console.log('⚠️  Fusion+ not available on testnet, proceeding with HTLC-only swap');
            }

            const swapId = ethers.keccak256(ethers.toUtf8Bytes(secret + Date.now()));
            const swapData = {
                id: swapId,
                type: 'STELLAR_TO_ETH',
                secret: secret,
                hashlock: hashlock,
                ethContractId: ethContractId,
                stellarBalanceId: stellarResult.balanceId,
                fusionOrderHash: fusionOrderHash,
                auctionMonitor: auctionMonitor,
                status: 'ACTIVE',
                timelock: timelockTimestamp,
                createdAt: Date.now(),
                statusHistory: [
                    { timestamp: Date.now(), status: 'CREATED', message: 'Swap initiated' },
                    { timestamp: Date.now(), status: 'STELLAR_HTLC_CREATED', message: `Stellar HTLC: ${stellarResult.balanceId}` },
                    { timestamp: Date.now(), status: 'ETH_HTLC_CREATED', message: `ETH HTLC: ${ethContractId}` }
                ],
                fusionStatus: fusionOrderHash ? 'AUCTION_ACTIVE' : 'NOT_AVAILABLE'
            };

            this.activeSwaps.set(swapId, swapData);

            console.log('🎉 Cross-chain swap created successfully!');
            console.log('📋 Final Swap Details:');
            console.log('- Swap ID:', swapId);
            console.log('- Secret:', secret);
            console.log('- ETH Contract ID:', ethContractId);
            console.log('- Stellar Balance ID:', stellarResult.balanceId);
            console.log('- Fusion Order Hash:', fusionOrderHash);
            console.log('- Status: ACTIVE');

            this.logStatus('SWAP_CREATED', `Swap ${swapId} created successfully`);

            return {
                success: true,
                swapId: swapId,
                secret: secret,
                ethContractId: ethContractId,
                stellarBalanceId: stellarResult.balanceId,
                fusionOrderHash: fusionOrderHash,
                fusionStatus: swapData.fusionStatus,
                auctionActive: !!fusionOrderHash
            };

        } catch (error) {
            console.error('❌ Failed to create Stellar → ETH swap:', error);
            this.logStatus('ERROR', `Swap creation failed: ${error.message}`);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Process secret reveal and complete swap with enhanced logging
     * @param {string} swapId - Swap ID
     * @param {string} preimage - Revealed secret
     */
    async processSecretReveal(swapId, preimage) {
        try {
            const swap = this.activeSwaps.get(swapId);
            if (!swap) {
                throw new Error('Swap not found');
            }

            // Verify preimage
            if (!StellarHTLC.verifyPreimage(preimage, swap.hashlock.slice(2))) {
                throw new Error('Invalid preimage');
            }

            console.log(`🎯 Processing secret reveal for swap ${swapId}`);
            console.log(`🔐 Preimage verified successfully`);

            // Stop auction monitoring if active
            if (swap.auctionMonitor && swap.auctionMonitor.stopMonitoring) {
                swap.auctionMonitor.stopMonitoring();
            }

            if (swap.type === 'ETH_TO_STELLAR') {
                console.log('💰 Withdrawing from Ethereum HTLC...');
                const ethTx = await this.htlcContract.withdraw(
                    swap.ethContractId,
                    '0x' + preimage
                );
                await ethTx.wait();
                console.log('✅ ETH HTLC withdrawn successfully');

            } else if (swap.type === 'STELLAR_TO_ETH') {
                console.log('💰 Claiming from Stellar HTLC...');
                const stellarResult = await this.stellarHTLC.claimHTLC(
                    process.env.STELLAR_PRIVATE_KEY,
                    swap.stellarBalanceId,
                    preimage
                );
                
                if (stellarResult.success) {
                    console.log('✅ Stellar HTLC claimed successfully');
                }
            }

            // Update swap status
            swap.status = 'COMPLETED';
            swap.completedAt = Date.now();
            swap.statusHistory.push({
                timestamp: Date.now(),
                status: 'COMPLETED',
                message: 'Swap completed successfully'
            });
            
            console.log('🎉 Swap completed successfully!');
            this.logStatus('SWAP_COMPLETED', `Swap ${swapId} completed successfully`);
            
            return {
                success: true,
                message: 'Swap completed successfully',
                completedAt: swap.completedAt
            };

        } catch (error) {
            console.error('❌ Failed to process secret reveal:', error);
            this.logStatus('ERROR', `Secret reveal failed: ${error.message}`);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Set up event listeners for HTLC contracts with enhanced logging
     * @private
     */
    setupEventListeners() {
        // Listen for HTLC withdrawals
        this.htlcContract.on('HTLCWithdraw', async (contractId) => {
            console.log('💰 HTLC withdrawal detected:', contractId);
            this.logStatus('HTLC_WITHDRAWAL', `Contract ${contractId} withdrawn`);
            
            // Find corresponding swap
            for (const [swapId, swap] of this.activeSwaps) {
                if (swap.ethContractId === contractId) {
                    // Get the preimage from the contract
                    const contractDetails = await this.htlcContract.getContract(contractId);
                    const preimage = contractDetails[7]; // preimage is at index 7
                    
                    if (preimage !== '0x0000000000000000000000000000000000000000000000000000000000000000') {
                        await this.processSecretReveal(swapId, preimage.slice(2));
                    }
                    break;
                }
            }
        });

        // Listen for HTLC refunds
        this.htlcContract.on('HTLCRefund', (contractId) => {
            console.log('💸 HTLC refund detected:', contractId);
            this.logStatus('HTLC_REFUND', `Contract ${contractId} refunded`);
            
            // Update corresponding swap status
            for (const [swapId, swap] of this.activeSwaps) {
                if (swap.ethContractId === contractId) {
                    swap.status = 'REFUNDED';
                    swap.refundedAt = Date.now();
                    swap.statusHistory.push({
                        timestamp: Date.now(),
                        status: 'REFUNDED',
                        message: 'Swap refunded due to timeout'
                    });
                    break;
                }
            }
        });
    }

    /**
     * Get enhanced swap status with detailed information
     * @param {string} swapId - Swap ID
     * @returns {Object} Enhanced swap status
     */
    getSwapStatus(swapId) {
        const swap = this.activeSwaps.get(swapId);
        if (!swap) {
            return { success: false, error: 'Swap not found' };
        }
        
        // Get Fusion+ auction stats if available
        let auctionStats = null;
        if (swap.fusionOrderHash) {
            auctionStats = this.fusionClient.getAuctionStats(swap.fusionOrderHash);
        }
        
        return {
            success: true,
            swap: {
                id: swap.id,
                type: swap.type,
                status: swap.status,
                timelock: swap.timelock,
                createdAt: swap.createdAt,
                completedAt: swap.completedAt,
                refundedAt: swap.refundedAt,
                fusionOrderHash: swap.fusionOrderHash,
                fusionStatus: swap.fusionStatus,
                statusHistory: swap.statusHistory,
                auctionStats: auctionStats?.success ? auctionStats.stats : null
            }
        };
    }

    /**
     * Log status updates for tracking
     * @param {string} status - Status type
     * @param {string} message - Status message
     */
    logStatus(status, message) {
        const statusEntry = {
            timestamp: Date.now(),
            status: status,
            message: message
        };
        
        this.statusHistory.push(statusEntry);
        console.log(`📊 [${status}] ${message}`);
    }

    /**
     * Get system status and statistics
     * @returns {Object} System status
     */
    getSystemStatus() {
        const activeSwaps = Array.from(this.activeSwaps.values());
        const completedSwaps = activeSwaps.filter(s => s.status === 'COMPLETED');
        const pendingSwaps = activeSwaps.filter(s => s.status === 'ACTIVE');
        const refundedSwaps = activeSwaps.filter(s => s.status === 'REFUNDED');

        return {
            totalSwaps: activeSwaps.length,
            completedSwaps: completedSwaps.length,
            pendingSwaps: pendingSwaps.length,
            refundedSwaps: refundedSwaps.length,
            fusionOrders: activeSwaps.filter(s => s.fusionOrderHash).length,
            lastStatusUpdate: this.statusHistory[this.statusHistory.length - 1]
        };
    }

    /**
     * Start the relayer service with enhanced monitoring
     */
    async start() {
        console.log('🚀 CrossChainRelayer service started with enhanced monitoring');
        this.logStatus('SERVICE_STARTED', 'Relayer service is running');
        
        // Monitor for timeouts and handle refunds
        setInterval(() => {
            this.checkTimeouts();
        }, 30000); // Check every 30 seconds

        // Log system status periodically
        setInterval(() => {
            const status = this.getSystemStatus();
            console.log('📊 System Status:', status);
        }, 60000); // Log every minute
    }

    /**
     * Check for timed out swaps and process refunds with enhanced logging
     * @private
     */
    async checkTimeouts() {
        const now = Math.floor(Date.now() / 1000);
        
        for (const [swapId, swap] of this.activeSwaps) {
            if (swap.status === 'ACTIVE' && now > swap.timelock) {
                console.log(`⏰ Swap ${swapId} timed out, processing refund...`);
                
                try {
                    // Stop auction monitoring if active
                    if (swap.auctionMonitor && swap.auctionMonitor.stopMonitoring) {
                        swap.auctionMonitor.stopMonitoring();
                    }

                    // Refund Ethereum HTLC
                    console.log('💸 Refunding Ethereum HTLC...');
                    const ethTx = await this.htlcContract.refund(swap.ethContractId);
                    await ethTx.wait();
                    console.log('✅ Ethereum HTLC refunded successfully');
                    
                    // Refund Stellar HTLC
                    console.log('💸 Refunding Stellar HTLC...');
                    const stellarResult = await this.stellarHTLC.refundHTLC(
                        process.env.STELLAR_PRIVATE_KEY,
                        swap.stellarBalanceId
                    );
                    
                    if (stellarResult.success) {
                        console.log('✅ Stellar HTLC refunded successfully');
                    }
                    
                    swap.status = 'REFUNDED';
                    swap.refundedAt = Date.now();
                    swap.statusHistory.push({
                        timestamp: Date.now(),
                        status: 'REFUNDED',
                        message: 'Swap refunded due to timeout'
                    });
                    
                    console.log(`✅ Swap ${swapId} refunded successfully`);
                    this.logStatus('SWAP_REFUNDED', `Swap ${swapId} refunded due to timeout`);
                } catch (error) {
                    console.error(`❌ Failed to refund swap ${swapId}:`, error);
                    this.logStatus('ERROR', `Refund failed for swap ${swapId}: ${error.message}`);
                }
            }
        }
    }
}

module.exports = CrossChainRelayer;