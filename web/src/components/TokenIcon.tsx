import React, { useState } from 'react';

// Token information with local icons
export const ETH_TOKEN = {
  symbol: 'ETH',
  name: 'Ethereum',
  logo: '/images/eth.png',
  chain: 'Ethereum',
  decimals: 18
};

export const XLM_TOKEN = {
  symbol: 'XLM',
  name: 'Stellar Lumens',
  logo: '/images/xlm.png',
  chain: 'Stellar',
  decimals: 7
};

// Additional tokens for future expansion
export const USDC_TOKEN = {
  symbol: 'USDC',
  name: 'USD Coin',
  logo: 'https://tokenicons.io/ethereum/0xA0b86a33E6441b8bB770AE39aaDC4e75C0f03E6F/32.png',
  chain: 'Ethereum',
  decimals: 6
};

export const USDT_TOKEN = {
  symbol: 'USDT',
  name: 'Tether USD',
  logo: 'https://tokenicons.io/ethereum/0xdAC17F958D2ee523a2206206994597C13D831ec7/32.png',
  chain: 'Ethereum',
  decimals: 6
};

export const DAI_TOKEN = {
  symbol: 'DAI',
  name: 'Dai Stablecoin',
  logo: 'https://tokenicons.io/ethereum/0x6B175474E89094C44Da98b954EedeAC495271d0F/32.png',
  chain: 'Ethereum',
  decimals: 18
};

export type TokenType = typeof ETH_TOKEN | typeof XLM_TOKEN | typeof USDC_TOKEN | typeof USDT_TOKEN | typeof DAI_TOKEN;

interface TokenIconProps {
  token: TokenType;
  size?: number;
  className?: string;
  showSymbol?: boolean;
}

const TokenIcon: React.FC<TokenIconProps> = ({ 
  token, 
  size = 32, 
  className = '',
  showSymbol = false 
}) => {
  const [imageError, setImageError] = useState(false);
  
  // Fallback icons for different tokens
  const getFallbackIcon = (symbol: string) => {
    switch (symbol) {
      case 'ETH':
        return '🦊';
      case 'XLM':
        return '🚀';
      case 'USDC':
        return '💵';
      case 'USDT':
        return '💲';
      case 'DAI':
        return '🏦';
      default:
        return '🪙';
    }
  };
  
  if (imageError) {
    return (
      <div 
        className={`flex items-center justify-center rounded-full bg-gray-600 ${className}`}
        style={{ width: size, height: size }}
      >
        <span className="text-sm">{getFallbackIcon(token.symbol)}</span>
      </div>
    );
  }
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img
        src={token.logo}
        alt={token.name}
        width={size}
        height={size}
        className="rounded-full"
        onError={() => setImageError(true)}
      />
      {showSymbol && (
        <span className="text-sm font-medium">{token.symbol}</span>
      )}
    </div>
  );
};

export default TokenIcon; 