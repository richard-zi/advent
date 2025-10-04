'use client';

import { useState, useEffect } from 'react';
import { DoorContent } from '@/lib/types';
import { Gift, Star, Sparkles, Lock, Check } from 'lucide-react';
import Snowfall from '@/components/Snowfall';
import ContentModal from '@/components/ContentModal';

export default function Home() {
  const [doors, setDoors] = useState<DoorContent[]>([]);
  const [openedDoors, setOpenedDoors] = useState<number[]>([]);
  const [selectedDoor, setSelectedDoor] = useState<DoorContent | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showSnow, setShowSnow] = useState(true);
  const [title, setTitle] = useState('Adventskalender 2024');
  const [description, setDescription] = useState('Öffne jeden Tag ein neues Türchen und entdecke die Überraschung! 🎁');
  const [startDate, setStartDate] = useState<Date | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('openedDoors');
    if (stored) setOpenedDoors(JSON.parse(stored));

    const darkModeStored = localStorage.getItem('darkMode');
    if (darkModeStored) setDarkMode(JSON.parse(darkModeStored));

    const snowPref = localStorage.getItem('showSnow');
    if (snowPref !== null) setShowSnow(JSON.parse(snowPref));

    fetchDoors();
    fetchSettings();
  }, []);

  useEffect(() => {
    localStorage.setItem('openedDoors', JSON.stringify(openedDoors));
  }, [openedDoors]);

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('showSnow', JSON.stringify(showSnow));
  }, [showSnow]);

  const fetchDoors = async () => {
    try {
      // Only fetch door status, not content
      const response = await fetch('/api/doors/status');
      const data = await response.json();

      const doorsArray: DoorContent[] = Object.entries(data).map(([key, value]: [string, any]) => ({
        day: parseInt(key),
        type: (value.isAvailable && value.hasContent ? 'locked' : 'not available yet') as DoorContent['type'],
        data: null,
        text: null,
        thumbnail: null,
      }));

      setDoors(doorsArray);
    } catch (error) {
      console.error('Error fetching doors:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      const data = await response.json();

      if (data.title) setTitle(data.title);
      if (data.description) setDescription(data.description);
      if (data.startDate) setStartDate(new Date(data.startDate));
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const handleDoorClick = async (door: DoorContent) => {
    if (!door.day || !startDate) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const doorDate = new Date(startDate);
    doorDate.setDate(doorDate.getDate() + (door.day - 1));
    doorDate.setHours(0, 0, 0, 0);

    if (today >= doorDate && door.type !== 'not available yet') {
      // Fetch content only when door is clicked
      try {
        const response = await fetch(`/api/doors/${door.day}`);

        if (response.status === 403) {
          alert('Dieses Türchen ist noch nicht verfügbar!');
          return;
        }

        if (!response.ok) {
          alert('Fehler beim Laden des Inhalts');
          return;
        }

        const content = await response.json();
        setSelectedDoor({ ...content, day: door.day });

        if (!openedDoors.includes(door.day)) {
          setOpenedDoors([...openedDoors, door.day]);
        }
      } catch (error) {
        console.error('Error loading door content:', error);
        alert('Fehler beim Laden des Inhalts');
      }
    }
  };

  const isDoorAvailable = (day: number) => {
    if (!startDate) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const doorDate = new Date(startDate);
    doorDate.setDate(doorDate.getDate() + (day - 1));
    doorDate.setHours(0, 0, 0, 0);

    return today >= doorDate;
  };

  const isDoorOpened = (day: number) => openedDoors.includes(day);

  // Define door layout with sizes and order - beautifully arranged
  const doorLayout = [
    // Row 1
    { day: 1, span: 'col-span-2 row-span-2', size: 'large' as const },
    { day: 2, span: 'col-span-1 row-span-1', size: 'small' as const },
    { day: 3, span: 'col-span-1 row-span-1', size: 'small' as const },
    { day: 4, span: 'col-span-2 row-span-1', size: 'medium' as const },
    { day: 5, span: 'col-span-1 row-span-2', size: 'medium' as const },
    { day: 6, span: 'col-span-1 row-span-1', size: 'small' as const },

    // Row 2
    { day: 7, span: 'col-span-1 row-span-1', size: 'small' as const },
    { day: 8, span: 'col-span-1 row-span-1', size: 'small' as const },
    { day: 9, span: 'col-span-2 row-span-1', size: 'medium' as const },
    { day: 10, span: 'col-span-1 row-span-1', size: 'small' as const },

    // Row 3 - Featured row with 24
    { day: 11, span: 'col-span-1 row-span-1', size: 'small' as const },
    { day: 12, span: 'col-span-1 row-span-2', size: 'medium' as const },
    { day: 24, span: 'col-span-3 row-span-3', size: 'xlarge' as const }, // Big centerpiece!
    { day: 13, span: 'col-span-1 row-span-1', size: 'small' as const },
    { day: 14, span: 'col-span-1 row-span-2', size: 'medium' as const },
    { day: 15, span: 'col-span-1 row-span-1', size: 'small' as const },

    // Row 4
    { day: 16, span: 'col-span-1 row-span-1', size: 'small' as const },
    { day: 17, span: 'col-span-1 row-span-1', size: 'small' as const },
    { day: 18, span: 'col-span-1 row-span-1', size: 'small' as const },

    // Row 5
    { day: 19, span: 'col-span-2 row-span-1', size: 'medium' as const },
    { day: 20, span: 'col-span-1 row-span-1', size: 'small' as const },
    { day: 21, span: 'col-span-2 row-span-2', size: 'large' as const },
    { day: 22, span: 'col-span-1 row-span-1', size: 'small' as const },
    { day: 23, span: 'col-span-1 row-span-1', size: 'small' as const },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-red-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-t-4 border-b-4 border-white mb-4 mx-auto"></div>
          <p className="text-white text-2xl font-light">Lade Adventskalender...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-500 ${
      darkMode
        ? 'bg-gradient-to-br from-indigo-950 via-purple-950 to-pink-950'
        : 'bg-gradient-to-br from-blue-50 via-red-50 to-purple-50'
    }`}>
      {showSnow && <Snowfall darkMode={darkMode} />}

      {/* Decorative Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-40 -right-40 w-96 h-96 rounded-full blur-3xl opacity-20 ${
          darkMode ? 'bg-purple-500' : 'bg-red-300'
        }`} />
        <div className={`absolute -bottom-40 -left-40 w-96 h-96 rounded-full blur-3xl opacity-20 ${
          darkMode ? 'bg-pink-500' : 'bg-blue-300'
        }`} />
      </div>

      {/* Header */}
      <header className="relative z-10 pt-8 pb-6">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Sparkles className={`w-8 h-8 ${darkMode ? 'text-yellow-400' : 'text-red-600'}`} />
              <h1 className={`text-3xl md:text-4xl font-bold ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {title}
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowSnow(!showSnow)}
                className={`px-4 py-2 rounded-full transition-all duration-300 ${
                  darkMode
                    ? 'bg-white/10 hover:bg-white/20 text-white backdrop-blur-md'
                    : 'bg-white/80 hover:bg-white shadow-lg text-gray-900'
                }`}
              >
                {showSnow ? '❄️ Schnee An' : '❄️ Schnee Aus'}
              </button>

              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`px-4 py-2 rounded-full transition-all duration-300 ${
                  darkMode
                    ? 'bg-white/10 hover:bg-white/20 text-white backdrop-blur-md'
                    : 'bg-white/80 hover:bg-white shadow-lg text-gray-900'
                }`}
              >
                {darkMode ? '☀️ Hell' : '🌙 Dunkel'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 pb-16">
        {/* Subtitle */}
        <div className="text-center mb-12">
          <p className={`text-lg md:text-xl ${
            darkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>
            {description}
          </p>
        </div>

        {/* Calendar Grid - Balanced Masonry Layout */}
        <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-9 auto-rows-[minmax(90px,1fr)] gap-3 md:gap-4 max-w-7xl mx-auto p-4">
          {doorLayout.map(({ day, span, size }) => {
            const door = doors.find(d => d.day === day);
            const available = isDoorAvailable(day);
            const opened = isDoorOpened(day);
            const hasContent = door && door.type !== 'not available yet';

            return (
              <button
                key={day}
                onClick={() => door && handleDoorClick(door)}
                disabled={!available || !hasContent}
                className={`
                  group relative ${span} rounded-2xl transition-all duration-500
                  transform hover:scale-[1.03] hover:-translate-y-1
                  ${available && hasContent ? 'cursor-pointer' : 'cursor-not-allowed'}
                  ${opened ? 'animate-pulse-slow' : ''}
                  ${size === 'xlarge' ? 'shadow-2xl' : ''}
                `}
                style={{
                  transformStyle: 'preserve-3d',
                  perspective: '1000px',
                }}
              >
                {/* Glassmorphism Background */}
                <div className={`
                  absolute inset-0 rounded-2xl transition-all duration-500
                  ${darkMode
                    ? available && hasContent
                      ? opened
                        ? 'bg-gradient-to-br from-emerald-500/40 to-teal-500/40 backdrop-blur-md border-2 border-emerald-400/60 shadow-xl shadow-emerald-500/30'
                        : 'bg-gradient-to-br from-purple-500/25 to-pink-500/25 backdrop-blur-md border-2 border-purple-400/50 hover:border-pink-400/70 hover:from-purple-500/35 hover:to-pink-500/35'
                      : 'bg-white/5 backdrop-blur-sm border-2 border-white/20'
                    : available && hasContent
                      ? opened
                        ? 'bg-gradient-to-br from-green-400 to-emerald-500 shadow-2xl shadow-green-500/50'
                        : 'bg-white/90 backdrop-blur-md shadow-xl hover:shadow-2xl border-2 border-white/50'
                      : 'bg-white/40 backdrop-blur-sm border-2 border-white/30'
                  }
                  ${available && hasContent && !opened ? 'group-hover:shadow-2xl group-hover:shadow-pink-500/50' : ''}
                `}>
                  {/* Shine Effect */}
                  {available && hasContent && !opened && (
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />
                  )}

                  {/* Sparkle Effect for Available Doors */}
                  {available && hasContent && !opened && darkMode && (
                    <>
                      <div className="absolute top-2 right-2 w-2 h-2 bg-yellow-300 rounded-full animate-pulse" />
                      <div className="absolute bottom-2 left-2 w-1.5 h-1.5 bg-pink-300 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
                    </>
                  )}
                </div>

                {/* Content */}
                <div className="relative z-10 h-full flex flex-col items-center justify-center p-4">
                  {/* Day Number */}
                  <div className={`
                    font-bold mb-2 transition-all duration-300
                    ${size === 'xlarge' ? 'text-6xl md:text-8xl' :
                      size === 'large' ? 'text-5xl md:text-6xl' :
                      size === 'medium' ? 'text-4xl md:text-5xl' :
                      'text-3xl md:text-4xl'}
                    ${darkMode
                      ? opened
                        ? 'text-emerald-300 drop-shadow-lg'
                        : available && hasContent
                          ? 'text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] group-hover:text-yellow-300 group-hover:drop-shadow-[0_0_20px_rgba(250,204,21,0.8)]'
                          : 'text-white/30'
                      : opened
                        ? 'text-white'
                        : available && hasContent
                          ? 'text-gray-800 group-hover:text-red-600'
                          : 'text-gray-400'
                    }
                  `}>
                    {day}
                  </div>

                  {/* Icon */}
                  <div className="transition-transform duration-300 group-hover:scale-110">
                    {!available || !hasContent ? (
                      <Lock className={`${size === 'xlarge' ? 'w-10 h-10' : size === 'large' ? 'w-8 h-8' : 'w-6 h-6'} ${darkMode ? 'text-white/30' : 'text-gray-400'}`} />
                    ) : opened ? (
                      <Check className={`${size === 'xlarge' ? 'w-10 h-10' : size === 'large' ? 'w-8 h-8' : 'w-6 h-6'} ${darkMode ? 'text-emerald-300' : 'text-white'}`} />
                    ) : (
                      <Gift className={`${size === 'xlarge' ? 'w-10 h-10' : size === 'large' ? 'w-8 h-8' : 'w-6 h-6'} ${
                        darkMode
                          ? 'text-white group-hover:text-yellow-300'
                          : 'text-red-600 group-hover:text-red-700'
                      }`} />
                    )}
                  </div>

                  {/* Star decoration for opened */}
                  {opened && (
                    <Star className={`w-4 h-4 mt-2 ${
                      darkMode ? 'text-yellow-400' : 'text-yellow-300'
                    } animate-pulse`} />
                  )}
                </div>

                {/* Glow effect for available doors */}
                {available && hasContent && !opened && (
                  <div className={`
                    absolute -inset-2 rounded-2xl opacity-0 group-hover:opacity-100
                    transition-opacity duration-500 blur-2xl -z-10
                    ${darkMode
                      ? 'bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-500'
                      : 'bg-gradient-to-r from-red-500 to-orange-500'}
                  `} />
                )}

                {/* Extra glow for XLarge door (24) */}
                {available && hasContent && !opened && size === 'xlarge' && darkMode && (
                  <div className="absolute -inset-4 rounded-2xl opacity-40 bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500 blur-3xl -z-20 animate-pulse" />
                )}
              </button>
            );
          })}
        </div>

        {/* Stats */}
        <div className="mt-12 text-center">
          <div className={`inline-flex items-center gap-4 px-8 py-4 rounded-full ${
            darkMode
              ? 'bg-white/10 backdrop-blur-md border border-white/20'
              : 'bg-white/80 backdrop-blur-md shadow-xl'
          }`}>
            <div className="flex items-center gap-2">
              <Gift className={`w-5 h-5 ${darkMode ? 'text-yellow-400' : 'text-red-600'}`} />
              <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {openedDoors.length} / 24 Türchen geöffnet
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* Content Modal */}
      {selectedDoor && (
        <ContentModal
          door={selectedDoor}
          onClose={() => setSelectedDoor(null)}
          darkMode={darkMode}
        />
      )}
    </div>
  );
}
