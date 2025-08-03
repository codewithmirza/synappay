// SynapPay Swap Service
import { SwapIntent, SwapIntentSchema } from '@synappay/shared/types';
import { generateSwapId } from '@synappay/shared/utils';

export class SwapService {
  constructor(private db: D1Database) {}

  async createSwapIntent(data: Partial<SwapIntent>): Promise<SwapIntent> {
    const swapIntent: SwapIntent = {
      id: generateSwapId(),
      fromChain: data.fromChain!,
      toChain: data.toChain!,
      fromToken: data.fromToken!,
      toToken: data.toToken!,
      fromAmount: data.fromAmount!,
      toAmount: data.toAmount!,
      sender: data.sender!,
      receiver: data.receiver!,
      hashlock: data.hashlock!,
      timelock: data.timelock!,
      status: 'pending',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    };

    // Validate the swap intent
    SwapIntentSchema.parse(swapIntent);

    // Store in database
    await this.db.prepare(`
      INSERT INTO swap_intents (
        id, from_chain, to_chain, from_token, to_token, 
        from_amount, to_amount, sender, receiver, hashlock, 
        timelock, status, created_at, expires_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      swapIntent.id,
      swapIntent.fromChain,
      swapIntent.toChain,
      swapIntent.fromToken,
      swapIntent.toToken,
      swapIntent.fromAmount,
      swapIntent.toAmount,
      swapIntent.sender,
      swapIntent.receiver,
      swapIntent.hashlock,
      swapIntent.timelock,
      swapIntent.status,
      swapIntent.createdAt.toISOString(),
      swapIntent.expiresAt.toISOString()
    ).run();

    return swapIntent;
  }

  async getSwapIntent(id: string): Promise<SwapIntent> {
    const result = await this.db.prepare(`
      SELECT * FROM swap_intents WHERE id = ?
    `).bind(id).first();

    if (!result) {
      throw new Error('Swap intent not found');
    }

    return {
      id: result.id as string,
      fromChain: result.from_chain as 'ethereum' | 'stellar',
      toChain: result.to_chain as 'ethereum' | 'stellar',
      fromToken: result.from_token as string,
      toToken: result.to_token as string,
      fromAmount: result.from_amount as string,
      toAmount: result.to_amount as string,
      sender: result.sender as string,
      receiver: result.receiver as string,
      hashlock: result.hashlock as string,
      timelock: result.timelock as number,
      status: result.status as SwapIntent['status'],
      createdAt: new Date(result.created_at as string),
      expiresAt: new Date(result.expires_at as string),
    };
  }

  async updateSwapStatus(id: string, status: SwapIntent['status']): Promise<void> {
    await this.db.prepare(`
      UPDATE swap_intents SET status = ?, updated_at = ? WHERE id = ?
    `).bind(status, new Date().toISOString(), id).run();
  }

  async getActiveSwaps(): Promise<SwapIntent[]> {
    const results = await this.db.prepare(`
      SELECT * FROM swap_intents 
      WHERE status IN ('pending', 'locked') 
      AND expires_at > datetime('now')
      ORDER BY created_at DESC
      LIMIT 100
    `).all();

    return results.results.map(result => ({
      id: result.id as string,
      fromChain: result.from_chain as 'ethereum' | 'stellar',
      toChain: result.to_chain as 'ethereum' | 'stellar',
      fromToken: result.from_token as string,
      toToken: result.to_token as string,
      fromAmount: result.from_amount as string,
      toAmount: result.to_amount as string,
      sender: result.sender as string,
      receiver: result.receiver as string,
      hashlock: result.hashlock as string,
      timelock: result.timelock as number,
      status: result.status as SwapIntent['status'],
      createdAt: new Date(result.created_at as string),
      expiresAt: new Date(result.expires_at as string),
    }));
  }
}