import { ethers } from 'ethers';

/**
 * 1inch Fusion+ Client for Cross-Chain Swaps
 * Extends Fusion+ to Stellar blockchain
 */
export class FusionPlusClient {
  constructor(apiKey = process.env.NEXT_PUBLIC_ONEINCH_API_KEY) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.1inch.dev';
    this.network = 'ethereum'; // Default to Ethereum for Fusion+
  }

  /**
   * Get quote from 1inch Fusion+
   */
  async getQuote(fromToken, toToken, amount, chainId = 11155111) {
    try {
      const response = await fetch(`${this.baseUrl}/swap/v6.0/${chainId}/quote`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Accept': 'application/json',
        },
        params: {
          src: fromToken,
          dst: toToken,
          amount: amount,
          includeTokensInfo: true,
          includeProtocols: true,
          includeGas: true,
        }
      });

      if (!response.ok) {
        throw new Error(`1inch API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting quote:', error);
      throw error;
    }
  }

  /**
   * Create Fusion+ order (intent-based swap)
   */
  async createOrder(orderParams) {
    try {
      const {
        fromToken,
        toToken,
        amount,
        fromAddress,
        receiver,
        permit,
        enableEstimate,
        disableEstimate,
        allowPartialFill,
        source,
        gasPrice,
        complexityLevel,
        connectorTokens,
        parts,
        mainRouteParts,
        slippage,
      } = orderParams;

      const response = await fetch(`${this.baseUrl}/swap/v6.0/11155111/swap`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          src: fromToken,
          dst: toToken,
          amount: amount,
          from: fromAddress,
          receiver: receiver,
          permit: permit,
          enableEstimate: enableEstimate,
          disableEstimate: disableEstimate,
          allowPartialFill: allowPartialFill,
          source: source,
          gasPrice: gasPrice,
          complexityLevel: complexityLevel,
          connectorTokens: connectorTokens,
          parts: parts,
          mainRouteParts: mainRouteParts,
          slippage: slippage,
        })
      });

      if (!response.ok) {
        throw new Error(`Fusion+ order creation failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating Fusion+ order:', error);
      throw error;
    }
  }

  /**
   * Get order status
   */
  async getOrderStatus(orderHash) {
    try {
      const response = await fetch(`${this.baseUrl}/fusion/v1.0/orders/${orderHash}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get order status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting order status:', error);
      throw error;
    }
  }

  /**
   * Get supported tokens
   */
  async getSupportedTokens(chainId = 11155111) {
    try {
      const response = await fetch(`${this.baseUrl}/swap/v6.0/${chainId}/tokens`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get supported tokens: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting supported tokens:', error);
      throw error;
    }
  }

  /**
   * Calculate optimal swap parameters
   */
  calculateSwapParams(quote, fromAddress, receiver) {
    return {
      src: quote.src,
      dst: quote.dst,
      amount: quote.amount,
      from: fromAddress,
      receiver: receiver,
      slippage: 1, // 1% slippage
      allowPartialFill: true,
      source: 'synappay',
    };
  }

  /**
   * Validate quote for cross-chain swap
   */
  validateCrossChainQuote(quote, stellarAmount) {
    // Ensure quote is valid for cross-chain swap
    if (!quote || !quote.toTokenAmount) {
      throw new Error('Invalid quote received');
    }

    // Calculate expected Stellar amount based on quote
    const expectedStellarAmount = this.calculateStellarEquivalent(quote);
    
    // Validate that the quote matches our cross-chain requirements
    if (Math.abs(expectedStellarAmount - stellarAmount) / stellarAmount > 0.05) {
      throw new Error('Quote mismatch for cross-chain swap');
    }

    return true;
  }

  /**
   * Calculate Stellar equivalent amount
   */
  calculateStellarEquivalent(quote) {
    // This would integrate with Stellar price feeds
    // For now, use a simple conversion
    const ethAmount = parseFloat(quote.toTokenAmount) / Math.pow(10, quote.toTokenDecimals);
    return ethAmount * 1000; // Rough XLM equivalent
  }
} 