#!/usr/bin/env node

// SynapPay Environment Validation Script
// Run with: node scripts/validate-env.js

const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

console.log(chalk.blue.bold('🔧 SynapPay Environment Validation\n'));

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const requiredVars = {
  // Core required variables
  core: [
    'NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID',
    'NEXT_PUBLIC_NETWORK_MODE'
  ],
  
  // Ethereum variables
  ethereum: [
    'NEXT_PUBLIC_SEPOLIA_RPC_URL',
    'NEXT_PUBLIC_SEPOLIA_HTLC_ADDRESS'
  ],
  
  // Stellar variables
  stellar: [
    'NEXT_PUBLIC_STELLAR_TESTNET_HORIZON_URL',
    'NEXT_PUBLIC_STELLAR_TESTNET_HTLC_ADDRESS'
  ],
  
  // API variables (new architecture)
  api: [
    'NEXT_PUBLIC_SYNAPPAY_API_URL',
    'NEXT_PUBLIC_COORDINATOR_WS_URL'
  ],
  
  // Token addresses
  tokens: [
    'NEXT_PUBLIC_USDC_ADDRESS',
    'NEXT_PUBLIC_USDT_ADDRESS',
    'NEXT_PUBLIC_DAI_ADDRESS'
  ]
};

const optionalVars = {
  // Production variables
  production: [
    'NEXT_PUBLIC_ETHEREUM_RPC_URL',
    'NEXT_PUBLIC_ETHEREUM_HTLC_ADDRESS',
    'NEXT_PUBLIC_STELLAR_MAINNET_HORIZON_URL',
    'NEXT_PUBLIC_STELLAR_MAINNET_HTLC_ADDRESS'
  ],
  
  // Feature flags
  features: [
    'NEXT_PUBLIC_ENABLE_TESTNET_BANNER',
    'NEXT_PUBLIC_ENABLE_NETWORK_SWITCH',
    'NEXT_PUBLIC_ENABLE_MARKETPLACE_MODE'
  ]
};

function validateEnvironment() {
  let hasErrors = false;
  let hasWarnings = false;

  console.log(chalk.yellow('📋 Checking Required Variables...\n'));

  // Check required variables
  Object.entries(requiredVars).forEach(([category, vars]) => {
    console.log(chalk.cyan.bold(`${category.toUpperCase()}:`));
    
    vars.forEach(varName => {
      const value = process.env[varName];
      if (!value || value.trim() === '') {
        console.log(chalk.red(`  ❌ ${varName} - MISSING`));
        hasErrors = true;
      } else if (value.includes('your_') || value.includes('0x0000000000000000000000000000000000000000')) {
        console.log(chalk.yellow(`  ⚠️  ${varName} - PLACEHOLDER VALUE`));
        hasWarnings = true;
      } else {
        console.log(chalk.green(`  ✅ ${varName} - OK`));
      }
    });
    console.log();
  });

  console.log(chalk.yellow('📋 Checking Optional Variables...\n'));

  // Check optional variables
  Object.entries(optionalVars).forEach(([category, vars]) => {
    console.log(chalk.cyan.bold(`${category.toUpperCase()}:`));
    
    vars.forEach(varName => {
      const value = process.env[varName];
      if (!value || value.trim() === '') {
        console.log(chalk.gray(`  ⚪ ${varName} - NOT SET (optional)`));
      } else if (value.includes('your_') || value.includes('0x0000000000000000000000000000000000000000')) {
        console.log(chalk.yellow(`  ⚠️  ${varName} - PLACEHOLDER VALUE`));
      } else {
        console.log(chalk.green(`  ✅ ${varName} - OK`));
      }
    });
    console.log();
  });

  // Network-specific validation
  const networkMode = process.env.NEXT_PUBLIC_NETWORK_MODE;
  console.log(chalk.cyan.bold('NETWORK VALIDATION:'));
  console.log(chalk.blue(`  Current network mode: ${networkMode || 'NOT SET'}`));
  
  if (networkMode === 'mainnet') {
    const mainnetVars = [
      'NEXT_PUBLIC_ETHEREUM_RPC_URL',
      'NEXT_PUBLIC_ETHEREUM_HTLC_ADDRESS',
      'NEXT_PUBLIC_STELLAR_MAINNET_HORIZON_URL',
      'NEXT_PUBLIC_STELLAR_MAINNET_HTLC_ADDRESS'
    ];
    
    mainnetVars.forEach(varName => {
      const value = process.env[varName];
      if (!value || value.includes('your_') || value.includes('0x0000000000000000000000000000000000000000')) {
        console.log(chalk.red(`  ❌ ${varName} - REQUIRED FOR MAINNET`));
        hasErrors = true;
      }
    });
  }

  console.log();

  // Summary
  if (hasErrors) {
    console.log(chalk.red.bold('❌ VALIDATION FAILED'));
    console.log(chalk.red('Please fix the missing required variables before proceeding.'));
    console.log(chalk.blue('📖 See ENVIRONMENT_SETUP.md for detailed setup instructions.'));
    process.exit(1);
  } else if (hasWarnings) {
    console.log(chalk.yellow.bold('⚠️  VALIDATION PASSED WITH WARNINGS'));
    console.log(chalk.yellow('Some variables have placeholder values. Update them for production use.'));
  } else {
    console.log(chalk.green.bold('✅ VALIDATION PASSED'));
    console.log(chalk.green('All required environment variables are properly configured!'));
  }

  // Additional checks
  console.log(chalk.blue('\n🔍 Additional Checks:'));
  
  // Check if .env.local exists
  const envPath = path.join(__dirname, '../.env.local');
  if (fs.existsSync(envPath)) {
    console.log(chalk.green('  ✅ .env.local file exists'));
  } else {
    console.log(chalk.red('  ❌ .env.local file not found'));
  }

  // Check WalletConnect Project ID format
  const wcProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
  if (wcProjectId && wcProjectId.length === 32) {
    console.log(chalk.green('  ✅ WalletConnect Project ID format looks correct'));
  } else if (wcProjectId) {
    console.log(chalk.yellow('  ⚠️  WalletConnect Project ID format might be incorrect'));
  }

  // Check RPC URL format
  const rpcUrl = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL;
  if (rpcUrl && rpcUrl.startsWith('https://')) {
    console.log(chalk.green('  ✅ Sepolia RPC URL format looks correct'));
  } else if (rpcUrl) {
    console.log(chalk.yellow('  ⚠️  Sepolia RPC URL should start with https://'));
  }

  console.log(chalk.blue('\n🚀 Next Steps:'));
  console.log('1. Deploy Cloudflare Workers API');
  console.log('2. Deploy Railway Coordinator');
  console.log('3. Update API URLs in environment variables');
  console.log('4. Test the complete application flow');
}

// Run validation
validateEnvironment();