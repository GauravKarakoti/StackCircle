'use client';

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { ethers } from 'ethers';
import PropTypes from 'prop-types';
import toast from 'react-hot-toast';

const CitreaContext = createContext();

export const CitreaProvider = ({ children }) => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState('');
  const [circleFactory, setCircleFactory] = useState(null);
  const [btcOracle, setBtcOracle] = useState(null);
  const [isRequesting, setIsRequesting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  
  // Citrea testnet configuration
  const FACTORY_ADDRESS = '0x019D3735b55cA4385660A3CE08e6Ba8e1C68640e'; 
  const BTC_ORACLE_ADDRESS = '0x751cE5d771Fac1dA6D44Ad00cCba49f312d8A322'; 
  
  // Initialize provider and contracts
  const init = useCallback(async () => {
    if (typeof window === 'undefined' || !window.ethereum) return;
    
    try {
      // Ethers v6: BrowserProvider instead of providers.Web3Provider
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      setProvider(web3Provider);
      
      // Get signer asynchronously
      const signer = await web3Provider.getSigner();
      setSigner(signer);
      
      // Create contract instances with signer
      const factory = new ethers.Contract(
        FACTORY_ADDRESS,
        ['function createCircle(string,uint256,uint256,uint256)'],
        signer
      );
      setCircleFactory(factory);
      
      const oracle = new ethers.Contract(
        BTC_ORACLE_ADDRESS,
        ['function verifyTimestamp(uint256) returns(uint256)'],
        signer
      );
      setBtcOracle(oracle);
      
      // Get current account if connected
      const accounts = await web3Provider.listAccounts();
      if (accounts.length > 0) {
        setAccount(accounts[0].address);
      }
    } catch (error) {
      console.error('Failed to initialize Citrea context:', error);
    }
  }, []);
  
  // Connect wallet
  const connectWallet = useCallback(async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      alert('Please install MetaMask to use this application!');
      return;
    }
    
    try {
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      setAccount(accounts[0]);
      await init();
    } catch (error) {
      console.error('Wallet connection failed:', error);
    }
  }, [init]);

  const resetWallet = useCallback(() => {
    setAccount('');
    setSigner(null);
    setCircleFactory(null);
    setBtcOracle(null);
    setIsConnected(false);
    
    // Clear local storage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('walletConnected');
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    resetWallet();
    
    // Notify user
    toast.success('Wallet disconnected');
    
    // Redirect to home page
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  }, [resetWallet]);
  
  // Create new circle
  const createCircle = useCallback(async (name, goal, amount, period) => {
    if (!circleFactory) {
      throw new Error('Circle factory contract not initialized');
    }
    
    const tx = await circleFactory.createCircle(
      name,
      ethers.parseEther(goal.toString()), // v6: parseEther instead of utils.parseEther
      ethers.parseEther(amount.toString()),
      period
    );
    await tx.wait();
    return tx.hash;
  }, [circleFactory]);

  const requestTestnetBTC = useCallback(async () => {
    setIsRequesting(true);
    
    if (!account) {
      toast.error('Please connect wallet first');
      setIsRequesting(false);
      return false;
    }
    
    try {
      const response = await fetch('/api/faucet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ address: account })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(data.message || 'Test BTC sent to your account!');
        return true;
      } else {
        toast.error(data.error || 'Failed to request test BTC');
        return false;
      }
    } catch (error) {
      toast.error('Network error - please try again');
      console.log(error);
      return false;
    } finally {
      setIsRequesting(false);
    }
  }, [account]);
  
  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        setAccount(accounts[0] || '');
      };
      
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      
      // Initialize if already connected
      if (window.ethereum.selectedAddress) {
        init();
      }
      
      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      };
    }
  }, [init]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    provider,
    signer,
    account,
    connectWallet,
    createCircle,
    requestTestnetBTC,
    disconnectWallet,
    isRequesting,
    btcOracle
  }), [provider, signer, account, connectWallet, createCircle, requestTestnetBTC, isRequesting, disconnectWallet, btcOracle]);

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