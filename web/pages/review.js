import { useState } from 'react';
import { motion } from 'framer-motion';

// Image assets from Figma
const imgFrame = "http://localhost:3845/assets/1b6af1c180620a49100b0962fb1d65b7e7bd3b37.svg";
const imgFrame1 = "http://localhost:3845/assets/b0e67450fceff8fac833144bf5332ecbfb863713.svg";
const imgFrame2 = "http://localhost:3845/assets/5c772275f3ad2c1bba8185a553819583765d121a.svg";
const imgFrame3 = "http://localhost:3845/assets/d6e6884bb2193e7557212a0bba9083f83eb8943f.svg";
const imgFrame4 = "http://localhost:3845/assets/e8d4e82d2853512e6ba5e45c1cd9aa4fafe8d03d.svg";
const imgFrame5 = "http://localhost:3845/assets/55bd8dfadef68bf72eb7d5c4962acd07c46c0351.svg";

export default function Review() {
  const [fromAmount, setFromAmount] = useState('1.00');
  const [toAmount, setToAmount] = useState('2,847.32');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [swapDetails, setSwapDetails] = useState({
    exchangeRate: '1 ETH = 2,847.32 USDC',
    slippage: '1.0%',
    gasFee: '$12.50',
    estimatedTime: '2-5 minutes'
  });

  const handleSwapTokens = async () => {
    setError(null);
    setIsLoading(true);
    
    try {
      // Simulate swap processing with potential errors
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          // Simulate various error conditions
          const random = Math.random();
          if (random < 0.05) { // 5% chance of insufficient funds
            reject(new Error('Insufficient funds. Please check your balance.'));
          } else if (random < 0.1) { // 5% chance of network error
            reject(new Error('Network error. Please check your connection and try again.'));
          } else if (random < 0.15) { // 5% chance of price impact too high
            reject(new Error('Price impact too high. Try a smaller amount.'));
          } else {
            resolve();
          }
        }, 2000);
      });
      
      // Navigate to progress page
      window.location.href = '/progress';
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    setError(null);
  };

  const handleBack = () => {
    window.location.href = '/swap';
  };

  return (
    <div className="min-h-screen bg-[#f2f2f7] flex items-center justify-center p-4">
      <div className="bg-[#ffffff] rounded-[30px] shadow-[0px_4px_20px_0px_rgba(0,0,0,0.08)] p-6 md:p-8 max-w-[600px] w-full">
        
        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <span className="text-red-800 font-medium">{error}</span>
              </div>
              <button
                onClick={handleRetry}
                className="text-red-600 hover:text-red-800 font-medium"
              >
                Retry
              </button>
            </div>
          </motion.div>
        )}

        {/* Progress Indicators */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-4">
            <div className="bg-[#007aff] text-white p-3 rounded-full shadow-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="w-8 h-0.5 bg-gray-300"></div>
            <div className="bg-gray-300 text-gray-500 p-3 rounded-full">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="w-8 h-0.5 bg-gray-300"></div>
            <div className="bg-gray-300 text-gray-500 p-3 rounded-full">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-semibold text-black mb-2">Review Swap</h1>
          <p className="text-gray-600">Confirm your swap details before proceeding</p>
        </div>

        {/* Swap Summary */}
        <div className="space-y-6">
          {/* From Token */}
          <div className="bg-gray-50 rounded-[20px] p-6">
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm font-medium text-gray-700">You Pay</label>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="text-2xl font-semibold text-gray-900">
                  {fromAmount} ETH
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  ≈ ${(parseFloat(fromAmount) * 2847.32).toLocaleString()}
                </div>
              </div>
              
              <div className="flex items-center gap-2 bg-white rounded-[15px] px-4 py-2">
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">Ξ</span>
                </div>
                <span className="font-medium">ETH</span>
              </div>
            </div>
          </div>

          {/* Swap Arrow */}
          <div className="flex justify-center">
            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </div>
          </div>

          {/* To Token */}
          <div className="bg-gray-50 rounded-[20px] p-6">
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm font-medium text-gray-700">You Receive</label>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="text-2xl font-semibold text-gray-900">
                  {toAmount} USDC
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  ≈ ${(parseFloat(toAmount.replace(',', '')) * 1).toLocaleString()}
                </div>
              </div>
              
              <div className="flex items-center gap-2 bg-white rounded-[15px] px-4 py-2">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">$</span>
                </div>
                <span className="font-medium">USDC</span>
              </div>
            </div>
          </div>

          {/* Swap Details */}
          <div className="bg-gray-50 rounded-[20px] p-6">
            <h3 className="text-lg font-semibold mb-4">Swap Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Exchange Rate</span>
                <span className="font-medium">{swapDetails.exchangeRate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Slippage</span>
                <span className="font-medium">{swapDetails.slippage}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Gas Fee</span>
                <span className="font-medium">{swapDetails.gasFee}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Estimated Time</span>
                <span className="font-medium">{swapDetails.estimatedTime}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleBack}
              className="flex-1 bg-gray-200 text-gray-800 py-4 rounded-[20px] text-lg font-medium hover:bg-gray-300 transition-colors"
            >
              Back
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSwapTokens}
              disabled={isLoading}
              className="flex-1 bg-black text-white py-4 rounded-[20px] text-lg font-medium hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processing...
                </div>
              ) : (
                'Confirm Swap'
              )}
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
} 