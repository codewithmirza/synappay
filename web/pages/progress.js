import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

// Image assets from Figma
const imgFrame = "http://localhost:3845/assets/a0d93239355829e4c4b530c90275fda978e91db2.svg";
const imgFrame1 = "http://localhost:3845/assets/6a785f892c3be9f8d3fb0e6a3d1e9220f4a4283b.svg";
const imgFrame2 = "http://localhost:3845/assets/93e8862adcb2a25efb017b0a7b66eccc937cfb6c.svg";
const imgFrame3 = "http://localhost:3845/assets/9ed60ebac51962657d4c62f72d5444029472e092.svg";

export default function Progress() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isComplete, setIsComplete] = useState(false);
  const [auctionData, setAuctionData] = useState(null);
  const [error, setError] = useState(null);
  const [showAuctionDetails, setShowAuctionDetails] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [orderHash, setOrderHash] = useState('demo-order-hash');

  // SSR-safe: get orderHash from URL only on client
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hash = new URLSearchParams(window.location.search).get('orderHash');
      setOrderHash(hash || 'demo-order-hash');
    }
  }, []);

  useEffect(() => {
    // Fetch auction status on component mount
    fetchAuctionStatus();
    
    // Set up polling for real-time updates
    const interval = setInterval(fetchAuctionStatus, 5000);
    
    return () => clearInterval(interval);
  }, [orderHash]);

  useEffect(() => {
    // Simulate progress through steps with auction awareness
    const timer = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < 4) {
          return prev + 1;
        } else {
          setIsComplete(true);
          clearInterval(timer);
          return prev;
        }
      });
    }, 3000);

    return () => clearInterval(timer);
  }, []);

  const fetchAuctionStatus = async () => {
    try {
      const response = await fetch(`/api/auction-status?orderHash=${orderHash}`);
      const data = await response.json();
      
      if (data.success) {
        setAuctionData(data);
        setError(null);
        
        // Update step based on auction status
        updateStepFromAuctionStatus(data.status.current);
      } else {
        setError(data.error || 'Failed to fetch auction status');
      }
    } catch (error) {
      setError('Network error while fetching status');
      console.error('Error fetching auction status:', error);
    }
  };

  const updateStepFromAuctionStatus = (status) => {
    switch (status) {
      case 'ACTIVE':
        setCurrentStep(3); // Awaiting Resolver/Secret
        break;
      case 'FILLED':
        setCurrentStep(4); // Swap Complete
        setIsComplete(true);
        break;
      case 'EXPIRED':
        setCurrentStep(4); // Show refund option
        break;
      default:
        // Keep current step
        break;
    }
  };

  const handleCancelSwap = () => {
    if (auctionData?.status?.canRefund) {
      // Show refund modal or redirect to refund page
      window.location.href = '/claim';
    } else {
      alert('Swap cannot be cancelled at this stage');
    }
  };

  const handleRetry = () => {
    setError(null);
    fetchAuctionStatus();
  };

  const formatTime = (seconds) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStepStatus = (step) => {
    if (step < currentStep) return 'completed';
    if (step === currentStep) return 'active';
    return 'pending';
  };

  const getStepIcon = (step, status) => {
    if (status === 'completed') {
      return (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      );
    }
    
    const icons = [
      <svg key="1" className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>,
      <svg key="2" className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>,
      <svg key="3" className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>,
      <svg key="4" className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ];
    
    return icons[step - 1];
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
          <h1 className="text-2xl md:text-3xl font-semibold text-black mb-2">Swap Progress</h1>
          <p className="text-gray-600">Tracking your cross-chain swap</p>
        </div>

        {/* Progress Timeline */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            {[1, 2, 3, 4].map((step) => {
              const status = getStepStatus(step);
              return (
                <div key={step} className="flex flex-col items-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                    status === 'completed' ? 'bg-green-500' :
                    status === 'active' ? 'bg-blue-500' : 'bg-gray-300'
                  }`}>
                    {getStepIcon(step, status)}
                  </div>
                  <div className="text-xs text-center">
                    {step === 1 && 'Initiated'}
                    {step === 2 && 'Processing'}
                    {step === 3 && 'Awaiting'}
                    {step === 4 && 'Complete'}
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Progress Lines */}
          <div className="flex justify-between px-6">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`flex-1 h-0.5 ${
                  getStepStatus(step) === 'completed' ? 'bg-green-500' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Current Status */}
        <div className="bg-gray-50 rounded-[20px] p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Current Status</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Order Hash</span>
              <span className="font-mono text-sm">{orderHash.slice(0, 8)}...{orderHash.slice(-8)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Status</span>
              <span className={`font-medium ${
                currentStep === 4 ? 'text-green-600' : 'text-blue-600'
              }`}>
                {currentStep === 1 && 'Swap Initiated'}
                {currentStep === 2 && 'Processing Transaction'}
                {currentStep === 3 && 'Awaiting Resolver'}
                {currentStep === 4 && 'Swap Complete'}
              </span>
            </div>
            {auctionData && (
              <div className="flex justify-between">
                <span className="text-gray-600">Resolvers</span>
                <span className="font-medium">{auctionData.status?.resolverCount || 0}</span>
              </div>
            )}
          </div>
        </div>

        {/* Auction Details (Expandable) */}
        {auctionData && (
          <div className="bg-gray-50 rounded-[20px] p-6 mb-6">
            <button
              onClick={() => setShowAuctionDetails(!showAuctionDetails)}
              className="flex items-center justify-between w-full text-left"
            >
              <h3 className="text-lg font-semibold">Auction Details</h3>
              <svg
                className={`w-5 h-5 transition-transform ${showAuctionDetails ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {showAuctionDetails && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 space-y-3"
              >
                <div className="flex justify-between">
                  <span className="text-gray-600">Best Offer</span>
                  <span className="font-medium">{auctionData.status?.bestOffer || '--'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Time Remaining</span>
                  <span className="font-medium">{formatTime(auctionData.status?.timeRemaining)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Offers</span>
                  <span className="font-medium">{auctionData.status?.totalOffers || 0}</span>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4">
          {isComplete ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => window.location.href = '/history'}
              className="flex-1 bg-green-600 text-white py-4 rounded-[20px] text-lg font-medium hover:bg-green-700 transition-colors"
            >
              View History
            </motion.button>
          ) : (
            <>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCancelSwap}
                className="flex-1 bg-red-600 text-white py-4 rounded-[20px] text-lg font-medium hover:bg-red-700 transition-colors"
              >
                Cancel Swap
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => window.location.href = '/swap'}
                className="flex-1 bg-black text-white py-4 rounded-[20px] text-lg font-medium hover:bg-gray-800 transition-colors"
              >
                New Swap
              </motion.button>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 