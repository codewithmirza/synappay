'use client';

import { useState, useEffect } from 'react';
import { workingWalletService } from '../lib/working-wallet-service';
import { workingSwapService } from '../lib/working-swap-service';
import UnifiedLayout from '../components/UnifiedLayout';

export default function Test() {
  const {
    ethConnected,
    stellarConnected,
    bothConnected,
    ethAddress,
    stellarPublicKey,
    connectEth,
    connectStellar,
    formatEthAddress,
    formatStellarAddress
  } = useWalletManager();

  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const addTestResult = (test, status, message) => {
    setTestResults(prev => [...prev, { test, status, message, timestamp: Date.now() }]);
  };

  const runTests = async () => {
    setLoading(true);
    setTestResults([]);

    try {
      // Test 1: Wallet Connection
      addTestResult('Wallet Connection', 'info', `ETH: ${ethConnected ? 'Connected' : 'Not Connected'}, Stellar: ${stellarConnected ? 'Connected' : 'Not Connected'}`);

      // Test 2: SynappayBridge
      try {
        const quote = await SynappayBridge.getSwapQuote('ethereum', 'stellar', 'USDC', 'XLM', '10');
        addTestResult('SynappayBridge Quote', 'success', `Quote received: ${quote.toAmount} XLM for 10 USDC`);
      } catch (error) {
        addTestResult('SynappayBridge Quote', 'error', `Failed: ${error.message}`);
      }

      // Test 3: API Health Check
      try {
        const response = await fetch('https://synappay-api-prod.synappay.workers.dev/health');
        const health = await response.json();
        addTestResult('API Health Check', 'success', `API Status: ${health.status}`);
      } catch (error) {
        addTestResult('API Health Check', 'error', `Failed: ${error.message}`);
      }

      // Test 4: Coordinator Health Check
      try {
        const response = await fetch('https://synappay-production.up.railway.app/health');
        const health = await response.json();
        addTestResult('Coordinator Health Check', 'success', `Coordinator Status: ${health.status}`);
      } catch (error) {
        addTestResult('Coordinator Health Check', 'error', `Failed: ${error.message}`);
      }

      // Test 5: Swap Initiation
      if (bothConnected) {
        try {
          const swap = await SynappayBridge.initiateSwap({
            fromChain: 'ethereum',
            toChain: 'stellar',
            fromToken: 'USDC',
            toToken: 'XLM',
            amount: '10',
            userAddress: ethAddress,
            stellarAddress: stellarPublicKey
          });
          addTestResult('Swap Initiation', 'success', `Swap ID: ${swap.id}`);
        } catch (error) {
          addTestResult('Swap Initiation', 'error', `Failed: ${error.message}`);
        }
      } else {
        addTestResult('Swap Initiation', 'warning', 'Skipped - wallets not connected');
      }

    } catch (error) {
      addTestResult('Test Suite', 'error', `Test suite failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <UnifiedLayout>
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">SynapPay System Test</h1>
          
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Wallet Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-700">Ethereum</h3>
                <p className="text-sm text-gray-600">
                  Status: {ethConnected ? '✅ Connected' : '❌ Not Connected'}
                </p>
                <p className="text-sm text-gray-600">
                  Address: {formatEthAddress(ethAddress)}
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
                  Status: {stellarConnected ? '✅ Connected' : '❌ Not Connected'}
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
          </div>

          <div className="mb-6">
            <button
              onClick={runTests}
              disabled={loading}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Running Tests...' : 'Run System Tests'}
            </button>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Test Results</h2>
            {testResults.map((result, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  result.status === 'success' ? 'bg-green-50 border-green-200' :
                  result.status === 'error' ? 'bg-red-50 border-red-200' :
                  result.status === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                  'bg-blue-50 border-blue-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">{result.test}</h3>
                  <span className={`text-sm px-2 py-1 rounded ${
                    result.status === 'success' ? 'bg-green-100 text-green-800' :
                    result.status === 'error' ? 'bg-red-100 text-red-800' :
                    result.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {result.status.toUpperCase()}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{result.message}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(result.timestamp).toLocaleTimeString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </UnifiedLayout>
  );
} 