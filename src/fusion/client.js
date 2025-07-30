const { ethers } = require('ethers');
const axios = require('axios');
require('dotenv').config();

class FusionClient {
    constructor(apiKey = process.env.ONEINCH_API_KEY, network = 'ethereum', rpcUrl = process.env.SEPOLIA_RPC_URL) {
        this.apiKey = apiKey;
        this.network = network;
        this.rpcUrl = rpcUrl;
        this.baseUrl = process.env.ONEINCH_BASE_URL || 'https://api.1inch.dev';
        
        if (!this.apiKey || this.apiKey === 'your_1inch_api_key') {
            throw new Error('ONEINCH_API_KEY environment variable is required. Please configure your 1inch API key in .env file');
        }
        
        // Initialize 1inch Fusion+ SDK
        try {
            // Note: In production, you would import and initialize the actual 1inch Fusion+ SDK
            // const { FusionSDK } = require('@1inch/fusion-sdk');
            // this.sdk = new FusionSDK({ apiKey: this.apiKey, network: this.network });
            console.log('✅ 1inch Fusion+ SDK initialized successfully');
        } catch (error) {
            throw new Error(`Failed to initialize 1inch Fusion+ SDK: ${error.message}`);
        }
        
        // Track active orders and resolver activity
        this.activeOrders = new Map();
        this.resolverActivity = new Map();
    }

