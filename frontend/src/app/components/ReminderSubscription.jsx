import { useState } from 'react';

const ReminderSubscription = () => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [reminderSettings, setReminderSettings] = useState({
    contribution: true,
    proposal: true,
    streak: true,
    frequency: 'daily'
  });

  const handleSubscription = async () => {
    try {
      // Push Protocol integration
      if (window.ethereum && window.ethereum.isPushEnabled) {
        await window.ethereum.push.enable();
        setIsSubscribed(true);
        alert('Reminders enabled successfully!');
      } else {
        alert('Push notifications not available - using email reminders');
        setIsSubscribed(true);
      }
    } catch (error) {
      console.error('Reminder enablement failed:', error);
      alert('Failed to enable reminders. Please try again.');
    }
  };

  const handleSettingChange = (setting) => {
    setReminderSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  return (
    <div className="mt-6 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl p-6 border border-orange-200">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div className="mb-4 md:mb-0">
          <h4 className="font-bold text-lg">Contribution Reminders</h4>
          <p className="text-gray-600 max-w-md">
            Get notified about important circle events and never miss a contribution deadline
          </p>
        </div>
        
        {!isSubscribed ? (
          <button
            onClick={handleSubscription}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
            </svg>
            Enable Reminders
          </button>
        ) : (
          <div className="bg-green-100 text-green-800 px-4 py-2 rounded-full flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Reminders Active
          </div>
        )}
      </div>
      
      {isSubscribed && (
        <div className="mt-4 pt-4 border-t border-orange-200">
          <h5 className="font-medium mb-3">Notification Settings</h5>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center">
              <label className="flex items-center cursor-pointer">
                <div className="relative">
                  <input 
                    type="checkbox" 
                    className="sr-only" 
                    checked={reminderSettings.contribution}
                    onChange={() => handleSettingChange('contribution')}
                  />
                  <div className={`block w-10 h-6 rounded-full ${
                    reminderSettings.contribution ? 'bg-orange-500' : 'bg-gray-300'
                  }`}></div>
                  <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${
                    reminderSettings.contribution ? 'transform translate-x-4' : ''
                  }`}></div>
                </div>
                <span className="ml-3 text-gray-700">Contribution Deadlines</span>
              </label>
            </div>
            
            <div className="flex items-center">
              <label className="flex items-center cursor-pointer">
                <div className="relative">
                  <input 
                    type="checkbox" 
                    className="sr-only" 
                    checked={reminderSettings.proposal}
                    onChange={() => handleSettingChange('proposal')}
                  />
                  <div className={`block w-10 h-6 rounded-full ${
                    reminderSettings.proposal ? 'bg-orange-500' : 'bg-gray-300'
                  }`}></div>
                  <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${
                    reminderSettings.proposal ? 'transform translate-x-4' : ''
                  }`}></div>
                </div>
                <span className="ml-3 text-gray-700">Voting Deadlines</span>
              </label>
            </div>
            
            <div className="flex items-center">
              <label className="flex items-center cursor-pointer">
                <div className="relative">
                  <input 
                    type="checkbox" 
                    className="sr-only" 
                    checked={reminderSettings.streak}
                    onChange={() => handleSettingChange('streak')}
                  />
                  <div className={`block w-10 h-6 rounded-full ${
                    reminderSettings.streak ? 'bg-orange-500' : 'bg-gray-300'
                  }`}></div>
                  <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${
                    reminderSettings.streak ? 'transform translate-x-4' : ''
                  }`}></div>
                </div>
                <span className="ml-3 text-gray-700">Streak Milestones</span>
              </label>
            </div>
            
            <div className="flex items-center">
              <label className="flex items-center">
                <span className="text-gray-700 mr-3">Frequency:</span>
                <select
                  value={reminderSettings.frequency}
                  onChange={(e) => setReminderSettings(prev => ({
                    ...prev,
                    frequency: e.target.value
                  }))}
                  className="border rounded px-3 py-1"
                >
                  <option value="daily">Daily Digest</option>
                  <option value="immediate">Immediately</option>
                  <option value="weekly">Weekly Summary</option>
                </select>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReminderSubscription;