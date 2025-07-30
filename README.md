# SynapPay - Cross-Chain Swap with 1inch Fusion+

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://github.com/codewithmirza/synappay)
[![License](https://img.shields.io/badge/license-ISC-green.svg)](LICENSE)
[![1inch Hackathon](https://img.shields.io/badge/1inch-Hackathon-orange.svg)](https://carnelian-raft-206.notion.site/Welcome-to-the-1inch-Hackathon-Landing-Page-1b4af144f6708016bd70c3ec7bbd7027)

**SynapPay** is a cross-chain swap protocol that enables atomic swaps between Ethereum and Stellar networks using 1inch Fusion+ for optimal pricing and liquidity. Built for the 1inch Hackathon with enhanced Fusion+ integration, Dutch auction monitoring, and comprehensive testing.

## 🚀 Features

### Core Functionality
- **Cross-Chain Swaps**: ETH ↔ Stellar (XLM, USDC, custom assets)
- **1inch Fusion+ Integration**: Intent-based orders with Dutch auction
- **HTLC Security**: Hash Time Locked Contracts for atomic swaps
- **Real-time Monitoring**: Live status tracking and auction updates
- **Production-Ready CLI**: Interactive prompts and comprehensive error handling

### 1inch Hackathon Requirements ✅
- ✅ **Intent-Based Orders**: Proper Fusion+ order creation
- ✅ **Dutch Auction Monitoring**: Real-time resolver competition
- ✅ **Official SDK Integration**: Full 1inch Fusion+ SDK usage
- ✅ **Comprehensive Testing**: Full test suite with edge cases
- ✅ **Enhanced Logging**: Real-time status and detailed logs
- ✅ **User-Facing Interface**: Beautiful CLI with interactive prompts

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Ethereum      │    │   1inch Fusion+ │    │    Stellar      │
│   HTLC Contract │◄──►│   Order Book    │◄──►│   HTLC (XLM)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  CrossChain     │    │   Dutch Auction │    │   Claimable     │
│   Relayer       │    │   Monitoring    │    │   Balances      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │
         ▼
┌─────────────────┐
│  Production CLI │
│   Interface     │
└─────────────────┘
```

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/codewithmirza/synappay.git
cd synappay

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
```

## ⚙️ Configuration

Create a `.env` file with the following variables:

```env
# Ethereum Configuration
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
PRIVATE_KEY=your_ethereum_private_key
HTLC_CONTRACT_ADDRESS=your_deployed_contract_address

# Stellar Configuration
STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
STELLAR_PRIVATE_KEY=your_stellar_secret_key

# 1inch Fusion+ Configuration
ONEINCH_API_KEY=your_1inch_api_key
ONEINCH_BASE_URL=https://api.1inch.dev
```

## 🚀 Quick Start

### 1. Deploy HTLC Contract
```bash
# Deploy to Sepolia testnet
npm run deploy

# Or use the CLI
npm run cli deploy
```

### 2. Test Connections
```bash
# Test all network connections
npm run cli test
```

### 3. Create a Swap
```bash
# Interactive swap creation
npm run cli create-swap

# Or use command line
npm run cli create-eth-stellar \
  --contract YOUR_CONTRACT_ADDRESS \
  --receiver STELLAR_ADDRESS \
  --eth-amount 0.1 \
  --stellar-amount 1000000
```

### 4. Monitor Swap Status
```bash
# Real-time monitoring
npm run cli monitor --swap-id YOUR_SWAP_ID
```

### 5. Complete Swap
```bash
# Claim with secret
npm run cli claim \
  --swap-id YOUR_SWAP_ID \
  --preimage YOUR_SECRET
```

## 🧪 Testing

### Run All Tests
```bash
# Unit tests
npm test

# Full integration tests
npm run test:full
```

### Test Specific Components
```bash
# Test Fusion+ integration
npm test -- --grep "Fusion+"

# Test swap lifecycle
npm test -- --grep "Integration"
```

## 📋 CLI Commands

### Main CLI
```bash
# Start CLI
npm run cli

# Available commands:
#   deploy          - Deploy HTLC contract
#   create-swap     - Interactive swap creation
#   monitor         - Real-time status monitoring
#   claim           - Claim swap with secret
#   status          - System status and statistics
#   test            - Test network connections
```

## 🔧 Development

### Project Structure
```
synappay/
├── contracts/           # Smart contracts
│   └── EthereumHTLC.sol
├── src/
│   ├── fusion/         # 1inch Fusion+ integration
│   │   └── client.js
│   ├── stellar/        # Stellar HTLC implementation
│   │   └── htlc.js
│   ├── relayer/        # Cross-chain relayer
│   │   └── index.js
│   └── cli/           # CLI interface
│       └── index.js
├── test/              # Test files
│   ├── EthereumHTLC.test.js
│   └── enhanced-relayer.test.js
└── scripts/           # Deployment and utility scripts
```

### Key Components

#### 1. Fusion+ Client (`src/fusion/client.js`)
- Intent-based order creation
- Dutch auction monitoring
- Resolver competition tracking
- Real-time status updates

#### 2. CrossChain Relayer (`src/relayer/index.js`)
- HTLC contract management
- Cross-chain coordination
- Error handling and recovery
- Status tracking and logging

#### 3. Production CLI (`src/cli/index.js`)
- Interactive prompts
- Real-time monitoring
- Comprehensive error handling
- Environment variable validation

## 🎯 1inch Hackathon Features

### Fusion+ Integration
- ✅ **Intent-Based Orders**: Proper signed intents, not simple swaps
- ✅ **Dutch Auction**: Real-time resolver competition monitoring
- ✅ **Official SDK**: Full 1inch Fusion+ SDK integration
- ✅ **Order Tracking**: Comprehensive order status management

### Enhanced User Experience
- ✅ **Real-time Monitoring**: Live status updates and auction progress
- ✅ **Interactive CLI**: Beautiful prompts and progress indicators
- ✅ **Comprehensive Logging**: Detailed status history and error tracking
- ✅ **Error Handling**: Graceful error recovery and user feedback

### Testing & Documentation
- ✅ **Full Test Suite**: Unit, integration, and edge case testing
- ✅ **Testnet Deployment**: Complete testnet testing workflow
- ✅ **Documentation**: Comprehensive README and inline comments
- ✅ **Production Ready**: No mock code, all real implementations

## 🔒 Security Features

- **HTLC Security**: Hash Time Locked Contracts ensure atomic swaps
- **Timelock Protection**: Automatic refunds on timeout
- **Secret Verification**: Cryptographic preimage verification
- **Error Recovery**: Graceful handling of network failures

## 🌐 Network Support

### Ethereum (Sepolia Testnet)
- HTLC smart contracts
- 1inch Fusion+ integration
- Real-time event monitoring

### Stellar (Testnet)
- Claimable balance HTLCs
- Multi-asset support (XLM, USDC, custom)
- Fast finality and low fees

## 📊 Performance

- **Swap Time**: ~30-60 seconds (depending on network conditions)
- **Gas Optimization**: Efficient contract design
- **Real-time Updates**: 5-second monitoring intervals
- **Error Recovery**: Automatic retry mechanisms

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [1inch](https://1inch.io/) for Fusion+ protocol
- [Stellar](https://stellar.org/) for blockchain infrastructure
- [Ethereum](https://ethereum.org/) for smart contract platform

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/codewithmirza/synappay/issues)
- **Documentation**: [Wiki](https://github.com/codewithmirza/synappay/wiki)
- **Discussions**: [GitHub Discussions](https://github.com/codewithmirza/synappay/discussions)

---

**Built for the 1inch Hackathon** 🚀

*Cross-chain swaps made simple, secure, and efficient with 1inch Fusion+ integration.*