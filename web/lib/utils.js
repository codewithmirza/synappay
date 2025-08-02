import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import TokenIcon from '../components/TokenIcon';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatAddress(address, start = 6, end = 4) {
  if (!address) return '';
  return `${address.slice(0, start)}...${address.slice(-end)}`;
}

export function formatAmount(amount, decimals = 6) {
  if (!amount) return '0';
  return parseFloat(amount).toFixed(decimals);
}

function getAssetIcon(asset, size = 24) {
  // Return the TokenIcon component instead of emoji
  return <TokenIcon symbol={asset} size={size} />;
}

// For cases where you need just the emoji fallback
function getAssetEmoji(asset) {
  const icons = {
    ETH: '🔷',
    XLM: '⭐',
    USDC: '💵',
    USDT: '💵',
    DAI: '💵',
  };
  return icons[asset] || '🪙';
}

export function getStatusColor(status) {
  const colors = {
    ACTIVE: 'text-blue-600',
    COMPLETED: 'text-green-600',
    REFUNDED: 'text-red-600',
    EXPIRED: 'text-gray-600',
    PENDING: 'text-yellow-600',
  };
  return colors[status] || 'text-gray-600';
}

export function getStatusBadge(status) {
  const badges = {
    ACTIVE: 'bg-blue-100 text-blue-800',
    COMPLETED: 'bg-green-100 text-green-800',
    REFUNDED: 'bg-red-100 text-red-800',
    EXPIRED: 'bg-gray-100 text-gray-800',
    PENDING: 'bg-yellow-100 text-yellow-800',
  };
  return badges[status] || 'bg-gray-100 text-gray-800';
}

// Global modal prevention utility
export class ModalPreventionManager {
  static instance = null;
  
  constructor() {
    this.isPreventing = false;
    this.preventionTimeout = null;
  }
  
  static getInstance() {
    if (!ModalPreventionManager.instance) {
      ModalPreventionManager.instance = new ModalPreventionManager();
    }
    return ModalPreventionManager.instance;
  }
  
  preventModals(duration = 2000) {
    this.isPreventing = true;
    
    // Clear existing timeout
    if (this.preventionTimeout) {
      clearTimeout(this.preventionTimeout);
    }
    
    // Set new timeout
    this.preventionTimeout = setTimeout(() => {
      this.isPreventing = false;
    }, duration);
    
    console.log(`Modal prevention active for ${duration}ms`);
  }
  
  isModalPrevented() {
    return this.isPreventing;
  }
  
  clearPrevention() {
    this.isPreventing = false;
    if (this.preventionTimeout) {
      clearTimeout(this.preventionTimeout);
      this.preventionTimeout = null;
    }
  }
}

// Global instance
export const modalPrevention = ModalPreventionManager.getInstance(); 