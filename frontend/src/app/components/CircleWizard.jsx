import { useState } from 'react';
import { useCitrea } from '../contexts/CitreaContext';
import '../globals.css';

const CircleWizard = () => {
  const { account, createCircle } = useCitrea();
  const [step, setStep] = useState(1);
  const [isCreating, setIsCreating] = useState(false);
  const [circleData, setCircleData] = useState({
    name: '',
    goal: 0.1,
    amount: 0.01,
    period: 7 // days
  });
  const [isPremium, setIsPremium] = useState(false);
  
  const inputIds = {
    name: `circle-name-${Math.random().toString(36).substring(2, 9)}`,
    goal: `circle-goal-${Math.random().toString(36).substring(2, 9)}`,
    amount: `circle-amount-${Math.random().toString(36).substring(2, 9)}`,
    period: `circle-period-${Math.random().toString(36).substring(2, 9)}`
  };

  const PREMIUM_BENEFITS = {
    analytics: "Advanced savings analytics",
    branding: "Custom circle branding",
    priority: "Priority support",
    integrations: "Third-party app integrations"
  };

  const PremiumInfo = () => (
    <div className="tooltip" data-tip="Premium benefits include advanced analytics, custom branding, and priority support">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
      </svg>
    </div>
  );
  
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
      setIsCreating(true);
      // THE FIX: Pass the 'isPremium' state to the createCircle function
      await createCircle(
        circleData.name,
        circleData.goal,
        circleData.amount,
        circleData.period * 86400, // Convert days to seconds
        isPremium
      );
      setStep(3);
    } catch (error) {
      console.error('Circle creation failed:', error);
    } finally {
      setIsCreating(false);
    }
  };
  
  return (
    <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl overflow-hidden p-8">
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
          <h3 className="text-2xl font-bold mb-6 text-orange-700">Circle Details</h3>
          
          <div className="mb-5">
            <label htmlFor={inputIds.name} className="input-label">
              Circle Name
            </label>
            <input
              id={inputIds.name}
              type="text"
              name="name"
              value={circleData.name}
              onChange={handleChange}
              className="input-field"
              required
              disabled={isCreating}
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
              disabled={isCreating}
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
              disabled={isCreating}
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
              disabled={isCreating}
            >
              <option value={7}>Weekly</option>
              <option value={14}>Bi-weekly</option>
              <option value={30}>Monthly</option>
            </select>
          </div>

          <div className="mb-4 flex items-center">
            <label className="flex items-center mt-4">
                <input
                    type="checkbox"
                    checked={isPremium}
                    onChange={(e) => setIsPremium(e.target.checked)}
                    className="mr-2"
                    disabled={isCreating}
                />
                <span>Premium Circle (0.01 BTC)</span>
                <PremiumInfo />
            </label>
          </div>

          {isPremium && (
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">
                Premium Fee (BTC)
              </label>
              <input
                type="number"
                name="fee"
                value={0.01}
                readOnly
                className="w-full px-3 py-2 border rounded bg-gray-100"
              />
              <p className="text-xs text-amber-600 mt-1">
                Includes: {Object.values(PREMIUM_BENEFITS).join(', ')}
              </p>
            </div>
          )}
          
          <button
            type="submit"
            className="btn-primary w-full py-3 text-lg flex justify-center items-center"
            disabled={isCreating}
          >
            {isCreating ? (
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : null}
            {isCreating ? 'Creating Circle...' : 'Create Circle'}
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
            onClick={() => {
              setStep(1);
              setCircleData({
                name: '',
                goal: 0.1,
                amount: 0.01,
                period: 7
              });
              setIsPremium(false); // Reset premium state as well
            }}
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