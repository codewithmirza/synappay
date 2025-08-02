import { TokenIcon as Web3TokenIcon } from '@web3icons/react';

/**
 * Reusable token icon component with fallback support
 */
export default function TokenIcon({ 
  symbol, 
  size = 24, 
  variant = "branded", 
  className = "",
  fallback = null 
}) {
  // Normalize symbol to lowercase for consistency
  const normalizedSymbol = symbol?.toLowerCase();
  
  // Map some symbols to their proper web3icons equivalents
  const symbolMap = {
    'xlm': 'xlm',
    'eth': 'eth',
    'usdc': 'usdc',
    'usdt': 'usdt',
    'dai': 'dai',
    'btc': 'btc',
    'bnb': 'bnb',
    'matic': 'matic',
    'avax': 'avax',
    'sol': 'sol',
    'ada': 'ada',
    'dot': 'dot',
    'link': 'link',
    'uni': 'uni',
    'aave': 'aave',
    'comp': 'comp',
    'mkr': 'mkr',
    'snx': 'snx',
    'crv': 'crv',
    'yfi': 'yfi',
    'sushi': 'sushi',
    '1inch': '1inch'
  };

  const mappedSymbol = symbolMap[normalizedSymbol] || normalizedSymbol;

  try {
    return (
      <Web3TokenIcon
        symbol={mappedSymbol}
        variant={variant}
        size={size}
        className={className}
      />
    );
  } catch (error) {
    // Fallback to a generic token icon or custom fallback
    if (fallback) {
      return fallback;
    }
    
    // Default fallback - a simple circular div with symbol
    return (
      <div 
        className={`inline-flex items-center justify-center rounded-full bg-gray-200 text-gray-600 font-semibold ${className}`}
        style={{ width: size, height: size, fontSize: size * 0.4 }}
      >
        {symbol?.charAt(0)?.toUpperCase() || '?'}
      </div>
    );
  }
}

/**
 * Chain icon component for blockchain networks
 */
export function ChainIcon({ 
  chain, 
  size = 24, 
  className = "" 
}) {
  const chainSymbols = {
    'ethereum': 'eth',
    'stellar': 'xlm',
    'bitcoin': 'btc',
    'binance': 'bnb',
    'polygon': 'matic',
    'avalanche': 'avax',
    'solana': 'sol',
    'cardano': 'ada',
    'polkadot': 'dot'
  };

  const symbol = chainSymbols[chain?.toLowerCase()] || chain;

  return (
    <TokenIcon 
      symbol={symbol} 
      size={size} 
      className={className}
      fallback={
        <div 
          className={`inline-flex items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold ${className}`}
          style={{ width: size, height: size, fontSize: size * 0.4 }}
        >
          {chain?.charAt(0)?.toUpperCase() || '?'}
        </div>
      }
    />
  );
}