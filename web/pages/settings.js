import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function Settings() {
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showHealthDetails, setShowHealthDetails] = useState(false);

  useEffect(() => {
    fetchSystemHealth();
    // Poll health status every 30 seconds
    const interval = setInterval(fetchSystemHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchSystemHealth = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/system-health');
      const data = await response.json();
      
      if (data.success) {
        setHealthData(data.health);
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch system health');
      }
    } catch (error) {
      setError('Network error while fetching system health');
      console.error('Error fetching system health:', error);
    } finally {
      setLoading(false);
    }
  };

  const getHealthColor = (status) => {
    switch (status) {
      case 'healthy': return 'bg-green-500';
      case 'degraded': return 'bg-yellow-500';
      case 'unhealthy': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getHealthText = (status) => {
    switch (status) {
      case 'healthy': return 'All Systems Operational';
      case 'degraded': return 'Some Issues Detected';
      case 'unhealthy': return 'System Issues';
      default: return 'Unknown Status';
    }
  };

  const getServiceStatus = (service) => {
    if (!service || service.status === 'error') {
      return { color: 'bg-red-500', text: 'Error', details: service?.error || 'Service unavailable' };
    }
    return { color: 'bg-green-500', text: 'Healthy', details: `${service.responseTime}ms` };
  };

  return (
    <div className="min-h-screen bg-[#f2f2f7] flex items-center justify-center p-4">
      <div className="bg-[#ffffff] rounded-[30px] shadow-[0px_4px_20px_0px_rgba(0,0,0,0.08)] p-6 md:p-8 max-w-[800px] w-full">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-semibold text-black mb-2">Settings & System Health</h1>
          <p className="text-gray-600">Monitor system status and configuration</p>
        </div>

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
                onClick={fetchSystemHealth}
                className="text-red-600 hover:text-red-800 font-medium"
              >
                Retry
              </button>
            </div>
          </motion.div>
        )}

        {/* Overall Health Status */}
        <div className="bg-gray-50 rounded-[20px] p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Overall System Health</h3>
            <button
              onClick={fetchSystemHealth}
              disabled={loading}
              className="text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
          
          {healthData ? (
            <div className="flex items-center gap-4">
              <div className={`w-4 h-4 rounded-full ${getHealthColor(healthData.overall)}`}></div>
              <div>
                <div className="font-medium">{getHealthText(healthData.overall)}</div>
                <div className="text-sm text-gray-600">Last updated: {new Date().toLocaleTimeString()}</div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <div className="w-4 h-4 bg-gray-300 rounded-full animate-pulse"></div>
              <div className="text-gray-600">Loading system status...</div>
            </div>
          )}
        </div>

        {/* Service Status */}
        <div className="bg-gray-50 rounded-[20px] p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Service Status</h3>
            <button
              onClick={() => setShowHealthDetails(!showHealthDetails)}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              {showHealthDetails ? 'Hide' : 'Show'} Details
            </button>
          </div>
          
          <div className="space-y-4">
            {healthData?.services ? (
              Object.entries(healthData.services).map(([serviceName, service]) => {
                const status = getServiceStatus(service);
                return (
                  <div key={serviceName} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${status.color}`}></div>
                      <span className="font-medium capitalize">{serviceName}</span>
                    </div>
                    <div className="text-sm text-gray-600">{status.text}</div>
                  </div>
                );
              })
            ) : (
              <div className="text-gray-600">Loading service status...</div>
            )}
          </div>

          {/* Detailed Health Information */}
          {showHealthDetails && healthData?.services && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6 pt-6 border-t border-gray-200"
            >
              <h4 className="font-medium mb-4">Detailed Information</h4>
              <div className="space-y-3">
                {Object.entries(healthData.services).map(([serviceName, service]) => {
                  const status = getServiceStatus(service);
                  return (
                    <div key={serviceName} className="bg-white rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium capitalize">{serviceName}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          status.color === 'bg-green-500' ? 'bg-green-100 text-green-800' :
                          status.color === 'bg-red-500' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {status.text}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        {status.details}
                      </div>
                      {service.error && (
                        <div className="text-sm text-red-600 mt-2">
                          Error: {service.error}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </div>

        {/* Configuration Options */}
        <div className="bg-gray-50 rounded-[20px] p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Configuration</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Auto-refresh</div>
                <div className="text-sm text-gray-600">Update status every 30 seconds</div>
              </div>
              <div className="w-12 h-6 bg-blue-500 rounded-full relative">
                <div className="w-4 h-4 bg-white rounded-full absolute right-1 top-1"></div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Notifications</div>
                <div className="text-sm text-gray-600">Get alerts for system issues</div>
              </div>
              <div className="w-12 h-6 bg-gray-300 rounded-full relative">
                <div className="w-4 h-4 bg-white rounded-full absolute left-1 top-1"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => window.location.href = '/help'}
            className="flex-1 bg-gray-200 text-gray-800 py-4 rounded-[20px] text-lg font-medium hover:bg-gray-300 transition-colors"
          >
            Help & Support
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