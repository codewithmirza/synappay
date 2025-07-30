#!/usr/bin/env node

const { ethers } = require('ethers');

console.log('🎯 FINAL WALLET VALUES FOR YOUR .env FILE\n');

// Use the original private key that was in your .env
const originalPrivateKey = '0xadbecbc1aff90ab1fd8d8b0476d1776e8d0ce5d2a8bc2647844f6171a62c5b98';
const wallet = new ethers.Wallet(originalPrivateKey);

console.log('💎 ETHEREUM WALLET (Copy these exact values):');
console.log('PRIVATE_KEY=' + originalPrivateKey);
console.log('');
console.log('📍 ETHEREUM ADDRESS TO FUND:');
console.log(wallet.address);
console.log('');

console.log('⭐ STELLAR WALLET (Already in your .env):');
console.log('STELLAR_PUBLIC_KEY=GCLVYWBS6WKZYVN22D62JQP3OQ3XVOX5HPBMPSQOTHMPHH4N6D6VGKTN');
console.log('STELLAR_PRIVATE_KEY=SBKDC6G3MDAFXU2QKGEMB34UK7IDBGAJ3WL3OPHBXOO2HGXDVOI6VC22');
console.log('');

console.log('🎯 COMPLETE .env UPDATE:');
console.log('Replace this line in your .env:');
console.log('FROM: PRIVATE_KEY=YOUR_METAMASK_PRIVATE_KEY_HERE');
console.log('TO:   PRIVATE_KEY=' + originalPrivateKey);
console.log('');

console.log('💰 FUND THESE ADDRESSES (ONE TIME ONLY):');
console.log('1. Ethereum Sepolia: ' + wallet.address);
console.log('   Go to: https://sepoliafaucet.com/');
console.log('');
console.log('2. Stellar Testnet: GCLVYWBS6WKZYVN22D62JQP3OQ3XVOX5HPBMPSQOTHMPHH4N6D6VGKTN');
console.log('   Go to: https://friendbot.stellar.org/?addr=GCLVYWBS6WKZYVN22D62JQP3OQ3XVOX5HPBMPSQOTHMPHH4N6D6VGKTN');
console.log('');

console.log('✅ AFTER UPDATING .env, RUN:');
console.log('npm run cli test');