'use client';

import { useEffect, useState } from 'react';
import { DoorContent } from '@/lib/types';
import { X, Gift, Image as ImageIcon, Video, Music, FileText, MessageSquare, Puzzle, Clock, Frame } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ContentModalProps {
  door: DoorContent;
  onClose: () => void;
  darkMode: boolean;
}

export default function ContentModal({ door, onClose, darkMode }: ContentModalProps) {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const getIcon = () => {
    switch (door.type) {
      case 'image':
      case 'gif':
        return <ImageIcon className="w-6 h-6" />;
      case 'video':
        return <Video className="w-6 h-6" />;
      case 'audio':
        return <Music className="w-6 h-6" />;
      case 'text':
        return <FileText className="w-6 h-6" />;
      case 'poll':
        return <MessageSquare className="w-6 h-6" />;
      case 'puzzle':
        return <Puzzle className="w-6 h-6" />;
      case 'countdown':
        return <Clock className="w-6 h-6" />;
      case 'iframe':
        return <Frame className="w-6 h-6" />;
      default:
        return <Gift className="w-6 h-6" />;
    }
  };

  const renderContent = () => {
    switch (door.type) {
      case 'image':
      case 'gif':
        return (
          <div className="relative w-full max-h-[60vh] overflow-hidden rounded-xl">
            <img
              src={door.data || ''}
              alt={`Türchen ${door.day}`}
              className="w-full h-full object-contain"
            />
          </div>
        );

      case 'video':
        return (
          <div className="relative w-full max-h-[60vh] overflow-hidden rounded-xl">
            <video
              src={door.data || ''}
              controls
              className="w-full h-full"
              autoPlay
            />
          </div>
        );

      case 'audio':
        return (
          <div className="w-full p-8">
            <audio
              src={door.data || ''}
              controls
              className="w-full"
              autoPlay
            />
          </div>
        );

      case 'text':
        return (
          <div className={`prose prose-lg max-w-none ${
            darkMode ? 'prose-invert' : ''
          }`}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{door.data || ''}</ReactMarkdown>
          </div>
        );

      case 'iframe':
        return (
          <div className="relative w-full aspect-video overflow-hidden rounded-xl">
            <iframe
              src={door.data || ''}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        );

      case 'countdown':
        return (
          <div className="text-center py-12">
            <Clock className={`w-24 h-24 mx-auto mb-6 ${
              darkMode ? 'text-yellow-400' : 'text-red-600'
            }`} />
            <h3 className={`text-3xl font-bold mb-4 ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Countdown bis Weihnachten!
            </h3>
            <CountdownTimer darkMode={darkMode} />
          </div>
        );

      case 'poll':
        return (
          <div className="text-center py-8">
            <MessageSquare className={`w-16 h-16 mx-auto mb-4 ${
              darkMode ? 'text-yellow-400' : 'text-red-600'
            }`} />
            <p className={darkMode ? 'text-white' : 'text-gray-900'}>
              Umfrage wird geladen...
            </p>
          </div>
        );

      case 'puzzle':
        return (
          <div className="text-center py-8">
            <Puzzle className={`w-16 h-16 mx-auto mb-4 ${
              darkMode ? 'text-yellow-400' : 'text-red-600'
            }`} />
            <p className={darkMode ? 'text-white' : 'text-gray-900'}>
              Puzzle wird geladen...
            </p>
          </div>
        );

      default:
        return (
          <div className="text-center py-8">
            <p className={darkMode ? 'text-white' : 'text-gray-900'}>
              Kein Inhalt verfügbar
            </p>
          </div>
        );
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
      onClick={handleClose}
    >
      {/* Backdrop */}
      <div className={`absolute inset-0 backdrop-blur-md ${
        darkMode ? 'bg-black/60' : 'bg-black/40'
      }`} />

      {/* Modal */}
      <div
        className={`relative max-w-4xl w-full max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl transform transition-all duration-500 ${
          isClosing ? 'scale-95 translate-y-4' : 'scale-100 translate-y-0'
        } ${
          darkMode
            ? 'bg-gradient-to-br from-gray-900 to-gray-800 border-2 border-white/10'
            : 'bg-white'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`sticky top-0 z-10 px-6 py-4 border-b backdrop-blur-md ${
          darkMode
            ? 'border-white/10 bg-gray-900/80'
            : 'border-gray-200 bg-white/80'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${
                darkMode
                  ? 'bg-gradient-to-br from-yellow-400 to-orange-500'
                  : 'bg-gradient-to-br from-red-500 to-pink-500'
              }`}>
                {getIcon()}
              </div>
              <div>
                <h2 className={`text-2xl font-bold ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Türchen {door.day}
                </h2>
                <p className={`text-sm ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {door.type === 'image' && 'Bild'}
                  {door.type === 'video' && 'Video'}
                  {door.type === 'audio' && 'Audio'}
                  {door.type === 'text' && 'Text'}
                  {door.type === 'gif' && 'Animation'}
                  {door.type === 'poll' && 'Umfrage'}
                  {door.type === 'puzzle' && 'Puzzle'}
                  {door.type === 'countdown' && 'Countdown'}
                  {door.type === 'iframe' && 'Eingebettet'}
                </p>
              </div>
            </div>

            <button
              onClick={handleClose}
              className={`p-2 rounded-full transition-all duration-300 hover:scale-110 ${
                darkMode
                  ? 'bg-white/10 hover:bg-white/20 text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
              }`}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {renderContent()}

          {/* Additional Message */}
          {door.text && (
            <div className={`mt-6 p-6 rounded-xl ${
              darkMode
                ? 'bg-white/5 border border-white/10'
                : 'bg-gray-50 border border-gray-200'
            }`}>
              <div className={`prose ${darkMode ? 'prose-invert' : ''}`}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{door.text}</ReactMarkdown>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`px-6 py-4 border-t ${
          darkMode ? 'border-white/10' : 'border-gray-200'
        }`}>
          <button
            onClick={handleClose}
            className={`w-full py-3 rounded-xl font-semibold transition-all duration-300 ${
              darkMode
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white'
                : 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white'
            }`}
          >
            Türchen schließen
          </button>
        </div>
      </div>
    </div>
  );
}

function CountdownTimer({ darkMode }: { darkMode: boolean }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const christmas = new Date(new Date().getFullYear(), 11, 25);
      const now = new Date();
      const diff = christmas.getTime() - now.getTime();

      if (diff > 0) {
        setTimeLeft({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((diff / 1000 / 60) % 60),
          seconds: Math.floor((diff / 1000) % 60),
        });
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid grid-cols-4 gap-4 max-w-2xl mx-auto">
      {Object.entries(timeLeft).map(([unit, value]) => (
        <div
          key={unit}
          className={`p-6 rounded-2xl ${
            darkMode
              ? 'bg-white/10 backdrop-blur-md border border-white/20'
              : 'bg-white shadow-xl border border-gray-200'
          }`}
        >
          <div className={`text-4xl font-bold mb-2 ${
            darkMode ? 'text-yellow-400' : 'text-red-600'
          }`}>
            {value}
          </div>
          <div className={`text-sm uppercase ${
            darkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            {unit === 'days' && 'Tage'}
            {unit === 'hours' && 'Stunden'}
            {unit === 'minutes' && 'Minuten'}
            {unit === 'seconds' && 'Sekunden'}
          </div>
        </div>
      ))}
    </div>
  );
}
