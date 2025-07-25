import { useState, useEffect } from 'react';
import { useCitrea } from '../contexts/CitreaContext';
import StreakVisual from './StreakVisual';
import BadgeDisplay from './BadgeDisplay';
import Governance from './Governance';
import ReminderSubscription from './ReminderSubscription';
import * as d3 from 'd3';
import '../globals.css';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const [circles, setCircles] = useState([]);
  const [loading, setLoading] = useState(true);
  const { account, contract, provider, fetchProposals, contributeToCircle, inviteMember } = useCitrea();
  const [activeCircle, setActiveCircle] = useState(null);
  const [badges, setBadges] = useState([1, 3]);
  const [isContributing, setIsContributing] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [memberAddress, setMemberAddress] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!account || !contract) return;
    
    // Fetch user's circles from contract
    const fetchCircles = async () => {
      setLoading(true);
      try {
        if (contract.getCirclesForMember) {
          // 1. Kick off the “transaction” and grab the encoded calldata
          const txResponse = await contract.getCirclesForMember(account);
          console.log('Raw tx response:', txResponse);

          // txResponse.data is the ABI‑encoded call payload for getCirclesForMember(address)
          const callData = txResponse.data;
          console.log('Call data:', callData);

          // 2. Do a low‑level eth_call using that exact calldata
          const rawReturn = await provider.call({
            to: contract.target,
            data: callData,
          });

          // 3. Decode the returned bytes with the same ABI
          //    decodeFunctionResult returns an array matching the function’s outputs
          const resultProxy = contract.interface.decodeFunctionResult(
            'getCirclesForMember',
            rawReturn
          );
          const bigNumberArray = Array.isArray(resultProxy[0])
            ? resultProxy[0]
            : [ resultProxy[0] ];
          console.log('Decoded circle IDs:', bigNumberArray);
          
          const onchainCircles = await Promise.all(
            bigNumberArray.map(async (id) => {
              const circleCalldata = contract.interface.encodeFunctionData(
                'getCircle',
                [ id ]
              );
              console.log(`Fetching circle ${id} with calldata:`, circleCalldata);

              const rawCircle = await provider.call({
                to: contract.target,
                data: circleCalldata
              });
              console.log(`Raw circle data for ${id}:`, rawCircle);

              const fn = contract.interface.getFunction('getCircle(uint256)');
              const tuple = contract.interface.decodeFunctionResult(fn, rawCircle);
              const circleData = tuple[0];
              console.log(`Circle ${id} data:`, circleData);
              const engineAddress = circleData[0];
              const engineContract = new ethers.Contract(
                engineAddress,
                ['function contributionAmount() view returns (uint256)'],
                provider
              );
              const contributionAmountWei = await engineContract.contributionAmount();
              const contributionAmount = Number(ethers.formatEther(contributionAmountWei));
              const governance = circleData[2];
              console.log(`Circle ${id} governance address:`, governance);
              const governanceContract = new ethers.Contract(
                governance,
                ["function proposalCount() view returns (uint256)"],
                provider
              );
              const proposalCount = await governanceContract.proposalCount();
              const proposalIds = Array.from({length: Number(proposalCount)}, (_, i) => i + 1);
              
              const proposals = proposalCount > 0 
                ? await fetchProposals(governance, proposalIds)
                : [];
              return {
                id,
                name: circleData[3],
                goal: Number(ethers.formatEther(circleData[4])), 
                saved: Number(circleData[8])/1000000000000000000,                
                members: circleData[6],            
                streak: circleData[7],               
                governance,
                engineAddress, 
                contributionAmount,
                proposals
              };
            })
          );
          setCircles(onchainCircles);
        } else {
          console.error("getCirclesForMember method not found on contract");
          setCircles([]);
        }
      } catch (error) {
        console.error("Failed to fetch circles:", error);
        // Fallback to mock data if contract call fails
        setCircles([
          {
            id: 1,
            name: 'Family Savings',
            goal: 0.5,
            saved: 0.15,
            members: 4,
            streak: 3,
            proposals: [
              {
                id: 1,
                title: "Donate 10% to Charity",
                description: "Proposal to donate 10% of funds to Bitcoin developers",
                type: "DONATION",
                votesFor: 15,
                votesAgainst: 2,
                deadline: Date.now() + 86400000
              }
            ]
          },
          {
            id: 2,
            name: 'Turkey Relief Fund',
            goal: 1.0,
            saved: 0.32,
            members: 12,
            streak: 5,
            proposals: []
          }
        ]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCircles();
  }, [account, contract, fetchProposals]);
  
  // Render progress chart
  useEffect(() => {
    if (circles.length > 0 && !activeCircle) {
      const svg = d3.select('#progress-chart');
      svg.selectAll('*').remove();
      
      const width = 300;
      const height = 200;
      const margin = { top: 20, right: 20, bottom: 30, left: 40 };
      
      const x = d3.scaleBand()
        .domain(circles.map(d => d.name))
        .range([margin.left, width - margin.right])
        .padding(0.1);
      
      const y = d3.scaleLinear()
        .domain([0, 1])
        .range([height - margin.bottom, margin.top]);
      
      // Draw bars
      svg.selectAll('rect')
        .data(circles)
        .enter()
        .append('rect')
        .attr('x', d => x(d.name))
        .attr('y', d => {
          const ratio = d.goal > 0 ? Math.min(1, d.saved / d.goal) : 0;
          return y(ratio);
        })
        .attr('width', x.bandwidth())
        .attr('height', d => {
          const ratio = d.goal > 0 ? Math.min(1, d.saved / d.goal) : 0;
          return height - margin.bottom - y(ratio);
        })
        .attr('fill', '#F97316');
      
      // Add labels
      svg.selectAll('text')
        .data(circles)
        .enter()
        .append('text')
        .text(d => {
          if (d.goal <= 0) return '0%';
          return `${Math.round((d.saved / d.goal) * 100)}%`;
        })
        .attr('x', d => x(d.name) + x.bandwidth() / 2)
        .attr('y', d => {
          const ratio = d.goal > 0 ? Math.min(1, d.saved / d.goal) : 0;
          return y(ratio) - 5;
        })
        .attr('text-anchor', 'middle')
        .attr('fill', 'black');
    }
  }, [circles, activeCircle]);

  const OverviewTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-orange-50 rounded-lg p-4">
          <h4 className="font-bold mb-2">Savings Progress</h4>
          <p className="text-3xl font-bold text-orange-600">
            {(activeCircle.saved / activeCircle.goal * 100).toFixed(1)}%
          </p>
          <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
            <div 
              className="bg-orange-600 h-2.5 rounded-full" 
              style={{ 
                width: `${Math.min(100, (activeCircle.saved / activeCircle.goal) * 100)}%` 
              }}
            ></div>
          </div>
          <p className="mt-2">
            <span className="font-medium">{activeCircle.saved} BTC</span> of 
            <span className="font-medium"> {activeCircle.goal} BTC</span>
          </p>
        </div>
        
        <div className="bg-orange-50 rounded-lg p-4">
          <h4 className="font-bold mb-2">Your Contribution Streak</h4>
          <div className="flex items-center">
            <StreakVisual streak={activeCircle.streak} />
            <span className="ml-2 text-xl font-bold">{activeCircle.streak} days</span>
          </div>
          <p className="mt-2 text-sm">
            Maintain your streak to earn special badges and rewards!
          </p>
        </div>
      </div>
      
      <BadgeDisplay badges={badges} />
      <ReminderSubscription circleId={Number(activeCircle.id)} />
      
      <div className="flex space-x-4">
        <button 
          onClick={handleContribution}
          disabled={isContributing}
          className={`flex-1 ${
            isContributing 
              ? 'bg-orange-300 cursor-not-allowed' 
              : 'bg-orange-500 hover:bg-orange-600'
          } text-white font-bold py-3 rounded flex items-center justify-center`}
        >
          {isContributing ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </>
          ) : (
            `Make Contribution (${activeCircle.contributionAmount} BTC)`
          )}
        </button>
        <button 
          onClick={() => setActiveTab('members')}
          className="flex-1 bg-orange-100 hover:bg-orange-200 text-orange-700 font-bold py-3 rounded"
        >
          Invite Members
        </button>
      </div>
    </div>
  );

  const MembersTab = () => (
    <div className="space-y-6">
      <div className="bg-orange-50 rounded-lg p-4">
        <h4 className="font-bold mb-4">Circle Members</h4>
        <div className="space-y-3">
          {[...Array(Number(activeCircle.members))].map((_, i) => (
            <div key={i} className="flex items-center p-3 bg-white rounded-lg shadow-sm">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center mr-3">
                <span className="text-orange-500 font-bold">{i + 1}</span>
              </div>
              <div>
                <p className="font-medium">Member {i + 1}</p>
                <p className="text-sm text-gray-500">Active participant</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-orange-50 rounded-lg p-4">
        <h4 className="font-bold mb-2">Invite New Member</h4>
        <div className="flex space-x-2">
          <input
            type="text"
            value={memberAddress}
            onChange={(e) => setMemberAddress(e.target.value)}
            placeholder="Enter member's address (0x...)"
            className="flex-1 border border-orange-300 rounded px-3 py-2"
          />
          <button
            onClick={handleInviteMember}
            disabled={isInviting}
            className={`${
              isInviting 
                ? 'bg-orange-300 cursor-not-allowed' 
                : 'bg-orange-500 hover:bg-orange-600'
            } text-white font-bold py-2 px-4 rounded`}
          >
            {isInviting ? 'Sending...' : 'Send Invite'}
          </button>
        </div>
      </div>
    </div>
  );

  const GovernanceTab = () => (
    <div>
      <Governance 
        circleId={activeCircle.id} 
        governanceAddress={activeCircle.governance}
        proposals={activeCircle.proposals}
        updateProposals={updateProposals}
      />
    </div>
  );

  const updateProposals = (circleId, newProposals) => {
    setCircles(prev => prev.map(circle => 
      circle.id === circleId ? {...circle, proposals: newProposals} : circle
    ));
    
    if (activeCircle?.id === circleId) {
      setActiveCircle(prev => ({...prev, proposals: newProposals}));
    }
  };

  const handleInviteMember = async () => {
    if (!memberAddress || !ethers.isAddress(memberAddress)) {
      toast.error('Please enter a valid Ethereum address');
      return;
    }

    setIsInviting(true);
    try {
      await inviteMember(Number(activeCircle.id), memberAddress);
      toast.success(`Successfully invited ${memberAddress}!`);
      
      // Reset form
      setMemberAddress('');
      setShowInviteForm(false);
    } catch (error) {
      toast.error(`Failed to invite member: ${error.message}`);
    } finally {
      setIsInviting(false);
    }
  };

  const handleContribution = async () => {
    if (!activeCircle?.engineAddress) return;
    
    setIsContributing(true);
    try {
      const txHash = await contributeToCircle(
        activeCircle.engineAddress, 
        activeCircle.contributionAmount
      );
      
      // Show transaction status
      toast.promise(
        provider.waitForTransaction(txHash),
        {
          loading: 'Processing transaction...',
          success: <b>Contribution successful!</b>,
          error: <b>Transaction failed</b>,
        }
      );
      
      // Update UI optimistically
      const newSaved = activeCircle.saved + activeCircle.contributionAmount;
      setActiveCircle(prev => ({...prev, saved: newSaved}));
      
      // Update circles list
      setTimeout(() => {
        setCircles(prev => prev.map(circle => 
          circle.id === activeCircle.id ? 
            {...circle, saved: circle.saved + activeCircle.contributionAmount} : 
            circle
        ));
      }, 3000);
    } catch (error) {
      toast.error(`Contribution failed: ${error.message}`);
      console.error(error);
    } finally {
      setIsContributing(false);
    }
  };
  
  if (!account) {
    return (
      <div className="text-center py-10">
        <p className="text-lg">Connect your wallet to view your Stacking Circles</p>
      </div>
    );
  }
  
  if (loading) {
    return (
      <div className="text-center py-10">
        <p className="text-lg">Loading your circles...</p>
        <div className="mt-4 w-12 h-12 border-t-2 border-orange-500 border-solid rounded-full animate-spin mx-auto"></div>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto">      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {circles.map(circle => (
          <div key={circle.id} className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-2xl p-6 border-2 border-orange-100 shadow-md transition-transform hover:scale-[1.02]">
            <div className="flex justify-between items-start">
              <h3 className="text-xl font-bold mb-2 text-orange-700">{circle.name}</h3>
              <div className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
                {circle.members} members
              </div>
            </div>
            <div className="relative my-4 w-32 h-32 mx-auto">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle 
                  className="text-orange-100 stroke-current" 
                  strokeWidth="8" 
                  cx="50" 
                  cy="50" 
                  r="40" 
                  fill="transparent" 
                />
                <circle 
                  className="text-orange-500  stroke-current" 
                  strokeWidth="8" 
                  strokeLinecap="round"
                  cx="50" 
                  cy="50" 
                  r="40" 
                  fill="transparent" 
                  strokeDasharray="251.2"
                  strokeDashoffset={251.2 * (1 - circle.saved/circle.goal)}
                  transform="rotate(-90 50 50)"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold">
                  {Math.round((circle.saved/circle.goal)*100)}%
                </span>
                <span className="text-xs text-gray-500">Progress</span>
              </div>
            </div>

            <div className="flex justify-between mt-4">
              <div>
                <p className="text-gray-600 text-sm">Goal</p>
                <p className="font-medium">{circle.goal} BTC</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Saved</p>
                <p className="font-medium">{circle.saved} BTC</p>
              </div>
            </div>
            <div className="flex justify-between">
              <div>
                <span className="text-sm text-gray-600">Your Streak</span>
                <StreakVisual streak={circle.streak} />
              </div>
            </div>

            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-600 mb-1">Your Badges</h4>
              <div className="flex space-x-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-orange-400 to-yellow-400 flex items-center justify-center">
                  <span className="text-white text-xs">🔥</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-orange-400 to-yellow-400 flex items-center justify-center">
                  <span className="text-white text-xs">🏛️</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-400 text-xs">⭐</span>
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => setActiveCircle(circle)}
              className="mt-4 w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white py-2 rounded-lg shadow-md transition-all"
            >
              View Circle Details
            </button>
          </div>
        ))}
      </div>
      
      {activeCircle && (
        <div className="bg-opacity-50 fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 sticky top-0 bg-white z-10 p-4 border-b">
              <h2 className="text-2xl font-bold text-orange-600">{activeCircle.name}</h2>
              <button 
                onClick={() => {
                  setActiveCircle(null)
                  setActiveTab('overview');
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                &times;
              </button>
            </div>

            <div className="border-b">
              <div className="flex -mb-px px-4">
                <button 
                  className={`py-3 px-4 font-medium border-b-2 ${
                    activeTab === 'overview' 
                      ? 'border-orange-500 text-orange-500' 
                      : 'border-transparent text-gray-500 hover:text-orange-500'
                  }`}
                  onClick={() => setActiveTab('overview')}
                >
                  Overview
                </button>
                <button 
                  className={`py-3 px-4 font-medium border-b-2 ${
                    activeTab === 'members' 
                      ? 'border-orange-500 text-orange-500' 
                      : 'border-transparent text-gray-500 hover:text-orange-500'
                  }`}
                  onClick={() => setActiveTab('members')}
                >
                  Members
                </button>
                <button 
                  className={`py-3 px-4 font-medium border-b-2 ${
                    activeTab === 'governance' 
                      ? 'border-orange-500 text-orange-500' 
                      : 'border-transparent text-gray-500 hover:text-orange-500'
                  }`}
                  onClick={() => setActiveTab('governance')}
                >
                  Governance
                </button>
              </div>
            </div>

            <div className="p-4">
              {activeTab === 'overview' && <OverviewTab />}
              {activeTab === 'members' && <MembersTab />}
              {activeTab === 'governance' && <GovernanceTab />}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;