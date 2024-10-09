// src/components/CalendarDoor.js
import React from 'react';

const CalendarDoor = ({ day, isOpen, onOpen, size, contentPreview }) => {
  // Helper function to get a preview text, truncated if necessary
  const getPreviewText = (text) => {
    return text && text.length > 60 ? text.substring(0, 60) + '...' : text;
  };

  return (
    <div 
      className={`w-full h-40 sm:h-56 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all duration-300 transform hover:scale-105 border-2 border-gray-400 shadow-md ${
        isOpen 
          ? 'bg-gray-300 border-gray-500 text-gray-900 shadow-lg' 
          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
      }`}
      onClick={() => onOpen(day)}
    >
      {/* Show content preview if the door is open, otherwise show the day number */}
      {isOpen ? (
        <div className="flex flex-col items-center">
          {contentPreview && contentPreview.type === 'text' && (
            <p className="text-base sm:text-lg text-gray-800 text-center mx-2 sm:mx-4">{getPreviewText(contentPreview.data)}</p>
          )}
          {contentPreview && contentPreview.type === 'video' && (
            <img
              src="https://via.placeholder.com/250"
              alt="Video Vorschau"
              className="w-24 h-24 sm:w-40 sm:h-40 object-cover rounded mt-2"
            />
          )}
          {contentPreview && contentPreview.type === 'audio' && (
            <span className="text-base sm:text-lg text-gray-800 mt-2 text-center">🎶 Audio-Inhalt</span>
          )}
          {contentPreview && contentPreview.type === 'image' && (
            <img
              src={contentPreview.data}
              alt="Bild Vorschau"
              className="w-24 h-24 sm:w-40 sm:h-40 object-cover rounded mt-2"
            />
          )}
          {contentPreview && contentPreview.text && (
            <p className="text-xs sm:text-sm text-gray-600 mt-2 text-center">{getPreviewText(contentPreview.text)}</p>
          )}
        </div>
      ) : (
        <span className={`font-bold text-base sm:text-lg md:text-2xl lg:text-3xl`}>{day}</span>
      )}
    </div>
  );
};

export default CalendarDoor;