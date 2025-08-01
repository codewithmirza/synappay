import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from '../lib/wagmi-config';
import '../styles/globals.css';

// Create a client
const queryClient = new QueryClient();

// Suppress hydration warnings for external scripts
if (typeof window !== 'undefined') {
  // Suppress console warnings about hydration mismatches
  const originalError = console.error;
  console.error = (...args) => {
    if (args[0]?.includes?.('Warning: Extra attributes from the server')) {
      return; // Suppress hydration warnings
    }
    originalError.apply(console, args);
  };
}

export default function App({ Component, pageProps }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <Component {...pageProps} />
      </QueryClientProvider>
    </WagmiProvider>
  );
} 