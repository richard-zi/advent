// src/components/CalendarDoor.js
import React from 'react';

const CalendarDoor = ({ day, isOpen, onOpen, size }) => {
  return (
    <div 
      className={`w-full h-48 rounded-lg flex items-center justify-center cursor-pointer transition-all duration-300 transform hover:scale-110 border-2 border-gray-400 shadow-md ${
        isOpen 
          ? 'bg-gray-300 border-gray-500 text-gray-900 shadow-lg' 
          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
      }`}
      onClick={() => onOpen(day)}
    >
      <span className={`font-bold text-lg sm:text-xl md:text-2xl lg:text-3xl`}>{day}</span>
    </div>
  );
};

export default CalendarDoor;