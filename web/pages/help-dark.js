import { useState } from 'react';
import { motion } from 'framer-motion';

// Image assets from Figma
const imgFrame = "http://localhost:3845/assets/27ccbc11c5a98e500f11ca85816c17b029ddc418.svg";
const imgFrame1 = "http://localhost:3845/assets/59028f802a7bacf3ec383b30277ac7a6f0fe516e.svg";
const imgFrame2 = "http://localhost:3845/assets/8da8c72a2572e33bb018812b32ac2a2e5ad5a629.svg";
const imgFrame3 = "http://localhost:3845/assets/631aa92d697a6e715018f62cda524f29987faf73.svg";
const imgFrame4 = "http://localhost:3845/assets/698ed240e328c42e2db15eca404cdb9d664d347e.svg";
const imgFrame5 = "http://localhost:3845/assets/d23d57d4c7087ca0380271e9948c69d99d79cf68.svg";

export default function HelpDark() {
  const [expandedItem, setExpandedItem] = useState(5); // Last item expanded by default

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
    <div className="min-h-screen bg-[#000000] flex items-center justify-center p-4">
      <div className="bg-[#1c1c1e] rounded-[30px] shadow-[0px_4px_20px_0px_rgba(0,0,0,0.08)] p-8 max-w-[800px] w-full">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-[#0a84ff] text-[30px] font-['Inter:Regular',_sans-serif] font-normal leading-[36px]">
            Help & Support
          </h1>
          <div className="bg-[#2c2c2e] p-4 rounded-full">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        </div>

        {/* FAQ Items */}
        <div className="space-y-4 mb-8">
          {faqItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-[#2c2c2e] rounded-2xl p-4"
            >
              <div 
                className="flex justify-between items-center cursor-pointer"
                onClick={() => toggleItem(item.id)}
              >
                <h3 className="text-[#ffffff] text-[18px] font-['Inter:Regular',_sans-serif] font-normal leading-[27px]">
                  {item.question}
                </h3>
                <motion.div
                  animate={{ rotate: expandedItem === item.id ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="w-4 h-4"
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
                <p className="text-[16px] text-[rgba(255,255,255,0.7)] font-['Inter:Regular',_sans-serif] font-normal leading-[24px] mt-4">
                  {item.answer}
                </p>
              </motion.div>
            </motion.div>
          ))}
        </div>

        {/* Footer Links */}
        <div className="border-t border-[#2c2c2e] pt-6">
          <div className="flex justify-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4">
                <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <span className="text-[#0a84ff] text-[14px] font-['Inter:Regular',_sans-serif] font-normal leading-[21px]">
                Documentation
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="w-4 h-4">
                <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <span className="text-[#0a84ff] text-[14px] font-['Inter:Regular',_sans-serif] font-normal leading-[21px]">
                Status Page
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="w-4 h-4">
                <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <span className="text-[#0a84ff] text-[14px] font-['Inter:Regular',_sans-serif] font-normal leading-[21px]">
                API
              </span>
            </div>
          </div>
        </div>

        {/* Floating Action Button */}
        <div className="fixed bottom-6 right-6">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="bg-[#0a84ff] text-white p-4 rounded-full shadow-[0px_4px_16px_0px_rgba(0,0,0,0.15)]"
          >
            <div className="w-6 h-6 relative">
              <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <div className="absolute -top-1 -right-1 bg-[#34c759] opacity-[0.981] p-1 rounded-full">
                <div className="bg-[#ffffff] rounded-full size-1.5" />
              </div>
            </div>
          </motion.button>
        </div>
      </div>
    </div>
  );
} 