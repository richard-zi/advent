'use client';

import { useEffect, useRef } from 'react';

interface Snowflake {
  x: number;
  y: number;
  radius: number;
  speed: number;
  wind: number;
  opacity: number;
}

interface SnowfallProps {
  darkMode?: boolean;
}

export default function Snowfall({ darkMode = false }: SnowfallProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let snowflakes: Snowflake[] = [];

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const createSnowflakes = () => {
      const count = Math.floor((canvas.width * canvas.height) / 15000);
      snowflakes = [];

      for (let i = 0; i < count; i++) {
        snowflakes.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: Math.random() * 3 + 1,
          speed: Math.random() * 1 + 0.5,
          wind: Math.random() * 0.5 - 0.25,
          opacity: Math.random() * 0.6 + 0.4,
        });
      }
    };

    const drawSnowflake = (snowflake: Snowflake) => {
      ctx.beginPath();
      ctx.arc(snowflake.x, snowflake.y, snowflake.radius, 0, Math.PI * 2);

      // Unterschiedliche Farben für Dark/Light Mode
      if (darkMode) {
        ctx.fillStyle = `rgba(255, 255, 255, ${snowflake.opacity})`;
      } else {
        // Im Light Mode: dunklere Schneeflocken mit leichtem Blauton
        ctx.fillStyle = `rgba(100, 150, 200, ${snowflake.opacity * 0.8})`;
      }

      ctx.fill();

      // Shadow für bessere Sichtbarkeit im Light Mode
      if (!darkMode) {
        ctx.shadowBlur = 4;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      }

      ctx.closePath();
    };

    const updateSnowflake = (snowflake: Snowflake) => {
      snowflake.y += snowflake.speed;
      snowflake.x += snowflake.wind;

      // Reset snowflake when it falls off screen
      if (snowflake.y > canvas.height) {
        snowflake.y = -10;
        snowflake.x = Math.random() * canvas.width;
      }

      // Keep snowflakes within horizontal bounds
      if (snowflake.x > canvas.width) {
        snowflake.x = 0;
      } else if (snowflake.x < 0) {
        snowflake.x = canvas.width;
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      snowflakes.forEach((snowflake) => {
        drawSnowflake(snowflake);
        updateSnowflake(snowflake);
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    resizeCanvas();
    createSnowflakes();
    animate();

    const handleResize = () => {
      resizeCanvas();
      createSnowflakes();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [darkMode]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50"
      style={{ mixBlendMode: darkMode ? 'screen' : 'multiply' }}
    />
  );
}
