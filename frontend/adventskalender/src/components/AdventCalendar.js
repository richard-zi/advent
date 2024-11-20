import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Settings } from 'lucide-react';
import CalendarDoor from './CalendarDoor';
import ContentPopup from './ContentPopup';
import SettingsModal from './SettingsModal';
import Snowfall from './Snowfall';
import AlertMessage from './AlertMessage';
import LoadingSpinner from './LoadingSpinner';
import axios from 'axios';

// Import background images
import lightBackground from '../assets/light-background.jpg';
import darkBackground from '../assets/dark-background.jpg';

// Credits configuration
const backgroundCredits = {
  light: {
    text: "Unsplash",
    link: "https://your-light-image-source.com",
    photographer: "Photographer Name"
  },
  dark: {
    text: "Unsplash",
    link: "https://your-dark-image-source.com",
    photographer: "Photographer Name"
  }
};

const AdventCalendar = () => {
  const [openDoors, setOpenDoors] = useState(() => {
    const saved = localStorage.getItem('openDoors');
    return saved ? JSON.parse(saved) : {};
  });
  const [calendarData, setCalendarData] = useState(() => {
    const saved = localStorage.getItem('calendarData');
    return saved ? JSON.parse(saved) : {};
  });
  const [selectedContent, setSelectedContent] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ show: false, type: 'notAvailable' });
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) {
      return JSON.parse(saved);
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [snowfall, setSnowfall] = useState(() => {
    const saved = localStorage.getItem('snowfall');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [doorStates, setDoorStates] = useState(() => {
    const saved = localStorage.getItem('doorStates');
    return saved ? JSON.parse(saved) : {};
  });
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [backgroundsLoaded, setBackgroundsLoaded] = useState({
    light: false,
    dark: false
  });
  const [themeLoading, setThemeLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(() => {
    const saved = localStorage.getItem('lastUpdate');
    return saved ? parseInt(saved) : 0;
  });
  
  const settingsRef = useRef(null);
  const abortControllerRef = useRef(null);

  const doorOrder = useMemo(() => [
    7, 15, 1, 24, 10, 4, 18, 12, 3, 22,
    9, 20, 6, 17, 2, 13, 5, 23, 11, 16,
    19, 8, 21, 14
  ], []);

  // Initialize theme with a loading state
  useEffect(() => {
    const savedTheme = localStorage.getItem('darkMode');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialDarkMode = savedTheme !== null ? JSON.parse(savedTheme) : prefersDark;
    
    // Apply initial theme without transition
    document.documentElement.classList.add('no-transitions');
    if (initialDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Remove no-transitions class after a short delay
    setTimeout(() => {
      document.documentElement.classList.remove('no-transitions');
      setThemeLoading(false);
      setDarkMode(initialDarkMode);
    }, 100);
  }, []);

  // Check if background images are available
  useEffect(() => {
    const checkImage = (url, theme) => {
      const img = new Image();
      img.onload = () => setBackgroundsLoaded(prev => ({ ...prev, [theme]: true }));
      img.onerror = () => setBackgroundsLoaded(prev => ({ ...prev, [theme]: false }));
      img.src = url;
    };

    try {
      checkImage(lightBackground, 'light');
      checkImage(darkBackground, 'dark');
    } catch (error) {
      console.warn('Error loading background images:', error);
      setBackgroundsLoaded({ light: false, dark: false });
    }
  }, []);

  const fetchCalendarData = useCallback(async (signal) => {
    try {
      const now = Date.now();
      // Only update every 5 minutes
      if (now - lastUpdate < 5 * 60 * 1000 && Object.keys(calendarData).length > 0) {
        setIsInitialLoad(false);
        return;
      }

      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/`, {
        params: {
          doorStates: JSON.stringify(doorStates)
        },
        signal
      });
      
      setCalendarData(response.data);
      localStorage.setItem('calendarData', JSON.stringify(response.data));
      localStorage.setItem('lastUpdate', now.toString());
      setLastUpdate(now);
    } catch (error) {
      if (!axios.isCancel(error)) {
        console.error('Error fetching data:', error);
      }
    } finally {
      setIsInitialLoad(false);
    }
  }, [doorStates, lastUpdate, calendarData]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      const userPreference = localStorage.getItem('darkMode');
      if (userPreference === null) {
        setDarkMode(e.matches);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    if (!themeLoading) {
      localStorage.setItem('darkMode', JSON.stringify(darkMode));
      if (darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [darkMode, themeLoading]);

  useEffect(() => {
    localStorage.setItem('doorStates', JSON.stringify(doorStates));
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    fetchCalendarData(abortControllerRef.current.signal);

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [doorStates, fetchCalendarData]);

  useEffect(() => {
    localStorage.setItem('openDoors', JSON.stringify(openDoors));
  }, [openDoors]);

  useEffect(() => {
    localStorage.setItem('snowfall', JSON.stringify(snowfall));
  }, [snowfall]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setIsSettingsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [settingsRef]);

  const handleDoorOpen = useCallback((day) => {
    if (!calendarData[day]) {
      setAlertConfig({ show: true, type: 'error' });
      return;
    }

    if (calendarData[day].type === "not available yet") {
      setAlertConfig({ show: true, type: 'notAvailable' });
      return;
    }

    setOpenDoors(prev => {
      const newState = { ...prev, [day]: true };
      localStorage.setItem('openDoors', JSON.stringify(newState));
      return newState;
    });
    setSelectedContent({ day, ...calendarData[day] });
  }, [calendarData]);

  const handleClosePopup = useCallback(() => {
    setSelectedContent(null);
  }, []);

  const toggleSettings = useCallback(() => {
    setIsSettingsOpen(prev => !prev);
  }, []);

  const toggleDarkMode = useCallback(() => {
    setDarkMode(prev => !prev);
  }, []);

  const toggleSnowfall = useCallback(() => {
    setSnowfall(prev => !prev);
  }, []);

  const BackgroundCredit = ({ darkMode }) => {
    const currentTheme = darkMode ? 'dark' : 'light';
    if (!backgroundsLoaded[currentTheme]) return null;

    return (
      <div className={`
        fixed bottom-2 left-2 z-10 
        opacity-60 hover:opacity-100
        transition-opacity duration-300
      `}>
        <a
          href={darkMode ? backgroundCredits.dark.link : backgroundCredits.light.link}
          target="_blank"
          rel="noopener noreferrer"
          className={`
            text-xs
            ${darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-800'}
            transition-colors duration-300
          `}
        >
          Photo: {darkMode ? backgroundCredits.dark.photographer : backgroundCredits.light.photographer}
        </a>
      </div>
    );
  };

  const renderCalendarContent = () => {
    if (isInitialLoad) {
      return (
        <div className="min-h-[600px] w-full flex flex-col items-center justify-center">
          <LoadingSpinner size="large" darkMode={darkMode} />
        </div>
      );
    }

    return (
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 sm:gap-3">
        {doorOrder.map((day) => (
          <CalendarDoor
            key={day}
            day={day}
            isOpen={openDoors[day]}
            onOpen={handleDoorOpen}
            contentPreview={calendarData[day]}
            darkMode={darkMode}
            doorStates={doorStates}
          />
        ))}
      </div>
    );
  };

  if (themeLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" darkMode={false} />
      </div>
    );
  }

  return (
    <div 
      className={`
        min-h-screen flex flex-col items-center pt-4 sm:pt-8 md:pt-12 p-2 sm:p-4 
        relative transition-all duration-300
        ${themeLoading ? 'opacity-0' : 'opacity-100'}
      `}
    >
      {/* Background base layer */}
      <div 
        className="fixed inset-0 transition-colors duration-700" 
        style={{
          backgroundColor: darkMode ? 'rgb(31, 41, 55)' : 'rgb(243, 244, 246)',
          zIndex: -2
        }} 
      />
      
      {/* Background images with crossfade */}
      {backgroundsLoaded.light && (
        <div 
          className={`
            fixed inset-0 bg-cover bg-center bg-fixed transition-opacity duration-700
            ${!darkMode ? 'opacity-100' : 'opacity-0'}
          `}
          style={{
            backgroundImage: `linear-gradient(to bottom, 
              rgba(243, 244, 246, 0.7), 
              rgba(243, 244, 246, 0.7)),
              url(${lightBackground})`,
            zIndex: -1
          }}
        />
      )}
      {backgroundsLoaded.dark && (
        <div 
          className={`
            fixed inset-0 bg-cover bg-center bg-fixed transition-opacity duration-700
            ${darkMode ? 'opacity-100' : 'opacity-0'}
          `}
          style={{
            backgroundImage: `linear-gradient(to bottom, 
              rgba(17, 24, 39, 0.7), 
              rgba(17, 24, 39, 0.7)),
              url(${darkBackground})`,
            zIndex: -1
          }}
        />
      )}

      <Snowfall isActive={snowfall} />
      
      <BackgroundCredit darkMode={darkMode} />
      
      <AlertMessage 
        isVisible={alertConfig.show}
        onClose={() => setAlertConfig({ show: false, type: 'notAvailable' })}
        darkMode={darkMode}
        type={alertConfig.type}
      />

      <div ref={settingsRef} className="fixed top-4 right-4 z-[100]">
        <button
          onClick={toggleSettings}
          className={`p-2 ${
            darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white hover:bg-gray-100'
          } rounded-full shadow-md transition-colors duration-200`}
        >
          <Settings size={24} className={darkMode ? 'text-gray-200' : 'text-gray-800'} />
        </button>
        <SettingsModal
          isOpen={isSettingsOpen}
          darkMode={darkMode}
          toggleDarkMode={toggleDarkMode}
          snowfall={snowfall}
          toggleSnowfall={toggleSnowfall}
        />
      </div>

      <div className="relative z-0 w-full flex flex-col items-center">
        <h1 className={`text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-4 sm:mb-6 ${
          darkMode ? 'text-gray-100' : 'text-gray-800'
        } tracking-tight transition-colors duration-300`}>
          Adventskalender
        </h1>

        <div className={`w-full max-w-xs sm:max-w-2xl md:max-w-4xl lg:max-w-5xl p-2 sm:p-4 ${
          darkMode ? 'bg-gray-800 bg-opacity-70' : 'bg-white bg-opacity-70'
        } backdrop-filter backdrop-blur-sm rounded-2xl shadow-md transition-colors duration-300`}>
          {renderCalendarContent()}
        </div>
      </div>

      <ContentPopup
        isOpen={!!selectedContent}
        onClose={handleClosePopup}
        content={selectedContent}
        darkMode={darkMode}
        doorStates={doorStates}
        setDoorStates={setDoorStates}
      />
    </div>
  );
};

export default AdventCalendar;