import React, { useState, useEffect } from 'react';
import { Settings } from 'lucide-react';
import CalendarDoor from './CalendarDoor';
import ContentPopup from './ContentPopup';
import SettingsModal from './SettingsModal';

const AdventCalendar = () => {
  const [openDoors, setOpenDoors] = useState({});
  const [calendarData, setCalendarData] = useState({});
  const [selectedContent, setSelectedContent] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Vorgemischte Reihenfolge der Türchen
  const doorOrder = [
    7, 15, 1, 24, 10, 4, 18, 12, 3, 22,
    9, 20, 6, 17, 2, 13, 5, 23, 11, 16,
    19, 8, 21, 14
  ];

  useEffect(() => {
    fetchCalendarData();
  }, []);

  const fetchCalendarData = async () => {
    // Mock API call to fetch calendar data
    const mockData = {
      1: { type: 'text', data: "Frohe Weihnachten!" },
      2: { type: 'video', data: "/api/placeholder/400/320", text: "Schöne Weihnachtszeit!" },
      3: { type: 'audio', data: "https://example.com/jingle-bells.mp3", text: "Weihnachtsmusik zum Genießen" },
      4: { type: 'image', data: "https://example.com/image.jpg", text: "Ein schönes Weihnachtsbild" },
      5: { type: 'text', data: "Dies ist ein sehr langer Text, der abgeschnitten werden muss, wenn er zu lang ist, um in das Türchen zu passen." },
      // ... more days
    };
    setCalendarData(mockData);
  };

  const handleDoorOpen = (day) => {
    setOpenDoors(prev => ({ ...prev, [day]: true }));
    setSelectedContent({ day, ...calendarData[day] });
  };

  const handleClosePopup = () => {
    setSelectedContent(null);
  };

  const toggleSettings = () => {
    setIsSettingsOpen(!isSettingsOpen);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center pt-4 sm:pt-8 md:pt-12 p-2 sm:p-4 relative">
      <button
        onClick={toggleSettings}
        className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors duration-200"
      >
        <Settings size={24} />
      </button>
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-4 sm:mb-6 text-gray-800 tracking-tight">
        Adventskalender
      </h1>
      <div className="w-full max-w-xs sm:max-w-2xl md:max-w-4xl lg:max-w-5xl p-2 sm:p-4 bg-white bg-opacity-70 backdrop-filter backdrop-blur-sm rounded-2xl shadow-md">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 sm:gap-3">
          {doorOrder.map((day) => (
            <CalendarDoor
              key={day}
              day={day}
              isOpen={openDoors[day]}
              onOpen={handleDoorOpen}
              contentPreview={calendarData[day]}
            />
          ))}
        </div>
      </div>
      <ContentPopup
        isOpen={!!selectedContent}
        onClose={handleClosePopup}
        content={selectedContent}
      />
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={toggleSettings}
      />
    </div>
  );
};

export default AdventCalendar;