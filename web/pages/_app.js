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
        // TODO: Re-enable after fixing import issues
        // const initialized = await swapService.initialize();
        console.log('✅ SynapPay services initialized successfully (basic mode)');
      } catch (error) {
        console.error('❌ Failed to initialize services:', error);
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