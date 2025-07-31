import { useState } from 'react';
import { motion } from 'framer-motion';

// Image assets from Figma
const imgFrame = "http://localhost:3845/assets/1d00695c5df019f1aaa0b1c6960f28a662c99f64.svg";

export default function ClaimSuccess() {
  const [hashOrSecret, setHashOrSecret] = useState('0x1a2b3c4d... or secret123');

  const handleStartNewClaim = () => {
    window.location.href = '/claim';
  };

  return (
    <div className="min-h-screen bg-[#f2f2f7] flex items-center justify-center p-4">
      <div className="bg-[#ffffff] rounded-[30px] shadow-[0px_4px_20px_0px_rgba(0,0,0,0.08)] p-12 max-w-[600px] w-full relative overflow-hidden">
        {/* Animated Particles */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            animate={{ 
              x: [0, 20, -10, 0],
              y: [0, -15, 10, 0],
              rotate: [0, 360]
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bg-[#34c759] rounded-full size-2 top-[147px] right-[100px]"
          />
          <motion.div
            animate={{ 
              x: [0, -20, 15, 0],
              y: [0, 10, -5, 0],
              rotate: [0, -360]
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bg-[#ff3b30] rounded-full size-3.5 top-[89px] right-[200px]"
          />
          <motion.div
            animate={{ 
              x: [0, 15, -20, 0],
              y: [0, -10, 15, 0],
              rotate: [0, 180]
            }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bg-[#ff2d92] rounded-full size-[11px] top-[178px] right-[50px]"
          />
          <motion.div
            animate={{ 
              x: [0, -15, 25, 0],
              y: [0, 20, -10, 0],
              rotate: [0, 360]
            }}
            transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bg-[#007aff] rounded-full size-[13px] top-[119px] right-[250px]"
          />
          <motion.div
            animate={{ 
              x: [0, 20, -15, 0],
              y: [0, -5, 20, 0],
              rotate: [0, -180]
            }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bg-[#34c759] rounded-full size-2.5 top-[208px] right-[150px]"
          />
          <motion.div
            animate={{ 
              x: [0, -25, 10, 0],
              y: [0, 15, -20, 0],
              rotate: [0, 360]
            }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bg-[#ff2d92] rounded-full size-[9px] top-[327px] left-[100px]"
          />
          <motion.div
            animate={{ 
              x: [0, 15, -20, 0],
              y: [0, -10, 25, 0],
              rotate: [0, -360]
            }}
            transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bg-[#ff9500] rounded-full size-2.5 top-[208px] left-[126px]"
          />
          <motion.div
            animate={{ 
              x: [0, -20, 15, 0],
              y: [0, 25, -15, 0],
              rotate: [0, 180]
            }}
            transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bg-[#30d158] rounded-full size-[7px] top-[268px] left-[226px]"
          />
          <motion.div
            animate={{ 
              x: [0, 25, -10, 0],
              y: [0, -20, 15, 0],
              rotate: [0, 360]
            }}
            transition={{ duration: 5.2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bg-[#5856d6] rounded-full size-3 top-[149px] left-[264px]"
          />
          <motion.div
            animate={{ 
              x: [0, -15, 20, 0],
              y: [0, 10, -25, 0],
              rotate: [0, -180]
            }}
            transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bg-[#5856d6] rounded-full size-[9px] top-[238px] left-[176px]"
          />
          <motion.div
            animate={{ 
              x: [0, 20, -15, 0],
              y: [0, -25, 10, 0],
              rotate: [0, 360]
            }}
            transition={{ duration: 3.3, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bg-[#ff9500] rounded-full size-2 top-[297px] right-[100px]"
          />
          <motion.div
            animate={{ 
              x: [0, -10, 25, 0],
              y: [0, 20, -15, 0],
              rotate: [0, -360]
            }}
            transition={{ duration: 4.7, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bg-[#007aff] rounded-full size-3 top-[116px] left-[75px]"
          />
        </div>

        {/* Header */}
        <div className="text-center mb-12 relative z-10">
          <h1 className="text-[#0000ee] text-[30px] font-['Inter:Regular',_sans-serif] font-normal leading-[36px] mb-4">
            Claim Your Funds
          </h1>
          <p className="text-[16px] text-[rgba(0,0,0,0.5)] font-['Inter:Regular',_sans-serif] font-normal leading-[24px]">
            Enter your transaction hash or secret to claim
          </p>
        </div>

        {/* Input Field */}
        <div className="mb-8 relative z-10">
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
        <div className="flex gap-4 mb-8 relative z-10">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 bg-[#000000] text-white px-12 py-5 rounded-[20px] text-[18px] font-['Inter:Regular',_sans-serif] font-normal leading-[27px]"
          >
            Claim Funds
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 bg-[#f2f2f7] text-[#000000] px-8 py-5 rounded-[20px] text-[18px] font-['Inter:Regular',_sans-serif] font-normal leading-[27px]"
          >
            Request Refund
          </motion.button>
        </div>

        {/* Success Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-[#26b286] rounded-[20px] p-6 mb-6 relative z-10"
        >
          <div className="flex items-center justify-center gap-3">
            <div className="bg-[#ffffff] p-1 rounded-full">
              <div className="w-3.5 h-3.5">
                <img
                  alt="Success"
                  className="w-full h-full"
                  src={imgFrame}
                />
              </div>
            </div>
            <span className="text-[#ffffff] text-[16px] font-['Inter:Regular',_sans-serif] font-normal leading-[24px]">
              Funds claimed successfully!
            </span>
          </div>
        </motion.div>

        {/* Start New Claim Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="text-center relative z-10"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleStartNewClaim}
            className="bg-[#f2f2f7] text-[#007aff] px-6 py-3 rounded-[20px] text-[14px] font-['Inter:Regular',_sans-serif] font-normal leading-[21px]"
          >
            Start New Claim
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
} 