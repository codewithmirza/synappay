#!/usr/bin/env node

const { ethers } = require('ethers');
require('dotenv').config();

console.log('🦊 Verifying MetaMask wallet integration...\n');

try {
    // Create wallet from private key
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY);
    
    console.log('💎 WALLET VERIFICATION:');
    console.log('Your MetaMask Address: 0xa64B1f369f98CE154148B8B3239245951E3E7843');
    console.log('Derived from Private Key:', wallet.address);
    console.log('');
    
    // Check if addresses match
    const expectedAddress = '0xa64B1f369f98CE154148B8B3239245951E3E7843';
    const derivedAddress = wallet.address;
    
    if (expectedAddress.toLowerCase() === derivedAddress.toLowerCase()) {
        console.log('✅ SUCCESS! Private key matches your MetaMask address');
        console.log('🎉 Your MetaMask wallet is properly configured');
    } else {
        console.log('❌ ERROR! Private key does not match your MetaMask address');
        console.log('🔧 Please double-check the private key you copied from MetaMask');
    }
    
    console.log('\n💰 NEXT STEPS:');
    console.log('1. Fund this address with Sepolia ETH:');
    console.log('   Address:', derivedAddress);
    console.log('   Faucet: https://sepoliafaucet.com/');
    console.log('2. Run: npm run cli test');
    
} catch (error) {
    console.error('❌ Error verifying wallet:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure you copied the full private key from MetaMask');
    console.log('2. Private key should start with 0x');
    console.log('3. Private key should be 66 characters long (including 0x)');
}