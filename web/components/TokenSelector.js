import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import TokenIcon from './TokenIcon';

const SUPPORTED_TOKENS = [
  { symbol: 'ETH', name: 'Ethereum' },
  { symbol: 'WETH', name: 'Wrapped Ethereum' },
  { symbol: 'USDC', name: 'USD Coin' },
  { symbol: 'USDT', name: 'Tether USD' },
  { symbol: 'DAI', name: 'Dai Stablecoin' },
  { symbol: 'LINK', name: 'Chainlink' },
  { symbol: 'UNI', name: 'Uniswap' },
  { symbol: 'AAVE', name: 'Aave' },
  { symbol: 'COMP', name: 'Compound' },
  { symbol: 'MKR', name: 'Maker' },
  { symbol: 'SNX', name: 'Synthetix' },
  { symbol: 'CRV', name: 'Curve DAO' },
  { symbol: 'YFI', name: 'yearn.finance' },
  { symbol: 'SUSHI', name: 'SushiSwap' },
  { symbol: '1INCH', name: '1inch' }
];

export default function TokenSelector({ 
  value, 
  onChange, 
  className = "",
  disabled = false,
  placeholder = "Select token"
}) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedToken = SUPPORTED_TOKENS.find(token => token.symbol === value);

  const handleSelect = (token) => {
    onChange(token.symbol);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          flex items-center space-x-2 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm 
          focus:outline-none focus:ring-2 focus:ring-blue-500 hover:bg-gray-50 transition-colors
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${isOpen ? 'ring-2 ring-blue-500' : ''}
        `}
      >
        {selectedToken ? (
          <>
            <TokenIcon symbol={selectedToken.symbol} size={20} />
            <span className="font-medium">{selectedToken.symbol}</span>
          </>
        ) : (
          <span className="text-gray-500">{placeholder}</span>
        )}
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto">
            {SUPPORTED_TOKENS.map((token) => (
              <button
                key={token.symbol}
                type="button"
                onClick={() => handleSelect(token)}
                className={`
                  w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-gray-50 transition-colors
                  ${selectedToken?.symbol === token.symbol ? 'bg-blue-50 text-blue-700' : 'text-gray-900'}
                `}
              >
                <TokenIcon symbol={token.symbol} size={20} />
                <div className="flex-1">
                  <div className="font-medium">{token.symbol}</div>
                  <div className="text-xs text-gray-500">{token.name}</div>
                </div>
                {selectedToken?.symbol === token.symbol && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}