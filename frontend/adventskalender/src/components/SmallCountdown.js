import React, { useState, useEffect } from 'react';

const SmallCountdown = ({ darkMode }) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const christmas = new Date(new Date().getFullYear(), 11, 24);
      const now = new Date();
      const difference = christmas.getTime() - now.getTime();
      
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, []);

  const TimeUnit = ({ value, label }) => (
    <div className="flex flex-col items-center">
      <div className={`
        text-center px-1
        ${darkMode ? 'text-gray-200' : 'text-gray-700'}
      `}>
        {String(value).padStart(2, '0')}
      </div>
      <div className={`
        text-[10px] 
        ${darkMode ? 'text-gray-400' : 'text-gray-500'}
      `}>
        {label}
      </div>
    </div>
  );

  return (
    <div className="flex justify-center space-x-2">
      <TimeUnit value={timeLeft.days} label="Tage" />
      <TimeUnit value={timeLeft.hours} label="Std" />
      <TimeUnit value={timeLeft.minutes} label="Min" />
      <TimeUnit value={timeLeft.seconds} label="Sek" />
    </div>
  );
};

export default SmallCountdown;