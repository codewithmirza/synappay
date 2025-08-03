'use client';

import { motion, AnimatePresence } from 'framer-motion';
import WalletConnectionButton from './WalletConnectionButton';
// import BackendStatus from './BackendStatus';

export default function UnifiedLayout({ children, title, subtitle, showWalletButton = true }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f2f2f7] via-white to-[#f8f9fa]">
      {/* Wallet Connection Button - Fixed Top Right */}
      {showWalletButton && (
        <div className="fixed top-4 right-4 z-50">
          <WalletConnectionButton />
        </div>
      )}

      {/* Main Content - Centered Vertically */}
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-[30px] shadow-[0px_20px_60px_0px_rgba(0,0,0,0.1)] p-8 md:p-16 max-w-[800px] w-full relative overflow-hidden"
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
                className="text-center mb-8"
              >
                <h2 className="text-3xl md:text-4xl font-bold leading-tight text-[#000000] font-inter mb-2">
                  {title}
                </h2>
                {subtitle && (
                  <p className="text-lg text-gray-600 leading-relaxed max-w-md mx-auto">
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

      {/* Backend Status - Show in development */}
      {/* {process.env.NODE_ENV === 'development' && <BackendStatus />} */}
    </div>
  );
}