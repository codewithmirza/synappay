// Synappay-style Testnet Banner with Faucet Links
import { AlertTriangle, ExternalLink } from 'lucide-react';
import { networkManager } from '../lib/network-config';

export default function TestnetBanner() {
  const banner = networkManager.getNetworkBanner();

  if (!banner.show) return null;

  return (
    <div className="bg-orange-50 border-b border-orange-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            <span className="text-sm font-medium text-orange-800">
              {banner.message}
            </span>
          </div>
          
          {banner.faucets && (
            <div className="flex items-center space-x-4">
              <span className="text-sm text-orange-700">Get testnet tokens:</span>
              <a
                href={banner.faucets.ethereum}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-1 text-sm text-orange-600 hover:text-orange-800 font-medium"
              >
                <span>Sepolia ETH</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <a
                href={banner.faucets.stellar}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-1 text-sm text-orange-600 hover:text-orange-800 font-medium"
              >
                <span>Stellar XLM</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}