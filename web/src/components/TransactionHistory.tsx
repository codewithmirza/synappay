import React from 'react';

interface TransactionHistoryProps {
  ethAddress: string;
  stellarAddress: string;
}

export default function TransactionHistory({ ethAddress, stellarAddress }: TransactionHistoryProps) {
  return (
    <div className="swap-card-border">
      <div className="swap-card-bg p-6 rounded-xl">
        <h2 className="text-2xl font-bold mb-6 text-center">
          <span className="page-title-gradient">Transaction History</span>
        </h2>
        
        <div className="text-center text-gray-400">
          <p>Transaction history implementation coming soon...</p>
          <p className="text-sm mt-2">
            ETH Address: {ethAddress ? `${ethAddress.substring(0, 6)}...${ethAddress.substring(ethAddress.length - 4)}` : 'Not connected'}
          </p>
          <p className="text-sm">
            Stellar Address: {stellarAddress ? `${stellarAddress.substring(0, 6)}...${stellarAddress.substring(stellarAddress.length - 4)}` : 'Not connected'}
          </p>
        </div>
      </div>
    </div>
  );
} 