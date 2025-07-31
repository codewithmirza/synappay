'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight, Home } from 'lucide-react';
import ApiClient from '../lib/api-client';
import config from '../lib/config';

// Image assets from Figma
const imgFrame = "http://localhost:3845/assets/1d00695c5df019f1aaa0b1c6960f28a662c99f64.svg";

export default function ClaimSuccess() {
  const [hashOrSecret, setHashOrSecret] = useState('0x1a2b3c4d... or secret123');

  const handleStartNewClaim = () => {
    window.location.href = '/claim';
  };

  return (
    <div className="min-h-screen bg-[#f2f2f7] flex items-center justify-center p-4">
      <div className="bg-[#ffffff] rounded-[30px] shadow-[0px_4px_20px_0px_rgba(0,0,0,0.08)] p-6 md:p-12 max-w-[600px] w-full relative overflow-hidden">
        {/* Animated Particles */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            animate={{ 
              x: [0, 20, -10, 0],
              y: [0, -15, 10, 0],
              rotate: [0, 360]
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bg-green-500 rounded-full size-2 top-[147px] right-[100px]"
          />
          <motion.div
            animate={{ 
              x: [0, -20, 15, 0],
              y: [0, 10, -5, 0],
              rotate: [0, -360]
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bg-red-500 rounded-full size-3.5 top-[89px] right-[200px]"
          />
          <motion.div
            animate={{ 
              x: [0, 15, -20, 0],
              y: [0, -10, 15, 0],
              rotate: [0, 180]
            }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bg-pink-500 rounded-full size-[11px] top-[178px] right-[50px]"
          />
          <motion.div
            animate={{ 
              x: [0, -15, 25, 0],
              y: [0, 20, -10, 0],
              rotate: [0, 360]
            }}
            transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bg-blue-500 rounded-full size-[13px] top-[119px] right-[250px]"
          />
          <motion.div
            animate={{ 
              x: [0, 20, -15, 0],
              y: [0, -5, 20, 0],
              rotate: [0, -180]
            }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bg-green-500 rounded-full size-2.5 top-[208px] right-[150px]"
          />
          <motion.div
            animate={{ 
              x: [0, -25, 10, 0],
              y: [0, 15, -20, 0],
              rotate: [0, 360]
            }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bg-pink-500 rounded-full size-[9px] top-[327px] left-[100px]"
          />
          <motion.div
            animate={{ 
              x: [0, 15, -20, 0],
              y: [0, -10, 25, 0],
              rotate: [0, -360]
            }}
            transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bg-orange-500 rounded-full size-2.5 top-[208px] left-[126px]"
          />
          <motion.div
            animate={{ 
              x: [0, -20, 15, 0],
              y: [0, 25, -15, 0],
              rotate: [0, 180]
            }}
            transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bg-green-400 rounded-full size-[7px] top-[268px] left-[226px]"
          />
          <motion.div
            animate={{ 
              x: [0, 25, -10, 0],
              y: [0, -20, 15, 0],
              rotate: [0, 360]
            }}
            transition={{ duration: 5.2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bg-purple-500 rounded-full size-3 top-[149px] left-[264px]"
          />
        </div>

        {/* Success Content */}
        <div className="relative z-10 text-center">
          {/* Success Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, type: "spring" }}
            className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </motion.div>

          {/* Success Message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mb-8"
          >
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Funds Received!
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed">
              Your funds have been successfully claimed and transferred to your wallet. The transaction has been confirmed on the blockchain.
            </p>
          </motion.div>

          {/* Transaction Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="bg-gray-50 rounded-[20px] p-6 mb-8"
          >
            <h3 className="text-lg font-semibold mb-4">Transaction Details</h3>
            <div className="space-y-3 text-left">
              <div className="flex justify-between">
                <span className="text-gray-600">Transaction Hash:</span>
                <span className="font-mono text-sm">{hashOrSecret}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="text-green-600 font-medium">Confirmed</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount:</span>
                <span className="font-medium">2,847.32 USDC</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Network:</span>
                <span className="font-medium">Ethereum</span>
              </div>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="flex gap-4"
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleStartNewClaim}
              className="flex-1 bg-gray-200 text-gray-800 py-4 rounded-[20px] text-lg font-medium hover:bg-gray-300 transition-colors"
            >
              Claim More Funds
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => window.location.href = '/'}
              className="flex-1 bg-black text-white py-4 rounded-[20px] text-lg font-medium hover:bg-gray-800 transition-colors"
            >
              Back to Home
            </motion.button>
          </motion.div>
        </div>
      </div>
    </div>
  );
} 