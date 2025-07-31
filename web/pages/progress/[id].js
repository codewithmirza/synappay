import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Clock, AlertCircle, ArrowRight, ExternalLink, Copy, RefreshCw } from 'lucide-react';
import Layout from '../../components/Layout';
import { cn, formatAddress } from '../../lib/utils';

const steps = [
  { id: 'initiated', label: 'Swap Initiated', icon: CheckCircle },
  { id: 'eth_locked', label: 'ETH Locked', icon: CheckCircle },
  { id: 'stellar_locked', label: 'Stellar Locked', icon: CheckCircle },
  { id: 'auction_active', label: 'Auction Active', icon: Clock },
  { id: 'resolved', label: 'Resolved', icon: CheckCircle },
  { id: 'completed', label: 'Completed', icon: CheckCircle },
];

export default function Progress() {
  const router = useRouter();
  const { id } = router.query;
  
  const [swap, setSwap] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState(3600);

  useEffect(() => {
    if (!id) return;

    const fetchSwap = async () => {
      try {
        const response = await fetch(`/api/swaps/${id}`);
        if (response.ok) {
          const data = await response.json();
          setSwap(data);
          
          // Simulate progress
          let step = 0;
          const interval = setInterval(() => {
            step++;
            setCurrentStep(step);
            if (step >= steps.length) {
              clearInterval(interval);
            }
          }, 3000);
        }
      } catch (error) {
        console.error('Failed to fetch swap:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSwap();
  }, [id]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStepStatus = (stepIndex) => {
    if (stepIndex < currentStep) return 'completed';
    if (stepIndex === currentStep) return 'active';
    return 'pending';
  };

  const getStepIcon = (step, status) => {
    const Icon = step.icon;
    if (status === 'completed') {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    } else if (status === 'active') {
      return <Clock className="h-5 w-5 text-blue-500 animate-pulse" />;
    } else {
      return <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/20" />;
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  if (!swap) {
    return (
      <Layout>
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Swap Not Found</h2>
          <p className="text-muted-foreground">The swap you're looking for doesn't exist.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold mb-2">Swap Progress</h1>
          <p className="text-muted-foreground">
            Tracking your cross-chain swap in real-time
          </p>
        </motion.div>

        {/* Progress Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card mb-8"
        >
          <div className="p-6">
            <div className="space-y-6">
              {steps.map((step, index) => {
                const status = getStepStatus(index);
                const isLast = index === steps.length - 1;
                
                return (
                  <div key={step.id} className="flex items-start space-x-4">
                    <div className="flex flex-col items-center">
                      {getStepIcon(step, status)}
                      {!isLast && (
                        <div className={cn(
                          "w-0.5 h-8 mt-2",
                          status === 'completed' ? "bg-green-500" : "bg-muted"
                        )} />
                      )}
                    </div>
                    
                    <div className="flex-1 pt-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className={cn(
                            "font-medium",
                            status === 'completed' && "text-green-600",
                            status === 'active' && "text-blue-600"
                          )}>
                            {step.label}
                          </h3>
                          {status === 'active' && (
                            <p className="text-sm text-muted-foreground mt-1">
                              Processing...
                            </p>
                          )}
                        </div>
                        
                        {status === 'completed' && (
                          <span className="text-xs text-green-600 font-medium">
                            ✓ Complete
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Swap Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid md:grid-cols-2 gap-6 mb-8"
        >
          {/* Swap Information */}
          <div className="card">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Swap Details</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Swap ID</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-sm">{formatAddress(swap.id)}</span>
                    <button className="text-muted-foreground hover:text-foreground">
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Direction</span>
                  <span className="font-medium">
                    {swap.direction === 'eth_to_stellar' ? 'ETH → Stellar' : 'Stellar → ETH'}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-medium">{swap.amount} {swap.asset}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Receiver</span>
                  <span className="font-mono text-sm">{formatAddress(swap.receiver)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Status Information */}
          <div className="card">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Status</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current Status</span>
                  <span className={cn(
                    "badge",
                    swap.status === 'COMPLETED' && "badge-primary",
                    swap.status === 'ACTIVE' && "badge-secondary",
                    swap.status === 'REFUNDED' && "badge-outline"
                  )}>
                    {swap.status}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Time Remaining</span>
                  <span className="font-mono">{formatTime(timeRemaining)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fusion Status</span>
                  <span className="text-sm font-medium">{swap.fusionStatus || 'N/A'}</span>
                </div>
                
                {swap.fusionOrderHash && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Order Hash</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-sm">{formatAddress(swap.fusionOrderHash)}</span>
                      <button className="text-muted-foreground hover:text-foreground">
                        <ExternalLink className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => window.location.reload()}
            className="btn btn-outline flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh Status</span>
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push('/history')}
            className="btn btn-primary flex items-center space-x-2"
          >
            <span>View History</span>
            <ArrowRight className="h-4 w-4" />
          </motion.button>
        </motion.div>

        {/* Completion Message */}
        <AnimatePresence>
          {currentStep >= steps.length && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="card mt-8 bg-green-50 border-green-200"
            >
              <div className="p-6 text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-green-800 mb-2">
                  Swap Completed Successfully!
                </h3>
                <p className="text-green-700">
                  Your cross-chain swap has been completed. The funds have been transferred to the receiver.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
} 