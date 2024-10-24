import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Play, Pause } from 'lucide-react';
import Dialog from './Dialog';
import ChristmasCountdown from './ChristmasCountdown';
import Poll from './Poll';

const AudioPlayer = ({ src, darkMode }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.addEventListener('loadedmetadata', () => {
        setDuration(audioRef.current.duration);
      });
      audioRef.current.addEventListener('timeupdate', () => {
        setCurrentTime(audioRef.current.currentTime);
      });
    }
  }, []);

  const togglePlay = () => {
    if (audioRef.current.paused) {
      audioRef.current.play();
      setIsPlaying(true);
    } else {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleSeek = (e) => {
    const newTime = e.target.value;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className={`w-full max-w-2xl mx-auto p-6 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
      <audio ref={audioRef} src={src} className="hidden" />
      
      <div className="flex items-center space-x-4">
        <button
          onClick={togglePlay}
          className={`p-4 rounded-full ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} transition-colors duration-200`}
        >
          {isPlaying ? 
            <Pause className={`w-6 h-6 ${darkMode ? 'text-white' : 'text-gray-800'}`} /> : 
            <Play className={`w-6 h-6 ${darkMode ? 'text-white' : 'text-gray-800'}`} />
          }
        </button>
        
        <div className="flex-1">
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="w-full cursor-pointer"
          />
        </div>
        
        <div className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          {formatTime(duration - currentTime)}
        </div>
      </div>
    </div>
  );
};

const VideoPlayer = ({ src }) => {
  return (
    <div className="relative w-full max-w-3xl mx-auto">
      <div className="w-full aspect-w-16 aspect-h-9 max-h-[60vh]">
        <video 
          controls 
          className="w-full h-full object-contain bg-black"
          style={{ maxHeight: '60vh' }}
        >
          <source src={src} type="video/mp4" />
          Ihr Browser unterstützt das Video-Tag nicht.
        </video>
      </div>
    </div>
  );
};

const GifPlayer = ({ src }) => {
  return (
    <div className="relative w-full max-w-3xl mx-auto">
      <div className="w-full flex justify-center">
        <img 
          src={src} 
          alt="GIF Animation" 
          className="max-w-full h-auto max-h-[60vh] object-contain"
        />
      </div>
    </div>
  );
};

const ContentPopup = ({ isOpen, onClose, content, darkMode }) => {
  if (!content) return null;

  const darkModeClass = darkMode 
    ? 'prose-invert prose-headings:text-white prose-p:text-white prose-strong:text-white prose-em:text-white prose-ul:text-white prose-ol:text-white prose-li:text-white prose-a:text-blue-300'
    : '';

    const renderContent = () => {
      switch (content.type) {
        case 'countdown':
          return (
            <div className="mt-6">
              <ChristmasCountdown darkMode={darkMode} />
            </div>
          );
        case 'poll':
          return <Poll doorNumber={content.day} darkMode={darkMode} />;
        case 'text':
          return (
            <div className={`prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none ${darkModeClass}`}>
              <ReactMarkdown>{content.data}</ReactMarkdown>
            </div>
          );
        case 'video':
          return <VideoPlayer src={content.data} />;
        case 'gif':
          return <GifPlayer src={content.data} />;
        case 'audio':
          return <AudioPlayer src={content.data} darkMode={darkMode} />;
        case 'image':
          return (
            <div className="flex justify-center">
              <img src={content.data} alt="Bild" className="max-w-full h-auto max-h-[60vh]" />
            </div>
          );
        default:
          return null;
      }
    };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} darkMode={darkMode}>
      <div className="space-y-8">
        {/* Türchen Titel kommt zuerst */}
        <div className="text-center">
          <h2 className={`text-4xl sm:text-5xl font-bold ${
            darkMode ? 'text-white' : 'text-gray-800'
          }`}>
            Türchen {content.day}
          </h2>
          
          {/* Countdown direkt unter dem Titel, wenn es ein Countdown-Typ ist */}
          {content.type === 'countdown' && (
            <div className="mt-6">
              <ChristmasCountdown darkMode={darkMode} />
            </div>
          )}
        </div>

        {/* Andere Content-Typen */}
        {content.type !== 'countdown' && (
          <div>{renderContent()}</div>
        )}

        {/* Message/Text wird immer am Ende angezeigt */}
        {content.text && (
          <div className={`prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none text-center ${darkModeClass}`}>
            <ReactMarkdown>{content.text}</ReactMarkdown>
          </div>
        )}
      </div>
    </Dialog>
  );
};

export default ContentPopup;