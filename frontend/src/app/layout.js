'use client';

import Head from 'next/head';
import Link from 'next/link';
import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import { useCitrea, CitreaProvider } from './contexts/CitreaContext';
import './globals.css';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex flex-col">
          <CitreaProvider>
            <div className="min-h-screen flex flex-col">
              <Head>
                <title>StackCircle - Bitcoin Social Savings</title>
                <meta name="description" content="Save Bitcoin together with friends and communities" />
                <link rel="icon" href="/favicon.ico" />
              </Head>
              
              {/* Navigation Bar */}
              <header className="bg-gradient-to-r from-orange-500 to-orange-400 text-white shadow-lg">
                <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
                  <Link href="/" className="flex items-center space-x-3 group">
                    <div className="bg-white rounded-full p-1 shadow-lg ring-2 ring-orange-400 transition">
                      <div className="bg-orange-500 w-7 h-7 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">₿</span>
                      </div>
                    </div>
                    <span className="text-2xl font-extrabold tracking-tight group-hover:text-orange-100 transition">StackCircle</span>
                  </Link>
                  <WalletSection />
                </div>
              </header>
              
              {/* Main Content */}
              <main className="flex-grow">
                {children}
              </main>
              
              {/* Footer */}
              <footer className="bg-orange-50 py-8 text-center text-gray-600 border-t border-orange-100 mt-8">
                <div className="max-w-6xl mx-auto px-4">
                  <p className="mb-3 font-semibold text-orange-600">Built on Citrea — Bitcoin&apos;s First ZK Rollup</p>
                  <div className="flex justify-center space-x-8 mb-4">
                    <a href="https://docs.citrea.xyz" target="_blank" rel="noopener noreferrer" className="hover:text-orange-700 hover:underline flex items-center space-x-1">
                      <span>📄</span><span>Documentation</span>
                    </a>
                    <a href="https://github.com/GauravKarakoti" target="_blank" rel="noopener noreferrer" className="hover:text-orange-700 hover:underline flex items-center space-x-1">
                      <span>💻</span><span>GitHub</span>
                    </a>
                    <a href="https://discord.com/invite/citrea" target="_blank" rel="noopener noreferrer" className="hover:text-orange-700 hover:underline flex items-center space-x-1">
                      <span>💬</span><span>Support</span>
                    </a>
                  </div>
                  <p className="text-xs text-gray-400">© {new Date().getFullYear()} StackCircle. All rights reserved.</p>
                </div>
              </footer>
            </div>
          </CitreaProvider>
        </div>
      </body>
    </html>
  );
}

RootLayout.propTypes = {
  children: PropTypes.node.isRequired
};

function WalletSection() {
  const { account, connectWallet, requestTestnetBTC, isRequesting, disconnectWallet } = useCitrea();
  const [showDisconnect, setShowDisconnect] = useState(false);
  
  // Handle keyboard events for accessibility
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setShowDisconnect(!showDisconnect);
    } else if (e.key === 'Escape') {
      setShowDisconnect(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showDisconnect && !e.target.closest('.wallet-section')) {
        setShowDisconnect(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') setShowDisconnect(false);
    });
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', (e) => {
        if (e.key === 'Escape') setShowDisconnect(false);
      });
    };
  }, [showDisconnect]);

  return (
    <div className="wallet-section flex items-center space-x-4">
      {account ? (
        <div className="relative">
          <div className="flex items-center space-x-2">
            <button 
              onClick={requestTestnetBTC}
              disabled={isRequesting}
              className="bg-orange-600 hover:bg-orange-700 text-white text-sm py-1 px-3 rounded disabled:opacity-50"
              aria-label="Get test Bitcoin"
            >
              {isRequesting ? 'Processing...' : 'Get Test BTC'}
            </button>
            
            {/* Changed to button for accessibility */}
            <button 
              type="button"
              className="flex items-center bg-orange-600 rounded-full pl-3 pr-1 py-1 cursor-pointer hover:bg-orange-700 transition focus:outline-none focus:ring-2 focus:ring-orange-300"
              onClick={() => setShowDisconnect(!showDisconnect)}
              onKeyDown={handleKeyDown}
              aria-haspopup="true"
              aria-expanded={showDisconnect}
              aria-label="Account options"
            >
              <span className="text-xs mr-2 truncate max-w-[120px]">
                {account.substring(0, 6)}...{account.substring(account.length - 4)}
              </span>
              <div className="bg-orange-500 w-6 h-6 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xs">✓</span>
              </div>
            </button>
          </div>
          
          {/* Disconnect dropdown */}
          {showDisconnect && (
            <div 
              className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10"
              role="menu"
              aria-orientation="vertical"
              aria-labelledby="account-menu-button"
            >
              <button
                type="button"
                onClick={disconnectWallet}
                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 focus:outline-none focus:bg-red-50"
                role="menuitem"
                tabIndex={0}
              >
                Disconnect Wallet
              </button>
            </div>
          )}
        </div>
      ) : (
        <button 
          type="button"
          onClick={connectWallet}
          className="bg-orange-600 hover:bg-orange-700 text-white py-2 px-4 rounded shadow-md focus:outline-none focus:ring-2 focus:ring-orange-300 transition"
          aria-label="Connect wallet"
        >
          Connect Wallet
        </button>
      )}
    </div>
  );
}