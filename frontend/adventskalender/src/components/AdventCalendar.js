// src/components/AdventCalendar.js
import React, { useState, useEffect } from 'react';
import CalendarDoor from './CalendarDoor';
import ContentPopup from './ContentPopup';

const AdventCalendar = () => {
  const [openDoors, setOpenDoors] = useState({});
  const [calendarData, setCalendarData] = useState({});
  const [selectedContent, setSelectedContent] = useState(null);

  useEffect(() => {
    fetchCalendarData();
  }, []);

  const fetchCalendarData = async () => {
    // Simulierter API-Aufruf
    const mockData = {
      1: { type: 'text', data: "Frohe Weihnachten!" },
      2: { type: 'video', data: "/api/placeholder/400/320" },
      3: { type: 'audio', data: "https://example.com/jingle-bells.mp3" },
      // ... weitere Tage
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

  const doorLayout = Array.from({ length: 24 }, (_, index) => ({ day: index + 1, size: 'large' }));

  return (
    <div className="min-h-screen bg-gradient-to-r from-red-100 to-green-100 flex flex-col justify-center items-center p-4">
      <h1 className="text-4xl font-bold text-center mb-6 text-green-800">Adventskalender</h1>
      <div className="w-full max-w-7xl p-4">
        <div className="grid grid-cols-6 grid-rows-4 gap-4">
          {doorLayout.map(({ day, size }) => (
            <CalendarDoor
              key={day}
              day={day}
              isOpen={openDoors[day]}
              onOpen={handleDoorOpen}
              size={size}
            />
          ))}
        </div>
      </div>
      <ContentPopup
        isOpen={!!selectedContent}
        onClose={handleClosePopup}
        content={selectedContent}
      />
    </div>
  );
};

export default AdventCalendar;
