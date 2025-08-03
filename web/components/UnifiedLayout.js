'use client';

import { motion, AnimatePresence } from 'framer-motion';
import WalletConnectionButton from './WalletConnectionButton';
import Navigation from './Navigation';
import NetworkToggle from './NetworkToggle';
import TestnetBanner from './TestnetBanner';
// import BackendStatus from './BackendStatus';

export default function UnifiedLayout({ children, title, subtitle, showWalletButton = true, showNavigation = true }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f2f2f7] via-white to-[#f8f9fa]">
      {/* Testnet Banner */}
      <TestnetBanner />

      {/* Top Bar with Wallet and Network Toggle */}
      <div className="fixed top-4 right-4 z-50 flex items-center space-x-3">
        <NetworkToggle />
        {showWalletButton && <WalletConnectionButton />}
      </div>

      {/* Main Content - Centered Vertically */}
      <div className="min-h-screen flex items-center justify-center p-4 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-[24px] shadow-[0px_8px_32px_0px_rgba(0,0,0,0.08)] p-6 md:p-12 max-w-[600px] w-full relative overflow-hidden"
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 right-0 w-40 h-40 bg-gradient-to-br from-green-500 to-blue-600 rounded-full blur-3xl"></div>
          </div>

          <div className="relative z-10">
            {/* Header */}
            {title && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="text-center mb-6"
              >
                <h2 className="text-2xl md:text-3xl font-bold leading-tight text-[#000000] font-inter mb-2">
                  {title}
                </h2>
                {subtitle && (
                  <p className="text-base text-gray-600 leading-relaxed max-w-sm mx-auto">
                    {subtitle}
                  </p>
                )}
              </motion.div>
            )}

            {/* Dynamic Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={title || 'content'}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* Navigation - Fixed Bottom */}
      {showNavigation && <Navigation />}

      {/* Backend Status - Show in development */}
      {/* {process.env.NODE_ENV === 'development' && <BackendStatus />} */}
    </div>
  );
}