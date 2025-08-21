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
import CircleCard from './CircleCard';

const Dashboard = () => {
  const [circles, setCircles] = useState([]);
  const [loading, setLoading] = useState(true);
  const { account, contract, provider, fetchProposals, contributeToCircle, addMember } = useCitrea();
  const [activeCircle, setActiveCircle] = useState(null);
  const [badges, setBadges] = useState([]);
  const [isContributing, setIsContributing] = useState(false);
  const [memberAddress, setMemberAddress] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const BADGE_SYSTEM_ADDRESS = "0x9c7Dc71187A5005619c58E63C267e1B6D2B7C5d4";

  useEffect(() => {
    if (!account || !contract) return;
    
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
          const circleIds = Array.isArray(resultProxy[0])
            ? resultProxy[0]
            : [ resultProxy[0] ];
          console.log('Decoded circle IDs:', circleIds);
          
          const onchainCircles = await Promise.all(
            circleIds.map(async (id) => {
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
              
              // 1. Kick off the “transaction” and grab the encoded calldata
              const membersTxResponse = await contract.getCircleMembers(id);
              console.log('Raw members tx response:', membersTxResponse);

              // txResponse.data is the ABI‑encoded call payload for getCircleMembers(uint256)
              const membersCallData = membersTxResponse.data;
              console.log('Members call data:', membersCallData);

              // 2. Do a low‑level eth_call using that exact calldata
              const rawMembersReturn = await provider.call({
                  to: contract.target,
                  data: membersCallData,
              });

              // 3. Decode the returned bytes with the same ABI
              //    decodeFunctionResult returns an array matching the function’s outputs
              // FIXED: Used 'getCircleMembers' instead of 'getCirclesForMember' to correctly decode the member addresses.
              const membersResultProxy = contract.interface.decodeFunctionResult(
                'getCircleMembers', 
                rawMembersReturn
              );
              const memberAddresses = Array.isArray(membersResultProxy[0])
                ? membersResultProxy[0]
                : [ membersResultProxy[0] ];
              console.log('Decoded member addresses:', memberAddresses);

              const engineAddress = circleData[0];
              const engineContract = new ethers.Contract(
                engineAddress,
                ['function contributionAmount() view returns (uint256)'],
                provider
              );
              const contributionAmountWei = await engineContract.contributionAmount();
              const contributionAmount = Number(ethers.formatEther(contributionAmountWei));
              const governance = circleData[2];
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
                saved: Number(ethers.formatEther(circleData[8])),
                memberCount: circleData[6],
                memberAddresses: memberAddresses,
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
        setCircles([]); // Set to empty on error to avoid showing stale or mock data
      } finally {
        setLoading(false);
      }
    };
    
    fetchCircles();
  }, [account, contract, provider, fetchProposals]);

  useEffect(() => {
    if (!account || !provider || !activeCircle) return;
    const fetchBadges = async () => {
      try {
        const badgeContract = new ethers.Contract(
          BADGE_SYSTEM_ADDRESS,
          ['function hasBadge(address, uint256, uint256) view returns (bool)'],
          provider
        );
        
        const badgeIds = [1, 2, 3];
        const userBadges = await Promise.all(
          badgeIds.map(id => 
            badgeContract.hasBadge(account, activeCircle.id, id)
          )
        );
        
        setBadges(
          badgeIds.filter((_, i) => userBadges[i])
        );
      } catch (error) {
        console.error("Error fetching badges:", error);
      }
    };
    
    fetchBadges();
  }, [activeCircle, account, provider]);
  
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
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
          Manage Members
        </button>
      </div>
    </div>
  );

  const MembersTab = () => (
    <div className="space-y-6">
      <div className="bg-orange-50 rounded-lg p-4">
        <h4 className="font-bold mb-4">Circle Members ({activeCircle.memberAddresses.length})</h4>
        <div className="space-y-3">
          {activeCircle.memberAddresses.map((address, i) => (
            <div key={i} className="flex items-center p-3 bg-white rounded-lg shadow-sm">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center mr-3">
                <span className="text-orange-500 font-bold">{i + 1}</span>
              </div>
              <div>
                <p className="font-medium text-sm break-all">{address}</p>
                {/* Add a check to ensure address is a string before calling toLowerCase */}
                {typeof address === 'string' && address.toLowerCase() === account.toLowerCase() && (
                  <span className="text-xs text-green-600 font-semibold">(You)</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-orange-50 rounded-lg p-4">
        <h4 className="font-bold mb-2">Add New Member</h4>
        <div className="flex space-x-2">
          <input
            type="text"
            value={memberAddress}
            onChange={(e) => setMemberAddress(e.target.value)}
            placeholder="Enter member's address (0x...)"
            className="flex-1 border border-orange-300 rounded px-3 py-2"
          />
          <button
            onClick={handleAddMember}
            disabled={isInviting}
            className={`${
              isInviting 
                ? 'bg-orange-300 cursor-not-allowed' 
                : 'bg-orange-500 hover:bg-orange-600'
            } text-white font-bold py-2 px-4 rounded`}
          >
            {isInviting ? 'Adding...' : 'Add Member'}
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

  const handleAddMember = async () => {
    if (!memberAddress || !ethers.isAddress(memberAddress)) {
      toast.error('Please enter a valid Ethereum address');
      return;
    }

    setIsInviting(true);
    try {
      await addMember(Number(activeCircle.id), memberAddress);
      toast.success(`Successfully added ${memberAddress}!`);
      
      const newMember = memberAddress;
      setActiveCircle(prev => ({
        ...prev,
        memberCount: Number(prev.memberCount) + 1,
        memberAddresses: [...prev.memberAddresses, newMember]
      }));
      setCircles(prevCircles => prevCircles.map(c => 
        c.id === activeCircle.id 
          ? { ...c, memberCount: Number(c.memberCount) + 1, memberAddresses: [...c.memberAddresses, newMember] } 
          : c
      ));
      
      setMemberAddress('');
    } catch (error) {
      toast.error(`Failed to add member: ${error.message}`);
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
      
      toast.promise(
        provider.waitForTransaction(txHash),
        {
          loading: 'Processing transaction...',
          success: <b>Contribution successful!</b>,
          error: <b>Transaction failed</b>,
        }
      );
      
      const newSaved = activeCircle.saved + activeCircle.contributionAmount;
      setActiveCircle(prev => ({...prev, saved: newSaved}));
      
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
    <div className="max-w-6xl mx-auto">       
      {circles.length === 0 ? (
        <div className="text-center py-12 card-gradient">
          <h3 className="text-xl font-semibold text-orange-800">No Circles Found</h3>
          <p className="text-orange-600 mt-2">You haven't joined or created any stacking circles yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {circles.map(circle => (
            <CircleCard 
              key={circle.id} 
              circle={circle} 
              onViewDetails={setActiveCircle} 
            />
          ))}
        </div>
      )}
      
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