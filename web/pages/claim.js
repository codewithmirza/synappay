import { useState } from 'react';
import { motion } from 'framer-motion';

export default function Claim() {
  const [hashOrSecret, setHashOrSecret] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleClaimFunds = () => {
    if (!hashOrSecret.trim()) {
      alert('Please enter a transaction hash or secret');
      return;
    }
    setIsLoading(true);
    // Simulate claim process
    setTimeout(() => {
      window.location.href = '/claim-success';
    }, 2000);
  };

  const handleRequestRefund = () => {
    if (!hashOrSecret.trim()) {
      alert('Please enter a transaction hash or secret');
      return;
    }
    setIsLoading(true);
    // Simulate refund request
    setTimeout(() => {
      alert('Refund request submitted successfully!');
      setIsLoading(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-[#f2f2f7] flex items-center justify-center p-4">
      <div className="bg-[#ffffff] rounded-[30px] shadow-[0px_4px_20px_0px_rgba(0,0,0,0.08)] p-12 max-w-[600px] w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-[#0000ee] text-[30px] font-['Inter:Regular',_sans-serif] font-normal leading-[36px] mb-4">
            Claim Your Funds
          </h1>
          <p className="text-[16px] text-[rgba(0,0,0,0.5)] font-['Inter:Regular',_sans-serif] font-normal leading-[24px]">
            Enter your transaction hash or secret to claim
          </p>
        </div>

        {/* Input Field */}
        <div className="mb-8">
          <label className="block text-[#000000] text-[18px] font-['Inter:Regular',_sans-serif] font-normal leading-[27px] mb-4">
            Transaction Hash or Secret
          </label>
          <input
            type="text"
            value={hashOrSecret}
            onChange={(e) => setHashOrSecret(e.target.value)}
            placeholder="0x1a2b3c4d... or secret123"
            className="w-full bg-[#f2f2f7] border-none rounded-[20px] px-6 py-4 text-[16px] font-['Inter:Regular',_sans-serif] font-normal text-[#000000] leading-[normal] focus:outline-none focus:ring-2 focus:ring-[#007aff]"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleClaimFunds}
            disabled={isLoading}
            className="flex-1 bg-[#000000] text-white px-12 py-5 rounded-[20px] text-[18px] font-['Inter:Regular',_sans-serif] font-normal leading-[27px] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Processing...' : 'Claim Funds'}
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleRequestRefund}
            disabled={isLoading}
            className="flex-1 bg-[#f2f2f7] text-[#000000] px-8 py-5 rounded-[20px] text-[18px] font-['Inter:Regular',_sans-serif] font-normal leading-[27px] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Processing...' : 'Request Refund'}
          </motion.button>
        </div>
      </div>
    </div>
  );
} 