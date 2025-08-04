import PropTypes from 'prop-types';
import '../globals.css';

const StreakVisual = ({ streak }) => {
  // Create an array of unique keys for the dots
  const dotKeys = [
    `streak-dot-1`,
    `streak-dot-2`,
    `streak-dot-3`,
    `streak-dot-4`,
    `streak-dot-5`
  ];
  
  return (
    <div className="flex items-center">
      <span className="font-bold mr-2">{streak}</span>
      <div className="flex">
        {dotKeys.map((key, index) => (
          <div 
            key={key}
            className={`w-4 h-4 rounded-full mx-1 transition-all ${index < streak ? 'bg-gradient-to-r from-orange-500 to-amber-500 pulse' : 'bg-gray-300'}`}
          />
        ))}
      </div>
    </div>
  );
};

StreakVisual.propTypes = {
  streak: PropTypes.number.isRequired
};

export default StreakVisual;