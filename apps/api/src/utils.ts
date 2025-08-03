// SynapPay API Utilities (Standalone for Cloudflare Workers)

/**
 * Generate unique swap ID
 */
export function generateSwapId(): string {
    return `swap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
 * Create API response
 */
export function createApiResponse<T>(success: boolean, data?: T, error?: string): any {
    return {
        success,
        data,
        error,
        timestamp: Date.now()
    };
}