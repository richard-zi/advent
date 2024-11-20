import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Play, Pause } from 'lucide-react';
import Dialog from './Dialog';
import ReactMarkdown from 'react-markdown';
import LoadingSpinner from './LoadingSpinner';

const ChristmasCountdown = React.lazy(() => import('./ChristmasCountdown'));
const Poll = React.lazy(() => import('./Poll'));
const SlidingGame = React.lazy(() => import('./SlidingGame'));

const AudioPlayer = ({ src, darkMode }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const audioRef = useRef(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.addEventListener('loadedmetadata', () => {
        setDuration(audioRef.current.duration);
        setIsLoading(false);
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

  if (isLoading) {
    return (
      <div className="w-full max-w-2xl mx-auto p-6 flex justify-center">
        <LoadingSpinner darkMode={darkMode} />
      </div>
    );
  }

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

const VideoPlayer = ({ src, darkMode }) => {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className="relative w-full max-w-3xl mx-auto">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <LoadingSpinner darkMode={true} size="large" />
        </div>
      )}
      <div className="w-full aspect-w-16 aspect-h-9 max-h-[60vh]">
        <video 
          controls 
          className="w-full h-full object-contain bg-black"
          style={{ maxHeight: '60vh' }}
          onLoadedData={() => setIsLoading(false)}
        >
          <source src={src} type="video/mp4" />
          Ihr Browser unterstützt das Video-Tag nicht.
        </video>
      </div>
      </div>
  );
};

const ImageContent = ({ src, alt, darkMode }) => {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className="relative flex justify-center">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <LoadingSpinner darkMode={darkMode} />
        </div>
      )}
      <img 
        src={src} 
        alt={alt} 
        className={`max-w-full h-auto max-h-[60vh] ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        onLoad={() => setIsLoading(false)}
        loading="lazy"
      />
    </div>
  );
};

const GifPlayer = ({ src, darkMode }) => {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className="relative w-full max-w-3xl mx-auto">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <LoadingSpinner darkMode={darkMode} />
        </div>
      )}
      <div className="w-full flex justify-center">
        <img 
          src={src} 
          alt="GIF Animation" 
          className={`max-w-full h-auto max-h-[60vh] object-contain ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
          onLoad={() => setIsLoading(false)}
          loading="lazy"
        />
      </div>
    </div>
  );
};

const LoadingFallback = ({ darkMode }) => (
  <div className="flex justify-center items-center p-8">
    <LoadingSpinner darkMode={darkMode} />
  </div>
);

const ContentPopup = ({ isOpen, onClose, content, darkMode, doorStates, setDoorStates }) => {
  const [contentLoading, setContentLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setContentLoading(true);
      const timer = setTimeout(() => setContentLoading(false), 500);
      return () => clearTimeout(timer);
    }
  }, [isOpen, content]);

  if (!content) return null;

  const darkModeClass = darkMode 
    ? 'prose-invert prose-headings:text-white prose-p:text-white prose-strong:text-white prose-em:text-white prose-ul:text-white prose-ol:text-white prose-li:text-white prose-a:text-blue-300'
    : '';

  const renderContent = () => {
    if (contentLoading) {
      return <LoadingFallback darkMode={darkMode} />;
    }

    switch (content.type) {
      case 'countdown':
        return (
          <Suspense fallback={<LoadingFallback darkMode={darkMode} />}>
            <div className="mt-6">
              <ChristmasCountdown darkMode={darkMode} />
            </div>
          </Suspense>
        );
      case 'poll':
        return (
          <Suspense fallback={<LoadingFallback darkMode={darkMode} />}>
            <Poll doorNumber={content.day} darkMode={darkMode} />
          </Suspense>
        );
      case 'text':
        return (
          <div className={`prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none ${darkModeClass}`}>
            <ReactMarkdown>{content.data}</ReactMarkdown>
          </div>
        );
      case 'video':
        return <VideoPlayer src={content.data} darkMode={darkMode} />;
      case 'gif':
        return <GifPlayer src={content.data} darkMode={darkMode} />;
      case 'audio':
        return <AudioPlayer src={content.data} darkMode={darkMode} />;
      case 'image':
        return <ImageContent src={content.data} alt="Bild" darkMode={darkMode} />;
      case 'puzzle':
        return (
          <Suspense fallback={<LoadingFallback darkMode={darkMode} />}>
            <div className="flex justify-center">
              <SlidingGame 
                imageUrl={content.data} 
                doorStates={doorStates} 
                setDoorStates={setDoorStates} 
                day={content.day}
              />
            </div>
          </Suspense>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} darkMode={darkMode}>
      <div className="space-y-8">
        <div className="text-center">
          <h2 className={`text-4xl sm:text-5xl font-bold ${
            darkMode ? 'text-white' : 'text-gray-800'
          }`}>
            Türchen {content.day}
          </h2>
        </div>

        <div>{renderContent()}</div>

        {content.text && !contentLoading && (
          <div className={`prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none text-center ${darkModeClass}`}>
            <ReactMarkdown>{content.text}</ReactMarkdown>
          </div>
        )}
      </div>
    </Dialog>
  );
};

export default ContentPopup;