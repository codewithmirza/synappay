import { useState } from 'react';
import { motion } from 'framer-motion';

// Image assets from Figma
const imgFrame = "http://localhost:3845/assets/ca89c627b59121acdb35167a0882371eb28979b3.svg";
const imgFrame1 = "http://localhost:3845/assets/95fac634a56edbc6057ef1bae35e34985f052c3b.svg";
const imgFrame2 = "http://localhost:3845/assets/bbd9b960c82d03bb6e236bc3312929e27758d260.svg";

export default function History() {
  const [transactions] = useState([
    {
      id: 1,
      fromToken: 'ETH',
      toToken: 'USDC',
      fromAmount: '2.5 ETH',
      toAmount: '7,125.80 USDC',
      status: 'Success',
      statusColor: 'bg-[#34c759]',
      date: '2024-01-15 at 14:32',
      route: 'Ethereum → Stellar'
    },
    {
      id: 2,
      fromToken: 'USDC',
      toToken: 'ETH',
      fromAmount: '5,000.00 USDC',
      toAmount: '1.75 ETH',
      status: 'Pending',
      statusColor: 'bg-[#007aff]',
      date: '2024-01-15 at 16:45',
      route: 'Stellar → Ethereum'
    },
    {
      id: 3,
      fromToken: 'WBTC',
      toToken: 'XLM',
      fromAmount: '0.1 WBTC',
      toAmount: '15,420.50 XLM',
      status: 'Refunded',
      statusColor: 'bg-[#ff9500]',
      date: '2024-01-14 at 09:15',
      route: 'Ethereum → Stellar'
    },
    {
      id: 4,
      fromToken: 'XLM',
      toToken: 'USDT',
      fromAmount: '25,000.00 XLM',
      toAmount: '2,847.32 USDT',
      status: 'Success',
      statusColor: 'bg-[#34c759]',
      date: '2024-01-13 at 11:28',
      route: 'Stellar → Ethereum'
    },
    {
      id: 5,
      fromToken: 'ETH',
      toToken: 'USDC',
      fromAmount: '1.0 ETH',
      toAmount: '2,843.15 USDC',
      status: 'Success',
      statusColor: 'bg-[#34c759]',
      date: '2024-01-12 at 20:07',
      route: 'Ethereum → Stellar'
    }
  ]);

  return (
    <div className="min-h-screen bg-[#f2f2f7] flex items-center justify-center p-4">
      <div className="bg-[#ffffff] rounded-[30px] shadow-[0px_4px_20px_0px_rgba(0,0,0,0.08)] p-8 max-w-[800px] w-full">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-[#0000ee] text-[30px] font-['Inter:Regular',_sans-serif] font-normal leading-[36px]">
            Transaction History
          </h1>
          <div className="bg-[#f2f2f7] p-4 rounded-full">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        </div>

        {/* Transactions List */}
        <div className="space-y-6">
          {transactions.map((tx, index) => (
            <motion.div
              key={tx.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-[#f2f2f7] rounded-[20px] p-6"
            >
              {/* Token Pair */}
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">{tx.fromToken}</span>
                    </div>
                    <span className="text-[#000000] text-[14px] font-['Inter:Regular',_sans-serif] font-normal leading-[21px]">
                      {tx.fromToken}
                    </span>
                  </div>
                  
                  <div className="w-4 h-4">
                    <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
                    </svg>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">{tx.toToken}</span>
                    </div>
                    <span className="text-[#000000] text-[14px] font-['Inter:Regular',_sans-serif] font-normal leading-[21px]">
                      {tx.toToken}
                    </span>
                  </div>
                </div>
                
                <div className="bg-[#ffffff] p-2 rounded-full shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1)]">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </div>
              </div>

              {/* Amount and Status */}
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-[#000000] text-[18px] font-['Inter:Regular',_sans-serif] font-normal leading-[27px]">
                    {tx.fromAmount}
                  </span>
                  <span className="text-[14px] text-[rgba(0,0,0,0.5)] font-['Inter:Regular',_sans-serif] font-normal leading-[21px]">
                    →
                  </span>
                  <span className="text-[#000000] text-[18px] font-['Inter:Regular',_sans-serif] font-normal leading-[27px]">
                    {tx.toAmount}
                  </span>
                </div>
                
                <div className={`${tx.statusColor} px-3 py-1 rounded-full`}>
                  <span className="text-[#ffffff] text-[12px] font-['Inter:Regular',_sans-serif] font-normal leading-[18px]">
                    {tx.status}
                  </span>
                </div>
              </div>

              {/* Date and Route */}
              <div className="flex justify-between items-center">
                <span className="text-[12px] text-[rgba(0,0,0,0.5)] font-['Inter:Regular',_sans-serif] font-normal leading-[18px]">
                  {tx.date}
                </span>
                <span className="text-[12px] text-[rgba(0,0,0,0.5)] font-['Inter:Regular',_sans-serif] font-normal leading-[18px]">
                  {tx.route}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
} 