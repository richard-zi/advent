import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Settings } from 'lucide-react';
import CalendarDoor from './CalendarDoor';
import ContentPopup from './ContentPopup';
import SettingsModal from './SettingsModal';
import Snowfall from './Snowfall';
import AlertMessage from './AlertMessage';
import axios from 'axios';

const AdventCalendar = () => {
  const [openDoors, setOpenDoors] = useState(() => {
    const saved = localStorage.getItem('openDoors');
    return saved ? JSON.parse(saved) : {};
  });
  const [calendarData, setCalendarData] = useState({});
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
  const settingsRef = useRef(null);
  const [doorStates, setDoorStates] = useState(() => {
    const saved = localStorage.getItem('doorStates');
    return saved ? JSON.parse(saved) : {};
  });

  // Configure axios defaults
  useEffect(() => {
    // Set base URL for all axios requests
    axios.defaults.baseURL = process.env.REACT_APP_API_URL;
    // Add error handling interceptor
    axios.interceptors.response.use(
      response => response,
      error => {
        console.error('API Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }, []);

  const fetchCalendarData = useCallback(async () => {
    try {
      const response = await axios.get('/api/content', {
        params: {
          doorStates: JSON.stringify(doorStates)
        }
      });
      setCalendarData(response.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }, [doorStates]);

  useEffect(() => {
    localStorage.setItem('doorStates', JSON.stringify(doorStates));
    fetchCalendarData();
  }, [doorStates, fetchCalendarData]);

  useEffect(() => {
    fetchCalendarData();
  }, [fetchCalendarData]);

  useEffect(() => {
    localStorage.setItem('openDoors', JSON.stringify(openDoors));
  }, [openDoors]);

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

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

  const handleDoorOpen = async (day) => {
    if (!calendarData[day]) {
      setAlertConfig({ show: true, type: 'error' });
      return;
    }

    if (calendarData[day].type === "not available yet") {
      setAlertConfig({ show: true, type: 'notAvailable' });
      return;
    }

    setOpenDoors(prev => ({ ...prev, [day]: true }));
    setSelectedContent({ day, ...calendarData[day] });
  };
  
  const handleClosePopup = () => {
    setSelectedContent(null);
  };

  const toggleSettings = () => {
    setIsSettingsOpen(!isSettingsOpen);
  };

  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  const toggleSnowfall = () => {
    setSnowfall(prev => !prev);
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${
      darkMode ? 'from-gray-800 to-gray-900' : 'from-gray-50 to-gray-100'
    } flex flex-col items-center pt-4 sm:pt-8 md:pt-12 p-2 sm:p-4 relative transition-colors duration-300`}>
      <Snowfall isActive={snowfall} />
      
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
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 sm:gap-3">
            {Array.from({ length: 24 }, (_, i) => i + 1).map((day) => (
              <CalendarDoor
                key={day}
                day={day}
                isOpen={openDoors[day]}
                onOpen={() => handleDoorOpen(day)}
                contentPreview={calendarData[day]}
                darkMode={darkMode}
                doorStates={doorStates}
              />
            ))}
          </div>
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