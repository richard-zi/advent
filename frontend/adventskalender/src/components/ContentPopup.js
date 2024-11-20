import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Play, Pause } from 'lucide-react';
import Dialog from './Dialog';
import ReactMarkdown from 'react-markdown';
import LoadingSpinner from './LoadingSpinner';

const ChristmasCountdown = React.lazy(() => import('./ChristmasCountdown'));
const Poll = React.lazy(() => import('./Poll'));
const SlidingGame = React.lazy(() => import('./SlidingGame'));

const CACHE_PREFIX = 'content-';

const AudioPlayer = ({ src, darkMode }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const audioRef = useRef(null);

  useEffect(() => {
    const cached = localStorage.getItem(`${CACHE_PREFIX}audio-${src}`);
    if (cached) {
      setIsLoading(false);
    }

    if (audioRef.current) {
      audioRef.current.addEventListener('loadedmetadata', () => {
        setDuration(audioRef.current.duration);
        setIsLoading(false);
        localStorage.setItem(`${CACHE_PREFIX}audio-${src}`, 'loaded');
      });
      audioRef.current.addEventListener('timeupdate', () => {
        setCurrentTime(audioRef.current.currentTime);
      });
    }
  }, [src]);

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
  const videoRef = useRef(null);

  useEffect(() => {
    const cached = localStorage.getItem(`${CACHE_PREFIX}video-${src}`);
    if (cached) {
      setIsLoading(false);
    }
  }, [src]);

  const handleLoadedData = () => {
    setIsLoading(false);
    localStorage.setItem(`${CACHE_PREFIX}video-${src}`, 'loaded');
  };

  return (
    <div className="relative w-full max-w-3xl mx-auto">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
        <LoadingSpinner darkMode={true} size="large" />
      </div>
    )}
    <div className="w-full aspect-w-16 aspect-h-9 max-h-[60vh]">
      <video 
        ref={videoRef}
        controls 
        className="w-full h-full object-contain bg-black"
        style={{ maxHeight: '60vh' }}
        onLoadedData={handleLoadedData}
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
const [imageSrc, setImageSrc] = useState(() => {
  const cached = localStorage.getItem(`${CACHE_PREFIX}image-${src}`);
  return cached || null;
});

useEffect(() => {
  if (src && !imageSrc) {
    const img = new Image();
    img.onload = () => {
      setImageSrc(src);
      setIsLoading(false);
      localStorage.setItem(`${CACHE_PREFIX}image-${src}`, src);
    };
    img.src = src;
  } else if (imageSrc) {
    setIsLoading(false);
  }
}, [src, imageSrc]);

return (
  <div className="relative flex justify-center">
    {isLoading && (
      <div className="absolute inset-0 flex items-center justify-center">
        <LoadingSpinner darkMode={darkMode} />
      </div>
    )}
    {imageSrc && (
      <img 
        src={imageSrc} 
        alt={alt} 
        className={`max-w-full h-auto max-h-[60vh] ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        loading="lazy"
      />
    )}
  </div>
);
};

const GifPlayer = ({ src, darkMode }) => {
const [isLoading, setIsLoading] = useState(true);
const [gifSrc, setGifSrc] = useState(() => {
  const cached = localStorage.getItem(`${CACHE_PREFIX}gif-${src}`);
  return cached || null;
});

useEffect(() => {
  if (src && !gifSrc) {
    const img = new Image();
    img.onload = () => {
      setGifSrc(src);
      setIsLoading(false);
      localStorage.setItem(`${CACHE_PREFIX}gif-${src}`, src);
    };
    img.src = src;
  } else if (gifSrc) {
    setIsLoading(false);
  }
}, [src, gifSrc]);

return (
  <div className="relative w-full max-w-3xl mx-auto">
    {isLoading && (
      <div className="absolute inset-0 flex items-center justify-center">
        <LoadingSpinner darkMode={darkMode} />
      </div>
    )}
    {gifSrc && (
      <div className="w-full flex justify-center">
        <img 
          src={gifSrc} 
          alt="GIF Animation" 
          className={`max-w-full h-auto max-h-[60vh] object-contain ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
          loading="lazy"
        />
      </div>
    )}
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
const [cachedContent, setCachedContent] = useState(() => {
  if (!content) return null;
  const cached = localStorage.getItem(`${CACHE_PREFIX}popup-${content.day}`);
  return cached ? JSON.parse(cached) : null;
});

useEffect(() => {
  if (isOpen && content) {
    const cached = localStorage.getItem(`${CACHE_PREFIX}popup-${content.day}`);
    if (cached) {
      setCachedContent(JSON.parse(cached));
      setContentLoading(false);
    } else {
      setContentLoading(true);
      const timer = setTimeout(() => {
        setCachedContent(content);
        localStorage.setItem(`${CACHE_PREFIX}popup-${content.day}`, JSON.stringify(content));
        setContentLoading(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }
}, [isOpen, content]);

if (!content && !cachedContent) return null;

const displayContent = cachedContent || content;

const darkModeClass = darkMode 
  ? 'prose-invert prose-headings:text-white prose-p:text-white prose-strong:text-white prose-em:text-white prose-ul:text-white prose-ol:text-white prose-li:text-white prose-a:text-blue-300'
  : '';

const renderContent = () => {
  if (contentLoading) {
    return <LoadingFallback darkMode={darkMode} />;
  }

  switch (displayContent.type) {
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
          <Poll doorNumber={displayContent.day} darkMode={darkMode} />
        </Suspense>
      );
    case 'text':
      return (
        <div className={`prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none ${darkModeClass}`}>
          <ReactMarkdown>{displayContent.data}</ReactMarkdown>
        </div>
      );
    case 'video':
      return <VideoPlayer src={displayContent.data} darkMode={darkMode} />;
    case 'gif':
      return <GifPlayer src={displayContent.data} darkMode={darkMode} />;
    case 'audio':
      return <AudioPlayer src={displayContent.data} darkMode={darkMode} />;
    case 'image':
      return <ImageContent src={displayContent.data} alt="Bild" darkMode={darkMode} />;
    case 'puzzle':
      return (
        <Suspense fallback={<LoadingFallback darkMode={darkMode} />}>
          <div className="flex justify-center">
            <SlidingGame 
              imageUrl={displayContent.data} 
              doorStates={doorStates} 
              setDoorStates={setDoorStates} 
              day={displayContent.day}
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
          Türchen {displayContent.day}
        </h2>
      </div>

      <div>{renderContent()}</div>

      {displayContent.text && !contentLoading && (
        <div className={`prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none text-center ${darkModeClass}`}>
          <ReactMarkdown>{displayContent.text}</ReactMarkdown>
        </div>
      )}
    </div>
  </Dialog>
);
};

export default ContentPopup;