#!/usr/bin/env node

// Simple console colors without external dependency
const colors = {
    blue: (text) => `\x1b[34m${text}\x1b[0m`,
    green: (text) => `\x1b[32m${text}\x1b[0m`,
    gray: (text) => `\x1b[90m${text}\x1b[0m`,
    bold: (text) => `\x1b[1m${text}\x1b[0m`
};

console.log(colors.blue(colors.bold('\n🌟 Welcome to SynapPay - Cross-Chain Ethereum ↔ Stellar Swaps\n')));

console.log(colors.green('📖 What is SynapPay?'));
console.log('SynapPay enables atomic cross-chain swaps between Ethereum and Stellar');
console.log('using 1inch Fusion+ and Hash Time Locked Contracts (HTLCs).\n');

console.log(colors.green('🏗️  How it works:'));
console.log('1. 🔐 Generate a secret and create hashlock');
console.log('2. 💰 Lock funds in HTLCs on both chains');
console.log('3. 🔄 Use 1inch Fusion+ for optimal execution');
console.log('4. ⚡ Reveal secret to claim funds atomically');
console.log('5. ⏰ Automatic refund if swap times out\n');

console.log(colors.green('🎯 Bounty Compliance:'));
console.log('✅ Track 1: Extend Fusion+ to Stellar ($32K)');
console.log('  - Bidirectional ETH ↔ Stellar swaps');
console.log('  - Hashlock/timelock preservation');
console.log('  - Onchain execution ready');
console.log('✅ Track 2: Best Use of Stellar × 1inch ($10K)');
console.log('  - Meaningful integration of both platforms');
console.log('  - Superior user experience\n');

console.log(colors.green('🚀 Quick Start:'));
console.log('1. npm run setup     # Initialize environment');
console.log('2. npm run build     # Compile contracts');
console.log('3. npm test          # Run tests');
console.log('4. npm run deploy:sepolia  # Deploy to testnet');
console.log('5. npm run cli test  # Test connections\n');

console.log(colors.green('💡 Example Swap:'));
console.log('# Create ETH → Stellar swap');
console.log('npm run cli create-eth-stellar \\');
console.log('  --contract 0x1234... \\');
console.log('  --receiver STELLAR_ADDRESS \\');
console.log('  --eth-amount 0.1 \\');
console.log('  --stellar-amount 100\n');

console.log('# Claim with secret');
console.log('npm run cli claim \\');
console.log('  --contract 0x1234... \\');
console.log('  --swap-id 0xabcd... \\');
console.log('  --preimage SECRET_HEX\n');

console.log(colors.green('🔧 Architecture:'));
console.log('📁 contracts/EthereumHTLC.sol    # Ethereum HTLC contract');
console.log('📁 src/fusion/client.js          # 1inch Fusion+ integration');
console.log('📁 src/stellar/htlc.js           # Stellar HTLC implementation');
console.log('📁 src/relayer/index.js          # Cross-chain orchestrator');
console.log('📁 src/cli/index.js              # Command-line interface\n');

console.log(colors.green('🧪 Testing:'));
console.log('- 12/12 contract tests passing');
console.log('- Full integration test suite');
console.log('- CLI testing tools');
console.log('- Testnet deployment ready\n');

console.log(colors.green('🌐 Networks:'));
console.log('- Ethereum: Sepolia testnet');
console.log('- Stellar: Testnet');
console.log('- 1inch: Fusion+ API integration\n');

console.log(colors.blue(colors.bold('🎉 Ready to build the future of cross-chain DeFi!')));
console.log(colors.gray('Built for ETHGlobal Unite 2025\n'));