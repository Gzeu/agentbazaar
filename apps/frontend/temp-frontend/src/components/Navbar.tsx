'use client';

import { useState } from 'react';
import { Search, Wallet, Menu, X } from 'lucide-react';

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  return (
    <nav className="sticky top-0 z-50 glass border-b border-dark-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-white">
              Agent<span className="text-brand-400">Bazaar</span>
            </h1>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="/" className="text-gray-300 hover:text-white transition-colors">
              Marketplace
            </a>
            <a href="/status" className="text-gray-300 hover:text-white transition-colors">
              Status
            </a>
            <a href="#services" className="text-gray-300 hover:text-white transition-colors">
              Services
            </a>
            <a href="#tasks" className="text-gray-300 hover:text-white transition-colors">
              Tasks
            </a>
            <a href="#dashboard" className="text-gray-300 hover:text-white transition-colors">
              Dashboard
            </a>
          </div>

          {/* Wallet Connect */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsConnected(!isConnected)}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium transition-colors"
            >
              <Wallet size={16} />
              <span>{isConnected ? '0x1234...5678' : 'Connect Wallet'}</span>
            </button>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white transition-colors"
            >
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 space-y-2 border-t border-dark-border">
            <a href="#marketplace" className="block px-3 py-2 text-gray-300 hover:text-white transition-colors">
              Marketplace
            </a>
            <a href="#services" className="block px-3 py-2 text-gray-300 hover:text-white transition-colors">
              Services
            </a>
            <a href="#tasks" className="block px-3 py-2 text-gray-300 hover:text-white transition-colors">
              Tasks
            </a>
            <a href="#dashboard" className="block px-3 py-2 text-gray-300 hover:text-white transition-colors">
              Dashboard
            </a>
          </div>
        )}
      </div>
    </nav>
  );
}
