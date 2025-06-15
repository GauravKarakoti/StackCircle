import { useState } from 'react';
import { useCitrea } from '../contexts/CitreaContext';
import '../globals.css';

const CircleWizard = () => {
  const { account, createCircle } = useCitrea();
  const [step, setStep] = useState(1);
  const [circleData, setCircleData] = useState({
    name: '',
    goal: 0.1,
    amount: 0.01,
    period: 7 // days
  });
  
  // Generate unique IDs for form elements
  const inputIds = {
    name: `circle-name-${Math.random().toString(36).substring(2, 9)}`,
    goal: `circle-goal-${Math.random().toString(36).substring(2, 9)}`,
    amount: `circle-amount-${Math.random().toString(36).substring(2, 9)}`,
    period: `circle-period-${Math.random().toString(36).substring(2, 9)}`
  };
  
  const handleChange = (e) => {
    setCircleData({
      ...circleData,
      [e.target.name]: e.target.value
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!account) return;
    
    try {
      await createCircle(
        circleData.name,
        circleData.goal,
        circleData.amount,
        circleData.period * 86400 // Convert days to seconds
      );
      setStep(3); // Success step
    } catch (error) {
      console.error('Circle creation failed:', error);
    }
  };
  
  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden p-6">
      {step === 1 && (
        <div className="text-center">
          <button 
            onClick={() => setStep(2)}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded"
          >
            Start Creating
          </button>
        </div>
      )}
      
      {step === 2 && (
        <form onSubmit={handleSubmit}>
          <h3 className="text-xl font-semibold mb-4">Circle Details</h3>
          
          <div className="mb-4">
            <label htmlFor={inputIds.name} className="block text-gray-700 mb-2">
              Circle Name
            </label>
            <input
              id={inputIds.name}
              type="text"
              name="name"
              value={circleData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded"
              required
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor={inputIds.goal} className="block text-gray-700 mb-2">
              Savings Goal (BTC)
            </label>
            <input
              id={inputIds.goal}
              type="number"
              name="goal"
              value={circleData.goal}
              onChange={handleChange}
              min="0.001"
              step="0.001"
              className="w-full px-3 py-2 border rounded"
              required
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor={inputIds.amount} className="block text-gray-700 mb-2">
              Contribution Amount (BTC)
            </label>
            <input
              id={inputIds.amount}
              type="number"
              name="amount"
              value={circleData.amount}
              onChange={handleChange}
              min="0.0001"
              step="0.0001"
              className="w-full px-3 py-2 border rounded"
              required
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor={inputIds.period} className="block text-gray-700 mb-2">
              Contribution Period (Days)
            </label>
            <select
              id={inputIds.period}
              name="period"
              value={circleData.period}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded"
            >
              <option value={7}>Weekly</option>
              <option value={14}>Bi-weekly</option>
              <option value={30}>Monthly</option>
            </select>
          </div>
          
          <button
            type="submit"
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded"
          >
            Create Circle
          </button>
        </form>
      )}
      
      {step === 3 && (
        <div className="text-center">
          <h3 className="text-xl font-semibold mb-4">Circle Created!</h3>
          <p className="mb-4">
            Your Stacking Circle <strong>{circleData.name}</strong> has been created on Citrea.
          </p>
          <button 
            onClick={() => setStep(1)}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded"
          >
            Create Another
          </button>
        </div>
      )}
    </div>
  );
};

export default CircleWizard;