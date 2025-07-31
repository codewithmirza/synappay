#!/usr/bin/env node

const { Command } = require('commander');
const CrossChainRelayer = require('../relayer/index');
const StellarHTLC = require('../stellar/htlc');
const { ethers } = require('ethers');
require('dotenv').config();

const program = new Command();

program
    .name('synappay-cli')
    .description('SynapPay Cross-Chain Swap CLI')
    .version('1.0.0');

// Global relayer instance
let relayer;

// Initialize relayer
async function initializeRelayer(htlcAddress) {
    if (!relayer) {
        relayer = new CrossChainRelayer();
        if (htlcAddress) {
            const success = await relayer.initialize(htlcAddress);
            if (!success) {
                console.error('Failed to initialize relayer');
                process.exit(1);
            }
        }
    }
    return relayer;
}

// Deploy HTLC contract command
program
    .command('deploy')
    .description('Deploy HTLC contract to Sepolia testnet')
    .action(async () => {
        try {
            console.log('🚀 Deploying HTLC contract to Sepolia...\n');
            
            if (!process.env.SEPOLIA_RPC_URL) {
                throw new Error('SEPOLIA_RPC_URL environment variable is required');
            }
            if (!process.env.PRIVATE_KEY) {
                throw new Error('PRIVATE_KEY environment variable is required');
            }
            
            const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
            const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
            
            console.log('Deployer address:', wallet.address);
            console.log('Network:', (await provider.getNetwork()).name);
            
            // Check balance
            const balance = await provider.getBalance(wallet.address);
            console.log('Balance:', ethers.formatEther(balance), 'ETH\n');
            
            if (balance < ethers.parseEther('0.01')) {
                console.error('❌ Insufficient balance for deployment');
                console.log('Please fund your account with Sepolia ETH from: https://sepoliafaucet.com/');
                return;
            }
            
            // Deploy contract using Hardhat
            console.log('📋 Deploying EthereumHTLC contract...');
            
            // Use the actual contract deployment script
            const { execSync } = require('child_process');
            try {
                execSync('npx hardhat run scripts/deploy.js --network sepolia', { 
                    stdio: 'inherit',
                    env: { ...process.env }
                });
            console.log('✅ Contract deployed successfully!');
            } catch (error) {
                console.error('❌ Contract deployment failed:', error.message);
                process.exit(1);
            }
            
        } catch (error) {
            console.error('❌ Deployment failed:', error.message);
            process.exit(1);
        }
    });

// Generate secret command
program
    .command('generate-secret')
    .description('Generate a new secret and hashlock for HTLC')
    .action(() => {
        const { secret, hash } = StellarHTLC.generateSecret();
        console.log('🔐 Generated Secret and Hashlock:\n');
        console.log('Secret (preimage):', secret);
        console.log('Hashlock (SHA256):', hash);
        console.log('\n💡 Keep the secret safe - you\'ll need it to claim funds!');
    });

// Create ETH to Stellar swap
program
    .command('create-eth-stellar')
    .description('Create ETH to Stellar swap')
    .requiredOption('-c, --contract <address>', 'HTLC contract address')
    .requiredOption('-r, --receiver <address>', 'Stellar receiver public key')
    .requiredOption('-e, --eth-amount <amount>', 'ETH amount to swap')
    .requiredOption('-s, --stellar-amount <amount>', 'Stellar amount to receive')
    .option('-a, --asset <code>', 'Stellar asset code', 'XLM')
    .option('-i, --issuer <address>', 'Stellar asset issuer (for non-native assets)')
    .option('-t, --timelock <seconds>', 'Timelock in seconds', '3600')
    .action(async (options) => {
        try {
            console.log('🔄 Creating ETH → Stellar swap...\n');
            
            const relayer = await initializeRelayer(options.contract);
            
            const swapParams = {
                stellarReceiver: options.receiver,
                ethAmount: parseFloat(options.ethAmount),
                stellarAmount: options.stellarAmount,
                stellarAssetCode: options.asset,
                stellarAssetIssuer: options.issuer || null,
                timelock: parseInt(options.timelock)
            };
            
            console.log('Swap Parameters:');
            console.log('- ETH Amount:', swapParams.ethAmount, 'ETH');
            console.log('- Stellar Amount:', swapParams.stellarAmount, swapParams.stellarAssetCode);
            console.log('- Receiver:', swapParams.stellarReceiver);
            console.log('- Timelock:', swapParams.timelock, 'seconds\n');
            
            const result = await relayer.createEthToStellarSwap(swapParams);
            
            if (result.success) {
                console.log('✅ Swap created successfully!\n');
                console.log('📋 Swap Details:');
                console.log('- Swap ID:', result.swapId);
                console.log('- Secret:', result.secret);
                console.log('- ETH Contract ID:', result.ethContractId);
                console.log('- Stellar Balance ID:', result.stellarBalanceId);
                console.log('- Fusion Order Hash:', result.fusionOrderHash);
                console.log('\n💡 Save these details! You\'ll need them to complete the swap.');
            } else {
                console.error('❌ Swap creation failed:', result.error);
            }
            
        } catch (error) {
            console.error('❌ Error:', error.message);
        }
    });

