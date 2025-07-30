#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { ethers } = require('ethers');

console.log('🚀 Setting up SynapPay development environment...\n');

// Check if .env already exists
const envPath = path.join(process.cwd(), '.env');
const envExamplePath = path.join(process.cwd(), '.env.example');

if (fs.existsSync(envPath)) {
    console.log('✅ .env file already exists');
} else if (fs.existsSync(envExamplePath)) {
    // Copy .env.example to .env
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ Created .env file from .env.example');
} else {
    // Create basic .env file
    const envContent = `# Ethereum
PRIVATE_KEY=your_private_key_here
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/your_infura_key
ETHERSCAN_API_KEY=your_etherscan_api_key

# 1inch Fusion+
ONEINCH_API_KEY=your_1inch_api_key
ONEINCH_BASE_URL=https://api.1inch.dev

# Stellar
STELLAR_NETWORK=testnet
STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
STELLAR_PRIVATE_KEY=your_stellar_private_key

# Relayer
RELAYER_PORT=3001
`;
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Created basic .env file');
}

// Generate a new Ethereum wallet if needed
console.log('\n🔐 Generating development wallet...');
const wallet = ethers.Wallet.createRandom();
console.log('Address:', wallet.address);
console.log('Private Key:', wallet.privateKey);
console.log('\n⚠️  IMPORTANT: This is a development wallet. Fund it with testnet tokens only!');
console.log('💰 Get Sepolia ETH from: https://sepoliafaucet.com/');

// Generate Stellar keypair
console.log('\n⭐ Generating Stellar keypair...');
try {
    const StellarSdk = require('stellar-sdk');
    const stellarKeypair = StellarSdk.Keypair.random();
    console.log('Public Key:', stellarKeypair.publicKey());
    console.log('Secret Key:', stellarKeypair.secret());
    console.log('\n💰 Fund your Stellar account at: https://laboratory.stellar.org/#account-creator');
} catch (error) {
    console.log('⚠️  Stellar SDK not available for keypair generation');
    console.log('You can generate a Stellar keypair at: https://laboratory.stellar.org/#account-creator');
}

console.log('\n📝 Next steps:');
console.log('1. Edit .env file with your API keys and private keys');
console.log('2. Fund your wallets with testnet tokens');
console.log('3. Run: npm run build');
console.log('4. Run: npm test');
console.log('5. Run: npm run deploy:sepolia');
console.log('\n🎉 Setup complete! Happy swapping!');