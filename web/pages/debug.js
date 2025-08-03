'use client';

import { useState, useEffect } from 'react';
import { workingWalletService } from '../lib/working-wallet-service';
import { workingSwapService } from '../lib/working-swap-service';
import UnifiedLayout from '../components/UnifiedLayout';

export default function Debug() {
  const walletStatus = workingWalletService.getStatus();
  const {
    ethereumConnected: ethConnected,
    stellarConnected,
    bothConnected,
    ethereumAccount: ethAddress,
    stellarAccount: stellarPublicKey
  } = walletStatus;
  
  const connectEth = workingWalletService.connectEthereum;
  const connectStellar = workingWalletService.connectStellar;
  const formatEthAddress = workingWalletService.formatEthAddress;
  const formatStellarAddress = workingWalletService.formatStellarAddress;
  const ethChainId = 1; // Default to mainnet

  const [debugInfo, setDebugInfo] = useState({});

  useEffect(() => {
    // Update debug info every second
    const interval = setInterval(() => {
      setDebugInfo({
        timestamp: new Date().toISOString(),
        ethConnected: Boolean(ethConnected),
        stellarConnected: Boolean(stellarConnected),
        bothConnected: Boolean(bothConnected),
        ethAddress: ethAddress || 'null',
        stellarPublicKey: stellarPublicKey || 'null',
        ethChainId,
        hasEthWallet: ethAddress && ethAddress !== 'None' && ethAddress !== 'null',
        hasStellarWallet: stellarPublicKey && stellarPublicKey !== 'None' && stellarPublicKey !== 'null',
        walletsConnected: (ethAddress && ethAddress !== 'None' && ethAddress !== 'null') && 
                         (stellarPublicKey && stellarPublicKey !== 'None' && stellarPublicKey !== 'null')
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [ethConnected, stellarConnected, bothConnected, ethAddress, stellarPublicKey, ethChainId]);

  const testQuote = async () => {
    try {
      const quote = await workingSwapService.getSwapQuote({
        fromChain: 'ethereum',
        toChain: 'stellar',
        fromToken: 'USDC',
        toToken: 'XLM',
        amount: '10'
      });
      console.log('Quote test successful:', quote);
      alert('Quote test successful! Check console for details.');
    } catch (error) {
      console.error('Quote test failed:', error);
      alert('Quote test failed: ' + error.message);
    }
  };

  return (
    <UnifiedLayout>
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Debug Information</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Wallet Status</h2>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-700">Ethereum</h3>
                <p className="text-sm text-gray-600">
                  Connected: {ethConnected ? '✅ Yes' : '❌ No'}
                </p>
                <p className="text-sm text-gray-600">
                  Address: {formatEthAddress(ethAddress)}
                </p>
                <p className="text-sm text-gray-600">
                  Chain ID: {ethChainId || 'undefined'}
                </p>
                <button
                  onClick={connectEth}
                  className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Connect ETH
                </button>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-700">Stellar</h3>
                <p className="text-sm text-gray-600">
                  Connected: {stellarConnected ? '✅ Yes' : '❌ No'}
                </p>
                <p className="text-sm text-gray-600">
                  Address: {formatStellarAddress(stellarPublicKey)}
                </p>
                <button
                  onClick={connectStellar}
                  className="mt-2 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                >
                  Connect Stellar
                </button>
              </div>
            </div>
            
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Connection Analysis</h2>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-blue-700">Wallet Manager</h3>
                <p className="text-sm text-blue-600">
                  Both Connected: {bothConnected ? '✅ Yes' : '❌ No'}
                </p>
                <p className="text-sm text-blue-600">
                  Has ETH Wallet: {debugInfo.hasEthWallet ? '✅ Yes' : '❌ No'}
                </p>
                <p className="text-sm text-blue-600">
                  Has Stellar Wallet: {debugInfo.hasStellarWallet ? '✅ Yes' : '❌ No'}
                </p>
                <p className="text-sm text-blue-600">
                  Wallets Connected: {debugInfo.walletsConnected ? '✅ Yes' : '❌ No'}
                </p>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-medium text-green-700">Test Functions</h3>
                <button
                  onClick={testQuote}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Test Quote
                </button>
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-4">Raw Debug Data</h2>
            <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-auto">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </UnifiedLayout>
  );
} 