import PropTypes from 'prop-types';

const BadgeDisplay = ({ badges }) => {
  const badgeData = [
    { id: 1, name: "7-Day Streak", icon: "🔥", description: "Maintained a contribution streak for 7 consecutive periods" },
    { id: 2, name: "Top Contributor", icon: "⭐", description: "Contributed more than any other member in the circle" },
    { id: 3, name: "Circle Governor", icon: "🏛️", description: "Successfully created and passed a governance proposal" }
  ];

  return (
    <div className="mt-6">
      <h3 className="text-xl font-semibold mb-4">Your Badges</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {badgeData.map(badge => (
          <div 
            key={badge.id} 
            className={`rounded-xl p-4 flex flex-col items-center text-center transition-all duration-300 ${
              badges.includes(badge.id) 
                ? 'bg-gradient-to-br from-orange-50 to-yellow-50 border-2 border-orange-200 shadow-md' 
                : 'bg-gray-50 border-2 border-gray-100 opacity-75'
            }`}
          >
            <div 
              className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl mb-3 ${
                badges.includes(badge.id) 
                  ? 'bg-gradient-to-r from-orange-400 to-yellow-400 text-white' 
                  : 'bg-gray-200 text-gray-400'
              }`}
            >
              {badge.icon}
            </div>
            <h4 className="font-bold">{badge.name}</h4>
            <p className="text-sm text-gray-600 mt-1">{badge.description}</p>
            {badges.includes(badge.id) ? (
              <span className="mt-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                Unlocked
              </span>
            ) : (
              <span className="mt-2 text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">
                Locked
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

BadgeDisplay.propTypes = {
  badges: PropTypes.arrayOf(PropTypes.number).isRequired
};

export default BadgeDisplay;