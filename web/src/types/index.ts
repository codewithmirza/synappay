// Common types for SynapPay

export interface Token {
  symbol: string;
  name: string;
  logo: string;
  chain: string;
  decimals: number;
  address?: string;
}

export interface SwapQuote {
  fromToken: Token;
  toToken: Token;
  fromAmount: string;
  toAmount: string;
  rate: number;
  slippage: number;
  gasEstimate?: string;
  fee?: string;
}

export interface Transaction {
  id: string;
  fromToken: Token;
  toToken: Token;
  fromAmount: string;
  toAmount: string;
  fromAddress: string;
  toAddress: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  timestamp: number;
  txHash?: string;
  stellarTxHash?: string;
  error?: string;
}

export interface WalletConnection {
  isConnected: boolean;
  address: string | null;
  chainId?: number;
  error?: string;
}

export interface NetworkConfig {
  id: number;
  name: string;
  displayName: string;
  rpcUrl: string;
  explorerUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  testnet: boolean;
}

export interface StellarNetworkConfig {
  name: string;
  displayName: string;
  horizonUrl: string;
  networkPassphrase: string;
  explorerUrl: string;
  testnet: boolean;
}

export interface SwapFormData {
  fromToken: Token;
  toToken: Token;
  fromAmount: string;
  toAmount: string;
  slippage: number;
  fromAddress: string;
  toAddress: string;
}

export interface SwapResult {
  success: boolean;
  txHash?: string;
  stellarTxHash?: string;
  error?: string;
  orderId?: string;
} 