// SynapPay Shared Utilities
import crypto from 'crypto';

/**
 * Generate a random preimage and its hash
 */
export function generatePreimageAndHash(): { preimage: string; hash: string } {
  const preimage = crypto.randomBytes(32).toString('hex');
  const hash = crypto.createHash('sha256').update(Buffer.from(preimage, 'hex')).digest('hex');
  return { preimage: `0x${preimage}`, hash: `0x${hash}` };
}

/**
 * Generate unique swap ID
 */
export function generateSwapId(): string {
  return `swap_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
}

/**
 * Calculate timelock (current time + duration in seconds)
 */
export function calculateTimelock(durationSeconds: number): number {
  return Math.floor(Date.now() / 1000) + durationSeconds;
}

/**
 * Format token amount for display
 */
export function formatTokenAmount(amount: string, decimals: number = 18): string {
  const num = parseFloat(amount) / Math.pow(10, decimals);
  return num.toFixed(6);
}

/**
 * Parse token amount from display format
 */
export function parseTokenAmount(amount: string, decimals: number = 18): string {
  const num = parseFloat(amount) * Math.pow(10, decimals);
  return Math.floor(num).toString();
}

/**
 * Validate Ethereum address
 */
export function isValidEthereumAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Validate Stellar address
 */
export function isValidStellarAddress(address: string): boolean {
  return /^G[A-Z2-7]{55}$/.test(address);
}

/**
 * Sleep utility for async operations
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry utility for failed operations
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxAttempts) {
        await sleep(delay * attempt);
      }
    }
  }
  
  throw lastError!;
}