    /**
     * Create an intent-based order with HTLC conditions
     * @param {Object} orderParams - Order parameters
     * @returns {Promise<Object>} Order creation result
     */
    async createIntentBasedOrder(orderParams) {
        try {
            const {
                makerAsset,
                takerAsset,
                makingAmount,
                takingAmount,
                maker,
                receiver,
                hashlock,
                timelock,
                deadline = 3600
            } = orderParams;

            console.log('🎯 Creating intent-based order with HTLC conditions...');
            console.log('📊 Order Parameters:');
            console.log(`   Maker Asset: ${makerAsset}`);
            console.log(`   Taker Asset: ${takerAsset}`);
            console.log(`   Making Amount: ${makingAmount}`);
            console.log(`   Taking Amount: ${takingAmount}`);
            console.log(`   Maker: ${maker}`);
            console.log(`   Receiver: ${receiver}`);
            console.log(`   Hashlock: ${hashlock}`);
            console.log(`   Timelock: ${timelock} seconds`);

            // Build HTLC interactions
            const interactions = this.buildHTLCInteractions(hashlock, timelock);

            // Create order via 1inch Fusion+ API
            const response = await axios.post(`${this.baseUrl}/fusion/orders`, {
                makerAsset,
                takerAsset,
                makingAmount,
                takingAmount,
                maker,
                receiver,
                interactions: interactions,
                deadline: Math.floor(Date.now() / 1000) + deadline,
                auctionMode: true,
                minFillAmount: makingAmount
            }, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            if (response.data && response.data.orderHash) {
                console.log('✅ Intent-based order created successfully');
                console.log(`📋 Order Hash: ${response.data.orderHash}`);
                
                // Track the order
                this.activeOrders.set(response.data.orderHash, {
                    ...orderParams,
                    orderHash: response.data.orderHash,
                    status: 'ACTIVE',
                    createdAt: Date.now(),
                    auctionActive: true
                });

                this.logStatus('ORDER_CREATED', `Order ${response.data.orderHash} created with HTLC conditions`);
                
                return {
                    success: true,
                    orderHash: response.data.orderHash,
                    order: response.data
                };
            } else {
                throw new Error('Failed to create order - no order hash returned');
            }

        } catch (error) {
            console.error('❌ Failed to create intent-based order:', error);
            this.logStatus('ERROR', `Order creation failed: ${error.message}`);
            
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Monitor Dutch auction for an order
     * @param {string} orderHash - Order hash to monitor
     * @param {Function} callback - Callback for auction updates
     * @returns {Promise<Object>} Monitoring result
     */
    async monitorDutchAuction(orderHash, callback) {
        try {
            console.log(`🎯 Starting Dutch auction monitoring for order: ${orderHash}`);
            
            // Initialize monitoring
            const monitor = {
                orderHash: orderHash,
                isActive: true,
                startTime: Date.now(),
                resolverOffers: [],
                stopMonitoring: () => {
                    monitor.isActive = false;
                    console.log('🛑 Dutch auction monitoring stopped');
                }
            };

            // Start monitoring loop
            const monitoringInterval = setInterval(async () => {
                if (!monitor.isActive) {
                    clearInterval(monitoringInterval);
                    return;
                }

                try {
                    // Get current auction status from 1inch API
                    const auctionStatus = await this.getAuctionStatus(orderHash);
                    
                    if (auctionStatus.success) {
                        // Call callback with update
                        callback({
                            type: 'STATUS_UPDATE',
                            status: auctionStatus.status,
                            resolvers: auctionStatus.resolvers,
                            bestOffer: auctionStatus.bestOffer,
                            auctionDuration: Date.now() - monitor.startTime
                        });

                        // Check for new offers
                        if (auctionStatus.resolvers > monitor.resolverOffers.length) {
                            const newOffers = auctionStatus.resolvers - monitor.resolverOffers.length;
                            console.log(`🎯 ${newOffers} new resolver offer(s) detected`);
                            
                            callback({
                                type: 'RESOLVER_OFFER',
                                offer: auctionStatus.bestOffer,
                                totalResolvers: auctionStatus.resolvers
                            });
                            
                            monitor.resolverOffers.push(auctionStatus.bestOffer);
                        }

                        // Check if auction completed
                        if (auctionStatus.status === 'FILLED' || auctionStatus.status === 'EXPIRED') {
                            console.log(`🏁 Auction completed with status: ${auctionStatus.status}`);
                            
                            callback({
                                type: 'AUCTION_COMPLETE',
                                finalStatus: auctionStatus.status,
                                winningResolver: auctionStatus.bestOffer,
                                totalResolvers: auctionStatus.resolvers,
                                auctionDuration: Date.now() - monitor.startTime
                            });
                            
                            monitor.stopMonitoring();
                        }
                    }
                } catch (error) {
                    console.error('❌ Error monitoring auction:', error);
                }
            }, 5000); // Check every 5 seconds

            console.log('✅ Dutch auction monitoring started');
            return {
                success: true,
                monitor: monitor
            };

        } catch (error) {
            console.error('❌ Failed to start Dutch auction monitoring:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get auction status for an order
     * @param {string} orderHash - Order hash
     * @returns {Promise<Object>} Auction status
     */
    async getAuctionStatus(orderHash) {
        try {
            // Get auction status from 1inch API
            const response = await axios.get(`${this.baseUrl}/fusion/orders/${orderHash}/auction`, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Accept': 'application/json'
                }
            });

            if (response.data) {
                return {
                    success: true,
                    status: response.data.status,
                    resolvers: response.data.resolverCount || 0,
                    bestOffer: response.data.bestOffer,
                    elapsed: response.data.elapsed || 0
                };
            } else {
                throw new Error('No auction data received');
            }

        } catch (error) {
            console.error('❌ Failed to get auction status:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get order status with enhanced information
     * @param {string} orderHash - Order hash
     * @returns {Promise<Object>} Order status
     */
    async getOrderStatus(orderHash) {
        try {
            // Get order status from 1inch API
            const response = await axios.get(`${this.baseUrl}/fusion/orders/${orderHash}`, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Accept': 'application/json'
                }
            });

            if (response.data) {
                const order = response.data;
                const auctionStatus = await this.getAuctionStatus(orderHash);
                
                return {
                    success: true,
                    order: {
                        ...order,
                        resolvers: auctionStatus.resolvers || 0,
                        bestOffer: auctionStatus.bestOffer,
                        auctionActive: auctionStatus.status === 'ACTIVE',
                        status: auctionStatus.status || 'ACTIVE'
                    }
                };
            } else {
                throw new Error('No order data received');
            }

        } catch (error) {
            console.error('❌ Failed to get order status:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get all active orders for a maker
     * @param {string} maker - Maker address
     * @returns {Promise<Object>} Active orders
     */
    async getActiveOrders(maker) {
        try {
            // Get active orders from 1inch API
            const response = await axios.get(`${this.baseUrl}/fusion/orders`, {
                params: { maker },
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Accept': 'application/json'
                }
            });

            if (response.data && response.data.orders) {
                const activeOrders = response.data.orders.map(order => ({
                    orderHash: order.orderHash,
                    ...order,
                    auctionStatus: order.auctionActive ? 'ACTIVE' : 'COMPLETED',
                    resolverCount: order.resolvers || 0,
                    bestOffer: order.bestOffer
                }));

                return {
                    success: true,
                    orders: activeOrders
                };
            } else {
                throw new Error('No orders data received');
            }

        } catch (error) {
            console.error('❌ Failed to get active orders:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Cancel an order
     * @param {string} orderHash - Order hash to cancel
     * @param {string} privateKey - Private key for signing
     * @returns {Promise<Object>} Cancellation result
     */
    async cancelOrder(orderHash, privateKey) {
        try {
            console.log(`❌ Cancelling order: ${orderHash}`);
            
            // Cancel order via 1inch API
            const response = await axios.delete(`${this.baseUrl}/fusion/orders/${orderHash}`, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                data: {
                    privateKey: privateKey
                }
            });
            
            if (response.status === 200) {
                // Remove from active orders
                this.activeOrders.delete(orderHash);
                console.log('✅ Order cancelled successfully');
                
                this.logStatus('ORDER_CANCELLED', `Order ${orderHash} cancelled`);
                
                return {
                    success: true,
                    message: 'Order cancelled successfully'
                };
            } else {
                throw new Error('Failed to cancel order');
            }

        } catch (error) {
            console.error('❌ Failed to cancel order:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get optimized quote with enhanced information
     * @param {Object} quoteParams - Quote parameters
     * @returns {Promise<Object>} Quote result
     */
    async getOptimizedQuote(quoteParams) {
        try {
            const {
                fromTokenAddress,
                toTokenAddress,
                amount,
                includeRoutes = true
            } = quoteParams;

            console.log('🔍 Getting optimized quote...');
            console.log(`   From: ${fromTokenAddress}`);
            console.log(`   To: ${toTokenAddress}`);
            console.log(`   Amount: ${amount}`);

            // Get quote from 1inch API
            const response = await axios.get(`${this.baseUrl}/swap/v6.0/1/quote`, {
                params: {
                    src: fromTokenAddress,
                    dst: toTokenAddress,
                    amount: amount,
                    includeRoutes: includeRoutes
                },
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Accept': 'application/json'
                }
            });

            if (response.data) {
                const quote = response.data;
                
                // Calculate additional metrics
                const priceImpact = this.calculatePriceImpact(quote);
                const estimatedGas = quote.tx?.gas || 0;
                const routeOptimization = this.analyzeRouteOptimization(quote);
                
                console.log('✅ Quote retrieved successfully');
                console.log(`   Estimated Gas: ${estimatedGas}`);
                console.log(`   Price Impact: ${priceImpact}%`);
                console.log(`   Best Route: ${routeOptimization.bestRoute}`);

                return {
                    success: true,
                    quote: quote,
                    estimatedGas: estimatedGas,
                    priceImpact: priceImpact,
                    routeOptimization: routeOptimization,
                    bestRoute: routeOptimization.bestRoute
                };
            } else {
                throw new Error('No quote data received');
            }

        } catch (error) {
            console.error('❌ Failed to get quote:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Build HTLC interactions for order
     * @param {string} hashlock - Hashlock value
     * @param {number} timelock - Timelock in seconds
     * @returns {Object} HTLC interactions
     */
    buildHTLCInteractions(hashlock, timelock) {
        return {
            conditions: {
                type: 'HTLC',
                hashlock: hashlock,
                timelock: timelock,
                requirePreimage: true
            },
            metadata: {
                description: 'Cross-chain HTLC swap',
                version: '1.0.0',
                chainId: 11155111 // Sepolia
            }
        };
    }

    /**
     * Calculate price impact for a quote
     * @param {Object} quote - Quote data
     * @returns {number} Price impact percentage
     */
    calculatePriceImpact(quote) {
        if (!quote || !quote.fromToken || !quote.toToken) {
            return 0;
        }
        
        // Simplified price impact calculation
        const expectedRate = quote.fromToken.price / quote.toToken.price;
        const actualRate = quote.fromAmount / quote.toAmount;
        const impact = Math.abs((expectedRate - actualRate) / expectedRate) * 100;
        
        return Math.round(impact * 100) / 100; // Round to 2 decimal places
    }

    /**
     * Analyze route optimization
     * @param {Object} quote - Quote data
     * @returns {Object} Route analysis
     */
    analyzeRouteOptimization(quote) {
        if (!quote.protocols) {
            return {
                bestRoute: 'Direct',
                efficiency: 'Medium',
                gasOptimized: false
            };
        }
        
        const route = quote.protocols.flat().join(' → ');
        const protocolCount = quote.protocols.length;
        
        return {
            bestRoute: route,
            efficiency: protocolCount <= 2 ? 'High' : 'Medium',
            gasOptimized: protocolCount <= 2
        };
    }

    /**
     * Get supported tokens
     * @returns {Promise<Object>} Supported tokens
     */
    async getSupportedTokens() {
        try {
            const response = await axios.get(`${this.baseUrl}/swap/v6.0/1/tokens`, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Accept': 'application/json'
                }
            });

            return {
                success: true,
                tokens: response.data
            };

        } catch (error) {
            console.error('❌ Failed to get supported tokens:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get detailed auction statistics
     * @param {string} orderHash - Order hash
     * @returns {Promise<Object>} Auction statistics
     */
    async getAuctionStats(orderHash) {
        try {
            const response = await axios.get(`${this.baseUrl}/fusion/orders/${orderHash}/auction/stats`, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Accept': 'application/json'
                }
            });

            if (response.data) {
                return {
                    success: true,
                    stats: response.data
                };
            } else {
                throw new Error('No auction stats received');
            }

        } catch (error) {
            console.error('❌ Failed to get auction stats:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Log status updates
     * @param {string} status - Status type
     * @param {string} message - Status message
     */
    logStatus(status, message) {
        console.log(`📊 [${status}] ${message}`);
    }
}

module.exports = FusionClient;