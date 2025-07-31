import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Home() {
  const [isConnected, setIsConnected] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);

  const connectWallet = async () => {
    try {
      if (typeof window.ethereum !== 'undefined') {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setIsConnected(true);
        // Navigate to swap page after successful connection
        setTimeout(() => {
          window.location.href = '/swap';
        }, 1000);
      } else {
        alert('Please install MetaMask!');
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  const openWalletModal = () => {
    setShowWalletModal(true);
  };

  const closeWalletModal = () => {
    setShowWalletModal(false);
  };

  return (
    <div className="min-h-screen bg-[#f2f2f7] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-[#ffffff] rounded-[30px] shadow-[0px_4px_20px_0px_rgba(0,0,0,0.08)] p-16 max-w-[515px] w-full"
      >
        <div className="text-center space-y-9">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-[48px] font-normal leading-[57.6px] text-black font-['Inter']"
          >
            Trustless Cross-Chain Swap
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-[20px] font-normal leading-[28px] text-black font-['Inter']"
          >
            Seamless ETH ↔️ XLM transfers, no middleman.
          </motion.p>
          
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={openWalletModal}
            className="bg-[#000000] text-white px-12 py-4 rounded-[20px] text-[18px] font-normal leading-[27px] font-['Inter'] hover:bg-gray-800 transition-colors"
          >
            {isConnected ? 'Connected!' : 'Start'}
          </motion.button>
        </div>
      </motion.div>

      {/* Wallet Connect Modal with Blurred Background */}
      <AnimatePresence>
        {showWalletModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 backdrop-blur-md backdrop-filter bg-[rgba(0,0,0,0.4)] z-50 flex items-center justify-center p-4"
            onClick={closeWalletModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.3 }}
              className="bg-[#ffffff] rounded-[30px] shadow-[0px_20px_60px_0px_rgba(0,0,0,0.15)] p-8 max-w-[520px] w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="text-center mb-8">
                <h2 className="text-[#0000ee] text-[30px] font-['Inter:Regular',_sans-serif] font-normal leading-[36px] mb-2">
                  Connect Wallet
                </h2>
                <p className="text-[16px] text-[rgba(0,0,0,0.5)] font-['Inter:Regular',_sans-serif] font-normal leading-[19px]">
                  Choose your preferred wallet to get started
                </p>
              </div>

              {/* Wallet Options */}
              <div className="space-y-4 mb-8">
                {/* MetaMask */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={connectWallet}
                  className="bg-[#f2f2f7] flex items-center gap-3 px-6 py-4 rounded-[30px] w-full transition-all hover:bg-gray-100"
                >
                  <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">M</span>
                  </div>
                  <span className="font-['Inter:Regular',_sans-serif] font-normal text-[16px] text-[#000000] leading-[21px]">
                    Connect MetaMask
                  </span>
                </motion.button>

                {/* WalletConnect */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    // TODO: Integrate WalletConnect
                    alert('WalletConnect integration coming soon!');
                  }}
                  className="bg-[#f2f2f7] flex items-center gap-3 px-6 py-4 rounded-[30px] w-full transition-all hover:bg-gray-100"
                >
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">WC</span>
                  </div>
                  <span className="font-['Inter:Regular',_sans-serif] font-normal text-[16px] text-[#000000] leading-[21px]">
                    Connect with WalletConnect
                  </span>
                </motion.button>
              </div>

              {/* Footer Text */}
              <div className="text-center">
                <p className="text-[14px] text-[rgba(0,0,0,0.5)] font-['Inter:Regular',_sans-serif] font-normal leading-[18px]">
                  Your keys, your coins.
                </p>
              </div>

              {/* Close Button */}
              <button
                onClick={closeWalletModal}
                className="absolute top-6 right-6 bg-[#f2f2f7] p-2 rounded-full hover:bg-gray-200 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 