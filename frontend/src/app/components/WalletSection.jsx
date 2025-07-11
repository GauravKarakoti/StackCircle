'use client';

import { useState, useEffect } from 'react';
import { useCitrea } from '../contexts/CitreaContext';

export default function WalletSection() {
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