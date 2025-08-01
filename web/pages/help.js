'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp, HelpCircle, ArrowLeft } from 'lucide-react';
import ApiClient from '../lib/api-client';
import config from '../lib/config';

// Image assets from Figma
const imgFrame = "http://localhost:3845/assets/53d15f2c91de850f5cb8d7ffe5497df682ce8522.svg";
const imgFrame1 = "http://localhost:3845/assets/c4ddf8f90865742602c33e9f3ea778ab1407c973.svg";
const imgFrame2 = "http://localhost:3845/assets/8da8c72a2572e33bb018812b32ac2a2e5ad5a629.svg";
const imgFrame3 = "http://localhost:3845/assets/631aa92d697a6e715018f62cda524f29987faf73.svg";
const imgFrame4 = "http://localhost:3845/assets/698ed240e328c42e2db15eca404cdb9d664d347e.svg";
const imgFrame5 = "http://localhost:3845/assets/d23d57d4c7087ca0380271e9948c69d99d79cf68.svg";

export default function Help() {
  const [expandedItem, setExpandedItem] = useState(null);

  const faqItems = [
    {
      id: 1,
      question: "What is Synappay?",
      answer: "Synappay is a trustless cross-chain swap platform that enables seamless token transfers between Ethereum and Stellar networks using HTLC (Hash Time Locked Contracts) technology."
    },
    {
      id: 2,
      question: "How long do swaps take?",
      answer: "Swaps typically take 2-5 minutes depending on network congestion. The process involves locking funds on both chains and requires confirmations from both networks."
    },
    {
      id: 3,
      question: "What are the fees?",
      answer: "Fees include network gas costs for both Ethereum and Stellar, plus a small platform fee. Total fees are typically $10-25 depending on the swap amount and network conditions."
    },
    {
      id: 4,
      question: "Is it safe to use?",
      answer: "Yes, Synappay uses industry-standard HTLC technology that ensures atomic swaps. Your funds are never held by a third party - they're locked in smart contracts until the swap completes or times out."
    },
    {
      id: 5,
      question: "Which tokens are supported?",
      answer: "ETH, WBTC, USDC, USDT on Ethereum. XLM, USDC on Stellar. More tokens added regularly."
    }
  ];

  const toggleItem = (id) => {
    setExpandedItem(expandedItem === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-[#f2f2f7] flex items-center justify-center p-4">
      <div className="bg-[#ffffff] rounded-[30px] shadow-[0px_4px_20px_0px_rgba(0,0,0,0.08)] p-6 md:p-8 max-w-[800px] w-full">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-semibold text-black mb-2">Help & Support</h1>
          <p className="text-gray-600">Find answers to common questions</p>
        </div>

        {/* FAQ Items */}
        <div className="space-y-4 mb-8">
          {faqItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gray-50 rounded-[20px] p-6"
            >
              <div 
                className="flex justify-between items-center cursor-pointer"
                onClick={() => toggleItem(item.id)}
              >
                <h3 className="text-lg font-medium text-gray-900">
                  {item.question}
                </h3>
                <motion.div
                  animate={{ rotate: expandedItem === item.id ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="w-5 h-5 text-gray-600"
                >
                  <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </motion.div>
              </div>
              
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ 
                  height: expandedItem === item.id ? 'auto' : 0,
                  opacity: expandedItem === item.id ? 1 : 0
                }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <p className="text-gray-600 leading-relaxed mt-4">
                  {item.answer}
                </p>
              </motion.div>
            </motion.div>
          ))}
        </div>

        {/* Contact Information */}
        <div className="bg-gray-50 rounded-[20px] p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4">Still Need Help?</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <div className="font-medium">Email Support</div>
                <div className="text-sm text-gray-600">support@www.synappay.com</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div>
                <div className="font-medium">Discord Community</div>
                <div className="text-sm text-gray-600">Join our community</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <div className="font-medium">Documentation</div>
                <div className="text-sm text-gray-600">Read our guides</div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => window.location.href = '/claim'}
            className="flex-1 bg-gray-200 text-gray-800 py-4 rounded-[20px] text-lg font-medium hover:bg-gray-300 transition-colors"
          >
            Claim/Refund
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => window.location.href = '/'}
            className="flex-1 bg-black text-white py-4 rounded-[20px] text-lg font-medium hover:bg-gray-800 transition-colors"
          >
            Back to Home
          </motion.button>
        </div>
      </div>
    </div>
  );
} 