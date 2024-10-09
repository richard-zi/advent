// src/components/AdventCalendar.js
import React, { useState, useEffect } from 'react';
import CalendarDoor from './CalendarDoor';
import ContentPopup from './ContentPopup';

const AdventCalendar = () => {
  // State to manage the doors that have been opened
  const [openDoors, setOpenDoors] = useState({});
  // State to manage the data for each calendar door
  const [calendarData, setCalendarData] = useState({});
  // State to manage the currently selected door content for popup
  const [selectedContent, setSelectedContent] = useState(null);

  // Fetch calendar data on component mount
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
    // Mark the door as opened
    setOpenDoors(prev => ({ ...prev, [day]: true }));
    // Set the selected content for the popup
    setSelectedContent({ day, ...calendarData[day] });
  };

  const handleClosePopup = () => {
    // Close the popup by clearing the selected content
    setSelectedContent(null);
  };

  // Create an array representing the 24 doors of the advent calendar
  const doorLayout = Array.from({ length: 24 }, (_, index) => ({ day: index + 1, size: 'large' }));

  return (
    <div className="min-h-screen bg-gradient-to-r from-gray-100 to-gray-300 flex flex-col justify-center items-center p-8">
      <h1 className="text-5xl font-extrabold text-center mb-10 text-gray-800 drop-shadow-lg">Adventskalender</h1>
      <div className="w-full max-w-6xl p-6">
        {/* Render a grid of calendar doors */}
        <div className="grid grid-cols-6 grid-rows-4 gap-4">
          {doorLayout.map(({ day, size }) => (
            <CalendarDoor
              key={day}
              day={day}
              isOpen={openDoors[day]}
              onOpen={handleDoorOpen}
              size={size}
              contentPreview={calendarData[day]}
            />
          ))}
        </div>
      </div>
      {/* Render the content popup if a door has been opened */}
      <ContentPopup
        isOpen={!!selectedContent}
        onClose={handleClosePopup}
        content={selectedContent}
      />
    </div>
  );
};

export default AdventCalendar;