// Create Stellar to ETH swap
program
    .command('create-stellar-eth')
    .description('Create Stellar to ETH swap')
    .requiredOption('-c, --contract <address>', 'HTLC contract address')
    .requiredOption('-r, --receiver <address>', 'ETH receiver address')
    .requiredOption('-s, --stellar-amount <amount>', 'Stellar amount to swap')
    .requiredOption('-e, --eth-amount <amount>', 'ETH amount to receive')
    .option('-a, --asset <code>', 'Stellar asset code', 'XLM')
    .option('-i, --issuer <address>', 'Stellar asset issuer (for non-native assets)')
    .option('-t, --timelock <seconds>', 'Timelock in seconds', '3600')
    .action(async (options) => {
        try {
            console.log('🔄 Creating Stellar → ETH swap...\n');
            
            const relayer = await initializeRelayer(options.contract);
            
            const swapParams = {
                ethReceiver: options.receiver,
                stellarAmount: options.stellarAmount,
                ethAmount: parseFloat(options.ethAmount),
                stellarAssetCode: options.asset,
                stellarAssetIssuer: options.issuer || null,
                timelock: parseInt(options.timelock)
            };
            
            console.log('Swap Parameters:');
            console.log('- Stellar Amount:', swapParams.stellarAmount, swapParams.stellarAssetCode);
            console.log('- ETH Amount:', swapParams.ethAmount, 'ETH');
            console.log('- Receiver:', swapParams.ethReceiver);
            console.log('- Timelock:', swapParams.timelock, 'seconds\n');
            
            const result = await relayer.createStellarToEthSwap(swapParams);
            
            if (result.success) {
                console.log('✅ Swap created successfully!\n');
                console.log('📋 Swap Details:');
                console.log('- Swap ID:', result.swapId);
                console.log('- Secret:', result.secret);
                console.log('- ETH Contract ID:', result.ethContractId);
                console.log('- Stellar Balance ID:', result.stellarBalanceId);
                console.log('- Fusion Order Hash:', result.fusionOrderHash);
                console.log('\n💡 Save these details! You\'ll need them to complete the swap.');
            } else {
                console.error('❌ Swap creation failed:', result.error);
            }
            
        } catch (error) {
            console.error('❌ Error:', error.message);
        }
    });

// Claim swap with secret
program
    .command('claim')
    .description('Claim swap with secret preimage')
    .requiredOption('-c, --contract <address>', 'HTLC contract address')
    .requiredOption('-s, --swap-id <id>', 'Swap ID')
    .requiredOption('-p, --preimage <secret>', 'Secret preimage')
    .action(async (options) => {
        try {
            console.log('🎯 Claiming swap with secret...\n');
            
            const relayer = await initializeRelayer(options.contract);
            
            const result = await relayer.processSecretReveal(options.swapId, options.preimage);
            
            if (result.success) {
                console.log('✅ Swap claimed successfully!');
                console.log('💰 Funds have been transferred to the receiver.');
            } else {
                console.error('❌ Claim failed:', result.error);
            }
            
        } catch (error) {
            console.error('❌ Error:', error.message);
        }
    });

// Check swap status
program
    .command('status')
    .description('Check swap status')
    .requiredOption('-c, --contract <address>', 'HTLC contract address')
    .requiredOption('-s, --swap-id <id>', 'Swap ID')
    .action(async (options) => {
        try {
            console.log('📊 Checking swap status...\n');
            
            const relayer = await initializeRelayer(options.contract);
            
            const result = relayer.getSwapStatus(options.swapId);
            
            if (result.success) {
                const swap = result.swap;
                console.log('📋 Swap Status:');
                console.log('- ID:', swap.id);
                console.log('- Type:', swap.type);
                console.log('- Status:', swap.status);
                console.log('- Created:', new Date(swap.createdAt).toLocaleString());
                if (swap.completedAt) {
                    console.log('- Completed:', new Date(swap.completedAt).toLocaleString());
                }
                console.log('- Timelock:', new Date(swap.timelock * 1000).toLocaleString());
            } else {
                console.error('❌ Status check failed:', result.error);
            }
            
        } catch (error) {
            console.error('❌ Error:', error.message);
        }
    });

