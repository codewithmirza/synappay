# SynapPay - Cross-Chain Atomic Swaps

A decentralized platform enabling atomic swaps between Ethereum and Stellar networks using HTLC (Hash Time Lock Contracts) and 1inch Fusion+ integration.

## Core Features

- **HTLC Atomic Swaps**: Secure cross-chain token exchanges with time-locked contracts
- **1inch Fusion+ Integration**: Leverages 1inch's Fusion+ protocol for Ethereum-side liquidity
- **Dual Contract Architecture**: Custom HTLC contracts for testnet, official 1inch Escrow Factory for mainnet
- **Automated Relayer**: Seamless user experience with automated cross-chain coordination
- **Real-time Rates**: Live exchange rates via CoinGecko API integration

## Supported Networks

- **Testnet**: Sepolia ↔ Stellar Testnet (custom contracts)
- **Mainnet**: Ethereum ↔ Stellar Mainnet (1inch Escrow Factory)

## Architecture

User locks tokens on source chain → Relayer detects lock → Creates corresponding lock on target chain → User claims with preimage → Relayer claims original tokens → Automatic refund if timeout expires. 