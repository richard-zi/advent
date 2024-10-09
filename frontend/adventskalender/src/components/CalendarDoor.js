// src/components/CalendarDoor.js
import React from 'react';

const CalendarDoor = ({ day, isOpen, onOpen, size }) => {
  return (
    <div 
      className={`w-full h-40 rounded-lg flex items-center justify-center cursor-pointer transition-all duration-300 transform hover:scale-105 border-4 border-gray-300 ${
        isOpen 
          ? 'bg-green-100 border-green-500 text-green-700 shadow-lg' 
          : 'bg-red-100 text-red-700 hover:bg-red-200'
      }`}
      onClick={() => onOpen(day)}
    >
      <span className={`font-bold text-base sm:text-lg md:text-xl lg:text-2xl`}>{day}</span>
    </div>
  );
};

export default CalendarDoor;