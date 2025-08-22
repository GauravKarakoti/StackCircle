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
  const FACTORY_ADDRESS = '0x55459A91d6EBaBDf9ebab8BA418bc8c34A553445'; 
  const BTC_ORACLE_ADDRESS = '0x9243c3AaD6699df1D5b962876B2183e2413C096c'; 
  
  // Initialize provider and contracts
  const init = useCallback(async () => {
    if (typeof window === 'undefined' || !window.ethereum) return;
    
    try {
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      setProvider(web3Provider);
      
      const signer = await web3Provider.getSigner();
      setSigner(signer);
      
      const factory = new ethers.Contract(
        FACTORY_ADDRESS,
        [
          'function createCircle(string,uint256,uint256,uint256)',
          'function getCirclesForMember(address) returns (uint256[])',
          'function getCircleMembers(uint256) returns (address[])',
          'function circleExists(uint256) returns (bool)',
          'function getCircle(uint256) returns ((address,address,address,string,uint256,uint256,uint256,uint256,uint256))',
          'function createProposal(uint256, uint8, string ,string ,uint256, address)',
          'function addMember(uint256, address)'
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
      
      const accounts = await web3Provider.listAccounts();
      if (accounts.length > 0) {
        setAccount(accounts[0].address);
      }
    } catch (error) {
      console.error('Failed to initialize Citrea context:', error);
    }
  }, []);

  const createProposal = useCallback(async (circleId, proposalData) => {
    if (!circleFactory) throw new Error("Contract not initialized");
    console.log("Creating proposal for circle:", circleId, "with data:", proposalData);
    const { title, description, type, amount, recipient } = proposalData;
    
    const circleCalldata = circleFactory.interface.encodeFunctionData(
      'getCircle',
      [ circleId ]
    );
    console.log(`Fetching circle ${circleId} with calldata:`, circleCalldata);

    const rawCircle = await provider.call({
      to: circleFactory.target,
      data: circleCalldata
    });
    console.log(`Raw circle data for ${circleId}:`, rawCircle);

    const fn = circleFactory.interface.getFunction('getCircle(uint256)');
    const tuple = circleFactory.interface.decodeFunctionResult(fn, rawCircle);
    const circleInfo = tuple[0];
    console.log(`Circle ${circleId} data:`, circleInfo);
    const governanceAddress = await circleInfo[2];
    console.log("Governance address for circle:", governanceAddress);

    // Use the correct ABI for the governance contract.
    const governanceAbi = [
      "function createProposal(uint8, string, string, uint256, address)"
    ];
    const governanceContract = new ethers.Contract(governanceAddress, governanceAbi, signer);

    let proposalType;
    switch (type) {
      case 'WITHDRAWAL':
          proposalType = 0;
          break;
      case 'DONATION':
          proposalType = 1;
          break;
      case 'PARAM_CHANGE':
          proposalType = 2;
          break;
      default:
          throw new Error("Invalid proposal type");
    }

    try {
      console.log("Creating proposal with data");
      const tx = await governanceContract.createProposal(
          proposalType,
          title,
          description,
          ethers.parseEther(amount.toString()),
          recipient
      );

      console.log("Creating proposal transaction:", tx);
      await tx.wait();
      console.log("Proposal created successfully:", tx.hash);
      return tx.hash;
    } catch (error) {
      console.error("Failed to create proposal:", error);
      throw error;
    }
  }, [circleFactory, signer]);

  const contributeToCircle = useCallback(async (engineAddress) => {
    if (!signer) throw new Error("No signer available");
    
    const contributionEngine = new ethers.Contract(
        engineAddress,
        [
            "function contribute() payable",
            "function contributionAmount() view returns (uint256)"
        ],
        signer
    );

    // Fetch the required contribution amount directly from the contract
    const requiredAmount = await contributionEngine.contributionAmount();
    
    // Call the contribute function, sending the required amount as value
    const tx = await contributionEngine.contribute({ 
        value: requiredAmount // Use the value directly from the contract
    });
    
    await tx.wait();
    
    return tx.hash;
  }, [signer]);

  const fetchProposals = useCallback(async (governanceAddress, proposalIds) => {
    if (!provider) return [];

    // FIX: Updated ABI to include the new 'proposer' field
    const governanceAbi = [
      "function getProposal(uint256) view returns (uint256, uint8, string, string, uint256, address, address, uint256, uint256, uint256, bool)"
    ];
    const governanceContract = new ethers.Contract(governanceAddress, governanceAbi, provider);
    
    const proposals = await Promise.all(
      proposalIds.map(async (id) => {
        // FIX: The decoded values will be at new indices
        const p = await governanceContract.getProposal(id);
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
          proposer: p[6], // New field
          deadline: Number(p[7]),
          votesFor: Number(p[8]), // Votes for is now at index 8
          votesAgainst: Number(p[9]), // Votes against is now at index 9
          executed: p[10] // Executed is now at index 10
        };
      })
    );
    return proposals;
  }, [provider]);

  const addMember = useCallback(async (circleId, memberAddress) => {
    if (!circleFactory) throw new Error("Contract not initialized");
    
    try {
      const tx = await circleFactory.addMember(circleId, memberAddress);
      await tx.wait();
      
      return tx.hash;
    } catch (error) {
      console.error("Failed to add member:", error);
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
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('walletConnected');
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    resetWallet();
    toast.success('Wallet disconnected');
    
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  }, [resetWallet]);
  
  const createCircle = useCallback(async (name, goal, amount, period, isPremium) => {
    if (!account) {
        throw new Error('Wallet not connected');
    }

    try {
      const response = await axios.post('/api/create-circle', {
          name,
          goal,
          amount,
          period,
          circleOwner: account,
          isPremium // Pass the isPremium flag
      });

      if (response.data.success) {
          toast.success(response.data.message);
          return response.data.txHash;
      } else {
          throw new Error(response.data.error || 'Failed to create circle.');
      }
    } catch (error) {
      if (error.response?.status === 402) {
        toast.error('Insufficient funds for premium circle');
      } else {
        toast.error('Failed to create circle: ' + error.message);
      }
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
        const message = response.data.message || 'Test BTC sent to your account!';
        toast.success(message);
        
        // NEW: Show alert with transaction details
        alert(
          `✅ Test BTC Request Successful!\n\n` +
          `Amount: 0.1 cBTC\n` +
          `Recipient: ${account}\n` +
          `Transaction: ${response.data.txHash}\n\n` +
          `Please allow a few minutes for the transaction to be confirmed.`
        );
        
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
      
      if (window.ethereum.selectedAddress) {
        init();
      }
      
      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      };
    }
  }, [init]);

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
    addMember,
    isRequesting,
    contract: circleFactory,
    btcOracle
  }), [provider, signer, account, connectWallet, createCircle, requestTestnetBTC, isRequesting, disconnectWallet, createProposal, fetchProposals, voteOnProposal, addMember, contributeToCircle, circleFactory, btcOracle]);

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