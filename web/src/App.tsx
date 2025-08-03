import { useState } from 'react'
import SwapInterface from './components/SwapInterface'
import TransactionHistory from './components/TransactionHistory'
import { ToastContainer, useToast, ToastProvider } from './components/Toast'
import { useFreighter } from './hooks/useFreighter'
import { isTestnet } from './config/networks'

// Window objects for type definitions
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      selectedAddress?: string;
    };
  }
}

function AppContent() {
  const [ethAddress, setEthAddress] = useState<string>('');
  const [showWalletMenu, setShowWalletMenu] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'swap' | 'history'>('swap');
  const [currentNetwork, setCurrentNetwork] = useState<'testnet' | 'mainnet'>(isTestnet() ? 'testnet' : 'mainnet');
  
  // Freighter hook usage
  const {
    isConnected: stellarConnected,
    address: stellarAddress,
    isLoading: stellarLoading,
    error: stellarError,
    connect: connectFreighter,
    disconnect: disconnectFreighter,
  } = useFreighter();

  // Toast hook
  const toast = useToast();

  // Network toggle handler with MetaMask auto-switching
  const toggleNetwork = async () => {
    const newNetwork = currentNetwork === 'testnet' ? 'mainnet' : 'testnet';
    setCurrentNetwork(newNetwork);
    
    // Auto-switch MetaMask network if connected
    if (window.ethereum && ethAddress) {
      try {
        const targetChainId = newNetwork === 'mainnet' ? '0x1' : '0xaa36a7';
        const networkName = newNetwork === 'mainnet' ? 'Ethereum Mainnet' : 'Sepolia Testnet';
        
        console.log(`🔗 Auto-switching MetaMask to ${networkName}...`);
        
        // Try to switch network
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: targetChainId }],
        });
        
        console.log(`✅ MetaMask switched to ${networkName}`);
        toast.success('Network Switched!', `MetaMask switched to ${networkName}`);
        
      } catch (switchError: any) {
        console.log('🔄 Network switch error:', switchError);
        
        // If network not added (error 4902), add it
        if (switchError.code === 4902 && newNetwork === 'mainnet') {
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: '0x1',
                chainName: 'Ethereum Mainnet',
                rpcUrls: ['https://eth-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_API_KEY_HERE'],
                blockExplorerUrls: ['https://etherscan.io'],
                nativeCurrency: {
                  name: 'Ether',
                  symbol: 'ETH',
                  decimals: 18
                }
              }],
            });
            console.log('✅ Ethereum Mainnet added and switched');
            toast.success('Network Added!', 'Ethereum Mainnet added to MetaMask');
          } catch (addError: any) {
            console.error('❌ Failed to add Ethereum Mainnet:', addError);
            toast.error('Network Switch Failed', 'Please switch MetaMask manually');
          }
        } else {
          console.log('⚠️ User rejected network switch or other error');
          toast.warning('Manual Switch Required', 'Please switch MetaMask network manually');
        }
      }
    }
    
    // Update URL parameter
    if (typeof window !== 'undefined') {
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.set('network', newNetwork);
      window.history.replaceState({}, '', currentUrl.toString());
    }
  };

  const connectMetaMask = async () => {
    if (!window.ethereum) {
      setConnectionError('MetaMask is not installed. Please install MetaMask extension.');
      return;
    }

    setIsConnecting(true);
    setConnectionError('');

    try {
      console.log('🦊 Connecting to MetaMask...');
      
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts && accounts.length > 0) {
        const address = accounts[0];
        setEthAddress(address);
        console.log('✅ MetaMask connected:', address);
        toast.success('MetaMask Connected!', `Address: ${address.substring(0, 6)}...${address.substring(address.length - 4)}`);
      }
    } catch (error: any) {
      console.error('❌ MetaMask connection error:', error);
      setConnectionError(error.message || 'Failed to connect to MetaMask');
      toast.error('Connection Failed', error.message || 'Failed to connect to MetaMask');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleFreighterConnect = async () => {
    try {
      await connectFreighter();
      toast.success('Freighter Connected!', 'Stellar wallet connected successfully');
    } catch (error: any) {
      console.error('❌ Freighter connection error:', error);
      toast.error('Connection Failed', error.message || 'Failed to connect to Freighter');
    }
  };

  const disconnectWallets = () => {
    setEthAddress('');
    disconnectFreighter();
    setConnectionError('');
    toast.info('Wallets Disconnected', 'All wallets have been disconnected');
  };

  const isWalletsConnected = ethAddress && stellarConnected && stellarAddress;
  const hasAnyConnection = ethAddress || (stellarConnected && stellarAddress);

  return (
    <div className="min-h-screen bg-white text-gray-900 relative overflow-hidden">
      {/* Navigation Bar */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <img src="/icon.png" alt="SynapPay" className="w-8 h-8" />
          <img src="/synappay-logo.svg" alt="SynapPay" className="h-6" />
        </div>

        {/* Network Toggle and Wallet Connect */}
        <div className="flex items-center gap-4">
          {/* Network Toggle */}
          <button
            onClick={toggleNetwork}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 bg-gray-100 hover:bg-gray-200 text-gray-700"
          >
            <div className={`w-2 h-2 rounded-full ${
              currentNetwork === 'mainnet' ? 'bg-blue-500' : 'bg-yellow-500'
            }`}></div>
            {currentNetwork === 'mainnet' ? 'Mainnet' : 'Testnet'}
          </button>
          
          {/* Connect Wallet Button */}
          <div className="relative">
            <button 
              onClick={() => setShowWalletMenu(!showWalletMenu)}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-2.5 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              {isWalletsConnected ? (
                <>
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  Connected
                </>
              ) : hasAnyConnection ? (
                <>
                  <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                  Partial
                </>
              ) : (
                'Connect Wallet'
              )}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="transition-transform duration-200" style={{ transform: showWalletMenu ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                <path d="M7 10l5 5 5-5z"/>
              </svg>
            </button>

            {/* Wallet Dropdown Menu */}
            {showWalletMenu && (
              <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-xl border border-gray-200 shadow-2xl z-[100] p-4">
                <h3 className="text-gray-900 font-semibold mb-4 text-center">Connect Wallets</h3>
                
                {(connectionError || stellarError) && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-700 text-sm">{connectionError || stellarError}</p>
                  </div>
                )}

                {/* MetaMask */}
                <div className="mb-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🦊</span>
                      <div>
                        <div className="text-gray-900 font-medium">MetaMask</div>
                        <div className="text-xs text-gray-500">Ethereum Network</div>
                      </div>
                    </div>
                    
                    {ethAddress ? (
                      <div className="text-right">
                        <div className="flex items-center gap-1 mb-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-xs text-green-600">Connected</span>
                        </div>
                        <p className="text-xs text-gray-600">
                          {ethAddress.substring(0, 6)}...{ethAddress.substring(ethAddress.length - 4)}
                        </p>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('MetaMask button mousedown');
                          connectMetaMask();
                        }}
                        className="bg-orange-100 hover:bg-orange-200 text-orange-700 px-4 py-2 rounded-lg transition-colors text-sm cursor-pointer relative z-[110]"
                        style={{ pointerEvents: 'auto' }}
                      >
                        {isConnecting ? 'Connecting...' : 'Connect'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Freighter */}
                <div className="mb-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🚀</span>
                      <div>
                        <div className="text-gray-900 font-medium">Freighter</div>
                        <div className="text-xs text-gray-500">Stellar Network</div>
                      </div>
                    </div>
                    
                    {stellarConnected && stellarAddress ? (
                      <div className="text-right">
                        <div className="flex items-center gap-1 mb-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-xs text-green-600">Connected</span>
                        </div>
                        <p className="text-xs text-gray-600">
                          {stellarAddress.substring(0, 6)}...{stellarAddress.substring(stellarAddress.length - 4)}
                        </p>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('Freighter button mousedown');
                          handleFreighterConnect();
                        }}
                        className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-2 rounded-lg transition-colors text-sm cursor-pointer relative z-[110]"
                        style={{ pointerEvents: 'auto' }}
                        disabled={stellarLoading}
                      >
                        {stellarLoading ? 'Connecting...' : 'Connect'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Disconnect Button */}
                {hasAnyConnection && (
                  <button
                    onClick={disconnectWallets}
                    className="w-full bg-red-100 hover:bg-red-200 text-red-700 py-2 rounded-lg transition-colors text-sm border border-red-200"
                  >
                    Disconnect All
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="text-center py-8 px-6">
        <h1 className="text-5xl font-normal mb-4 text-black leading-[58px]" style={{ fontFamily: 'Inter' }}>
          Trustless Cross-Chain Swap
        </h1>
        <p className="text-xl text-black mb-6 max-w-2xl mx-auto leading-[28px]" style={{ fontFamily: 'Inter' }}>
          Seamless ETH ↔️ XLM transfers, no middleman.
        </p>
      </div>

      {/* Floating Navigation Toggle */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
        <div className="flex bg-white rounded-xl p-1 border border-gray-200 shadow-lg">
          <button
            onClick={() => setActiveTab('swap')}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
              activeTab === 'swap'
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            Swap
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
              activeTab === 'history'
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            History
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 pb-20">
        {activeTab === 'swap' && (
          <SwapInterface 
            ethAddress={ethAddress} 
            stellarAddress={stellarAddress || ''}
          />
        )}
        
        {activeTab === 'history' && (
          <TransactionHistory
            ethAddress={ethAddress}
            stellarAddress={stellarAddress || ''}
          />
        )}
      </div>

      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-100/50 rounded-full blur-3xl"></div>
      </div>

      {/* Footer Bar */}
      <div className="w-full h-[28px] bg-gray-100 flex items-center justify-end px-6">
        <a 
          href="https://x.com/SynapPay" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-gray-600 hover:text-blue-600 transition-colors text-lg font-semibold flex items-center gap-2"
        >
          Powered by SynapPay
          <span className="text-xl">𝕏</span>
        </a>
      </div>

      {/* Toast Container */}
      <ToastContainer 
        toasts={toast.toasts}
        onClose={toast.removeToast}
      />
    </div>
  );
}

function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}

export default App; 