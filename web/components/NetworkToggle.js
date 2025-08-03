// Synappay-style Network Toggle Component
import { useState } from 'react';
import { Globe, TestTube } from 'lucide-react';
import { networkManager } from '../lib/network-config';

export default function NetworkToggle() {
  const [currentNetwork, setCurrentNetwork] = useState(networkManager.getCurrentNetwork());

  const handleNetworkSwitch = (network) => {
    networkManager.switchNetwork(network);
    setCurrentNetwork(network);
  };

  const isTestnet = currentNetwork === 'testnet';

  return (
    <div className="flex items-center space-x-2">
      <div className="flex bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => handleNetworkSwitch('testnet')}
          className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            isTestnet
              ? 'bg-white text-orange-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <TestTube className="w-4 h-4" />
          <span>Testnet</span>
        </button>
        
        <button
          onClick={() => handleNetworkSwitch('mainnet')}
          className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            !isTestnet
              ? 'bg-white text-green-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>Mainnet</span>
        </button>
      </div>
    </div>
  );
}