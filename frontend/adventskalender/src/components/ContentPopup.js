import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Play, Pause, Volume2, Volume1, VolumeX, RefreshCcw } from 'lucide-react';
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

const AudioPlayer = ({ src, darkMode }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isVolumeHovered, setIsVolumeHovered] = useState(false);
  const audioRef = useRef(null);
  const progressBarRef = useRef(null);
  const previousVolumeRef = useRef(1);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadStart = () => {
      setIsLoading(true);
      setError(null);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
    };

    const handleProgress = () => {
      if (audio.buffered.length > 0) {
        const bufferedEnd = audio.buffered.end(audio.buffered.length - 1);
        const duration = audio.duration || 0;
        const progress = duration ? (bufferedEnd / duration) * 100 : 0;
        setLoadingProgress(progress);
        setIsBuffering(bufferedEnd <= audio.currentTime + 5);
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      audio.currentTime = 0;
    };

    const handleError = (e) => {
      console.error('Audio error:', e);
      setError('Audio konnte nicht geladen werden');
      setIsLoading(false);
    };

    const handleWaiting = () => {
      setIsBuffering(true);
    };

    const handlePlaying = () => {
      setIsBuffering(false);
      setIsLoading(false);
      setError(null);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
      setError(null);
    };

    // Add event listeners
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('progress', handleProgress);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('canplay', handleCanPlay);

    // Set initial source
    audio.src = src;
    audio.load();

    // Cleanup
    return () => {
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('progress', handleProgress);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.src = '';
    };
  }, [src]);

  const handleProgressBarClick = (e) => {
    if (!progressBarRef.current || !audioRef.current || !duration) return;
    
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickPosition = (e.clientX - rect.left) / rect.width;
    const newTime = clickPosition * duration;
    
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const togglePlay = async () => {
    try {
      const audio = audioRef.current;
      if (!audio) return;

      if (audio.paused) {
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setIsPlaying(true);
              setError(null);
            })
            .catch(err => {
              console.error('Playback error:', err);
              setError('Wiedergabe fehlgeschlagen');
              setIsPlaying(false);
            });
        }
      } else {
        audio.pause();
        setIsPlaying(false);
      }
    } catch (err) {
      console.error('Toggle play error:', err);
      setError('Wiedergabe fehlgeschlagen');
      setIsPlaying(false);
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
      if (newVolume > 0) {
        setIsMuted(false);
      }
      previousVolumeRef.current = newVolume;
    }
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!isMuted) {
      previousVolumeRef.current = volume;
      audio.volume = 0;
      setVolume(0);
    } else {
      const newVolume = previousVolumeRef.current;
      audio.volume = newVolume;
      setVolume(newVolume);
    }
    setIsMuted(!isMuted);
  };

  const formatTime = (time) => {
    if (!time) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getVolumeIcon = () => {
    if (volume === 0 || isMuted) return <VolumeX size={18} />;
    return volume < 0.5 ? <Volume1 size={18} /> : <Volume2 size={18} />;
  };

  const progressPercentage = duration ? (currentTime / duration) * 100 : 0;

  if (error) {
    return (
      <div className={`flex items-center justify-center p-4 rounded-lg ${
        darkMode ? 'bg-red-900/20 text-red-400' : 'bg-red-100 text-red-600'
      }`}>
        <span className="flex items-center gap-2">
          <RefreshCcw size={16} className="animate-spin" />
          {error}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center max-w-6xl mx-auto px-16">
      <div className="flex items-center space-x-8 w-full">
      <audio
        ref={audioRef}
        preload="auto"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* Play/Pause Button */}
      <button
        onClick={togglePlay}
        disabled={isLoading}
        className={`
          w-14 h-14 rounded-full 
          flex items-center justify-center
          transition-all duration-300
          ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}
          ${darkMode ? 
            'bg-blue-600 hover:bg-blue-500 text-white' : 
            'bg-blue-500 hover:bg-blue-600 text-white'
          }
          ${isBuffering ? 'animate-pulse' : ''}
        `}
      >
        {isBuffering ? (
          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          isPlaying ? 
            <Pause size={24} /> : 
            <Play size={24} className="ml-0.5" />
        )}
      </button>

        {/* Progress Section */}
        <div className="flex-grow flex flex-col gap-1.5">
          {/* Progress Bar */}
          <div className="relative" ref={progressBarRef}>
            <div 
              className={`
                h-2 rounded-full cursor-pointer
                ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}
                group relative
              `}
              onClick={handleProgressBarClick}
            >
              {/* Loading Progress */}
              <div
                className={`
                  absolute h-full rounded-full
                  ${darkMode ? 'bg-gray-600' : 'bg-gray-300'}
                  transition-all duration-300 ease-out
                `}
                style={{ width: `${loadingProgress}%` }}
              />
              
              {/* Playback Progress */}
              <div
                className={`
                  absolute h-full rounded-full
                  ${darkMode ? 'bg-blue-500' : 'bg-blue-500'}
                  transition-all duration-150 ease-out
                `}
                style={{ width: `${progressPercentage}%` }}
              >
                {/* Progress Knob */}
                <div 
                  className={`
                    absolute right-0 top-1/2 -translate-y-1/2
                    w-4 h-4 rounded-full 
                    ${darkMode ? 'bg-blue-400' : 'bg-blue-400'}
                    opacity-0 group-hover:opacity-100
                    transition-all duration-200
                    transform translate-x-1/2
                    shadow-lg
                    scale-90 hover:scale-100
                  `}
                />
              </div>
            </div>
          </div>

          {/* Time Display */}
          <div className="flex justify-between items-center px-0.5">
            <span className={`text-xs font-medium ${
              darkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {formatTime(currentTime)}
            </span>
            <span className={`text-xs font-medium ${
              darkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Volume Controls */}
        <div 
          className="relative"
          onMouseEnter={() => setIsVolumeHovered(true)}
          onMouseLeave={() => setIsVolumeHovered(false)}
        >
          <button
            onClick={toggleMute}
            className={`
              p-2 rounded-lg
              ${darkMode ? 
                'hover:bg-gray-700/50 text-gray-300' : 
                'hover:bg-gray-100 text-gray-600'
              }
              transition-colors duration-200
            `}
          >
            {getVolumeIcon()}
          </button>

          {/* Volume Popup */}
          <div className={`
            absolute bottom-[calc(100%+0.5rem)] 
            transition-all duration-200 w-8
            ${isVolumeHovered ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible translate-y-1'}
          `}>
            <div className={`
              py-2 px-2 rounded-lg shadow-lg
              ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}
              w-8 h-28 flex flex-col items-center relative
            `}>
              <div className="h-20 flex items-center justify-center w-full">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={handleVolumeChange}
                  className={`
                    h-20 w-1
                    rounded-full 
                    ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}
                    appearance-none 
                    cursor-pointer
                    [writing-mode:bt-lr]
                    [-webkit-appearance:slider-vertical]
                    [&::-webkit-slider-thumb]:appearance-none
                    [&::-webkit-slider-thumb]:w-3
                    [&::-webkit-slider-thumb]:h-3
                    [&::-webkit-slider-thumb]:rounded-full
                    [&::-webkit-slider-thumb]:bg-blue-500
                    [&::-webkit-slider-thumb]:hover:scale-110
                    [&::-webkit-slider-thumb]:transition-transform
                    [&::-moz-range-thumb]:w-3
                    [&::-moz-range-thumb]:h-3
                    [&::-moz-range-thumb]:rounded-full
                    [&::-moz-range-thumb]:bg-blue-500
                    [&::-moz-range-thumb]:border-0
                    [&::-moz-range-thumb]:hover:scale-110
                    [&::-moz-range-thumb]:transition-transform
                  `}
                />
              </div>
              <div className={`
                text-xs font-medium mt-1 w-full text-center
                absolute bottom-2 left-0 right-0
                ${darkMode ? 'text-gray-400' : 'text-gray-600'}
                z-10
              `}>
                {Math.round(volume * 100)}%
              </div>
            </div>

            {/* Arrow */}
            <div className={`
              w-3 h-3 rotate-45
              absolute -bottom-1.5 left-1/2 -translate-x-1/2
              ${darkMode ? 'bg-gray-800 border-r border-b border-gray-700' : 'bg-white border-r border-b border-gray-200'}
            `} />

            {/* Arrow */}
            <div className={`
              w-3 h-3 rotate-45
              absolute -bottom-1.5 left-1/2 -translate-x-1/2
              ${darkMode ? 'bg-gray-800 border-r border-b border-gray-700' : 'bg-white border-r border-b border-gray-200'}
            `} />
          </div>
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