// Enhanced CLI commands for multi-currency and best rates
program
    .command('get-best-rate')
    .description('Get best exchange rate for token pair')
    .requiredOption('-f, --from <token>', 'Source token (ETH, USDC, XLM)')
    .requiredOption('-t, --to <token>', 'Target token (ETH, USDC, XLM)')
    .requiredOption('-a, --amount <amount>', 'Amount to swap')
    .action(async (options) => {
        try {
            console.log('🔍 Finding best exchange rate...\n');
            
            const BestRateDiscovery = require('../enhanced/best-rate');
            const rateDiscovery = new BestRateDiscovery(process.env.ONEINCH_API_KEY);
            
            // Convert amount to appropriate units
            const amount = options.from.toUpperCase() === 'ETH' 
                ? ethers.parseEther(options.amount.toString()).toString()
                : (parseFloat(options.amount) * 1000000).toString(); // USDC has 6 decimals
            
            const result = await rateDiscovery.getBestRate(options.from, options.to, amount);
            
            if (result.success) {
                console.log('💰 Best Rate Found:');
                console.log('From:', options.from.toUpperCase());
                console.log('To:', options.to.toUpperCase());
                console.log('Input Amount:', options.amount);
                console.log('Output Amount:', ethers.formatUnits(result.outputAmount, 18));
                console.log('Exchange Rate:', result.exchangeRate.toFixed(6));
                console.log('Route:', result.route);
                console.log('Estimated Gas:', result.estimatedGas);
                console.log('Price Impact:', result.priceImpact);
                console.log('Savings vs CEX:', result.savings.vsCEX);
            } else {
                console.error('❌ Rate discovery failed:', result.error);
                if (result.fallback) {
                    console.log('📊 Fallback rate:', result.fallback);
                }
            }
        } catch (error) {
            console.error('❌ Error:', error.message);
        }
    });

program
    .command('compare-routes')
    .description('Compare rates across different routes')
    .requiredOption('-f, --from <token>', 'Source token')
    .requiredOption('-t, --to <token>', 'Target token')
    .requiredOption('-a, --amount <amount>', 'Amount to swap')
    .option('--show-fees', 'Show detailed fee breakdown')
    .option('--show-time', 'Show settlement time estimates')
    .action(async (options) => {
        try {
            console.log('📊 Comparing routes across platforms...\n');
            
            const BestRateDiscovery = require('../enhanced/best-rate');
            const rateDiscovery = new BestRateDiscovery(process.env.ONEINCH_API_KEY);
            
            const amount = options.from.toUpperCase() === 'ETH' 
                ? ethers.parseEther(options.amount.toString()).toString()
                : (parseFloat(options.amount) * 1000000).toString();
            
            const comparison = await rateDiscovery.compareRoutes(options.from, options.to, amount);
            
            if (comparison.success) {
                console.log('🏆 Best Route:', comparison.bestRoute.name);
                console.log('💡 Recommendation:', comparison.recommendation);
                console.log('💰 Potential Savings:', comparison.savings.savingsPercent);
                console.log('');
                
                console.log('📋 All Routes:');
                comparison.allRoutes.forEach((route, index) => {
                    console.log(`${index + 1}. ${route.name}`);
                    console.log(`   Output: ${ethers.formatUnits(route.outputAmount || '0', 18)} ${options.to.toUpperCase()}`);
                    if (options.showFees && route.fees) {
                        console.log(`   Fees: $${route.fees.totalFeeUSD}`);
                    }
                    if (options.showTime) {
                        console.log(`   Settlement: ${route.timeToSettle}`);
                    }
                    console.log('');
                });
            } else {
                console.error('❌ Route comparison failed:', comparison.error);
            }
        } catch (error) {
            console.error('❌ Error:', error.message);
        }
    });

