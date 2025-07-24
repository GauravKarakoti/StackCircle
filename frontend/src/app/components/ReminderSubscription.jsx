import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useCitrea } from '../contexts/CitreaContext';

const ReminderSubscription = ({ circleId }) => {
  const { account } = useCitrea();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [reminderSettings, setReminderSettings] = useState({
    contribution: true,
    proposal: true,
    streak: true,
    frequency: 'daily'
  });
  const [isSaving, setIsSaving] = useState(false);

  // Load settings from localStorage on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('reminderSettings');
    const savedSubscription = localStorage.getItem('isSubscribed');
    
    if (savedSettings) {
      setReminderSettings(JSON.parse(savedSettings));
    }
    
    if (savedSubscription) {
      setIsSubscribed(savedSubscription === 'true');
    }
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    if (isSubscribed) {
      localStorage.setItem('reminderSettings', JSON.stringify(reminderSettings));
      localStorage.setItem('isSubscribed', 'true');
    }
  }, [reminderSettings, isSubscribed]);

  const handleSubscription = async () => {
    try {
      setIsSaving(true);
      
      // Save subscription to backend
      const response = await axios.post('/api/reminders', {
        circleId,
        isSubscribed: true,
        settings: reminderSettings,
        walletAddress: account // Use the connected wallet address
      });
      
      if (response.data.success) {
        setIsSubscribed(true);
        toast.success('Reminders enabled successfully!');
      } else {
        toast.error('Failed to enable reminders');
      }
    } catch (error) {
      console.error('Reminder enablement failed:', error);
      toast.error('Failed to enable reminders. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUnsubscribe = async () => {
    try {
      setIsSaving(true);
      
      // Remove subscription from backend
      await axios.post('/api/reminders', {
        circleId,
        isSubscribed: false,
        walletAddress: account // Use the connected wallet address
      });
      
      setIsSubscribed(false);
      localStorage.removeItem('isSubscribed');
      toast.success('Reminders disabled');
    } catch (error) {
      console.error('Unsubscribe failed:', error);
      toast.error('Failed to disable reminders');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSettingChange = (setting) => {
    setReminderSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  const handleUpdateSettings = async () => {
    try {
      setIsSaving(true);
      
      // Update settings in backend
      await axios.post('/api/reminders', {
        circleId,
        isSubscribed: true,
        settings: reminderSettings,
        walletAddress: account // Use the connected wallet address
      });
      
      toast.success('Settings updated!');
    } catch (error) {
      console.error('Failed to update settings:', error);
      toast.error('Failed to update settings');
    } finally {
      setIsSaving(false);
    }
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
            disabled={isSaving || !account}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg flex items-center disabled:opacity-75"
          >
            {isSaving ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Enabling...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                </svg>
                Enable Reminders
              </>
            )}
          </button>
        ) : (
          <div className="flex items-center space-x-3">
            <div className="bg-green-100 text-green-800 px-4 py-2 rounded-full flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Reminders Active
            </div>
            <button
              onClick={handleUnsubscribe}
              disabled={isSaving}
              className="text-red-600 hover:text-red-800 text-sm disabled:opacity-75"
            >
              Disable
            </button>
          </div>
        )}
      </div>
      
      {isSubscribed && (
        <div className="mt-4 pt-4 border-t border-orange-200">
          <div className="flex justify-between items-center mb-3">
            <h5 className="font-medium">Notification Settings</h5>
            <button
              onClick={handleUpdateSettings}
              disabled={isSaving}
              className="text-sm bg-orange-100 hover:bg-orange-200 text-orange-700 px-3 py-1 rounded disabled:opacity-75"
            >
              {isSaving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
          
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
                  disabled={isSaving}
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