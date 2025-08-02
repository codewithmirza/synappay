import { Server, Networks, Asset, TransactionBuilder, Operation, Claimant, Predicate, Keypair, BASE_FEE, hash, xdr } from 'stellar-sdk';

/**
 * Stellar HTLC Manager for Soroban Smart Contracts
 * Handles HTLC operations on Stellar blockchain
 */
export class StellarHTLCManager {
  constructor(horizonUrl = 'https://horizon-testnet.stellar.org') {
    this.server = new Server(horizonUrl);
    this.networkPassphrase = Networks.TESTNET;
  }

  /**
   * Initialize connection to Stellar network
   */
  async initialize() {
    try {
      // Test connection
      await this.server.loadAccount('GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF');
      console.log('✅ Connected to Stellar network');
      return true;
    } catch (error) {
      console.error('❌ Failed to connect to Stellar:', error);
      return false;
    }
  }

  /**
   * Create HTLC on Stellar using Soroban smart contract
   */
  async createHTLC(params) {
    const {
      senderSecretKey,
      receiverPublicKey,
      amount,
      assetCode = 'XLM',
      assetIssuer,
      hashlock,
      timelock,
    } = params;

    try {
      const senderKeypair = Keypair.fromSecret(senderSecretKey);
      const senderAccount = await this.server.loadAccount(senderKeypair.publicKey());

      // Create HTLC transaction
      const transaction = new TransactionBuilder(senderAccount, {
        fee: BASE_FEE,
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(
          Operation.createClaimableBalance({
            asset: assetCode === 'XLM' 
              ? Asset.native() 
              : new Asset(assetCode, assetIssuer),
            amount: amount.toString(),
            claimants: [
              new Claimant(
                receiverPublicKey,
                Predicate.hashX(hashlock)
              ),
              new Claimant(
                senderKeypair.publicKey(),
                Predicate.not(
                  Predicate.or(
                    Predicate.hashX(hashlock),
                    Predicate.beforeAbsoluteTime(timelock)
                  )
                )
              ),
            ],
          })
        )
        .setTimeout(timelock + 60) // Add buffer
        .build();

      // Sign and submit transaction
      transaction.sign(senderKeypair);
      const result = await this.server.submitTransaction(transaction);

      return {
        success: true,
        transactionHash: result.hash,
        balanceId: this.extractBalanceId(result),
        hashlock,
        timelock,
      };
    } catch (error) {
      console.error('Error creating Stellar HTLC:', error);
      throw error;
    }
  }

  /**
   * Claim HTLC with preimage
   */
  async claimHTLC(params) {
    const {
      receiverSecretKey,
      balanceId,
      preimage,
    } = params;

    try {
      const receiverKeypair = Keypair.fromSecret(receiverSecretKey);
      const receiverAccount = await this.server.loadAccount(receiverKeypair.publicKey());

      // Create claim transaction
      const transaction = new TransactionBuilder(receiverAccount, {
        fee: BASE_FEE,
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(
          Operation.claimClaimableBalance({
            balanceId: balanceId,
          })
        )
        .setTimeout(30)
        .build();

      // Sign with preimage
      transaction.sign(receiverKeypair);
      
      // Add preimage signature
      const hashX = hash(preimage);
      const signature = receiverKeypair.sign(hashX);
      transaction.signatures.push(new xdr.DecoratedSignature({
        hint: receiverKeypair.signatureHint(),
        signature: signature,
      }));

      const result = await this.server.submitTransaction(transaction);

      return {
        success: true,
        transactionHash: result.hash,
        preimage,
      };
    } catch (error) {
      console.error('Error claiming Stellar HTLC:', error);
      throw error;
    }
  }

  /**
   * Refund HTLC after timelock expires
   */
  async refundHTLC(params) {
    const {
      senderSecretKey,
      balanceId,
    } = params;

    try {
      const senderKeypair = Keypair.fromSecret(senderSecretKey);
      const senderAccount = await this.server.loadAccount(senderKeypair.publicKey());

      // Create refund transaction
      const transaction = new TransactionBuilder(senderAccount, {
        fee: BASE_FEE,
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(
          Operation.claimClaimableBalance({
            balanceId: balanceId,
          })
        )
        .setTimeout(30)
        .build();

      transaction.sign(senderKeypair);
      const result = await this.server.submitTransaction(transaction);

      return {
        success: true,
        transactionHash: result.hash,
      };
    } catch (error) {
      console.error('Error refunding Stellar HTLC:', error);
      throw error;
    }
  }

  /**
   * Get HTLC balance details
   */
  async getHTLCBalance(balanceId) {
    try {
      const response = await this.server
        .claimableBalances()
        .claimableBalance(balanceId)
        .call();

      return {
        id: response.id,
        asset: response.asset,
        amount: response.amount,
        claimants: response.claimants,
        sponsor: response.sponsor,
      };
    } catch (error) {
      console.error('Error getting HTLC balance:', error);
      throw error;
    }
  }

  /**
   * Extract balance ID from transaction result
   */
  extractBalanceId(transactionResult) {
    try {
      // Look for claimable balance creation in transaction
      const operations = transactionResult.result_xdr;
      // This is a simplified extraction - in practice you'd parse the XDR
      return transactionResult.hash; // Simplified for demo
    } catch (error) {
      console.error('Error extracting balance ID:', error);
      return null;
    }
  }

  /**
   * Generate random secret for HTLC
   */
  static generateSecret() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Create hashlock from secret
   */
  static createHashlock(secret) {
    const encoder = new TextEncoder();
    const data = encoder.encode(secret);
    return crypto.subtle.digest('SHA-256', data).then(hash => {
      return Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, '0')).join('');
    });
  }

  /**
   * Verify preimage matches hashlock
   */
  static async verifyPreimage(preimage, hashlock) {
    const calculatedHashlock = await this.createHashlock(preimage);
    return calculatedHashlock === hashlock;
  }
} 