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
        
        // Active swaps tracking
        this.activeSwaps = new Map();
        
        console.log('CrossChainRelayer initialized');
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
            
            console.log(`Relayer initialized with HTLC contract: ${htlcContractAddress}`);
            return true;
        } catch (error) {
            console.error('Failed to initialize relayer:', error);
            return false;
        }
    }

    /**
     * Create a new cross-chain swap (ETH -> Stellar)
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

            console.log('Creating ETH -> Stellar swap...');
            console.log('Secret:', secret);
            console.log('Hashlock:', hashlock);

            // Step 1: Create Fusion+ order (testnet limitation handling)
            let fusionOrderHash = null;
            try {
                const fusionOrder = await this.fusionClient.createOrder({
                    makerAsset: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', // ETH
                    takerAsset: '0x0000000000000000000000000000000000000000', // Placeholder for Stellar asset
                    makingAmount: ethers.parseEther(ethAmount.toString()),
                    takingAmount: stellarAmount,
                    maker: this.ethWallet.address,
                    receiver: this.ethWallet.address, // Use valid Ethereum address
                    hashlock: hashlock,
                    timelock: timelock
                });

                if (fusionOrder.success) {
                    fusionOrderHash = fusionOrder.orderHash;
                    console.log('✅ Fusion+ order created:', fusionOrderHash);
                } else {
                    console.log('⚠️  Fusion+ order failed (testnet limitation):', fusionOrder.error);
                }
            } catch (error) {
                console.log('⚠️  Fusion+ not available on testnet, proceeding with HTLC-only swap');
            }

            // Step 2: Create Ethereum HTLC
            const ethTx = await this.htlcContract.newContract(
                this.ethWallet.address,
                hashlock,
                timelockTimestamp,
                { value: ethers.parseEther(ethAmount.toString()) }
            );
            
            const ethReceipt = await ethTx.wait();
            const ethContractId = ethReceipt.logs[0].topics[1]; // Extract contract ID from event

            // Step 3: Create Stellar HTLC
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

            // Store swap details
            const swapId = ethers.keccak256(ethers.toUtf8Bytes(secret + Date.now()));
            this.activeSwaps.set(swapId, {
                id: swapId,
                type: 'ETH_TO_STELLAR',
                secret: secret,
                hashlock: hashlock,
                ethContractId: ethContractId,
                stellarBalanceId: stellarResult.balanceId,
                fusionOrderHash: fusionOrderHash,
                status: 'ACTIVE',
                timelock: timelockTimestamp,
                createdAt: Date.now()
            });

            console.log('Cross-chain swap created successfully');
            console.log('Swap ID:', swapId);
            console.log('ETH Contract ID:', ethContractId);
            console.log('Stellar Balance ID:', stellarResult.balanceId);

            return {
                success: true,
                swapId: swapId,
                secret: secret,
                ethContractId: ethContractId,
                stellarBalanceId: stellarResult.balanceId,
                fusionOrderHash: fusionOrderHash
            };

        } catch (error) {
            console.error('Failed to create ETH -> Stellar swap:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Create a new cross-chain swap (Stellar -> ETH)
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

            console.log('Creating Stellar -> ETH swap...');

            // Step 1: Create Stellar HTLC
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

            // Step 2: Create Ethereum HTLC
            const ethTx = await this.htlcContract.newContract(
                ethReceiver,
                hashlock,
                timelockTimestamp,
                { value: ethers.parseEther(ethAmount.toString()) }
            );
            
            const ethReceipt = await ethTx.wait();
            const ethContractId = ethReceipt.logs[0].topics[1];

            // Step 3: Create Fusion+ order (testnet limitation handling)
            let fusionOrderHash = null;
            try {
                const fusionOrder = await this.fusionClient.createOrder({
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
                } else {
                    console.log('⚠️  Fusion+ order failed (testnet limitation)');
                }
            } catch (error) {
                console.log('⚠️  Fusion+ not available on testnet, proceeding with HTLC-only swap');
            }

            const swapId = ethers.keccak256(ethers.toUtf8Bytes(secret + Date.now()));
            this.activeSwaps.set(swapId, {
                id: swapId,
                type: 'STELLAR_TO_ETH',
                secret: secret,
                hashlock: hashlock,
                ethContractId: ethContractId,
                stellarBalanceId: stellarResult.balanceId,
                fusionOrderHash: fusionOrder.orderHash,
                status: 'ACTIVE',
                timelock: timelockTimestamp,
                createdAt: Date.now()
            });

            return {
                success: true,
                swapId: swapId,
                secret: secret,
                ethContractId: ethContractId,
                stellarBalanceId: stellarResult.balanceId,
                fusionOrderHash: fusionOrder.orderHash
            };

        } catch (error) {
            console.error('Failed to create Stellar -> ETH swap:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Process secret reveal and complete swap
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

            console.log(`Processing secret reveal for swap ${swapId}`);

            if (swap.type === 'ETH_TO_STELLAR') {
                // Withdraw from Ethereum HTLC
                const ethTx = await this.htlcContract.withdraw(
                    swap.ethContractId,
                    '0x' + preimage
                );
                await ethTx.wait();
                console.log('ETH HTLC withdrawn successfully');

            } else if (swap.type === 'STELLAR_TO_ETH') {
                // Claim from Stellar HTLC
                const stellarResult = await this.stellarHTLC.claimHTLC(
                    process.env.STELLAR_PRIVATE_KEY,
                    swap.stellarBalanceId,
                    preimage
                );
                
                if (stellarResult.success) {
                    console.log('Stellar HTLC claimed successfully');
                }
            }

            // Update swap status
            swap.status = 'COMPLETED';
            swap.completedAt = Date.now();
            
            return {
                success: true,
                message: 'Swap completed successfully'
            };

        } catch (error) {
            console.error('Failed to process secret reveal:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Set up event listeners for HTLC contracts
     * @private
     */
    setupEventListeners() {
        // Listen for HTLC withdrawals
        this.htlcContract.on('HTLCWithdraw', async (contractId) => {
            console.log('HTLC withdrawal detected:', contractId);
            
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
            console.log('HTLC refund detected:', contractId);
            // Handle refund logic
        });
    }

    /**
     * Get swap status
     * @param {string} swapId - Swap ID
     * @returns {Object} Swap status
     */
    getSwapStatus(swapId) {
        const swap = this.activeSwaps.get(swapId);
        if (!swap) {
            return { success: false, error: 'Swap not found' };
        }
        
        return {
            success: true,
            swap: {
                id: swap.id,
                type: swap.type,
                status: swap.status,
                timelock: swap.timelock,
                createdAt: swap.createdAt,
                completedAt: swap.completedAt
            }
        };
    }

    /**
     * Start the relayer service
     */
    async start() {
        console.log('CrossChainRelayer service started');
        
        // Monitor for timeouts and handle refunds
        setInterval(() => {
            this.checkTimeouts();
        }, 30000); // Check every 30 seconds
    }

    /**
     * Check for timed out swaps and process refunds
     * @private
     */
    async checkTimeouts() {
        const now = Math.floor(Date.now() / 1000);
        
        for (const [swapId, swap] of this.activeSwaps) {
            if (swap.status === 'ACTIVE' && now > swap.timelock) {
                console.log(`Swap ${swapId} timed out, processing refund...`);
                
                try {
                    // Refund Ethereum HTLC
                    const ethTx = await this.htlcContract.refund(swap.ethContractId);
                    await ethTx.wait();
                    
                    // Refund Stellar HTLC
                    await this.stellarHTLC.refundHTLC(
                        process.env.STELLAR_PRIVATE_KEY,
                        swap.stellarBalanceId
                    );
                    
                    swap.status = 'REFUNDED';
                    swap.refundedAt = Date.now();
                    
                    console.log(`Swap ${swapId} refunded successfully`);
                } catch (error) {
                    console.error(`Failed to refund swap ${swapId}:`, error);
                }
            }
        }
    }
}

module.exports = CrossChainRelayer;