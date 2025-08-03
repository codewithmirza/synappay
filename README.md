# SynapPay

Cross-chain atomic swaps extending 1inch Fusion+ to Stellar using Hash Time Locked Contracts (HTLC).

## 🚀 New Architecture

This project has been migrated to a modern pnpm workspace structure with Vite + React + TypeScript for improved performance and developer experience.

### Workspace Structure

```
synappay/
├── contracts/     # Smart contracts (Hardhat)
├── stellar/       # Stellar integration
├── relayer/       # Backend relayer service
└── web/          # Frontend (Vite + React + TypeScript)
```

### Technology Stack

- **Frontend**: Vite + React + TypeScript
- **Styling**: Tailwind CSS with custom dark theme
- **Ethereum**: Ethers.js
- **Stellar**: Stellar SDK + Freighter API
- **Package Manager**: pnpm workspaces
- **Build Tool**: Vite

## 🛠️ Development

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0

### Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build all workspaces
pnpm build

# Build for production
pnpm build:prod
```

### Workspace Commands

```bash
# Frontend (web)
pnpm web:dev          # Start development server
pnpm web:build        # Build frontend
pnpm web:preview      # Preview build

# Smart Contracts
pnpm contracts:compile # Compile contracts
pnpm contracts:deploy  # Deploy to mainnet
pnpm contracts:deploy:sepolia # Deploy to testnet

# Stellar
pnpm stellar:build    # Build stellar integration

# Relayer
pnpm relayer:start    # Start relayer service
```

## 🌟 Features

- **Cross-chain Swaps**: Ethereum ↔ Stellar
- **1inch Fusion+ Integration**: Advanced swap routing
- **HTLC Security**: Hash Time Locked Contracts
- **Real-time Updates**: WebSocket connections
- **Dark Theme**: Modern glass morphism UI
- **Wallet Integration**: MetaMask + Freighter
- **Transaction History**: Complete swap tracking

## 🔧 Environment Variables

Create a `.env` file in the root directory:

```env
# Network Configuration
VITE_NETWORK_MODE=testnet

# Ethereum RPC URLs
VITE_SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
VITE_MAINNET_RPC_URL=https://mainnet.infura.io/v3/YOUR_KEY

# 1inch API
VITE_ONEINCH_API_KEY=your_1inch_api_key

# Contract Addresses
VITE_HTLC_CONTRACT_ADDRESS=0x...
VITE_STELLAR_HTLC_ADDRESS=...
```

## 📦 Migration from Next.js

This project has been successfully migrated from Next.js to Vite for:

- **Faster Development**: Hot module replacement
- **Better Performance**: Optimized builds
- **Modern Tooling**: Latest React features
- **TypeScript Support**: Full type safety
- **Monorepo Structure**: pnpm workspaces

## 🎨 UI/UX Improvements

- **Dark Theme**: Consistent dark mode
- **Glass Morphism**: Modern glass effects
- **Gradient Borders**: Animated flowing borders
- **Toast Notifications**: User feedback system
- **Responsive Design**: Mobile-first approach

## 🔗 Links

- [Live Demo](https://synappay.com)
- [GitHub](https://github.com/synappay)

## 📄 License

MIT License - see LICENSE file for details. 