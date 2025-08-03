'use client';

import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { Home, ArrowUpDown, History, BarChart3 } from 'lucide-react';

const navigationItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/swap', label: 'Swap', icon: ArrowUpDown },
  { href: '/history', label: 'History', icon: History },
  { href: '/progress', label: 'Progress', icon: BarChart3 }
];

export default function Navigation() {
  const router = useRouter();

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
            
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className={`
                  flex items-center space-x-2 px-4 py-2 rounded-xl transition-all
                  ${isActive 
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