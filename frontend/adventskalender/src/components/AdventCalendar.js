import React, { useState, useEffect } from 'react';
import CalendarDoor from './CalendarDoor';
import ContentPopup from './ContentPopup';
import axios from 'axios'; 

const AdventCalendar = () => {
  const [openDoors, setOpenDoors] = useState({});
  const [calendarData, setCalendarData] = useState({});
  const [selectedContent, setSelectedContent] = useState(null);

  useEffect(() => {
    fetchCalendarData();
  }, []);

  const fetchCalendarData = async () => {
    // Mock API call to fetch calendar data
    try {
      const response = await axios.get('http://localhost:5000/api/');  // WIP
      console.log(response.data); 
      setCalendarData(response.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    /*
    const mockData = {
      1: { type: 'text', data: "Frohe Weihnachten!" },
      2: { type: 'video', data: "/api/placeholder/400/320", text: "Schöne Weihnachtszeit!" },
      3: { type: 'audio', data: "https://example.com/jingle-bells.mp3", text: "Weihnachtsmusik zum Genießen" },
      4: { type: 'image', data: "https://example.com/image.jpg", text: "Ein schönes Weihnachtsbild" },
      5: { type: 'text', data: "Dies ist ein sehr langer Text, der abgeschnitten werden muss, wenn er zu lang ist, um in das Türchen zu passen." },
      // ... more days
    */
      };
  };
  const handleDoorOpen = (day) => {
    console.log(calendarData);
    setOpenDoors(prev => ({ ...prev, [day]: true }));
    setSelectedContent({ day, ...calendarData[day] });
  };

  const handleClosePopup = () => {
    setSelectedContent(null);
  };

  const doorLayout = Array.from({ length: 24 }, (_, index) => ({ day: index + 1 }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col justify-center items-center p-4 sm:p-8">
      <h1 className="text-4xl sm:text-6xl font-bold text-center mb-8 sm:mb-12 text-gray-800 tracking-tight">
        Adventskalender
      </h1>
      <div className="w-full max-w-5xl sm:max-w-7xl p-6 sm:p-8 bg-white bg-opacity-70 backdrop-filter backdrop-blur-sm rounded-2xl shadow-md">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          {doorLayout.map(({ day }) => (
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
    </div>
  );
};

export default AdventCalendar;