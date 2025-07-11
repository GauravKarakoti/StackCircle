import { useState, useEffect } from 'react';
import { useCitrea } from '../contexts/CitreaContext';
import StreakVisual from './StreakVisual';
import BadgeDisplay from './BadgeDisplay';
import Governance from './Governance';
import ReminderSubscription from './ReminderSubscription';
import * as d3 from 'd3';
import '../globals.css';

const Dashboard = () => {
  const [circles, setCircles] = useState([]);
  const [loading, setLoading] = useState(true);
  const { account, contract } = useCitrea();
  const [activeCircle, setActiveCircle] = useState(null);
  const [badges, setBadges] = useState([1, 3]);

  useEffect(() => {
    if (!account || !contract) return;
    
    // Fetch user's circles from contract
    const fetchCircles = async () => {
      setLoading(true);
      try {
        if (contract.getCirclesForMember) {
          // Get circle IDs for the current account
          const circleIds = await contract.getCirclesForMember(account);
          
          // Create mock circles based on the retrieved IDs
          const mockCircles = circleIds.map((id, index) => {
            const circleId = Number(id); // Convert BigNumber to number
            
            return {
              id: circleId,
              name: `Circle ${index + 1}`,
              goal: (index + 1) * 0.5, // Dynamic goal based on index
              saved: (index + 1) * 0.15, // Dynamic saved amount
              members: 4 + index * 2, // Dynamic member count
              streak: 3 + index, // Dynamic streak
              proposals: circleId % 2 === 0 ? [] : [ // Alternate proposals
                {
                  id: 1,
                  title: "Donate 10% to Charity",
                  description: "Proposal to donate 10% of funds to Bitcoin developers",
                  type: "DONATION",
                  votesFor: 15,
                  votesAgainst: 2,
                  deadline: Date.now() + 86400000 // 1 day from now
                }
              ]
            };
          });
          
          setCircles(mockCircles);
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
  }, [account, contract]);
  
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
        .attr('y', d => y(d.saved / d.goal))
        .attr('width', x.bandwidth())
        .attr('height', d => height - margin.bottom - y(d.saved / d.goal))
        .attr('fill', '#F97316');
      
      // Add labels
      svg.selectAll('text')
        .data(circles)
        .enter()
        .append('text')
        .text(d => `${Math.round((d.saved / d.goal) * 100)}%`)
        .attr('x', d => x(d.name) + x.bandwidth() / 2)
        .attr('y', d => y(d.saved / d.goal) - 5)
        .attr('text-anchor', 'middle')
        .attr('fill', 'black');
    }
  }, [circles, activeCircle]);
  
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {circles.map(circle => (
          <div key={circle.id} className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-xl font-semibold mb-2">{circle.name}</h3>
            <div className="flex justify-between mb-3">
              <span>Goal: {circle.goal} BTC</span>
              <span>Saved: {circle.saved} BTC</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
              <div 
                className="bg-orange-600 h-2.5 rounded-full" 
                style={{ width: `${(circle.saved / circle.goal) * 100}%` }}
              ></div>
            </div>
            <div className="flex justify-between">
              <div>
                <span className="text-sm text-gray-600">Members</span>
                <p className="font-bold">{circle.members}</p>
              </div>
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
              className="mt-4 w-full bg-orange-500 hover:bg-orange-600 text-white py-2 rounded"
            >
              View Circle Details
            </button>
          </div>
        ))}
      </div>
      
      {activeCircle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold text-orange-600">{activeCircle.name}</h3>
                <button 
                  onClick={() => setActiveCircle(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  &times;
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-orange-50 rounded-lg p-4">
                  <h4 className="font-bold mb-2">Savings Progress</h4>
                  <p className="text-3xl font-bold text-orange-600">
                    {(activeCircle.saved / activeCircle.goal * 100).toFixed(1)}%
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                    <div 
                      className="bg-orange-600 h-2.5 rounded-full" 
                      style={{ width: `${(activeCircle.saved / activeCircle.goal) * 100}%` }}
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
              
              {/* Badge Display - Full View */}
              <BadgeDisplay badges={badges} />
              
              {/* Governance Component */}
              <Governance circleId={activeCircle.id} proposals={activeCircle.proposals} />
              
              {/* Reminder Subscription */}
              <ReminderSubscription />

              <div className="mt-6 flex space-x-4">
                <button className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded">
                  Make Contribution
                </button>
                <button className="flex-1 bg-orange-100 hover:bg-orange-200 text-orange-700 font-bold py-3 rounded">
                  Invite Members
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-xl font-semibold mb-4">Savings Progress</h3>
        <svg id="progress-chart" width="100%" height="200"></svg>
      </div>
    </div>
  );
};

export default Dashboard;