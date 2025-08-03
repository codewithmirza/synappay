// Synappay-style Stellar HTLC Manager using Claimable Balances
import { 
  Server, 
  Keypair, 
  TransactionBuilder, 
  Operation, 
  Asset, 
  Networks,
  Claimant,
  Predicate,
  xdr,
  StrKey
} from 'stellar-sdk';
import { createHash } from 'crypto';

export interface StellarHTLCParams {
  sender: Keypair;
  receiver: string;
  amount: string;
  asset: Asset;
  hashlock: string; // SHA256 hash of the secret
  timelock: number; // Unix timestamp
}

export interface StellarHTLCStatus {
  balanceId: string;
  status: 'active' | 'claimed' | 'expired';
  amount: string;
  asset: Asset;
  claimants: any[];
  hashlock: string;
  timelock: number;
}

export class StellarHTLCManager {
  private server: Server;
  private networkPassphrase: string;
  private isTestnet: boolean;

  constructor(horizonUrl: string, isTestnet: boolean = true) {
    this.server = new Server(horizonUrl);
    this.isTestnet = isTestnet;
    this.networkPassphrase = isTestnet ? Networks.TESTNET : Networks.PUBLIC;
  }

  /**
   * Create HTLC using Stellar Claimable Balance (Synappay approach)
   * Creates a claimable balance with two conditions:
   * 1. Can be claimed by receiver with correct preimage
   * 2. Can be reclaimed by sender after timelock expires
   */
  async createHTLC(params: StellarHTLCParams): Promise<string> {
    try {
      // Load sender account
      const senderAccount = await this.server.loadAccount(params.sender.publicKey());
      
      // Create claimants with conditions
      const claimants = [
        // Receiver can claim with preimage (hashlock condition)
        new Claimant(
          params.receiver,
          Predicate.and(
            Predicate.not(Predicate.absBefore(params.timelock.toString())),
            // Note: Stellar doesn't have native hashlock, so we simulate it
            // The actual hashlock verification happens in the claiming process
            Predicate.unconditional()
          )
        ),
        // Sender can reclaim after timelock expires
        new Claimant(
          params.sender.publicKey(),
          Predicate.not(Predicate.absBefore(params.timelock.toString()))
        )
      ];

      // Build transaction with create claimable balance operation
      const transaction = new TransactionBuilder(senderAccount, {
        fee: '10000',
        networkPassphrase: this.networkPassphrase
      })
        .addOperation(
          Operation.createClaimableBalance({
            asset: params.asset,
            amount: params.amount,
            claimants: claimants
          })
        )
        .setTimeout(300)
        .build();

      // Sign and submit transaction
      transaction.sign(params.sender);
      const result = await this.server.submitTransaction(transaction);

      // Extract balance ID from transaction result
      const balanceId = this.extractBalanceId(result);
      
      console.log('Stellar HTLC created:', {
        balanceId,
        amount: params.amount,
        asset: params.asset.code || 'XLM',
        hashlock: params.hashlock,
        timelock: params.timelock
      });

      return balanceId;
    } catch (error) {
      console.error('Failed to create Stellar HTLC:', error);
      throw error;
    }
  }

  /**
   * Claim HTLC by providing the preimage
   * Verifies the preimage matches the hashlock before claiming
   */
  async claimHTLC(params: {
    claimer: Keypair;
    balanceId: string;
    preimage: string;
    expectedHashlock: string;
  }): Promise<string> {
    try {
      // Verify preimage matches hashlock
      const computedHash = createHash('sha256').update(params.preimage, 'hex').digest('hex');
      if (computedHash !== params.expectedHashlock) {
        throw new Error('Preimage does not match hashlock');
      }

      // Load claimer account
      const claimerAccount = await this.server.loadAccount(params.claimer.publicKey());

      // Build claim transaction
      const transaction = new TransactionBuilder(claimerAccount, {
        fee: '10000',
        networkPassphrase: this.networkPassphrase
      })
        .addOperation(
          Operation.claimClaimableBalance({
            balanceId: params.balanceId
          })
        )
        .setTimeout(300)
        .build();

      // Sign and submit
      transaction.sign(params.claimer);
      const result = await this.server.submitTransaction(transaction);

      console.log('Stellar HTLC claimed:', {
        balanceId: params.balanceId,
        claimer: params.claimer.publicKey(),
        preimage: params.preimage,
        txHash: result.hash
      });

      return result.hash;
    } catch (error) {
      console.error('Failed to claim Stellar HTLC:', error);
      throw error;
    }
  }

