import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from '../lib/reown-config';
// import swapService from '../lib/swap-service-new';
import { useEffect } from 'react';
import '../styles/globals.css';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App({ Component, pageProps }) {
  // Initialize swap service on app start
  useEffect(() => {
    const initializeServices = async () => {
      console.log('🚀 Initializing SynapPay services...');
      
      try {
        // Test API connection directly
        const apiResponse = await fetch('https://synappay-api.blockable.workers.dev/health');
        const apiHealth = await apiResponse.json();
        console.log('✅ API Health Check:', apiHealth);
        
        // Test Coordinator connection
        const coordinatorResponse = await fetch('https://synappay-production.up.railway.app/health');
        const coordinatorHealth = await coordinatorResponse.json();
        console.log('✅ Coordinator Health Check:', coordinatorHealth);
        
        // Test WebSocket connection
        console.log('🔗 Testing WebSocket connection...');
        const ws = new WebSocket('wss://synappay-production.up.railway.app');
        
        ws.onopen = () => {
          console.log('✅ WebSocket connected successfully!');
          ws.close();
        };
        
        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          console.log('📨 WebSocket message received:', data);
        };
        
        ws.onerror = (error) => {
          console.error('❌ WebSocket connection failed:', error);
        };
        
        console.log('✅ SynapPay backend services are healthy!');
      } catch (error) {
        console.error('❌ Failed to connect to backend services:', error);
      }
    };

    initializeServices();
  }, []);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <Component {...pageProps} />
      </QueryClientProvider>
    </WagmiProvider>
  );
} 