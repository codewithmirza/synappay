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
        className="bg-[#ffffff] rounded-[30px] shadow-[0px_4px_20px_0px_rgba(0,0,0,0.08)] p-8 md:p-16 max-w-[515px] w-full"
      >
        <div className="text-center space-y-6 md:space-y-9">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-3xl md:text-[48px] font-normal leading-tight md:leading-[57.6px] text-black font-['Inter']"
          >
            Trustless Cross-Chain Swap
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-base md:text-[20px] font-normal leading-relaxed md:leading-[28px] text-black font-['Inter']"
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
            className="bg-[#000000] text-white px-8 md:px-12 py-3 md:py-4 rounded-[20px] text-base md:text-[18px] font-normal leading-relaxed md:leading-[27px] font-['Inter'] hover:bg-gray-800 transition-colors"
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
              className="bg-[#ffffff] rounded-[30px] shadow-[0px_20px_60px_0px_rgba(0,0,0,0.15)] p-6 md:p-8 max-w-[520px] w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="text-center mb-6 md:mb-8">
                <h2 className="text-[#0000ee] text-2xl md:text-[30px] font-['Inter:Regular',_sans-serif] font-normal leading-tight md:leading-[36px] mb-2">
                  Connect Wallet
                </h2>
                <p className="text-sm md:text-[16px] text-[rgba(0,0,0,0.5)] font-['Inter:Regular',_sans-serif] font-normal leading-relaxed md:leading-[19px]">
                  Choose your preferred wallet to get started
                </p>
              </div>

              {/* Wallet Options */}
              <div className="space-y-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={connectWallet}
                  className="w-full bg-[#f8f9fa] hover:bg-[#e9ecef] border border-[#dee2e6] rounded-[15px] p-4 flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#f7931e] rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                      </svg>
                    </div>
                    <span className="text-[#212529] font-medium">MetaMask</span>
                  </div>
                  <svg className="w-5 h-5 text-[#6c757d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-[#f8f9fa] hover:bg-[#e9ecef] border border-[#dee2e6] rounded-[15px] p-4 flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#3b82f6] rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                      </svg>
                    </div>
                    <span className="text-[#212529] font-medium">WalletConnect</span>
                  </div>
                  <svg className="w-5 h-5 text-[#6c757d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                </motion.button>
          </div>

              {/* Close Button */}
              <div className="mt-6 md:mt-8 text-center">
                <button
                  onClick={closeWalletModal}
                  className="text-[#6c757d] hover:text-[#495057] font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 