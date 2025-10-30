'use client';

import { useEffect, useState } from 'react';

interface SnowflakeProps {
  size: number;
  left: number;
  delay: number;
  duration: number;
  opacity: number;
}

function Snowflake({ size, left, delay, duration, opacity }: SnowflakeProps) {
  return (
    <div
      className="absolute top-0 text-christmas-silver animate-snowfall"
      style={{
        left: `${left}%`,
        fontSize: `${size}px`,
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`,
        opacity: opacity,
      }}
    >
      ❄
    </div>
  );
}

interface ChristmasSnowCSSProps {
  darkMode?: boolean;
  intensity?: 'low' | 'medium' | 'high';
}

export default function ChristmasSnowCSS({ darkMode = false, intensity = 'medium' }: ChristmasSnowCSSProps) {
  const [snowflakes, setSnowflakes] = useState<SnowflakeProps[]>([]);

  useEffect(() => {
    const flakeCount = intensity === 'low' ? 30 : intensity === 'medium' ? 50 : 80;

    const newSnowflakes: SnowflakeProps[] = [];
    for (let i = 0; i < flakeCount; i++) {
      newSnowflakes.push({
        size: Math.random() * 10 + 10, // 10-20px
        left: Math.random() * 100, // 0-100%
        delay: Math.random() * 10, // 0-10s delay
        duration: Math.random() * 10 + 10, // 10-20s duration
        opacity: Math.random() * 0.5 + 0.5, // 0.5-1 opacity
      });
    }
    setSnowflakes(newSnowflakes);
  }, [intensity]);

  return (
    <>
      <style jsx>{`
        @keyframes snowfall {
          0% {
            transform: translateY(-10vh) translateX(0);
          }
          50% {
            transform: translateY(50vh) translateX(20px);
          }
          100% {
            transform: translateY(110vh) translateX(-20px);
          }
        }

        .animate-snowfall {
          animation: snowfall linear infinite;
          will-change: transform;
        }
      `}</style>

      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {snowflakes.map((flake, index) => (
          <Snowflake key={index} {...flake} />
        ))}
      </div>
    </>
  );
}
