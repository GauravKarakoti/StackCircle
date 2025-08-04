import PropTypes from 'prop-types';
import '../globals.css';

const BadgeDisplay = ({ badges }) => {
  const badgeData = [
    { id: 1, name: "7-Day Streak", icon: "🔥", description: "Maintained a contribution streak for 7 consecutive periods" },
    { id: 2, name: "Top Contributor", icon: "⭐", description: "Contributed more than any other member in the circle" },
    { id: 3, name: "Circle Governor", icon: "🏛️", description: "Successfully created and passed a governance proposal" }
  ];

  return (
    <div className="mt-8">
      <h3 className="text-2xl font-bold mb-6 text-orange-700">Your Badges</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {badgeData.map(badge => (
          <div 
            key={badge.id} 
            className={`rounded-2xl p-5 flex flex-col items-center text-center transition-all duration-300 ${
              badges.includes(badge.id) 
                ? 'bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-300 shadow-lg' 
                : 'bg-gray-50 border-2 border-gray-200 opacity-80'
            }`}
          >
            <div 
              className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl mb-4 shadow-inner ${
                badges.includes(badge.id) 
                  ? 'bg-gradient-to-br from-orange-400 to-amber-400 text-white' 
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