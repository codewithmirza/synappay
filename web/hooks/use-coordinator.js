// Hook for connecting to SynapPay Coordinator WebSocket
import { useState, useEffect, useRef } from 'react';
import apiClient from '../lib/api-client';

export function useCoordinator() {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [lastMessage, setLastMessage] = useState(null);
  const [error, setError] = useState(null);
  const wsRef = useRef(null);

  useEffect(() => {
    // Connect to coordinator WebSocket
    const connectWebSocket = () => {
      setConnectionStatus('connecting');
      setError(null);

      wsRef.current = apiClient.connectToCoordinator({
        onOpen: () => {
          setIsConnected(true);
          setConnectionStatus('connected');
          setError(null);
          console.log('✅ Coordinator WebSocket connected');
        },
        
        onMessage: (data) => {
          setLastMessage(data);
          console.log('📨 Coordinator message:', data);
        },
        
        onClose: () => {
          setIsConnected(false);
          setConnectionStatus('disconnected');
          console.log('📡 Coordinator WebSocket disconnected');
          
          // Attempt to reconnect after 5 seconds
          setTimeout(() => {
            if (wsRef.current?.readyState === WebSocket.CLOSED) {
              connectWebSocket();
            }
          }, 5000);
        },
        
        onError: (error) => {
          setError(error);
          setConnectionStatus('error');
          console.error('❌ Coordinator WebSocket error:', error);
        }
      });
    };

    connectWebSocket();

    // Cleanup on unmount
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // Send message to coordinator
  const sendMessage = (message) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      return true;
    } else {
      console.warn('WebSocket not connected, cannot send message');
      return false;
    }
  };

  // Subscribe to swap updates
  const subscribeToSwap = (swapId) => {
    return sendMessage({
      type: 'subscribe_swap',
      swapId: swapId
    });
  };

  // Get coordinator status
  const getStatus = () => {
    return sendMessage({
      type: 'get_status'
    });
  };

  // Ping coordinator
  const ping = () => {
    return sendMessage({
      type: 'ping'
    });
  };

  return {
    isConnected,
    connectionStatus,
    lastMessage,
    error,
    sendMessage,
    subscribeToSwap,
    getStatus,
    ping
  };
}