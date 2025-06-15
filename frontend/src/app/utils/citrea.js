'use client';

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { ethers } from 'ethers';
import PropTypes from 'prop-types';

// Citrea testnet configuration
const CITREA_RPC = 'https://rpc.testnet.citrea.xyz';
const FAUCET_URL = 'https://citrea.xyz/faucet';

// Create context
const CitreaContext = createContext();

export const CitreaProvider = ({ children }) => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  
  // Initialize provider
  const initProvider = useCallback(async () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        const web3Provider = new ethers.BrowserProvider(window.ethereum);
        setProvider(web3Provider);
        
        // Check if connected
        const accounts = await web3Provider.listAccounts();
        if (accounts.length > 0) {
          setAccount(accounts[0].address);
          const signer = await web3Provider.getSigner();
          setSigner(signer);
          setIsConnected(true);
        }
      } catch (error) {
        console.error('Error initializing provider:', error);
      }
    }
  }, []);
  
  // Connect wallet
  const connectWallet = useCallback(async () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ 
          method: 'eth_requestAccounts' 
        });
        
        const web3Provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await web3Provider.getSigner();
        
        setProvider(web3Provider);
        setSigner(signer);
        setAccount(accounts[0]);
        setIsConnected(true);
        
        return true;
      } catch (error) {
        console.error('Error connecting wallet:', error);
        return false;
      }
    } else {
      alert('Please install MetaMask to use this application!');
      return false;
    }
  }, []);
  
  // Request testnet BTC
  const requestTestnetBTC = useCallback(async () => {
    if (!account) return false;
    
    try {
      const response = await fetch(FAUCET_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ address: account })
      });
      
      const data = await response.json();
      return data.success || false;
    } catch (error) {
      console.error('Faucet request failed:', error);
      return false;
    }
  }, [account]);
  
  // Initialize on mount
  useEffect(() => {
    initProvider();
    
    // Handle account changes
    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        // Disconnected
        setAccount('');
        setIsConnected(false);
      } else {
        setAccount(accounts[0]);
      }
    };
    
    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      
      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      };
    }
  }, [initProvider]);

  // Memoize context value
  const contextValue = useMemo(() => ({
    provider,
    signer,
    account,
    isConnected,
    connectWallet,
    requestTestnetBTC
  }), [provider, signer, account, isConnected, connectWallet, requestTestnetBTC]);

  return (
    <CitreaContext.Provider value={contextValue}>
      {children}
    </CitreaContext.Provider>
  );
};

CitreaProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export const useCitrea = () => {
  const context = useContext(CitreaContext);
  if (!context) {
    throw new Error('useCitrea must be used within a CitreaProvider');
  }
  return context;
};