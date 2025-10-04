'use client';

import { Star, Gift } from 'lucide-react';

interface ProgressBarProps {
  openedDoors: number[];
  darkMode: boolean;
}

export default function ProgressBar({ openedDoors, darkMode }: ProgressBarProps) {
  const progress = (openedDoors.length / 24) * 100;

  return (
    <div className={`w-full max-w-4xl mx-auto mb-8 p-6 rounded-2xl backdrop-blur-md ${
      darkMode
        ? 'bg-white/10 border border-white/20'
        : 'bg-white/80 border border-gray-200 shadow-xl'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Gift className={`w-5 h-5 ${darkMode ? 'text-yellow-400' : 'text-red-600'}`} />
          <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Fortschritt
          </span>
        </div>
        <span className={`text-sm font-bold ${darkMode ? 'text-yellow-400' : 'text-red-600'}`}>
          {openedDoors.length} / 24
        </span>
      </div>

      <div className={`relative h-4 rounded-full overflow-hidden ${
        darkMode ? 'bg-white/10' : 'bg-gray-200'
      }`}>
        <div
          className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 transition-all duration-1000 ease-out relative overflow-hidden"
          style={{ width: `${progress}%` }}
        >
          <div className="absolute inset-0 bg-white/30 animate-shimmer" />
        </div>
      </div>

      <div className="flex items-center justify-between mt-3">
        <div className="flex gap-1">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`w-4 h-4 ${
                i < Math.floor(openedDoors.length / 5)
                  ? darkMode ? 'text-yellow-400 fill-yellow-400' : 'text-yellow-500 fill-yellow-500'
                  : darkMode ? 'text-white/20' : 'text-gray-300'
              }`}
            />
          ))}
        </div>
        <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          {openedDoors.length === 24
            ? '🎉 Alle Türchen geöffnet!'
            : `Noch ${24 - openedDoors.length} Türchen zu entdecken`}
        </span>
      </div>
    </div>
  );
}
