import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Meta Tags */}
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <meta name="theme-color" content="#6366f1" />
        <meta name="description" content="Cross-chain swaps between Ethereum and Stellar using 1inch Fusion+. Swap ETH ↔ XLM with HTLC security and partial fills." />
        <meta name="keywords" content="cross-chain, swap, ethereum, stellar, 1inch, fusion, htlc, defi, crypto" />
        <meta name="author" content="SynapPay" />
        
        {/* Open Graph */}
        <meta property="og:title" content="SynapPay - Cross-Chain Swaps" />
        <meta property="og:description" content="Cross-chain swaps between Ethereum and Stellar using 1inch Fusion+" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.synappay.com" />
        <meta property="og:image" content="https://www.synappay.com/icons/icon-512.png" />
        <meta property="og:site_name" content="SynapPay" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="SynapPay - Cross-Chain Swaps" />
        <meta name="twitter:description" content="Cross-chain swaps between Ethereum and Stellar using 1inch Fusion+" />
        <meta name="twitter:image" content="https://www.synappay.com/icons/icon-512.png" />
        
        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-180.png" />
        
        {/* Manifest */}
        <link rel="manifest" href="/manifest.json" />
        
        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* DNS Prefetch */}
        <link rel="dns-prefetch" href="//api.1inch.dev" />
        <link rel="dns-prefetch" href="//horizon-testnet.stellar.org" />
        
        {/* PWA */}
        <meta name="application-name" content="SynapPay" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="SynapPay" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#6366f1" />
        <meta name="msapplication-tap-highlight" content="no" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
} 