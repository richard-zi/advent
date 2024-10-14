import React from 'react';

const CalendarDoor = ({ day, isOpen, onOpen, contentPreview }) => {
  const getPreviewText = (text) => {
    return text && text.length > 30 ? text.substring(0, 30) + '...' : text;
  };

  return (
    <div 
      className={`aspect-square rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all duration-300 transform hover:scale-102 border ${
        isOpen 
          ? 'bg-white shadow-sm border-gray-300' 
          : 'bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 border-gray-200'
      }`}
      onClick={() => onOpen(day)}
    >
      {isOpen ? (
        <div className="flex flex-col items-center justify-center p-2 w-full h-full">
          {contentPreview && contentPreview.type === 'text' && (
            <p className="text-sm sm:text-base text-gray-600 text-center overflow-hidden">{getPreviewText(contentPreview.data)}</p>
          )}
          {contentPreview && contentPreview.type === 'video' && (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-md">
              <svg className="w-10 h-10 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          )}
          {contentPreview && contentPreview.type === 'audio' && (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-md">
              <svg className="w-10 h-10 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
          )}
          {contentPreview && contentPreview.type === 'image' && (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-md">
              <svg className="w-10 h-10 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center">
          <span className="font-bold text-2xl sm:text-3xl text-gray-700">{day}</span>
          <div className="mt-2 w-6 h-0.5 bg-red-600 rounded-full"></div>
        </div>
      )}
    </div>
  );
};

export default CalendarDoor;