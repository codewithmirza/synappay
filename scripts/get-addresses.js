#!/usr/bin/env node

const { ethers } = require('ethers');
const StellarSdk = require('stellar-sdk');
require('dotenv').config();

console.log('🔍 Finding your wallet addresses from private keys...\n');

// Get Ethereum address from private key
try {
    const ethWallet = new ethers.Wallet(process.env.PRIVATE_KEY);
    console.log('💎 ETHEREUM WALLET:');
    console.log('Private Key:', process.env.PRIVATE_KEY);
    console.log('Derived Address:', ethWallet.address);
    console.log('');

    console.log('🧮 How this works (Math, not API):');
    console.log('Private Key → Public Key → Address (pure cryptography)');
    console.log('No internet needed - it\'s mathematical derivation!');
    console.log('');

    console.log('💰 Get Sepolia ETH here:');
    console.log('🔗 https://sepoliafaucet.com/');
    console.log('🔗 https://sepolia-faucet.pk910.de/');
    console.log('🔗 https://www.alchemy.com/faucets/ethereum-sepolia');
    console.log('');

} catch (error) {
    console.error('❌ Error with Ethereum private key:', error.message);
}

// Get Stellar address (you already have both public and private)
try {
    console.log('⭐ STELLAR WALLET:');
    console.log('Public Key:', process.env.STELLAR_PUBLIC_KEY);
    console.log('Private Key:', process.env.STELLAR_PRIVATE_KEY);
    console.log('');

    console.log('💰 Fund Stellar account here:');
    console.log('🔗 https://laboratory.stellar.org/#account-creator');
    console.log('🔗 https://friendbot.stellar.org/?addr=' + process.env.STELLAR_PUBLIC_KEY);
    console.log('');

} catch (error) {
    console.error('❌ Error with Stellar keys:', error.message);
}

console.log('📋 SUMMARY:');
console.log('1. Copy the Ethereum address above');
console.log('2. Go to any Sepolia faucet and paste it');
console.log('3. Request test ETH (usually 0.1-0.5 ETH)');
console.log('4. For Stellar, click the friendbot link above');
console.log('5. Wait 1-2 minutes for funds to arrive');
console.log('6. Run: npm run cli test');