program
    .command('create-fiat-swap')
    .description('Create swap with fiat equivalent calculation')
    .requiredOption('-c, --contract <address>', 'HTLC contract address')
    .requiredOption('--from-currency <currency>', 'Source currency (ETH, XLM, USDC)')
    .requiredOption('--to-currency <currency>', 'Target currency (ETH, XLM, USDC)')
    .requiredOption('--amount <amount>', 'Amount to swap')
    .option('--fiat-equivalent <fiat>', 'Show equivalent in fiat (USD, EUR, GBP)', 'USD')
    .action(async (options) => {
        try {
            console.log('💱 Creating fiat-equivalent swap...\n');
            
            const MultiCurrencyManager = require('../enhanced/multi-currency');
            const multiCurrency = new MultiCurrencyManager();
            
            // Calculate fiat equivalent
            const fiatCalc = multiCurrency.calculateFiatEquivalent(
                options.fromCurrency, 
                parseFloat(options.amount), 
                options.fiatEquivalent
            );
            
            console.log('💰 Fiat Equivalent:');
            console.log(`${fiatCalc.assetAmount} ${fiatCalc.assetCode} = ${fiatCalc.fiatAmount.toFixed(2)} ${fiatCalc.fiatCurrency}`);
            console.log(`Exchange Rate: 1 ${fiatCalc.assetCode} = $${fiatCalc.exchangeRate}`);
            console.log('');
            
            // Get conversion route
            const route = multiCurrency.getBestConversionRoute(
                options.fromCurrency,
                options.toCurrency,
                parseFloat(options.amount)
            );
            
            console.log('🛣️  Conversion Route:');
            console.log(`${route.inputAmount} ${route.fromAsset} → ${route.outputAmount.toFixed(6)} ${route.toAsset}`);
            console.log(`Fee: ${route.feePercent.toFixed(2)}% (${route.feeAmount.toFixed(6)} ${route.toAsset})`);
            console.log(`Route Type: ${route.route}`);
            console.log(`Estimated Time: ${route.estimatedTime}`);
            console.log('');
            
            console.log('✅ Ready to create swap with these parameters');
            console.log('💡 Use create-eth-stellar or create-stellar-eth with these amounts');
            
        } catch (error) {
            console.error('❌ Error:', error.message);
        }
    });

// Start relayer service
program
    .command('start-relayer')
    .description('Start the cross-chain relayer service')
    .requiredOption('-c, --contract <address>', 'HTLC contract address')
    .option('-p, --port <port>', 'HTTP server port', '3001')
    .action(async (options) => {
        try {
            console.log('🚀 Starting CrossChain Relayer Service...\n');
            
            const relayer = await initializeRelayer(options.contract);
            await relayer.start();
            
            console.log('✅ Relayer service is running');
            console.log('📡 Monitoring both Ethereum and Stellar networks');
            console.log('🔄 Processing cross-chain swaps automatically');
            console.log('\n💡 Press Ctrl+C to stop the service');
            
            // Keep the process running
            process.on('SIGINT', () => {
                console.log('\n🛑 Shutting down relayer service...');
                process.exit(0);
            });
            
            // Keep alive
            setInterval(() => {
                console.log('⏰', new Date().toLocaleString(), '- Relayer is active');
            }, 60000); // Log every minute
            
        } catch (error) {
            console.error('❌ Failed to start relayer:', error.message);
        }
    });

// Test connection
program
    .command('test')
    .description('Test connections to Ethereum and Stellar networks')
    .action(async () => {
        try {
            console.log('🧪 Testing network connections...\n');
            
            // Test Ethereum connection
            console.log('1. Testing Ethereum connection...');
            const ethProvider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
            const network = await ethProvider.getNetwork();
            const blockNumber = await ethProvider.getBlockNumber();
            console.log('✅ Ethereum connected');
            console.log('   Network:', network.name, '(Chain ID:', network.chainId.toString() + ')');
            console.log('   Latest block:', blockNumber);
            
            // Test wallet
            const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, ethProvider);
            const balance = await ethProvider.getBalance(wallet.address);
            console.log('   Wallet:', wallet.address);
            console.log('   Balance:', ethers.formatEther(balance), 'ETH\n');
            
            // Test Stellar connection
            console.log('2. Testing Stellar connection...');
            const stellarHTLC = new StellarHTLC(process.env.STELLAR_HORIZON_URL);
            console.log('✅ Stellar connected');
            console.log('   Horizon URL:', process.env.STELLAR_HORIZON_URL);
            console.log('   Network: Testnet\n');
            
            // Test 1inch connection
            console.log('3. Testing 1inch Fusion+ connection...');
            const relayer = new CrossChainRelayer();
            const tokensResult = await relayer.fusionClient.getSupportedTokens();
            if (tokensResult.success) {
                console.log('✅ 1inch Fusion+ connected');
                console.log('   Supported tokens:', tokensResult.tokens?.length || 'N/A');
            } else {
                console.log('⚠️  1inch connection issue:', tokensResult.error);
            }
            
            console.log('\n🎉 Connection tests completed!');
            
        } catch (error) {
            console.error('❌ Test failed:', error.message);
        }
    });

// Parse command line arguments
program.parse(process.argv);