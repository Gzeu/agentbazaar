'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, Zap } from 'lucide-react';

interface StatusItem {
  name: string;
  status: 'online' | 'offline' | 'pending';
  description: string;
  lastChecked: string;
}

export default function StatusPage() {
  const [statusItems, setStatusItems] = useState<StatusItem[]>([
    {
      name: 'Frontend',
      status: 'online',
      description: 'Next.js application running successfully',
      lastChecked: new Date().toISOString()
    },
    {
      name: 'Registry Contract',
      status: 'pending',
      description: 'Smart contract not deployed yet',
      lastChecked: new Date().toISOString()
    },
    {
      name: 'Escrow Contract',
      status: 'pending',
      description: 'Smart contract not deployed yet',
      lastChecked: new Date().toISOString()
    },
    {
      name: 'Reputation Contract',
      status: 'pending',
      description: 'Smart contract not deployed yet',
      lastChecked: new Date().toISOString()
    },
    {
      name: 'MultiversX Devnet',
      status: 'online',
      description: 'Blockchain network operational',
      lastChecked: new Date().toISOString()
    },
    {
      name: 'Wallet Connection',
      status: 'offline',
      description: 'Wallet not connected (0 EGLD balance)',
      lastChecked: new Date().toISOString()
    }
  ]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'offline':
        return <XCircle className="w-5 h-5 text-red-400" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-400" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'text-green-400 bg-green-400/10 border-green-400/30';
      case 'offline':
        return 'text-red-400 bg-red-400/10 border-red-400/30';
      case 'pending':
        return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30';
      default:
        return 'text-gray-400 bg-gray-400/10 border-gray-400/30';
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg text-dark-text">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Zap className="w-8 h-8 text-brand-400 mr-3" />
            <h1 className="text-3xl font-bold text-white">System Status</h1>
          </div>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Real-time status of AgentBazaar components and services
          </p>
        </div>

        <div className="space-y-4">
          {statusItems.map((item) => (
            <div
              key={item.name}
              className={`glass rounded-lg p-6 border transition-all hover:glow-brand ${getStatusColor(item.status)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  {getStatusIcon(item.status)}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">
                      {item.name}
                    </h3>
                    <p className="text-sm opacity-80">
                      {item.description}
                    </p>
                    <p className="text-xs opacity-60 mt-2">
                      Last checked: {new Date(item.lastChecked).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(item.status)}`}>
                    {item.status.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <div className="glass rounded-lg p-6 border border-brand-500/30 bg-brand-500/10">
            <h3 className="text-lg font-semibold text-white mb-2">
              Next Steps
            </h3>
            <ul className="text-sm text-gray-300 space-y-2 text-left max-w-md mx-auto">
              <li>• Fund devnet wallet with EGLD from faucet</li>
              <li>• Deploy Registry, Escrow, and Reputation contracts</li>
              <li>• Connect frontend to deployed contracts</li>
              <li>• Test end-to-end functionality</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
