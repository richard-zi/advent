import React from 'react';

const SettingsModal = ({ isOpen, darkMode, toggleDarkMode, snowfall, toggleSnowfall }) => {
  if (!isOpen) return null;

  return (
    <div className={`absolute top-14 right-4 w-48 ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 focus:outline-none`}>
      <div className="px-4 py-2 text-sm space-y-4">
        <div className="flex items-center justify-between">
          <span className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Dark Mode</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only peer" 
              checked={darkMode}
              onChange={toggleDarkMode}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>
        <div className="flex items-center justify-between">
          <span className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Snowfall</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only peer" 
              checked={snowfall}
              onChange={toggleSnowfall}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;