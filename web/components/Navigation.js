'use client';

import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { Home, ArrowUpDown, History, BarChart3 } from 'lucide-react';

import { walletConnectionService } from '../lib/wallet-connection-service';

const navigationItems = [
  { href: '/', label: 'Home', icon: Home, requiresWallets: false },
  { href: '/swap', label: 'Swap', icon: ArrowUpDown, requiresWallets: true },
  { href: '/history', label: 'History', icon: History, requiresWallets: true }
];

export default function Navigation() {
  const router = useRouter();
  const walletStatus = walletConnectionService.getStatus();
  const bothConnected = walletStatus.bothConnected;

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 p-2"
      >
        <div className="flex items-center space-x-2">
          {navigationItems.map((item) => {
            const isActive = router.pathname === item.href;
            const Icon = item.icon;
            const isDisabled = item.requiresWallets && !bothConnected;
            
            return (
              <button
                key={item.href}
                onClick={() => {
                  if (!isDisabled) {
                    router.push(item.href);
                  }
                }}
                disabled={isDisabled}
                className={`
                  flex items-center space-x-2 px-4 py-2 rounded-xl transition-all
                  ${isDisabled 
                    ? 'text-gray-400 cursor-not-allowed opacity-50' 
                    : isActive 
                      ? 'bg-black text-white shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}