# SynapPay Wallet Connection Setup

This document describes the new wallet connection implementation using Reown AppKit for Ethereum and Freighter for Stellar.

## Overview

The new implementation provides:
- **Ethereum**: Reown AppKit (WalletConnect v2) integration
- **Stellar**: Freighter browser extension integration
- **Top-right wallet connection button** with dropdown interface
- **Clean separation** of wallet concerns
- **Removed redundant code** from old WalletConnect implementation

## Architecture

### New Files Created:
- `lib/useReownWallet.js` - Ethereum wallet hook using Wagmi
- `lib/useStellarWallet.js` - Stellar wallet hook using Freighter
- `lib/useCombinedWallet.js` - Combined wallet state management
- `lib/wagmi-config.js` - Wagmi configuration for Reown
- `components/WalletConnectionButton.js` - Top-right wallet connection UI

### Files Removed:
- `lib/useWalletConnect.js` - Old WalletConnect hook
- `lib/walletconnect.js` - Old WalletConnect manager
- `lib/useDualWallet.js` - Old dual wallet hook
- `lib/dual-wallet-manager.js` - Old dual wallet manager
- `lib/useCrossChainWallet.js` - Old cross-chain wallet hook

## Setup Instructions

### 1. Environment Variables

Add these to your `.env.local`:

```env
# WalletConnect Project ID (from Reown)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here

# Ethereum RPC
NEXT_PUBLIC_SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/your_project_id

# Other existing variables...
```

### 2. Reown AppKit Setup

1. Visit [https://reown.com](https://reown.com) and create an account
2. Create a new project and select **AppKit**
3. Copy your Project ID
4. Add the Project ID to your environment variables

### 3. Freighter Setup

1. Install Freighter browser extension from [https://www.freighter.app/](https://www.freighter.app/)
2. Create a testnet account
3. The app will automatically detect Freighter when available

## Usage

### Wallet Connection Button

The wallet connection button is now positioned in the top-right corner of all pages and provides:

- **Visual status**: Shows connection state (Connected, Partially Connected, Not Connected)
- **Dropdown interface**: Click to see detailed wallet information
- **Network switching**: Automatic Sepolia network detection and switching
- **Freighter detection**: Automatic detection and installation prompts

### React Hooks

```javascript
import { useCombinedWallet } from '../lib/useCombinedWallet';

const {
  // Ethereum
  ethConnected,
  ethAddress,
  connectEth,
  disconnectEth,
  
  // Stellar
  stellarConnected,
  stellarPublicKey,
  connectStellar,
  disconnectStellar,
  
  // Combined
  bothConnected,
  canSwap,
} = useCombinedWallet();
```

## Features

### Ethereum (Reown AppKit)
- ✅ WalletConnect v2 integration
- ✅ Multiple wallet support (MetaMask, Trust Wallet, Rainbow, etc.)
- ✅ Automatic network switching to Sepolia
- ✅ Transaction signing
- ✅ Message signing

### Stellar (Freighter)
- ✅ Freighter browser extension integration
- ✅ Testnet support
- ✅ Transaction signing
- ✅ Message signing
- ✅ Automatic detection

### UI Improvements
- ✅ Top-right wallet connection button
- ✅ Dropdown interface with detailed wallet info
- ✅ Network status indicators
- ✅ Error handling and user feedback
- ✅ Responsive design

## Migration Notes

### Breaking Changes:
1. **Environment variable**: `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` is now required
2. **Hook names**: `useDualWallet` → `useCombinedWallet`
3. **Component imports**: Updated to use new wallet connection button

### Updated Pages:
- `pages/index.js` - Updated to use new wallet hooks and top-right button
- `pages/swap.js` - Updated to use new wallet hooks and top-right button
- `pages/_app.js` - Added Wagmi and React Query providers

## Troubleshooting

### Common Issues:

1. **WalletConnect not connecting**:
   - Check your `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` is correct
   - Ensure you're using the correct Project ID from Reown

2. **Freighter not detected**:
   - Install Freighter browser extension
   - Ensure you're on a supported browser (Chrome, Firefox, Edge)

3. **Network switching issues**:
   - The app automatically detects and prompts for Sepolia network
   - Users can manually switch networks in their wallet

4. **Build errors**:
   - Ensure all dependencies are installed: `npm install`
   - Check that all environment variables are set correctly

## Security Notes

- **API Keys**: Never expose 1inch API keys in client-side code
- **Proxy**: All 1inch API calls should go through your backend
- **Environment Variables**: Keep sensitive keys in server-side environment variables only

## Next Steps

1. **Test the implementation** with both Ethereum and Stellar wallets
2. **Deploy to staging** to verify the wallet connections work in production
3. **Update documentation** for users on how to connect wallets
4. **Monitor for any issues** and gather user feedback 