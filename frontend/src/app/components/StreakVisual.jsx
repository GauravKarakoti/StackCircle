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
            className={`w-3 h-3 rounded-full mx-1 ${index < streak ? 'bg-orange-500' : 'bg-gray-300'}`}
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