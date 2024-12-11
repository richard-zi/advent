import React, { Suspense, useState, useEffect } from 'react';
import { BarChart2, Puzzle, Film, FileText, Music } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

const SmallCountdown = React.lazy(() => import('./SmallCountdown'));

const LoadingFallback = ({ darkMode }) => (
  <div className="flex justify-center items-center p-2">
    <LoadingSpinner size="small" darkMode={darkMode} />
  </div>
);

const CACHE_PREFIX = 'door-preview-';

const MediaPreview = ({ src, alt, darkMode, isPreloaded, contentType, doorStates, day, content }) => {
  const [isLoading, setIsLoading] = useState(!isPreloaded);
  const [imageSrc, setImageSrc] = useState(() => {
    const cached = localStorage.getItem(`${CACHE_PREFIX}${src}`);
    return cached || null;
  });

  useEffect(() => {
    let effectiveSrc = src;
    const isPuzzle = contentType === 'puzzle';
    const isPuzzleSolved = isPuzzle && doorStates[day]?.win;

    if (isPuzzle) {
      if (isPuzzleSolved && content?.data) {
        // Wenn das Puzzle gelöst ist, zeige das vollständige Bild
        effectiveSrc = content.data;
      } else if (content?.thumbnail) {
        // Wenn nicht gelöst, zeige das Thumbnail
        effectiveSrc = content.thumbnail;
      }
    }

    if (effectiveSrc && !imageSrc) {
      const img = new Image();
      img.onload = () => {
        setImageSrc(effectiveSrc);
        setIsLoading(false);
        localStorage.setItem(`${CACHE_PREFIX}${effectiveSrc}`, effectiveSrc);
      };
      img.src = effectiveSrc;
    } else if (imageSrc) {
      setIsLoading(false);
    }
  }, [src, imageSrc, contentType, doorStates, day, content]);

  return (
    <div className="w-full h-full relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <LoadingSpinner size="small" darkMode={darkMode} />
        </div>
      )}
      {imageSrc && (
        <img
          src={imageSrc}
          alt={alt}
          className={`w-full h-full object-cover absolute inset-0 ${
            isLoading ? 'opacity-0' : 'opacity-100'
          } transition-opacity duration-300`}
        />
      )}
      <div className={`absolute inset-0 ${darkMode ? 'bg-black' : 'bg-white'} opacity-10`}></div>
    </div>
  );
};

const CalendarDoor = ({ 
  day, 
  isOpen, 
  onOpen, 
  contentPreview, 
  darkMode, 
  doorStates,
  isPreloaded = false 
}) => {
  const [previewContent, setPreviewContent] = useState(() => {
    const cached = localStorage.getItem(`${CACHE_PREFIX}content-${day}`);
    return cached ? JSON.parse(cached) : null;
  });

  useEffect(() => {
    if (contentPreview) {
      setPreviewContent(contentPreview);
      localStorage.setItem(`${CACHE_PREFIX}content-${day}`, JSON.stringify(contentPreview));
    }
  }, [contentPreview, day]);

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
        return <Music className={`w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 ${iconColor}`} />;
      case 'puzzle':
        return <Puzzle className={`w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 ${iconColor}`} />;
      case 'text':
        return <FileText className={`w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 ${iconColor}`} />;
      case 'iframe':
        return <Film className={`w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 ${iconColor}`} />;
      default:
        return null;
    }
  };

  const renderContent = () => {
    if (!previewContent) return null;

    if (previewContent.type === 'countdown') {
      return (
        <div className="flex-1 flex items-center justify-center p-2">
          <Suspense fallback={<LoadingFallback darkMode={darkMode} />}>
            <SmallCountdown darkMode={darkMode} />
          </Suspense>
        </div>
      );
    }

    if (previewContent.type === 'poll') {
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

    switch (previewContent.type) {
      case 'text':
        return (
          <div className="flex flex-col items-center justify-center h-full">
            <p className={`text-xs md:text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'} text-center px-2`}>
              {getPreviewText(previewContent.data)}
            </p>
          </div>
        );
      case 'audio':
      case 'iframe':
        return (
          <div className="w-full h-full flex items-center justify-center">
            {renderMediaIcon(previewContent.type)}
          </div>
        );
      case 'puzzle':
        if (previewContent.thumbnail || (doorStates[day]?.win && previewContent.data)) {
          return (
            <MediaPreview
              src={previewContent.thumbnail}
              alt={`Preview for door ${day}`}
              darkMode={darkMode}
              isPreloaded={isPreloaded}
              contentType={previewContent.type}
              doorStates={doorStates}
              day={day}
              content={previewContent}
            />
          );
        }
        return (
          <div className="w-full h-full flex items-center justify-center">
            {renderMediaIcon('puzzle')}
          </div>
        );
      case 'video':
      case 'image':
      case 'gif':
        return previewContent.thumbnail ? (
          <MediaPreview
            src={previewContent.thumbnail}
            alt={`Preview for door ${day}`}
            darkMode={darkMode}
            isPreloaded={isPreloaded}
            contentType={previewContent.type}
            doorStates={doorStates}
            day={day}
            content={previewContent}
          />
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