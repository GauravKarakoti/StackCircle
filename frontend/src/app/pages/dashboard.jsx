import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
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
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-orange-600">My Stacking Circles</h1>
          <button 
            onClick={() => router.push('/')}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded"
          >
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