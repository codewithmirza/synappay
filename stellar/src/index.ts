/**
 * Stellar Integration for SynapPay
 * Cross-chain bridge functionality for Stellar blockchain
 */

import { StellarClient } from './stellar-client';
import { EnhancedStellarBridge } from './enhanced-stellar-bridge';
import { ClaimableBalance } from './claimable-balance';

// Export main classes
export { StellarClient } from './stellar-client';
export { EnhancedStellarBridge } from './enhanced-stellar-bridge';
export { ClaimableBalance } from './claimable-balance';

// Export types
export interface StellarConfig {
  horizonUrl: string;
  networkPassphrase: string;
  testnet: boolean;
}

export interface HTLCConfig {
  timeout: number;
  secretHash: string;
  amount: string;
  asset: string;
}

// Default configuration
export const DEFAULT_CONFIG: StellarConfig = {
  horizonUrl: 'https://horizon.stellar.org',
  networkPassphrase: 'Public Global Stellar Network ; September 2015',
  testnet: false
};

// Main bridge class
export class SynapPayStellarBridge {
  private client: StellarClient;
  private bridge: EnhancedStellarBridge;

  constructor(config: StellarConfig = DEFAULT_CONFIG) {
    this.client = new StellarClient(config);
    this.bridge = new EnhancedStellarBridge(this.client);
  }

  async createHTLC(config: HTLCConfig): Promise<string> {
    return this.bridge.createHTLC(config);
  }

  async claimHTLC(htlcId: string, secret: string): Promise<boolean> {
    return this.bridge.claimHTLC(htlcId, secret);
  }

  async refundHTLC(htlcId: string): Promise<boolean> {
    return this.bridge.refundHTLC(htlcId);
  }

  getClient(): StellarClient {
    return this.client;
  }

  getBridge(): EnhancedStellarBridge {
    return this.bridge;
  }
}

// Export default instance
export default SynapPayStellarBridge; 