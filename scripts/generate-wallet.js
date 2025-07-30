#!/usr/bin/env node

const { ethers } = require('ethers');
const StellarSdk = require('stellar-sdk');

console.log('🎲 Generating new wallets...\n');

// Generate new Ethereum wallet
console.log('💎 NEW ETHEREUM WALLET:');
const newEthWallet = ethers.Wallet.createRandom();
console.log('Private Key:', newEthWallet.privateKey);
console.log('Address:', newEthWallet.address);
console.log('');

// Generate new Stellar wallet
console.log('⭐ NEW STELLAR WALLET:');
const newStellarKeypair = StellarSdk.Keypair.random();
console.log('Private Key:', newStellarKeypair.secret());
console.log('Public Key:', newStellarKeypair.publicKey());
console.log('');

console.log('📝 To use these new wallets:');
console.log('1. Copy the private keys above');
console.log('2. Replace them in your .env file:');
console.log('   PRIVATE_KEY=' + newEthWallet.privateKey);
console.log('   STELLAR_PRIVATE_KEY=' + newStellarKeypair.secret());
console.log('   STELLAR_PUBLIC_KEY=' + newStellarKeypair.publicKey());
console.log('3. Fund the new addresses with testnet tokens');
console.log('4. Run: npm run cli test');
console.log('');

console.log('💰 Fund these addresses:');
console.log('Ethereum:', newEthWallet.address, '→ https://sepoliafaucet.com/');
console.log('Stellar:', newStellarKeypair.publicKey(), '→ https://friendbot.stellar.org/?addr=' + newStellarKeypair.publicKey());