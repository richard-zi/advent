import React, { useState, useEffect, useRef, Suspense } from "react";
import { Play, Pause } from 'lucide-react';
import Dialog from './Dialog';
import ReactMarkdown from 'react-markdown';
import LoadingSpinner from './LoadingSpinner';

const ChristmasCountdown = React.lazy(() => import('./ChristmasCountdown'));
const Poll = React.lazy(() => import('./Poll'));
const SlidingGame = React.lazy(() => import('./SlidingGame'));

const CACHE_PREFIX = 'content-';

const LoadingFallback = ({ darkMode }) => (
  <div className="flex justify-center items-center p-8">
    <LoadingSpinner darkMode={darkMode} />
  </div>
);

// In der ContentPopup Komponente
const AudioPlayer = ({ src, darkMode }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const audioRef = useRef(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    setCurrentTime(0);
    setIsPlaying(false);

    const preloadAudio = async () => {
      try {
        const cached = localStorage.getItem(`${CACHE_PREFIX}audio-${src}`);
        
        if (!cached) {
          const audio = new Audio();
          
          // Add progress monitoring
          audio.addEventListener('progress', () => {
            if (audio.buffered.length > 0) {
              const bufferedEnd = audio.buffered.end(audio.buffered.length - 1);
              const duration = audio.duration;
              const progress = (bufferedEnd / duration) * 100;
              setLoadingProgress(progress);
            }
          });

          // Setup promise for loading
          await new Promise((resolve, reject) => {
            audio.onloadeddata = resolve;
            audio.onerror = reject;
            audio.preload = 'auto';
            audio.src = src;
            audio.load();
          });

          localStorage.setItem(`${CACHE_PREFIX}audio-${src}`, 'loaded');
        }

        // Set up the actual audio element for playback
        if (audioRef.current) {
          audioRef.current.src = src;
          audioRef.current.load();
        }

        setIsLoading(false);
      } catch (err) {
        console.error('Error loading audio:', err);
        setError('Failed to load audio file');
        setIsLoading(false);
      }
    };

    preloadAudio();

    // Setup event listeners for the actual audio element
    const audio = audioRef.current;
    if (audio) {
      const handleLoadedMetadata = () => {
        setDuration(audio.duration);
        setIsLoading(false);
      };

      const handleTimeUpdate = () => {
        setCurrentTime(audio.currentTime);
      };

      const handleEnded = () => {
        setIsPlaying(false);
        setCurrentTime(0);
      };

      const handleError = (e) => {
        console.error('Audio playback error:', e);
        setError('Error playing audio');
        setIsPlaying(false);
      };

      // Add progress monitoring for the actual playback element
      const handleProgress = () => {
        if (audio.buffered.length > 0) {
          const bufferedEnd = audio.buffered.end(audio.buffered.length - 1);
          const progress = (bufferedEnd / audio.duration) * 100;
          setLoadingProgress(progress);
        }
      };

      audio.addEventListener('loadedmetadata', handleLoadedMetadata);
      audio.addEventListener('timeupdate', handleTimeUpdate);
      audio.addEventListener('ended', handleEnded);
      audio.addEventListener('error', handleError);
      audio.addEventListener('progress', handleProgress);

      return () => {
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audio.removeEventListener('timeupdate', handleTimeUpdate);
        audio.removeEventListener('ended', handleEnded);
        audio.removeEventListener('error', handleError);
        audio.removeEventListener('progress', handleProgress);
      };
    }
  }, [src]);

  const handleProgressChange = (e) => {
    const newTime = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const togglePlay = async () => {
    try {
      if (audioRef.current) {
        if (audioRef.current.paused) {
          await audioRef.current.play();
          setIsPlaying(true);
        } else {
          audioRef.current.pause();
          setIsPlaying(false);
        }
      }
    } catch (err) {
      console.error('Playback error:', err);
      setError('Failed to play audio');
      setIsPlaying(false);
    }
  };

  const formatTime = (time) => {
    if (!time) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-100'} shadow-md`}>
      {isLoading ? (
        <div className="flex flex-col items-center">
          <LoadingSpinner darkMode={darkMode} />
          <div className="mt-2 text-sm text-gray-500">
            Loading: {Math.round(loadingProgress)}%
          </div>
        </div>
      ) : error ? (
        <div className={`text-center ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
          {error}
        </div>
      ) : (
        <div className="flex flex-col space-y-4">
          <audio ref={audioRef} preload="auto">
            <source src={src} type="audio/mpeg" />
            Your browser does not support the audio element.
          </audio>

          <button
            onClick={togglePlay}
            className={`
              w-12 h-12 rounded-full 
              flex items-center justify-center
              ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'}
              transition-colors duration-200
            `}
          >
            {isPlaying ? <Pause className="w-6 h-6 text-white" /> : <Play className="w-6 h-6 text-white" />}
          </button>

          <div className="space-y-2">
            <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
              {/* Progress Bar Background */}
              <div
                className={`absolute h-full transition-all duration-150 ${darkMode ? 'bg-blue-600' : 'bg-blue-500'}`}
                style={{ width: `${progressPercentage}%` }}
              />
              {/* Range Input */}
              <input
                type="range"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={handleProgressChange}
                className="absolute w-full h-full opacity-0 cursor-pointer"
                style={{ 
                  WebkitAppearance: 'none',
                  margin: 0
                }}
              />
            </div>

            <div className={`flex justify-between text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        </div>
      )}
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
          Your browser does not support the video tag.
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

const IframeContent = ({ src, darkMode }) => {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className="relative w-full max-w-5xl mx-auto">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <LoadingSpinner darkMode={darkMode} />
        </div>
      )}
      <div className="w-full aspect-video">
        <iframe
          title="Content Frame"
          src={src}
          className="w-full h-[600px]"
          onLoad={() => setIsLoading(false)}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{
            border: 'none',
            borderRadius: '8px',
            boxShadow: darkMode ? '0 4px 6px -1px rgba(0, 0, 0, 0.3)' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
        ></iframe>
      </div>
    </div>
  );
};

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
          <div className={`prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none ${darkModeClass} mx-auto text-center`}>
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
      case 'iframe':
        return <IframeContent src={displayContent.data} darkMode={darkMode} />;
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
          <div className={`
            prose prose-sm sm:prose lg:prose-lg xl:prose-xl 
            max-w-none text-center mx-auto
            ${darkModeClass}
          `}>
            <div className="max-w-3xl mx-auto">
              <ReactMarkdown>{displayContent.text}</ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
};

export default ContentPopup;