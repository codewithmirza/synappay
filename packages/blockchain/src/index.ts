// Synappay-style Cross-Chain Bridge Components
export { StellarHTLCManager, StellarHTLCParams, StellarHTLCStatus } from './stellar/htlc-manager';
export { CrossChainCoordinator, SwapRequest, SwapState } from './cross-chain-coordinator';

// Re-export Fusion+ client from protocols
export { FusionPlusClient, CrossChainSwapParams, FusionOrder } from '../../../packages/protocols/src/fusion-plus/client';