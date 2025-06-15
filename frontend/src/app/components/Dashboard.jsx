import { useState, useEffect } from 'react';
import { useCitrea } from '../contexts/CitreaContext';
import StreakVisual from './StreakVisual';
import * as d3 from 'd3';
import '../globals.css';

const Dashboard = () => {
  const { account } = useCitrea();
  const [circles, setCircles] = useState([]);
  const [loading, setLoading] = useState(true);
  const { contract } = useCitrea();

  useEffect(() => {
    if (!account) return;
    
    // Fetch user's circles from contract
    const fetchCircles = async () => {
      setLoading(true);
      contract.getCirclesForMember(account)
      setTimeout(() => {
        setCircles([
          {
            id: 1,
            name: 'Family Savings',
            goal: 0.5,
            saved: 0.15,
            members: 4,
            streak: 3
          },
          {
            id: 2,
            name: 'Turkey Relief Fund',
            goal: 1.0,
            saved: 0.32,
            members: 12,
            streak: 5
          }
        ]);
        setLoading(false);
      }, 1000);
    };
    
    fetchCircles();
  }, [account]);
  
  // Render progress chart
  useEffect(() => {
    if (circles.length > 0) {
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
  }, [circles]);
  
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
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-orange-600 mb-6">Your Stacking Circles</h2>
      
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
            <button className="mt-4 w-full bg-orange-500 hover:bg-orange-600 text-white py-2 rounded">
              Make Contribution
            </button>
          </div>
        ))}
      </div>
      
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-xl font-semibold mb-4">Savings Progress</h3>
        <svg id="progress-chart" width="100%" height="200"></svg>
      </div>
    </div>
  );
};

export default Dashboard;