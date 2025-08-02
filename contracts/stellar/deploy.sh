#!/bin/bash

# Stellar HTLC Contract Deployment Script
echo "🚀 Deploying Stellar HTLC Smart Contract..."

# Check if Stellar CLI is installed
if ! command -v stellar &> /dev/null; then
    echo "❌ Stellar CLI not found. Installing..."
    npm install -g @stellar/cli
fi

# Build the contract
echo "🔨 Building Stellar smart contract..."
stellar contract build

# Deploy to testnet
echo "📤 Deploying to Stellar testnet..."
CONTRACT_ID=$(stellar contract deploy \
    --wasm target/wasm32-unknown-unknown/release/stellar_htlc.wasm \
    --source-account $STELLAR_PRIVATE_KEY \
    --network testnet)

echo "✅ Contract deployed successfully!"
echo "📋 Contract ID: $CONTRACT_ID"

# Save contract ID to environment
echo "" >> ../../.env
echo "# Stellar HTLC Smart Contract" >> ../../.env
echo "STELLAR_HTLC_CONTRACT_ID=$CONTRACT_ID" >> ../../.env

# Initialize the contract (if needed)
echo "🔧 Initializing contract..."

echo "🎉 Stellar HTLC deployment complete!"
echo "Contract ID: $CONTRACT_ID"
echo "Network: Stellar Testnet"
echo "Explorer: https://stellar.expert/explorer/testnet/contract/$CONTRACT_ID"