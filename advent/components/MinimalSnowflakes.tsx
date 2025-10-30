'use client';

import { useEffect, useState } from 'react';

interface SnowflakeProps {
  delay: number;
  duration: number;
  left: number;
  opacity: number;
  size: number;
}

export default function MinimalSnowflakes() {
  const [snowflakes, setSnowflakes] = useState<SnowflakeProps[]>([]);

  useEffect(() => {
    // Only 15 very subtle snowflakes
    const flakes: SnowflakeProps[] = [];
    for (let i = 0; i < 15; i++) {
      flakes.push({
        delay: Math.random() * 10,
        duration: 15 + Math.random() * 15, // 15-30s
        left: Math.random() * 100,
        opacity: 0.2 + Math.random() * 0.3, // 0.2-0.5
        size: 8 + Math.random() * 8, // 8-16px
      });
    }
    setSnowflakes(flakes);
  }, []);

  return (
    <>
      <style jsx>{`
        @keyframes gentle-fall {
          0% {
            transform: translateY(-10vh) translateX(0) rotate(0deg);
          }
          50% {
            transform: translateY(50vh) translateX(15px) rotate(180deg);
          }
          100% {
            transform: translateY(110vh) translateX(-15px) rotate(360deg);
          }
        }

        .snowflake {
          animation: gentle-fall linear infinite;
          will-change: transform;
        }
      `}</style>

      <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
        {snowflakes.map((flake, i) => (
          <div
            key={i}
            className="snowflake absolute top-0 text-gold"
            style={{
              left: `${flake.left}%`,
              fontSize: `${flake.size}px`,
              opacity: flake.opacity,
              animationDelay: `${flake.delay}s`,
              animationDuration: `${flake.duration}s`,
            }}
          >
            ❄
          </div>
        ))}
      </div>
    </>
  );
}
