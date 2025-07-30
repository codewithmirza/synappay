const StellarSdk = require('stellar-sdk');

class MultiCurrencyManager {
    constructor(horizonUrl = 'https://horizon-testnet.stellar.org') {
        this.server = new StellarSdk.Horizon.Server(horizonUrl);
        
        // Supported assets on Stellar testnet
        this.supportedAssets = {
            'XLM': StellarSdk.Asset.native(),
            'USDC': new StellarSdk.Asset('USDC', 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5'),
            'EURT': new StellarSdk.Asset('EURT', 'GAP5LETOV6YIE62YAM56STDANPRDO7ZFDBGSNHJQIYGGKSMOZAHOOS2S'),
            'BTC': new StellarSdk.Asset('BTC', 'GAUTUYY2THLF7SGITDFMXJVYH3LHDSMGEAKSBU267M2K7A3W543CKUEF'),
            'ETH': new StellarSdk.Asset('ETH', 'GBDEVU63Y6NTHJQQZIKVTC23NWLQVP3WJ2RI2OTSJTNYOIGICST6DUXR')
        };
        
        // Fiat equivalent rates (mock - in production would use real API)
        this.fiatRates = {
            'USD': 1.0,
            'EUR': 0.85,
            'GBP': 0.73,
            'JPY': 110.0,
            'INR': 74.5
        };
    }

    /**
     * Get supported Stellar assets
     * @returns {Object} Supported assets
     */
    getSupportedAssets() {
        return Object.keys(this.supportedAssets);
    }

    /**
     * Get asset object for Stellar operations
     * @param {string} assetCode - Asset code (XLM, USDC, etc.)
     * @returns {StellarSdk.Asset} Stellar asset object
     */
    getAsset(assetCode) {
        const asset = this.supportedAssets[assetCode.toUpperCase()];
        if (!asset) {
            throw new Error(`Unsupported asset: ${assetCode}`);
        }
        return asset;
    }

    /**
     * Calculate fiat equivalent
     * @param {string} assetCode - Asset code
     * @param {number} amount - Asset amount
     * @param {string} fiatCurrency - Target fiat currency
     * @returns {Object} Fiat equivalent calculation
     */
    calculateFiatEquivalent(assetCode, amount, fiatCurrency = 'USD') {
        // Mock exchange rates - in production would use real price feeds
        const assetToUsdRates = {
            'XLM': 0.12,
            'USDC': 1.0,
            'EURT': 1.18,
            'BTC': 43000,
            'ETH': 2300
        };
        
        const assetRate = assetToUsdRates[assetCode.toUpperCase()];
        const fiatRate = this.fiatRates[fiatCurrency.toUpperCase()];
        
        if (!assetRate || !fiatRate) {
            throw new Error(`Unsupported conversion: ${assetCode} to ${fiatCurrency}`);
        }
        
        const usdValue = amount * assetRate;
        const fiatValue = usdValue / fiatRate;
        
        return {
            assetCode,
            assetAmount: amount,
            fiatCurrency,
            fiatAmount: fiatValue,
            exchangeRate: assetRate,
            usdValue
        };
    }

    /**
     * Get best conversion route
     * @param {string} fromAsset - Source asset
     * @param {string} toAsset - Target asset
     * @param {number} amount - Amount to convert
     * @returns {Object} Conversion route information
     */
    getBestConversionRoute(fromAsset, toAsset, amount) {
        const fromRate = this.getAssetUsdRate(fromAsset);
        const toRate = this.getAssetUsdRate(toAsset);
        
        const usdValue = amount * fromRate;
        const targetAmount = usdValue / toRate;
        
        // Calculate fees (mock - 0.1% for Stellar, varies for Ethereum)
        const stellarFee = 0.001; // 0.1%
        const ethereumFee = 0.003; // 0.3%
        
        const isFromEthereum = fromAsset === 'ETH';
        const isToEthereum = toAsset === 'ETH';
        
        let totalFeePercent = stellarFee;
        if (isFromEthereum || isToEthereum) {
            totalFeePercent += ethereumFee;
        }
        
        const feeAmount = targetAmount * totalFeePercent;
        const finalAmount = targetAmount - feeAmount;
        
        return {
            fromAsset,
            toAsset,
            inputAmount: amount,
            outputAmount: finalAmount,
            feeAmount,
            feePercent: totalFeePercent * 100,
            exchangeRate: targetAmount / amount,
            route: isFromEthereum || isToEthereum ? 'cross-chain' : 'stellar-native',
            estimatedTime: isFromEthereum || isToEthereum ? '30-60 seconds' : '3-5 seconds'
        };
    }

    /**
     * Get asset USD rate (mock implementation)
     * @private
     */
    getAssetUsdRate(assetCode) {
        const rates = {
            'XLM': 0.12,
            'USDC': 1.0,
            'EURT': 1.18,
            'BTC': 43000,
            'ETH': 2300
        };
        
        const rate = rates[assetCode.toUpperCase()];
        if (!rate) {
            throw new Error(`No rate available for ${assetCode}`);
        }
        return rate;
    }

    /**
     * Validate asset pair for swapping
     * @param {string} fromAsset - Source asset
     * @param {string} toAsset - Target asset
     * @returns {boolean} Whether pair is supported
     */
    isValidAssetPair(fromAsset, toAsset) {
        const supportedAssets = this.getSupportedAssets();
        const ethAssets = ['ETH'];
        
        const fromSupported = supportedAssets.includes(fromAsset.toUpperCase()) || 
                             ethAssets.includes(fromAsset.toUpperCase());
        const toSupported = supportedAssets.includes(toAsset.toUpperCase()) || 
                           ethAssets.includes(toAsset.toUpperCase());
        
        return fromSupported && toSupported && fromAsset !== toAsset;
    }

    /**
     * Get asset balance for an account
     * @param {string} publicKey - Stellar public key
     * @param {string} assetCode - Asset code
     * @returns {Promise<Object>} Balance information
     */
    async getAssetBalance(publicKey, assetCode) {
        try {
            const account = await this.server.loadAccount(publicKey);
            
            if (assetCode.toUpperCase() === 'XLM') {
                return {
                    assetCode: 'XLM',
                    balance: account.balances.find(b => b.asset_type === 'native')?.balance || '0',
                    available: true
                };
            }
            
            const asset = this.getAsset(assetCode);
            const balance = account.balances.find(b => 
                b.asset_code === asset.code && b.asset_issuer === asset.issuer
            );
            
            return {
                assetCode,
                balance: balance?.balance || '0',
                available: !!balance,
                trustlineRequired: !balance
            };
        } catch (error) {
            return {
                assetCode,
                balance: '0',
                available: false,
                error: error.message
            };
        }
    }
}

module.exports = MultiCurrencyManager;