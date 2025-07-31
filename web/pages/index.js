import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Zap, Shield, Globe, ArrowUpDown } from 'lucide-react';
import Layout from '../components/Layout';
import { cn } from '../lib/utils';

export default function Home() {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');

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

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent"
          >
            Trustless Cross-Chain Swap
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto"
          >
            Seamlessly swap between Ethereum and Stellar with 1inch Fusion+ integration.
            Atomic, secure, and lightning fast.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            {!isConnected ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={connectWallet}
                className="btn btn-primary text-lg px-8 py-4 flex items-center space-x-2"
              >
                <Zap className="h-5 w-5" />
                <span>Start Swap</span>
                <ArrowRight className="h-5 w-5" />
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => window.location.href = '/swap'}
                className="btn btn-primary text-lg px-8 py-4 flex items-center space-x-2"
              >
                <ArrowUpDown className="h-5 w-5" />
                <span>Create Swap</span>
                <ArrowRight className="h-5 w-5" />
              </motion.button>
            )}
          </motion.div>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="grid md:grid-cols-3 gap-8 mb-16"
        >
          <motion.div
            whileHover={{ y: -5 }}
            className="card p-6 text-center"
          >
            <div className="flex justify-center mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Shield className="h-6 w-6 text-primary" />
              </div>
            </div>
            <h3 className="text-xl font-semibold mb-2">Atomic Security</h3>
            <p className="text-muted-foreground">
              HTLC contracts ensure your funds are safe. Either the swap completes or you get a refund.
            </p>
          </motion.div>

          <motion.div
            whileHover={{ y: -5 }}
            className="card p-6 text-center"
          >
            <div className="flex justify-center mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Zap className="h-6 w-6 text-primary" />
              </div>
            </div>
            <h3 className="text-xl font-semibold mb-2">1inch Fusion+</h3>
            <p className="text-muted-foreground">
              Get the best rates with Dutch auction mechanics and real-time price discovery.
            </p>
          </motion.div>

          <motion.div
            whileHover={{ y: -5 }}
            className="card p-6 text-center"
          >
            <div className="flex justify-center mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Globe className="h-6 w-6 text-primary" />
              </div>
            </div>
            <h3 className="text-xl font-semibold mb-2">Cross-Chain</h3>
            <p className="text-muted-foreground">
              Bridge Ethereum and Stellar seamlessly. Support for ETH, XLM, USDC, and more.
            </p>
          </motion.div>
        </motion.div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 0.6 }}
          className="card p-8 text-center"
        >
          <h2 className="text-3xl font-bold mb-8">Powered by</h2>
          <div className="flex flex-wrap justify-center items-center gap-8">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded bg-blue-600"></div>
              <span className="text-lg font-semibold">1inch Fusion+</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded bg-purple-600"></div>
              <span className="text-lg font-semibold">Stellar</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded bg-orange-600"></div>
              <span className="text-lg font-semibold">Ethereum</span>
            </div>
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          className="text-center mt-16"
        >
          <h2 className="text-3xl font-bold mb-4">Ready to swap?</h2>
          <p className="text-muted-foreground mb-6">
            Connect your wallet and start swapping in seconds.
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={isConnected ? () => window.location.href = '/swap' : connectWallet}
            className="btn btn-primary text-lg px-8 py-4"
          >
            {isConnected ? 'Create Your First Swap' : 'Connect Wallet'}
          </motion.button>
        </motion.div>
      </div>
    </Layout>
  );
} 