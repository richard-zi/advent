import React, { useState, useEffect, useRef } from 'react';
import { Settings } from 'lucide-react';
import CalendarDoor from './CalendarDoor';
import ContentPopup from './ContentPopup';
import SettingsModal from './SettingsModal';
import Snowfall from './Snowfall';
import axios from 'axios'; 

const AdventCalendar = () => {
  localStorage.clear() // Für Debuggingzwecke
  const [openDoors, setOpenDoors] = useState(() => {
    const saved = localStorage.getItem('openDoors');
    return saved ? JSON.parse(saved) : {};
  });
  const [calendarData, setCalendarData] = useState({});
  const [selectedContent, setSelectedContent] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved !== null ? JSON.parse(saved) : true; // Default to true
  });
  const [snowfall, setSnowfall] = useState(() => {
    const saved = localStorage.getItem('snowfall');
    return saved !== null ? JSON.parse(saved) : true; // Default to true
  });
  const settingsRef = useRef(null);

  // Predefined order of doors
  const doorOrder = [
    7, 15, 1, 24, 10, 4, 18, 12, 3, 22,
    9, 20, 6, 17, 2, 13, 5, 23, 11, 16,
    19, 8, 21, 14
  ];

  useEffect(() => {
    fetchCalendarData();
  }, []);

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
      1: { type: 'text', data: `# Willkommen zum Adventskalender!
  
  ## Markdown-Funktionen
  
  ### 1. Textformatierung
  
  Dies ist ein **fettgedruckter** Text und dies ist *kursiv*. Du kannst auch ***beides kombinieren***.
  Das ist ein text
  ### 2. Listen
  
  Ungeordnete Liste:
  - Erstes Item
  - Zweites Item
    - Unterpunkt
  - Drittes Item
  
  Geordnete Liste:
  1. Erster Punkt
  2. Zweiter Punkt
  3. Dritter Punkt
  
  ### 3. Links
  
  Hier ist ein [Link zur Weihnachtsseite](https://de.wikipedia.org/wiki/Weihnachten).
  
  ### 4. Bilder
  
  ![Weihnachtsbaum](https://example.com/weihnachtsbaum.jpg)
  
  ### 5. Blockzitate
  
  > Weihnachten ist die Zeit, in der die Menschen nach Hause kommen.
  > 
  > -- Marjorie Holmes
  
  ### 6. Code
  
  Inline-Code: \`console.log("Frohe Weihnachten!")\`
  
  Code-Block:
  \`\`\`javascript
  function weihnachtsGruß(name) {
    return \`Frohe Weihnachten, \${name}!\`;
  }
  
  console.log(weihnachtsGruß("Welt"));
  \`\`\`
  
  ### 7. Horizontale Linie
  
  ---
  
  ### 8. Tabellen
  
  | Datum | Ereignis |
  |-------|----------|
  | 24.12 | Heiligabend |
  | 25.12 | 1. Weihnachtstag |
  | 26.12 | 2. Weihnachtstag |
  
  ### 9. Aufgabenliste
  
  - [x] Weihnachtsbaum schmücken
  - [ ] Geschenke einpacken
  - [ ] Plätzchen backen
  
  ### 10. Fußnoten
  
  Hier ist eine Fußnote[^1].
  
  [^1]: Dies ist der Fußnotentext.
  
  Viel Spaß beim Entdecken des Adventskalenders!` },
      2: { type: 'video', data: "/api/placeholder/400/320", text: "Schöne Weihnachtszeit!" },
      3: { type: 'audio', data: "https://example.com/jingle-bells.mp3", text: "Weihnachtsmusik zum Genießen" },
      4: { type: 'image', data: "https://example.com/image.jpg", text: "Ein schönes Weihnachtsbild" },
      5: { type: 'text', data: "Dies ist ein sehr langer Text, der abgeschnitten werden muss, wenn er zu lang ist, um in das Türchen zu passen." },
      // ... more days
    */
      };
  };
  const handleDoorOpen = (day) => {
    if (!calendarData[day]) {
      setSelectedContent({"type" : "error"});

    } else  {
      if (calendarData[day].type !== "not available yet") {
        setOpenDoors(prev => ({ ...prev, [day]: true }));
      }
      setSelectedContent({ day, ...calendarData[day] });
    }
    
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
    <div className={`min-h-screen bg-gradient-to-br ${darkMode ? 'from-gray-800 to-gray-900' : 'from-gray-50 to-gray-100'} flex flex-col items-center pt-4 sm:pt-8 md:pt-12 p-2 sm:p-4 relative transition-colors duration-300`}>
      <Snowfall isActive={snowfall} />
      <div ref={settingsRef} className="absolute top-4 right-4">
        <button
          onClick={toggleSettings}
          className={`p-2 ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white hover:bg-gray-100'} rounded-full shadow-md transition-colors duration-200`}
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
      <h1 className={`text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-4 sm:mb-6 ${darkMode ? 'text-gray-100' : 'text-gray-800'} tracking-tight transition-colors duration-300`}>
        Adventskalender
      </h1>
      <div className={`w-full max-w-xs sm:max-w-2xl md:max-w-4xl lg:max-w-5xl p-2 sm:p-4 ${darkMode ? 'bg-gray-800 bg-opacity-70' : 'bg-white bg-opacity-70'} backdrop-filter backdrop-blur-sm rounded-2xl shadow-md transition-colors duration-300`}>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 sm:gap-3">
          {doorOrder.map((day) => (
            <CalendarDoor
              key={day}
              day={day}
              isOpen={openDoors[day]}
              onOpen={handleDoorOpen}
              contentPreview={calendarData[day]}
              darkMode={darkMode}
            />
          ))}
        </div>
      </div>
      <ContentPopup
        isOpen={!!selectedContent}
        onClose={handleClosePopup}
        content={selectedContent}
        darkMode={darkMode}
      />
    </div>
  );
};

export default AdventCalendar;