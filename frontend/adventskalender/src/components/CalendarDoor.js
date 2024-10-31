import React from 'react';
import SmallCountdown from './SmallCountdown';
import { BarChart2 } from 'lucide-react';

const CalendarDoor = ({ day, isOpen, onOpen, contentPreview, darkMode }) => {
  const getPreviewText = (text) => {
    if (!text) return '';
    const plainText = text
      .replace(/#{1,6}\s?/g, '')
      .replace(/(\*\*|__)(.*?)\1/g, '$2')
      .replace(/(\*|_)(.*?)\1/g, '$2')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/`{1,3}[^`\n]+`{1,3}/g, '')
      .replace(/^\s*[-+*]\s+/gm, '')
      .replace(/^\s*\d+\.\s+/gm, '')
      .replace(/\n/g, ' ').trim();

    return plainText.length > 80 ? plainText.substring(0, 77) + '...' : plainText;
  };

  const renderMediaIcon = (type) => {
    const iconColor = darkMode ? 'text-gray-300' : 'text-gray-500';
    switch (type) {
      case 'audio':
        return (
          <svg className={`w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 ${iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
        );
      default:
        return null;
    }
  };

  const renderContent = () => {
    if (!contentPreview) return null;

    if (contentPreview.type === 'countdown') {
      return (
        <div className="flex-1 flex items-center justify-center p-2">
          <SmallCountdown darkMode={darkMode} />
        </div>
      );
    }

    if (contentPreview.type === 'poll') {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-2">
          <BarChart2 className={`w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 ${
            darkMode ? 'text-gray-300' : 'text-gray-500'
          } mb-1`} />
          <span className={`text-xs sm:text-sm text-center ${
            darkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Umfrage
          </span>
        </div>
      );
    }

    switch (contentPreview.type) {
      case 'text':
        return (
          <p className={`text-xs md:text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'} text-center overflow-hidden`}>
            {getPreviewText(contentPreview.data)}
          </p>
        );
      case 'audio':
        return (
          <div className="w-full h-full flex items-center justify-center">
            {renderMediaIcon('audio')}
          </div>
        );
      case 'video':
      case 'image':
      case 'gif':
      case 'puzzle':
        return contentPreview.thumbnail ? (
          <div className="w-full h-full relative">
            <img
              src={contentPreview.thumbnail}
              alt={`Vorschau für Türchen ${day}`}
              className="w-full h-full object-cover absolute inset-0"
            />
            <div className={`absolute inset-0 ${darkMode ? 'bg-black' : 'bg-white'} opacity-10`}></div>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className={`w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 ${darkMode ? 'text-gray-300' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div 
      className={`aspect-square rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all duration-300 transform hover:scale-102 border overflow-hidden relative ${
        isOpen 
          ? darkMode
            ? 'bg-gray-700 shadow-sm border-gray-600'
            : 'bg-white shadow-sm border-gray-300'
          : darkMode
            ? 'bg-gradient-to-br from-gray-800 to-gray-700 hover:from-gray-700 hover:to-gray-600 border-gray-600'
            : 'bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 border-gray-200'
      }`}
      onClick={() => onOpen(day)}
    >
      {isOpen ? (
        <>
          <div className="flex-1 w-full flex items-center justify-center relative overflow-hidden">
            {renderContent()}
          </div>
          <div className={`
            w-full h-6 sm:h-8
            flex items-center justify-center
            ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}
            relative z-10
          `}>
            <span className={`text-sm sm:text-base font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {day}
            </span>
          </div>
        </>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center">
          <span className={`font-bold text-xl sm:text-2xl md:text-3xl ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{day}</span>
          <div className="mt-1 w-4 sm:w-5 md:w-6 h-1 bg-red-600 rounded-full"></div>
        </div>
      )}
    </div>
  );
};

export default CalendarDoor;