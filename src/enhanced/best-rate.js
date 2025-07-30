const axios = require('axios');
const { ethers } = require('ethers');

class BestRateDiscovery {
    constructor(oneinchApiKey, oneinchBaseUrl = 'https://api.1inch.dev') {
        this.apiKey = oneinchApiKey;
        this.baseUrl = oneinchBaseUrl;
        this.chainId = 11155111; // Sepolia testnet
        
        // Common token addresses on Sepolia
        this.tokenAddresses = {
            'ETH': '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
            'USDC': '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
            'USDT': '0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0',
            'DAI': '0x3e622317f8C93f7328350cF0B56d9eD4C620C5d6'
        };
    }

    /**
     * Get best rate for token swap using 1inch
     * @param {string} fromToken - Source token symbol
     * @param {string} toToken - Target token symbol  
     * @param {string} amount - Amount in wei/smallest unit
     * @returns {Promise<Object>} Best rate information
     */
    async getBestRate(fromToken, toToken, amount) {
        try {
            const fromAddress = this.getTokenAddress(fromToken);
            const toAddress = this.getTokenAddress(toToken);
            
            // Get quote from 1inch
            const quoteUrl = `${this.baseUrl}/swap/v6.0/${this.chainId}/quote`;
            const params = {
                src: fromAddress,
                dst: toAddress,
                amount: amount,
                includeTokensInfo: true,
                includeProtocols: true
            };
            
            const response = await axios.get(quoteUrl, {
                params,
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'accept': 'application/json'
                }
            });
            
            const quote = response.data;
            
            return {
                success: true,
                fromToken,
                toToken,
                inputAmount: amount,
                outputAmount: quote.dstAmount,
                exchangeRate: parseFloat(quote.dstAmount) / parseFloat(amount),
                estimatedGas: quote.estimatedGas,
                protocols: quote.protocols,
                savings: this.calculateSavings(quote),
                route: this.formatRoute(quote.protocols),
                priceImpact: this.calculatePriceImpact(quote)
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                fallback: this.getFallbackRate(fromToken, toToken, amount)
            };
        }
    }

    /**
     * Compare rates across multiple routes
     * @param {string} fromToken - Source token
     * @param {string} toToken - Target token
     * @param {string} amount - Amount to swap
     * @returns {Promise<Object>} Rate comparison
     */
    async compareRoutes(fromToken, toToken, amount) {
        try {
            // Get 1inch rate
            const oneinchRate = await this.getBestRate(fromToken, toToken, amount);
            
            // Get direct Stellar rate (for cross-chain comparison)
            const stellarRate = this.getStellarRate(fromToken, toToken, amount);
            
            // Get CEX rate for comparison (mock)
            const cexRate = this.getCEXRate(fromToken, toToken, amount);
            
            const routes = [
                {
                    name: '1inch Aggregation',
                    ...oneinchRate,
                    fees: this.calculateOneinchFees(amount),
                    timeToSettle: '15-30 seconds'
                },
                {
                    name: 'Stellar Direct',
                    ...stellarRate,
                    fees: this.calculateStellarFees(amount),
                    timeToSettle: '3-5 seconds'
                },
                {
                    name: 'CEX Reference',
                    ...cexRate,
                    fees: this.calculateCEXFees(amount),
                    timeToSettle: '1-5 minutes'
                }
            ];
            
            // Sort by best output amount
            routes.sort((a, b) => parseFloat(b.outputAmount || 0) - parseFloat(a.outputAmount || 0));
            
            return {
                success: true,
                fromToken,
                toToken,
                inputAmount: amount,
                bestRoute: routes[0],
                allRoutes: routes,
                savings: this.calculateRouteSavings(routes),
                recommendation: this.getRouteRecommendation(routes)
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get token address by symbol
     * @private
     */
    getTokenAddress(symbol) {
        const address = this.tokenAddresses[symbol.toUpperCase()];
        if (!address) {
            throw new Error(`Unsupported token: ${symbol}`);
        }
        return address;
    }

    /**
     * Get fallback rate when 1inch fails
     * @private
     */
    getFallbackRate(fromToken, toToken, amount) {
        // Mock fallback rates
        const rates = {
            'ETH_USDC': 2300,
            'USDC_ETH': 1/2300,
            'ETH_USDT': 2300,
            'USDT_ETH': 1/2300
        };
        
        const rateKey = `${fromToken.toUpperCase()}_${toToken.toUpperCase()}`;
        const rate = rates[rateKey] || 1;
        
        return {
            outputAmount: (parseFloat(amount) * rate).toString(),
            exchangeRate: rate,
            source: 'fallback',
            warning: '1inch API unavailable, using fallback rates'
        };
    }

    /**
     * Get Stellar native rate
     * @private
     */
    getStellarRate(fromToken, toToken, amount) {
        // Mock Stellar DEX rates
        const stellarRates = {
            'XLM_USDC': 8.33, // 1 XLM = 0.12 USD
            'USDC_XLM': 0.12,
            'XLM_EURT': 7.07,
            'EURT_XLM': 0.1415
        };
        
        const rateKey = `${fromToken.toUpperCase()}_${toToken.toUpperCase()}`;
        const rate = stellarRates[rateKey] || 1;
        
        return {
            success: true,
            outputAmount: (parseFloat(amount) * rate).toString(),
            exchangeRate: rate,
            source: 'stellar-dex'
        };
    }

    /**
     * Get CEX rate for comparison
     * @private
     */
    getCEXRate(fromToken, toToken, amount) {
        // Mock CEX rates (typically worse due to fees)
        const cexRates = {
            'ETH_USDC': 2290, // Slightly worse than market
            'USDC_ETH': 1/2290,
            'ETH_USDT': 2290,
            'USDT_ETH': 1/2290
        };
        
        const rateKey = `${fromToken.toUpperCase()}_${toToken.toUpperCase()}`;
        const rate = cexRates[rateKey] || 1;
        
        return {
            success: true,
            outputAmount: (parseFloat(amount) * rate).toString(),
            exchangeRate: rate,
            source: 'cex-reference'
        };
    }

    /**
     * Calculate various fees
     * @private
     */
    calculateOneinchFees(amount) {
        return {
            networkFee: '0.002', // ETH
            protocolFee: '0.001', // 0.1%
            totalFeeUSD: '15.50'
        };
    }

    calculateStellarFees(amount) {
        return {
            networkFee: '0.00001', // XLM
            protocolFee: '0',
            totalFeeUSD: '0.01'
        };
    }

    calculateCEXFees(amount) {
        return {
            tradingFee: '0.1%',
            withdrawalFee: '0.005', // ETH
            totalFeeUSD: '25.00'
        };
    }

    /**
     * Calculate savings compared to alternatives
     * @private
     */
    calculateSavings(quote) {
        // Mock savings calculation
        return {
            vsUniswap: '2.3%',
            vsCEX: '8.7%',
            estimatedSavingsUSD: '12.50'
        };
    }

    /**
     * Format protocol route
     * @private
     */
    formatRoute(protocols) {
        if (!protocols || !protocols[0]) return 'Direct';
        
        return protocols[0].map(p => p.name).join(' → ');
    }

    /**
     * Calculate price impact
     * @private
     */
    calculatePriceImpact(quote) {
        // Mock price impact calculation
        return '0.15%';
    }

    /**
     * Calculate savings between routes
     * @private
     */
    calculateRouteSavings(routes) {
        if (routes.length < 2) return null;
        
        const best = parseFloat(routes[0].outputAmount || 0);
        const worst = parseFloat(routes[routes.length - 1].outputAmount || 0);
        
        const savingsPercent = ((best - worst) / worst * 100).toFixed(2);
        
        return {
            bestRoute: routes[0].name,
            worstRoute: routes[routes.length - 1].name,
            savingsPercent: `${savingsPercent}%`,
            absoluteSavings: (best - worst).toString()
        };
    }

    /**
     * Get route recommendation
     * @private
     */
    getRouteRecommendation(routes) {
        const best = routes[0];
        
        if (best.name === 'Stellar Direct') {
            return 'Recommended: Stellar for lowest fees and fastest settlement';
        } else if (best.name === '1inch Aggregation') {
            return 'Recommended: 1inch for best exchange rate despite higher fees';
        } else {
            return 'Consider decentralized options for better rates and security';
        }
    }
}

module.exports = BestRateDiscovery;