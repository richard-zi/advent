import React, { useState, useEffect } from 'react';

const ChristmasCountdown = ({ darkMode }) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const christmas = new Date(new Date().getFullYear(), 11, 24); // Dezember ist 11 (0-basiert)
      const now = new Date();
      
      const difference = christmas.getTime() - now.getTime();
      
      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((difference / 1000 / 60) % 60);
        const seconds = Math.floor((difference / 1000) % 60);

        setTimeLeft({ days, hours, minutes, seconds });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, []);

  const TimeUnit = ({ value, label }) => (
    <div className="flex flex-col items-center">
      <div className={`
        w-16 h-16 rounded-lg 
        ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} 
        flex items-center justify-center
        text-2xl font-bold
        ${darkMode ? 'text-white' : 'text-gray-800'}
      `}>
        {String(value).padStart(2, '0')}
      </div>
      <div className={`
        mt-2 text-sm font-medium
        ${darkMode ? 'text-gray-300' : 'text-gray-600'}
      `}>
        {label}
      </div>
    </div>
  );

  return (
    <div className="w-full flex flex-col items-center space-y-6">
      <div className="flex space-x-4">
        <TimeUnit value={timeLeft.days} label="Tage" />
        <TimeUnit value={timeLeft.hours} label="Stunden" />
        <TimeUnit value={timeLeft.minutes} label="Minuten" />
        <TimeUnit value={timeLeft.seconds} label="Sekunden" />
      </div>
    </div>
  );
};

export default ChristmasCountdown;