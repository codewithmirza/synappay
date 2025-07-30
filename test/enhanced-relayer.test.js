const { expect } = require('chai');
const { ethers } = require('ethers');
const CrossChainRelayer = require('../src/relayer/index');
const FusionClient = require('../src/fusion/client');
const StellarHTLC = require('../src/stellar/htlc');

describe('Enhanced CrossChain Relayer Tests', () => {
    let relayer;
    let mockHtlcAddress = '0x1234567890123456789012345678901234567890';

    beforeEach(() => {
        // Mock environment variables
        process.env.SEPOLIA_RPC_URL = 'https://sepolia.infura.io/v3/test';
        process.env.PRIVATE_KEY = '0x1234567890123456789012345678901234567890123456789012345678901234';
        process.env.STELLAR_HORIZON_URL = 'https://horizon-testnet.stellar.org';
        process.env.STELLAR_PRIVATE_KEY = 'S1234567890123456789012345678901234567890123456789012345678901234';
        process.env.ONEINCH_API_KEY = 'test_api_key';

        relayer = new CrossChainRelayer();
    });

    describe('Initialization', () => {
        it('should initialize relayer with HTLC contract', async () => {
            const result = await relayer.initialize(mockHtlcAddress);
            expect(result).to.be.true;
        });

        it('should handle initialization failure gracefully', async () => {
            // Test with invalid contract address
            const result = await relayer.initialize('0x0000000000000000000000000000000000000000');
            expect(result).to.be.false;
        });
    });

    describe('Fusion+ Integration', () => {
        it('should create intent-based orders', async () => {
            await relayer.initialize(mockHtlcAddress);
            
            const orderParams = {
                makerAsset: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
                takerAsset: '0x0000000000000000000000000000000000000000',
                makingAmount: ethers.parseEther('0.1'),
                takingAmount: '1000000',
                maker: '0x1234567890123456789012345678901234567890',
                receiver: '0x1234567890123456789012345678901234567890',
                hashlock: '0x1234567890123456789012345678901234567890123456789012345678901234',
                timelock: 3600
            };

            const result = await relayer.fusionClient.createIntentBasedOrder(orderParams);
            
            // Should handle testnet limitations gracefully
            expect(result).to.have.property('success');
        });

        it('should monitor Dutch auctions', async () => {
            await relayer.initialize(mockHtlcAddress);
            
            let callbackCalled = false;
            const mockOrderHash = '0x1234567890123456789012345678901234567890123456789012345678901234';
            
            const monitor = await relayer.fusionClient.monitorDutchAuction(
                mockOrderHash,
                (update) => {
                    callbackCalled = true;
                    expect(update).to.have.property('type');
                }
            );

            expect(monitor).to.have.property('success');
            expect(monitor.stopMonitoring).to.be.a('function');
        });

        it('should get optimized quotes', async () => {
            await relayer.initialize(mockHtlcAddress);
            
            const quoteParams = {
                fromTokenAddress: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
                toTokenAddress: '0xA0b86a33E6441b8c4C8C1C1C1C1C1C1C1C1C1C1C',
                amount: ethers.parseEther('0.1').toString()
            };

            const result = await relayer.fusionClient.getOptimizedQuote(quoteParams);
            expect(result).to.have.property('success');
        });
    });

    describe('ETH to Stellar Swap', () => {
        it('should create ETH to Stellar swap with Fusion+ integration', async () => {
            await relayer.initialize(mockHtlcAddress);
            
            const swapParams = {
                stellarReceiver: 'G1234567890123456789012345678901234567890123456789012345678901234',
                ethAmount: 0.1,
                stellarAmount: '1000000',
                stellarAssetCode: 'XLM',
                stellarAssetIssuer: null,
                timelock: 3600
            };

            const result = await relayer.createEthToStellarSwap(swapParams);
            
            expect(result).to.have.property('success');
            if (result.success) {
                expect(result).to.have.property('swapId');
                expect(result).to.have.property('secret');
                expect(result).to.have.property('ethContractId');
                expect(result).to.have.property('stellarBalanceId');
                expect(result).to.have.property('fusionOrderHash');
                expect(result).to.have.property('fusionStatus');
                expect(result).to.have.property('auctionActive');
            }
        });

        it('should handle swap creation errors gracefully', async () => {
            await relayer.initialize(mockHtlcAddress);
            
            // Test with invalid parameters
            const swapParams = {
                stellarReceiver: 'invalid_address',
                ethAmount: -1, // Invalid amount
                stellarAmount: '1000000',
                stellarAssetCode: 'XLM',
                stellarAssetIssuer: null,
                timelock: 3600
            };

            const result = await relayer.createEthToStellarSwap(swapParams);
            expect(result.success).to.be.false;
            expect(result).to.have.property('error');
        });
    });

    describe('Stellar to ETH Swap', () => {
        it('should create Stellar to ETH swap with Fusion+ integration', async () => {
            await relayer.initialize(mockHtlcAddress);
            
            const swapParams = {
                ethReceiver: '0x1234567890123456789012345678901234567890',
                stellarAmount: '1000000',
                ethAmount: 0.1,
                stellarAssetCode: 'XLM',
                stellarAssetIssuer: null,
                timelock: 3600
            };

            const result = await relayer.createStellarToEthSwap(swapParams);
            
            expect(result).to.have.property('success');
            if (result.success) {
                expect(result).to.have.property('swapId');
                expect(result).to.have.property('secret');
                expect(result).to.have.property('ethContractId');
                expect(result).to.have.property('stellarBalanceId');
                expect(result).to.have.property('fusionOrderHash');
                expect(result).to.have.property('fusionStatus');
                expect(result).to.have.property('auctionActive');
            }
        });
    });

    describe('Secret Reveal and Completion', () => {
        it('should process secret reveal correctly', async () => {
            await relayer.initialize(mockHtlcAddress);
            
            // Create a swap first
            const swapParams = {
                stellarReceiver: 'G1234567890123456789012345678901234567890123456789012345678901234',
                ethAmount: 0.1,
                stellarAmount: '1000000',
                stellarAssetCode: 'XLM',
                stellarAssetIssuer: null,
                timelock: 3600
            };

            const swapResult = await relayer.createEthToStellarSwap(swapParams);
            expect(swapResult.success).to.be.true;

            // Process secret reveal
            const revealResult = await relayer.processSecretReveal(
                swapResult.swapId,
                swapResult.secret
            );

            expect(revealResult).to.have.property('success');
        });

        it('should reject invalid preimages', async () => {
            await relayer.initialize(mockHtlcAddress);
            
            const result = await relayer.processSecretReveal(
                'invalid_swap_id',
                'invalid_preimage'
            );

            expect(result.success).to.be.false;
            expect(result).to.have.property('error');
        });
    });

    describe('Status Tracking', () => {
        it('should track swap status correctly', async () => {
            await relayer.initialize(mockHtlcAddress);
            
            // Create a swap
            const swapParams = {
                stellarReceiver: 'G1234567890123456789012345678901234567890123456789012345678901234',
                ethAmount: 0.1,
                stellarAmount: '1000000',
                stellarAssetCode: 'XLM',
                stellarAssetIssuer: null,
                timelock: 3600
            };

            const swapResult = await relayer.createEthToStellarSwap(swapParams);
            expect(swapResult.success).to.be.true;

            // Get status
            const statusResult = relayer.getSwapStatus(swapResult.swapId);
            expect(statusResult.success).to.be.true;
            expect(statusResult.swap).to.have.property('id');
            expect(statusResult.swap).to.have.property('status');
            expect(statusResult.swap).to.have.property('type');
            expect(statusResult.swap).to.have.property('fusionStatus');
            expect(statusResult.swap).to.have.property('statusHistory');
        });

        it('should return error for non-existent swap', () => {
            const result = relayer.getSwapStatus('non_existent_swap_id');
            expect(result.success).to.be.false;
            expect(result).to.have.property('error');
        });
    });

    describe('System Status', () => {
        it('should provide system status information', async () => {
            await relayer.initialize(mockHtlcAddress);
            
            const status = relayer.getSystemStatus();
            expect(status).to.have.property('totalSwaps');
            expect(status).to.have.property('completedSwaps');
            expect(status).to.have.property('pendingSwaps');
            expect(status).to.have.property('refundedSwaps');
            expect(status).to.have.property('fusionOrders');
            expect(status).to.have.property('lastStatusUpdate');
        });
    });

    describe('Error Handling', () => {
        it('should handle network errors gracefully', async () => {
            // Test with invalid RPC URL
            process.env.SEPOLIA_RPC_URL = 'https://invalid-url.com';
            
            const newRelayer = new CrossChainRelayer();
            const result = await newRelayer.initialize(mockHtlcAddress);
            
            // Should handle the error gracefully
            expect(result).to.be.false;
        });

        it('should handle Fusion+ API errors', async () => {
            await relayer.initialize(mockHtlcAddress);
            
            // Test with invalid API key
            relayer.fusionClient.apiKey = 'invalid_key';
            
            const result = await relayer.fusionClient.getSupportedTokens();
            expect(result.success).to.be.false;
            expect(result).to.have.property('error');
        });
    });

    describe('Timeout and Refund Handling', () => {
        it('should detect and handle timeouts', async () => {
            await relayer.initialize(mockHtlcAddress);
            
            // Create a swap with very short timelock
            const swapParams = {
                stellarReceiver: 'G1234567890123456789012345678901234567890123456789012345678901234',
                ethAmount: 0.1,
                stellarAmount: '1000000',
                stellarAssetCode: 'XLM',
                stellarAssetIssuer: null,
                timelock: 1 // 1 second timelock
            };

            const swapResult = await relayer.createEthToStellarSwap(swapParams);
            expect(swapResult.success).to.be.true;

            // Wait for timeout
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Check that timeout handling works
            const status = relayer.getSwapStatus(swapResult.swapId);
            expect(status.success).to.be.true;
        });
    });

    describe('Integration Tests', () => {
        it('should complete full swap lifecycle', async () => {
            await relayer.initialize(mockHtlcAddress);
            
            // Step 1: Create swap
            const swapParams = {
                stellarReceiver: 'G1234567890123456789012345678901234567890123456789012345678901234',
                ethAmount: 0.1,
                stellarAmount: '1000000',
                stellarAssetCode: 'XLM',
                stellarAssetIssuer: null,
                timelock: 3600
            };

            const swapResult = await relayer.createEthToStellarSwap(swapParams);
            expect(swapResult.success).to.be.true;

            // Step 2: Check status
            const statusResult = relayer.getSwapStatus(swapResult.swapId);
            expect(statusResult.success).to.be.true;
            expect(statusResult.swap.status).to.equal('ACTIVE');

            // Step 3: Complete swap
            const completeResult = await relayer.processSecretReveal(
                swapResult.swapId,
                swapResult.secret
            );
            expect(completeResult.success).to.be.true;

            // Step 4: Verify completion
            const finalStatus = relayer.getSwapStatus(swapResult.swapId);
            expect(finalStatus.success).to.be.true;
            expect(finalStatus.swap.status).to.equal('COMPLETED');
        });
    });
}); 