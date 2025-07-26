'use client';

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { ethers } from 'ethers';
import PropTypes from 'prop-types';
import toast from 'react-hot-toast';
import '../globals.css';
import axios from 'axios';

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
  const FACTORY_ADDRESS = '0xf3d5FA40A7aB6EC0fdaA26C9dB9245AAF22617f7'; 
  const BTC_ORACLE_ADDRESS = '0xFFE48e98EF520C451538706dbD603532C390aA11'; 
  
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
        [
          'function createCircle(string,uint256,uint256,uint256)',
          'function getCirclesForMember(address) returns (uint256[])',
          'function getCircleMembers(uint256) returns (address[])',
          'function circleExists(uint256) returns (bool)',
          'function getCircle(uint256) returns ((address,address,address,string,uint256,uint256,uint256,uint256,uint256))',
          'function createProposal(uint256, uint8, string ,string ,uint256, address)',
          'function inviteMember(uint256, address)'
        ],
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

  const createProposal = useCallback(async (circleId, proposalData) => {
    if (!circleFactory) throw new Error("Contract not initialized"); // Changed from contract to circleFactory
    
    // Convert proposal data to contract format
    const { title, description, type, amount, recipient } = proposalData;
    console.log("Creating proposal with data");
    
    // Execute contract call
    const tx = await circleFactory.createProposal( // Changed from contract to circleFactory
      circleId,
      type === 'WITHDRAWAL' ? 0 : type === 'DONATION' ? 1 : 2,
      title,
      description,
      ethers.parseEther(amount.toString()),
      recipient
    );
    console.log("Creating proposal transaction:", tx);
    
    await tx.wait();
    console.log("Proposal created successfully:", tx.hash);
    return tx.hash;
  }, [circleFactory]);

  const contributeToCircle = useCallback(async (engineAddress, amount) => {
    if (!signer) throw new Error("No signer available");
    
    const contributionEngine = new ethers.Contract(
      engineAddress,
      [
        "function contribute() payable",
        "function contributionAmount() view returns (uint256)"
      ],
      signer
    );

    // Verify contribution amount matches required
    const requiredAmount = await contributionEngine.contributionAmount();
    if (ethers.parseEther(amount.toString()) !== requiredAmount) {
      throw new Error(`Contribution amount must be exactly ${ethers.formatEther(requiredAmount)} ETH`);
    }

    const tx = await contributionEngine.contribute({ 
      value: ethers.parseEther(amount.toString())
    });
    await tx.wait();
    
    return tx.hash;
  }, [signer]);

  const fetchProposals = useCallback(async (governanceAddress, proposalIds) => {
    if (!provider) return [];

    const governanceAbi = [
      "function getProposal(uint256) view returns (uint256, uint8, string, string, uint256, address, uint256, uint256, uint256, bool)"
    ];
    const governanceContract = new ethers.Contract(governanceAddress, governanceAbi, provider);
    
    const proposals = await Promise.all(
      proposalIds.map(async (id) => {
        const p = await governanceContract.getProposal(id);
        // p[1] comes back as a BigInt/BigNumber; convert it to a JS number
        const kind = Number(p[1]);
        let typeLabel;
        switch (kind) {
          case 0:
            typeLabel = 'WITHDRAWAL';
            break;
          case 1:
            typeLabel = 'DONATION';
            break;
          default:
            typeLabel = 'PARAM_CHANGE';
        }

        return {
          id: p[0].toString(),
          type: typeLabel,
          title: p[2],
          description: p[3],
          amount: Number(ethers.formatEther(p[4])),
          recipient: p[5],
          deadline: Number(p[6]),
          votesFor: Number(p[7]),
          votesAgainst: Number(p[8]),
          executed: p[9]
        };
      })
    );
    return proposals;
  }, [provider]);

  const inviteMember = useCallback(async (circleId, memberAddress) => {
    if (!circleFactory) throw new Error("Contract not initialized");
    
    try {
      // The logic is now a simple, direct call to the factory contract
      const tx = await circleFactory.inviteMember(circleId, memberAddress);
      await tx.wait();
      
      return tx.hash;
    } catch (error) {
      console.error("Failed to invite member:", error);
      // This will now pass a more useful error message to the toast notification
      throw error;
    }
  }, [circleFactory, signer]);

  const voteOnProposal = useCallback(async (governanceAddress, proposalId, support) => {
    if (!provider || !signer) throw new Error("Not connected");
    
    const governanceAbi = [
      "function vote(uint256, bool)"
    ];
    const governanceContract = new ethers.Contract(governanceAddress, governanceAbi, signer);
    
    const tx = await governanceContract.vote(proposalId, support);
    await tx.wait();
    
    return tx.hash;
  }, [provider, signer]);
  
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
  
  const createCircle = useCallback(async (name, goal, amount, period) => {
    if (!account) { // 'account' is the connected user's address
      throw new Error('Wallet not connected');
    }

    try {
      // Call your new backend API endpoint
      const response = await axios.post('/api/create-circle', { 
        name,
        goal,
        amount,
        period,
        circleOwner: account // Pass the user's address to the backend
      });

      if (response.data.success) {
        toast.success(response.data.message);
        return response.data.txHash;
      } else {
        throw new Error(response.data.error || 'Failed to create circle.');
      }
    } catch (error) {
      console.error('API call to create circle failed:', error);
      // Re-throw the error so the component can catch it
      throw error;
    }
  }, [account]);

  const requestTestnetBTC = useCallback(async () => {
    setIsRequesting(true);
    
    if (!account) {
      toast.error('Please connect wallet first');
      setIsRequesting(false);
      return false;
    }
    
    try {
      const response = await axios.post('/api/faucet', { 
        address: account 
      });
      
      if (response.data.success) {
        toast.success(response.data.message || 'Test BTC sent to your account!');
        return true;
      } else {
        toast.error(response.data.error || 'Failed to request test BTC');
        return false;
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || 
                          error.message || 
                          'Network error - please try again';
      toast.error(errorMessage);
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
    createProposal,
    fetchProposals,
    voteOnProposal,
    contributeToCircle,
    inviteMember,
    isRequesting,
    contract: circleFactory,
    btcOracle
  }), [provider, signer, account, connectWallet, createCircle, requestTestnetBTC, isRequesting, disconnectWallet, createProposal, fetchProposals, voteOnProposal, inviteMember, contributeToCircle, circleFactory, btcOracle]);

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