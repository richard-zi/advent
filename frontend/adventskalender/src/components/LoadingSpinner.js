import React from 'react';

const LoadingSpinner = ({ size = 'medium', darkMode = false }) => {
  const sizeClasses = {
    small: 'w-6 h-6',
    medium: 'w-10 h-10',
    large: 'w-16 h-16'
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className={`${sizeClasses[size]} relative`}>
        <div className={`animate-spin rounded-full border-4 border-solid ${
          darkMode 
            ? 'border-gray-600 border-t-gray-200' 
            : 'border-gray-200 border-t-blue-500'
        } ${sizeClasses[size]}`}></div>
      </div>
      <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
        Wird geladen...
      </span>
    </div>
  );
};

export default LoadingSpinner;