import { useState } from 'react';
import { motion } from 'framer-motion';

// Image assets from Figma
const imgFrame = "http://localhost:3845/assets/4ef9f0c87570c1716223e53c1796c97549633d17.svg";

export default function Swap() {
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('2,847.32');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  const validateInput = () => {
    const errors = {};
    
    if (!fromAmount || parseFloat(fromAmount) <= 0) {
      errors.amount = 'Please enter a valid amount';
    }
    
    if (parseFloat(fromAmount) > 2.45) {
      errors.balance = 'Insufficient balance';
    }
    
    if (parseFloat(fromAmount) < 0.001) {
      errors.minAmount = 'Minimum swap amount is 0.001 ETH';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleReviewSwap = async () => {
    setError(null);
    
    if (!validateInput()) {
      return;
    }

    setIsLoading(true);
    
    try {
      // Simulate API call for quote
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if quote is still valid
      if (Math.random() < 0.1) { // 10% chance of quote expiry
        throw new Error('Quote expired. Please try again.');
      }
      
      // Navigate to review page
      window.location.href = '/review';
    } catch (error) {
      setError(error.message || 'Failed to get quote. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAmountChange = (value) => {
    setFromAmount(value);
    setError(null);
    setValidationErrors({});
    
    // Simulate real-time quote updates
    if (value && parseFloat(value) > 0) {
      const calculatedAmount = (parseFloat(value) * 2847.32).toFixed(2);
      setToAmount(calculatedAmount.toLocaleString());
    } else {
      setToAmount('0.00');
    }
  };

  const handleRetry = () => {
    setError(null);
    setValidationErrors({});
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

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-semibold text-black mb-2">Swap Tokens</h1>
          <p className="text-gray-600">Exchange ETH for USDC with the best rates</p>
        </div>

        {/* Swap Form */}
        <div className="space-y-6">
          {/* From Token */}
          <div className="bg-gray-50 rounded-[20px] p-6">
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm font-medium text-gray-700">You Pay</label>
              <div className="text-sm text-gray-500">
                Balance: <span className="font-medium">2.45 ETH</span>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <input
                  type="number"
                  value={fromAmount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  placeholder="0.00"
                  className="w-full text-2xl font-semibold bg-transparent border-none outline-none"
                />
                {validationErrors.amount && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.amount}</p>
                )}
                {validationErrors.balance && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.balance}</p>
                )}
                {validationErrors.minAmount && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.minAmount}</p>
                )}
              </div>
              
              <div className="flex items-center gap-2 bg-white rounded-[15px] px-4 py-2">
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">Ξ</span>
                </div>
                <span className="font-medium">ETH</span>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Swap Arrow */}
          <div className="flex justify-center">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </motion.button>
          </div>

          {/* To Token */}
          <div className="bg-gray-50 rounded-[20px] p-6">
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm font-medium text-gray-700">You Receive</label>
              <div className="text-sm text-gray-500">
                Rate: <span className="font-medium">1 ETH = 2,847.32 USDC</span>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="text-2xl font-semibold text-gray-900">
                  {toAmount}
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
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Swap Details */}
          <div className="bg-gray-50 rounded-[20px] p-6">
            <h3 className="text-lg font-semibold mb-4">Swap Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Exchange Rate</span>
                <span className="font-medium">1 ETH = 2,847.32 USDC</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Slippage</span>
                <span className="font-medium">1.0%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Gas Fee</span>
                <span className="font-medium">$12.50</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Estimated Time</span>
                <span className="font-medium">2-5 minutes</span>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleReviewSwap}
            disabled={isLoading || !fromAmount || parseFloat(fromAmount) <= 0}
            className="w-full bg-black text-white py-4 rounded-[20px] text-lg font-medium hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Getting Quote...
              </div>
            ) : (
              'Review Swap'
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
} 