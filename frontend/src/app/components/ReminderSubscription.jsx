import React from 'react';
import { useCitrea } from '../contexts/CitreaContext';

// This is now a "presentational" component. It holds no state of its own.
// It receives everything it needs to display and function via props.
const ReminderSubscription = ({
    isSubscribed,
    email,
    setEmail,
    reminderSettings,
    setReminderSettings,
    isLoading,
    isSaving,
    handleSubscription,
    handleUnsubscribe,
    handleUpdateSettings,
}) => {
    const { account } = useCitrea();

    const handleSettingChange = (setting) => {
        setReminderSettings(prev => ({
            ...prev,
            [setting]: !prev[setting]
        }));
    };

    if (isLoading) {
        return (
            <div className="bg-orange-50 rounded-lg p-4 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
        );
    }

    return (
        <div className="bg-orange-50 rounded-lg p-6 mt-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                <div className="mb-4 md:mb-0">
                    <h4 className="font-bold text-lg text-gray-800">Contribution Reminders</h4>
                    <p className="text-gray-600 max-w-md">
                        Get notified about important circle events and never miss a contribution deadline.
                    </p>

                    {!isSubscribed && (
                        <div className="mt-4">
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                Email Address
                            </label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                className="mt-1 block w-full md:w-80 px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                                required
                            />
                        </div>
                    )}
                </div>

                {!isSubscribed ? (
                    <button
                        onClick={handleSubscription}
                        disabled={isSaving || !account}
                        className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg flex items-center disabled:opacity-75 font-semibold transition-colors"
                    >
                        {isSaving ? 'Enabling...' : 'Enable Reminders'}
                    </button>
                ) : (
                    <div className="flex items-center space-x-3">
                        <div className="bg-green-100 text-green-800 px-4 py-2 rounded-full flex items-center font-medium">
                            Reminders Active
                        </div>
                        <button
                            onClick={handleUnsubscribe}
                            disabled={isSaving}
                            className="text-red-600 hover:text-red-800 text-sm disabled:opacity-75 font-semibold"
                        >
                            Disable
                        </button>
                    </div>
                )}
            </div>

            {isSubscribed && (
                <div className="mt-4 pt-4 border-t border-orange-200">
                    <div className="flex justify-between items-center mb-3">
                        <h5 className="font-medium text-gray-700">Notification Settings</h5>
                        <button
                            onClick={handleUpdateSettings}
                            disabled={isSaving}
                            className="text-sm bg-orange-100 hover:bg-orange-200 text-orange-700 px-3 py-1 rounded disabled:opacity-75 font-semibold"
                        >
                            {isSaving ? 'Saving...' : 'Save Settings'}
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Contribution Toggle */}
                        <div className="flex items-center">
                            <label className="flex items-center cursor-pointer">
                                <div className="relative inline-block w-12 h-6">
                                    <input
                                        type="checkbox"
                                        className="sr-only"
                                        checked={reminderSettings.contribution}
                                        onChange={() => handleSettingChange('contribution')}
                                    />
                                    <div className={`block w-12 h-6 rounded-full transition ${reminderSettings.contribution ? 'bg-orange-500' : 'bg-gray-300'}`}></div>
                                    <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${reminderSettings.contribution ? 'transform translate-x-6' : ''}`}></div>
                                </div>
                                <span className="ml-3 text-gray-700">Contribution Deadlines</span>
                            </label>
                        </div>

                        {/* Proposal Toggle */}
                        <div className="flex items-center">
                             <label className="flex items-center cursor-pointer">
                                <div className="relative inline-block w-12 h-6">
                                    <input
                                        type="checkbox"
                                        className="sr-only"
                                        checked={reminderSettings.proposal}
                                        onChange={() => handleSettingChange('proposal')}
                                    />
                                    <div className={`block w-12 h-6 rounded-full transition ${reminderSettings.proposal ? 'bg-orange-500' : 'bg-gray-300'}`}></div>
                                    <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${reminderSettings.proposal ? 'transform translate-x-6' : ''}`}></div>
                                </div>
                                <span className="ml-3 text-gray-700">Voting Deadlines</span>
                            </label>
                        </div>

                        {/* Streak Toggle */}
                        <div className="flex items-center">
                             <label className="flex items-center cursor-pointer">
                                <div className="relative inline-block w-12 h-6">
                                    <input
                                        type="checkbox"
                                        className="sr-only"
                                        checked={reminderSettings.streak}
                                        onChange={() => handleSettingChange('streak')}
                                    />
                                    <div className={`block w-12 h-6 rounded-full transition ${reminderSettings.streak ? 'bg-orange-500' : 'bg-gray-300'}`}></div>
                                    <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${reminderSettings.streak ? 'transform translate-x-6' : ''}`}></div>
                                </div>
                                <span className="ml-3 text-gray-700">Streak Milestones</span>
                            </label>
                        </div>

                        {/* Frequency Dropdown */}
                        <div className="flex items-center">
                            <label className="flex items-center">
                                <span className="text-gray-700 mr-3">Frequency:</span>
                                <select
                                    value={reminderSettings.frequency}
                                    onChange={(e) => setReminderSettings(prev => ({
                                        ...prev,
                                        frequency: e.target.value
                                    }))}
                                    className="border border-gray-300 rounded px-3 py-1 bg-white"
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