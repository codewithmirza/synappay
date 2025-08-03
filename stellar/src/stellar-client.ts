import type { StellarConfig } from './index';

export class StellarClient {
  private config: StellarConfig;

  constructor(config: StellarConfig) {
    this.config = config;
  }

  getConfig(): StellarConfig {
    return this.config;
  }

  async getAccount(accountId: string) {
    // Placeholder implementation
    console.log('Getting account:', accountId);
    return { id: accountId };
  }

  async getNetworkPassphrase(): Promise<string> {
    return this.config.networkPassphrase;
  }

  isTestnet(): boolean {
    return this.config.testnet;
  }
} 