'use client';

import { useMemo } from 'react';
import StreakVisual from './StreakVisual'; // 1. Imported the component

const CircleCard = ({ circle, onViewDetails }) => {

  // Memoize the progress percentage to prevent flickering
  const progressPercentage = useMemo(() => {
    if (!circle.goal || circle.goal === 0) {
      return 0;
    }
    const percentage = (circle.saved / circle.goal) * 100;
    return Math.min(percentage, 100); // Cap at 100%
  }, [circle.saved, circle.goal]);

  // Memoize the stroke-dashoffset calculation for the progress ring
  const strokeDashoffset = useMemo(() => {
    const circumference = 2 * Math.PI * 40; // 2 * pi * radius
    return circumference * (1 - progressPercentage / 100);
  }, [progressPercentage]);

  return (
    <div className="card-gradient transition-transform hover:scale-[1.02] hover:shadow-lg flex flex-col justify-between p-6">
      <div>
        <div className="flex justify-between items-start">
          <h3 className="text-xl font-bold mb-2 text-orange-700">{circle.name}</h3>
          <div className="badge badge-primary">
            {Number(circle.members)} members
          </div>
        </div>
        <div className="relative progress-ring my-4">
          <svg className="w-full h-full" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              className="text-orange-100 stroke-current"
              strokeWidth="8"
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
            />
            {/* Progress circle */}
            <circle
              className="text-orange-500 stroke-current"
              strokeWidth="8"
              strokeLinecap="round"
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
              strokeDasharray={2 * Math.PI * 40}
              strokeDashoffset={strokeDashoffset}
              transform="rotate(-90 50 50)"
              style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-orange-800">
              {progressPercentage.toFixed(0)}%
            </span>
            <span className="text-xs text-gray-500">Progress</span>
          </div>
        </div>

        <div className="flex justify-between mt-4 text-sm">
          <div>
            <p className="text-gray-600">Saved</p>
            <p className="font-medium">{circle.saved.toFixed(4)} BTC</p>
          </div>
          <div className="text-right">
            <p className="text-gray-600">Goal</p>
            <p className="font-medium">{circle.goal.toFixed(2)} BTC</p>
          </div>
        </div>

        {/* 2. Added the StreakVisual component here */}
        <div className="mt-4">
            <p className="text-gray-600 text-sm mb-1">Contribution Streak</p>
            <StreakVisual streak={Number(circle.streak)} />
        </div>
      </div>
      
      <button
        onClick={() => onViewDetails(circle)}
        className="btn-primary mt-6 w-full py-3"
      >
        View Circle Details
      </button>
    </div>
  );
};

export default CircleCard;