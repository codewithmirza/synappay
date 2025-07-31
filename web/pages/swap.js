import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpDown, Zap, Shield, Clock, Info, ChevronDown } from 'lucide-react';
import Layout from '../components/Layout';
import { cn, formatAmount, getAssetIcon } from '../lib/utils';

export default function Swap() {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [swapDirection, setSwapDirection] = useState('eth_to_stellar');
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [fromAsset, setFromAsset] = useState('ETH');
  const [toAsset, setToAsset] = useState('XLM');
  const [receiver, setReceiver] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [timelock, setTimelock] = useState(3600);
  const [quote, setQuote] = useState(null);

  const assets = [
    { symbol: 'ETH', name: 'Ethereum', icon: '🔷' },
    { symbol: 'XLM', name: 'Stellar Lumens', icon: '⭐' },
    { symbol: 'USDC', name: 'USD Coin', icon: '💵' },
    { symbol: 'USDT', name: 'Tether', icon: '💵' },
  ];

  const connectWallet = async () => {
    try {
      if (typeof window.ethereum !== 'undefined') {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const account = accounts[0];
        setWalletAddress(account);
        setIsConnected(true);
      } else {
        alert('Please install MetaMask!');
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  const getQuote = async () => {
    if (!fromAmount || !isConnected) return;
    
    setIsLoading(true);
    try {
      // Simulate API call for quote
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockQuote = {
        fromAmount: parseFloat(fromAmount),
        toAmount: parseFloat(fromAmount) * (swapDirection === 'eth_to_stellar' ? 1000 : 0.001),
        priceImpact: 0.5,
        estimatedGas: 150000,
        route: '1inch Fusion+',
        eta: '30-60 seconds'
      };
      
      setQuote(mockQuote);
      setToAmount(mockQuote.toAmount.toFixed(6));
    } catch (error) {
      console.error('Failed to get quote:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (fromAmount && isConnected) {
      const timeout = setTimeout(getQuote, 500);
      return () => clearTimeout(timeout);
    }
  }, [fromAmount, swapDirection, isConnected]);

  const handleSwapDirection = () => {
    setSwapDirection(prev => prev === 'eth_to_stellar' ? 'stellar_to_eth' : 'eth_to_stellar');
    setFromAsset(prev => prev === 'ETH' ? 'XLM' : 'ETH');
    setToAsset(prev => prev === 'XLM' ? 'ETH' : 'XLM');
    setFromAmount('');
    setToAmount('');
    setQuote(null);
  };

  const handleCreateSwap = async () => {
    if (!isConnected) {
      connectWallet();
      return;
    }

    if (!fromAmount || !receiver) {
      alert('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/swaps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          direction: swapDirection,
          amount: parseFloat(fromAmount),
          receiver,
          asset: toAsset,
          timelock,
          walletAddress
        })
      });

      if (response.ok) {
        const result = await response.json();
        // Redirect to progress page
        window.location.href = `/progress/${result.swapId}`;
      } else {
        throw new Error('Failed to create swap');
      }
    } catch (error) {
      alert('Failed to create swap: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold mb-2">Create Swap</h1>
          <p className="text-muted-foreground">
            Swap between Ethereum and Stellar with 1inch Fusion+ integration
          </p>
        </motion.div>

        {/* Swap Interface */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card max-w-2xl mx-auto"
        >
          <div className="p-6">
            {/* From Card */}
            <div className="card mb-4">
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-muted-foreground">From</label>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-muted-foreground">Balance: 0.0</span>
                    <button className="text-xs text-primary hover:underline">Max</button>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="flex-1">
                    <input
                      type="number"
                      value={fromAmount}
                      onChange={(e) => setFromAmount(e.target.value)}
                      placeholder="0.0"
                      className="input text-2xl font-bold"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1 px-3 py-2 rounded-lg bg-secondary">
                      <span className="text-lg">{getAssetIcon(fromAsset)}</span>
                      <span className="font-medium">{fromAsset}</span>
                      <ChevronDown className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Swap Direction Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSwapDirection}
              className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <ArrowUpDown className="h-5 w-5" />
            </motion.button>

            {/* To Card */}
            <div className="card mb-6">
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-muted-foreground">To</label>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-muted-foreground">Estimated</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="flex-1">
                    <input
                      type="number"
                      value={toAmount}
                      onChange={(e) => setToAmount(e.target.value)}
                      placeholder="0.0"
                      className="input text-2xl font-bold"
                      disabled
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1 px-3 py-2 rounded-lg bg-secondary">
                      <span className="text-lg">{getAssetIcon(toAsset)}</span>
                      <span className="font-medium">{toAsset}</span>
                      <ChevronDown className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Receiver Address */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Receiver Address</label>
              <input
                type="text"
                value={receiver}
                onChange={(e) => setReceiver(e.target.value)}
                placeholder={swapDirection === 'eth_to_stellar' ? 'G... (Stellar address)' : '0x... (Ethereum address)'}
                className="input"
              />
            </div>

            {/* Quote Information */}
            {quote && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="card mb-6"
              >
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Price Impact</span>
                    <span className="text-sm font-medium">{quote.priceImpact}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Estimated Gas</span>
                    <span className="text-sm font-medium">{quote.estimatedGas.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Route</span>
                    <span className="text-sm font-medium">{quote.route}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">ETA</span>
                    <span className="text-sm font-medium">{quote.eta}</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Advanced Options */}
            <div className="mb-6">
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center space-x-2 text-sm text-muted-foreground hover:text-foreground"
              >
                <ChevronDown className={cn("h-4 w-4 transition-transform", showAdvanced && "rotate-180")} />
                <span>Advanced Options</span>
              </button>
              
              <AnimatePresence>
                {showAdvanced && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 space-y-4"
                  >
                    <div>
                      <label className="block text-sm font-medium mb-2">Timelock (seconds)</label>
                      <input
                        type="number"
                        value={timelock}
                        onChange={(e) => setTimelock(parseInt(e.target.value))}
                        min="300"
                        max="86400"
                        className="input"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Minimum: 300s (5 min), Maximum: 86400s (24 hours)
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Create Swap Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCreateSwap}
              disabled={isLoading || !fromAmount || !receiver}
              className="btn btn-primary w-full text-lg py-4 flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Creating Swap...</span>
                </>
              ) : !isConnected ? (
                <>
                  <Zap className="h-5 w-5" />
                  <span>Connect Wallet</span>
                </>
              ) : (
                <>
                  <Shield className="h-5 w-5" />
                  <span>Create Swap</span>
                </>
              )}
            </motion.button>

            {/* Powered by 1inch */}
            <div className="flex items-center justify-center mt-4 text-xs text-muted-foreground">
              <span>Powered by</span>
              <div className="flex items-center space-x-1 ml-1">
                <div className="h-3 w-3 rounded bg-blue-600"></div>
                <span className="font-medium">1inch Fusion+</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
} 