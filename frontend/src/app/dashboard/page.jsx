'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCitrea } from '../contexts/CitreaContext';
import Dashboard from '../components/Dashboard';
import '../globals.css';

export default function DashboardPage() {
  const { account } = useCitrea();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!account) {
      router.push('/');
    } else {
      // Simulate loading data
      setTimeout(() => setLoading(false), 1000);
    }
  }, [account, router]);

  if (!account) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Redirecting to homepage...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white pt-4 pb-16">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-orange-700 mb-4 md:mb-0">My Stacking Circles</h1>
          <button 
            onClick={() => router.push('/')}
            className="flex justify-center btn-primary px-6 py-3 text-lg"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Create New Circle
          </button>
        </div>
        
        {loading ? (
          <div className="text-center py-12">
            <p className="text-lg">Loading your circles...</p>
            <div className="mt-4 w-12 h-12 border-t-2 border-orange-500 border-solid rounded-full animate-spin mx-auto"></div>
          </div>
        ) : (
          <Dashboard />
        )}
      </div>
    </div>
  );
}