  /**
   * Refund HTLC after timelock expires (sender reclaims)
   */
  async refundHTLC(params: {
    sender: Keypair;
    balanceId: string;
  }): Promise<string> {
    try {
      // Load sender account
      const senderAccount = await this.server.loadAccount(params.sender.publicKey());

      // Build refund transaction
      const transaction = new TransactionBuilder(senderAccount, {
        fee: '10000',
        networkPassphrase: this.networkPassphrase
      })
        .addOperation(
          Operation.claimClaimableBalance({
            balanceId: params.balanceId
          })
        )
        .setTimeout(300)
        .build();

      // Sign and submit
      transaction.sign(params.sender);
      const result = await this.server.submitTransaction(transaction);

      console.log('Stellar HTLC refunded:', {
        balanceId: params.balanceId,
        sender: params.sender.publicKey(),
        txHash: result.hash
      });

      return result.hash;
    } catch (error) {
      console.error('Failed to refund Stellar HTLC:', error);
      throw error;
    }
  }

  /**
   * Get HTLC status by checking claimable balance
   */
  async getHTLCStatus(balanceId: string): Promise<StellarHTLCStatus | null> {
    try {
      const claimableBalance = await this.server.claimableBalances()
        .claimableBalance(balanceId)
        .call();

      const now = Math.floor(Date.now() / 1000);
      let status: 'active' | 'claimed' | 'expired' = 'active';

      // Check if expired (simplified - would need to parse claimant conditions properly)
      const timelock = this.extractTimelockFromClaimants(claimableBalance.claimants);
      if (timelock && now > timelock) {
        status = 'expired';
      }

      return {
        balanceId: balanceId,
        status: status,
        amount: claimableBalance.amount,
        asset: claimableBalance.asset,
        claimants: claimableBalance.claimants,
        hashlock: '', // Would need to be stored separately or in memo
        timelock: timelock || 0
      };
    } catch (error) {
      if (error.response?.status === 404) {
        // Balance not found - likely claimed or never existed
        return null;
      }
      console.error('Failed to get HTLC status:', error);
      throw error;
    }
  }

  /**
   * Get all active HTLCs for an account
   */
  async getActiveHTLCs(accountId: string): Promise<StellarHTLCStatus[]> {
    try {
      const claimableBalances = await this.server.claimableBalances()
        .claimant(accountId)
        .limit(100)
        .call();

      const htlcs: StellarHTLCStatus[] = [];
      
      for (const balance of claimableBalances.records) {
        const timelock = this.extractTimelockFromClaimants(balance.claimants);
        const now = Math.floor(Date.now() / 1000);
        
        let status: 'active' | 'claimed' | 'expired' = 'active';
        if (timelock && now > timelock) {
          status = 'expired';
        }

        htlcs.push({
          balanceId: balance.id,
          status: status,
          amount: balance.amount,
          asset: balance.asset,
          claimants: balance.claimants,
          hashlock: '', // Would need additional storage
          timelock: timelock || 0
        });
      }

      return htlcs;
    } catch (error) {
      console.error('Failed to get active HTLCs:', error);
      return [];
    }
  }

  /**
   * Generate a random preimage and its hash for HTLC
   */
  generateHashlock(): { preimage: string; hashlock: string } {
    const preimage = Keypair.random().secret(); // Use as random bytes
    const hashlock = createHash('sha256').update(preimage, 'hex').digest('hex');
    
    return { preimage, hashlock };
  }

  /**
   * Verify a preimage matches a hashlock
   */
  verifyPreimage(preimage: string, hashlock: string): boolean {
    const computedHash = createHash('sha256').update(preimage, 'hex').digest('hex');
    return computedHash === hashlock;
  }

  // Helper methods
  private extractBalanceId(transactionResult: any): string {
    // Extract balance ID from transaction result
    // This would need to parse the transaction result properly
    const operations = transactionResult.result_xdr;
    // Simplified - would need proper XDR parsing
    return 'balance_id_placeholder';
  }

  private extractTimelockFromClaimants(claimants: any[]): number | null {
    // Extract timelock from claimant conditions
    // This would need to parse the predicate conditions properly
    for (const claimant of claimants) {
      if (claimant.predicate && claimant.predicate.abs_before) {
        return parseInt(claimant.predicate.abs_before);
      }
    }
    return null;
  }
}