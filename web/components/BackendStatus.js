// Backend Status Component - Shows connection status to our services
import { useState, useEffect } from 'react';
import apiClient from '../lib/api-client';
import { useCoordinator } from '../hooks/use-coordinator';

export default function BackendStatus() {
  const [apiStatus, setApiStatus] = useState('checking');
  const [apiHealth, setApiHealth] = useState(null);
  const { isConnected: coordinatorConnected, connectionStatus } = useCoordinator();

  useEffect(() => {
    checkAPIStatus();
    
    // Check API status every 30 seconds
    const interval = setInterval(checkAPIStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkAPIStatus = async () => {
    try {
      setApiStatus('checking');
      const health = await apiClient.healthCheck();
      setApiHealth(health);
      setApiStatus(health.status === 'healthy' ? 'healthy' : 'unhealthy');
    } catch (error) {
      setApiStatus('error');
      setApiHealth({ error: error.message });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy':
      case 'connected':
        return 'text-green-500';
      case 'checking':
      case 'connecting':
        return 'text-yellow-500';
      case 'error':
      case 'disconnected':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy':
      case 'connected':
        return '✅';
      case 'checking':
      case 'connecting':
        return '🔄';
      case 'error':
      case 'disconnected':
        return '❌';
      default:
        return '⚪';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 border border-gray-200 dark:border-gray-700 min-w-[280px]">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
        Backend Status
      </h3>
      
      <div className="space-y-2">
        {/* API Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-300">
            Cloudflare API
          </span>
          <div className="flex items-center space-x-2">
            <span className={`text-sm font-medium ${getStatusColor(apiStatus)}`}>
              {apiStatus}
            </span>
            <span>{getStatusIcon(apiStatus)}</span>
          </div>
        </div>

        {/* Coordinator Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-300">
            Railway Coordinator
          </span>
          <div className="flex items-center space-x-2">
            <span className={`text-sm font-medium ${getStatusColor(connectionStatus)}`}>
              {connectionStatus}
            </span>
            <span>{getStatusIcon(connectionStatus)}</span>
          </div>
        </div>

        {/* API URL */}
        <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            API: {process.env.NEXT_PUBLIC_SYNAPPAY_API_URL?.replace('https://', '')}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            WS: {process.env.NEXT_PUBLIC_COORDINATOR_WS_URL?.replace('wss://', '')}
          </div>
        </div>

        {/* Health Details */}
        {apiHealth && (
          <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
            <details className="text-xs">
              <summary className="cursor-pointer text-gray-500 dark:text-gray-400">
                Details
              </summary>
              <pre className="mt-1 text-xs text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-2 rounded overflow-auto max-h-20">
                {JSON.stringify(apiHealth, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}