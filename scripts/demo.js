#!/usr/bin/env node

const { ethers } = require('ethers');
const StellarHTLC = require('../src/stellar/htlc');
require('dotenv').config();

async function runDemo() {
    console.log('🎬 SynapPay Demo - Cross-Chain Swap Simulation\n');
    console.log('='.repeat(60));
    
    // Demo scenario
    const scenario = {
        alice: {
            name: 'Alice',
            ethAddress: '0x742d35Cc6634C0532925a3b8D4C9db96590c6C8C',
            stellarAddress: 'GCKFBEIYTKP5RDBQMTVVALONAOPBDQZGKEPKMIC7YOXJHDMKBVDAVKQTG'
        },
        bob: {
            name: 'Bob',
            ethAddress: '0x8ba1f109551bD432803012645Hac136c30C6756M',
            stellarAddress: 'GDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3B2WSQHG4W37'
        },
        swap: {
            ethAmount: '0.1',
            stellarAmount: '100',
            asset: 'XLM'
        }
    };
    
    console.log('📋 Demo Scenario:');
    console.log(`${scenario.alice.name} wants to swap ${scenario.swap.ethAmount} ETH for ${scenario.swap.stellarAmount} ${scenario.swap.asset}`);
    console.log(`${scenario.bob.name} wants to swap ${scenario.swap.stellarAmount} ${scenario.swap.asset} for ${scenario.swap.ethAmount} ETH`);
    console.log('');
    
    // Step 1: Generate secret
    console.log('1. 🔐 Generating Secret for HTLC...');
    const { secret, hash } = StellarHTLC.generateSecret();
    console.log(`Secret: ${secret}`);
    console.log(`Hash: ${hash}`);
    console.log('✅ Secret generated\n');
    
    // Step 2: Create HTLCs
    console.log('2. 📝 Creating Hash Time Locked Contracts...');
    
    const timelock = Math.floor(Date.now() / 1000) + 3600; // 1 hour
    const timelockDate = new Date(timelock * 1000);
    
    console.log(`⏰ Timelock: ${timelockDate.toLocaleString()}`);
    console.log('');
    
    // Ethereum HTLC (Alice locks ETH)
    console.log('📄 Ethereum HTLC:');
    console.log(`- Sender: ${scenario.alice.name} (${scenario.alice.ethAddress})`);
    console.log(`- Receiver: ${scenario.bob.name} (${scenario.bob.ethAddress})`);
    console.log(`- Amount: ${scenario.swap.ethAmount} ETH`);
    console.log(`- Hashlock: 0x${hash}`);
    console.log(`- Timelock: ${timelock}`);
    console.log('✅ Ethereum HTLC ready');
    console.log('');
    
    // Stellar HTLC (Bob locks XLM)
    console.log('🌟 Stellar HTLC:');
    console.log(`- Sender: ${scenario.bob.name} (${scenario.bob.stellarAddress})`);
    console.log(`- Receiver: ${scenario.alice.name} (${scenario.alice.stellarAddress})`);
    console.log(`- Amount: ${scenario.swap.stellarAmount} ${scenario.swap.asset}`);
    console.log(`- Hashlock: 0x${hash}`);
    console.log(`- Timelock: ${timelock}`);
    console.log('✅ Stellar HTLC ready');
    console.log('');
    
    // Step 3: Atomic Swap Process
    console.log('3. 🔄 Atomic Swap Process...');
    console.log('');
    
    console.log('Phase 1: Setup');
    console.log(`- ${scenario.alice.name} creates Ethereum HTLC with ${scenario.swap.ethAmount} ETH`);
    console.log(`- ${scenario.bob.name} creates Stellar HTLC with ${scenario.swap.stellarAmount} ${scenario.swap.asset}`);
    console.log('- Both HTLCs use the same hashlock');
    console.log('- Both HTLCs have the same timelock');
    console.log('✅ Setup complete');
    console.log('');
    
    console.log('Phase 2: Claim');
    console.log(`- ${scenario.alice.name} reveals the secret to claim ${scenario.swap.stellarAmount} ${scenario.swap.asset} from Stellar`);
    console.log('- Secret is now public on Stellar blockchain');
    console.log(`- ${scenario.bob.name} uses the revealed secret to claim ${scenario.swap.ethAmount} ETH from Ethereum`);
    console.log('✅ Swap completed atomically');
    console.log('');
    
    // Step 4: Verification
    console.log('4. ✅ Verification...');
    
    const isValidSecret = StellarHTLC.verifyPreimage(secret, hash);
    console.log(`Secret verification: ${isValidSecret ? '✅ VALID' : '❌ INVALID'}`);
    
    console.log('');
    console.log('Final State:');
    console.log(`- ${scenario.alice.name}: Lost ${scenario.swap.ethAmount} ETH, Gained ${scenario.swap.stellarAmount} ${scenario.swap.asset}`);
    console.log(`- ${scenario.bob.name}: Lost ${scenario.swap.stellarAmount} ${scenario.swap.asset}, Gained ${scenario.swap.ethAmount} ETH`);
    console.log('- Both parties got what they wanted!');
    console.log('');
    
    // Step 5: 1inch Fusion+ Integration
    console.log('5. 🚀 1inch Fusion+ Integration...');
    console.log('');
    console.log('Benefits of using 1inch Fusion+:');
    console.log('✅ Gasless transactions for users');
    console.log('✅ MEV protection');
    console.log('✅ Dutch auction for better prices');
    console.log('✅ Deep liquidity aggregation');
    console.log('✅ Resolver network for execution');
    console.log('');
    
    console.log('Integration points:');
    console.log('- HTLC conditions embedded in Fusion+ orders');
    console.log('- Resolvers compete to execute swaps');
    console.log('- Cross-chain secret relay via relayer service');
    console.log('- Automatic refunds on timeout');
    console.log('');
    
    // Step 6: Real Implementation
    console.log('6. 🛠️  Real Implementation Commands...');
    console.log('');
    console.log('To run this demo with real contracts:');
    console.log('');
    console.log('# 1. Setup environment');
    console.log('npm run setup');
    console.log('# Edit .env with your credentials');
    console.log('');
    console.log('# 2. Deploy contracts');
    console.log('npm run deploy:sepolia');
    console.log('');
    console.log('# 3. Create ETH → Stellar swap');
    console.log('npm run cli create-eth-stellar \\');
    console.log('  --contract 0x1234... \\');
    console.log(`  --receiver ${scenario.alice.stellarAddress} \\`);
    console.log(`  --eth-amount ${scenario.swap.ethAmount} \\`);
    console.log(`  --stellar-amount ${scenario.swap.stellarAmount} \\`);
    console.log(`  --asset ${scenario.swap.asset}`);
    console.log('');
    console.log('# 4. Claim with secret');
    console.log('npm run cli claim \\');
    console.log('  --contract 0x1234... \\');
    console.log('  --swap-id 0xabcd... \\');
    console.log(`  --preimage ${secret}`);
    console.log('');
    
    console.log('='.repeat(60));
    console.log('🎉 Demo completed! Ready to build the future of cross-chain swaps!');
    console.log('='.repeat(60));
}

// Run demo
if (require.main === module) {
    runDemo().catch(console.error);
}

module.exports = runDemo;