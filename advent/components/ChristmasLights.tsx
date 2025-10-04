'use client';

import { useEffect, useRef } from 'react';

interface ChristmasLightsProps {
  enabled?: boolean;
}

export default function ChristmasLights({ enabled = true }: ChristmasLightsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!enabled) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = 100;

    const lights: Array<{
      x: number;
      y: number;
      color: string;
      phase: number;
      speed: number;
    }> = [];

    const colors = [
      '#ff0000', // Red
      '#00ff00', // Green
      '#ffff00', // Yellow
      '#0000ff', // Blue
      '#ff00ff', // Magenta
      '#00ffff', // Cyan
      '#ffa500', // Orange
    ];

    // Create lights
    const numLights = Math.floor(window.innerWidth / 60);
    for (let i = 0; i < numLights; i++) {
      lights.push({
        x: (i + 0.5) * (window.innerWidth / numLights),
        y: 30 + Math.sin(i * 0.5) * 15,
        color: colors[i % colors.length],
        phase: Math.random() * Math.PI * 2,
        speed: 0.02 + Math.random() * 0.02,
      });
    }

    let animationId: number;

    function animate() {
      if (!ctx || !canvas) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw string/wire
      ctx.strokeStyle = 'rgba(50, 50, 50, 0.3)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < lights.length; i++) {
        const light = lights[i];
        if (i === 0) {
          ctx.moveTo(light.x, light.y);
        } else {
          ctx.lineTo(light.x, light.y);
        }
      }
      ctx.stroke();

      // Draw lights
      lights.forEach((light) => {
        light.phase += light.speed;
        const brightness = (Math.sin(light.phase) + 1) / 2;

        // Glow effect
        const gradient = ctx.createRadialGradient(
          light.x,
          light.y,
          0,
          light.x,
          light.y,
          20
        );
        gradient.addColorStop(0, light.color);
        gradient.addColorStop(0.5, `${light.color}66`);
        gradient.addColorStop(1, 'transparent');

        ctx.globalAlpha = brightness * 0.8 + 0.2;
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(light.x, light.y, 20, 0, Math.PI * 2);
        ctx.fill();

        // Bulb
        ctx.globalAlpha = 1;
        ctx.fillStyle = light.color;
        ctx.beginPath();
        ctx.arc(light.x, light.y, 8, 0, Math.PI * 2);
        ctx.fill();

        // Highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.arc(light.x - 2, light.y - 2, 3, 0, Math.PI * 2);
        ctx.fill();
      });

      animationId = requestAnimationFrame(animate);
    }

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = 100;
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full pointer-events-none z-50"
      style={{ height: '100px' }}
    />
  );
}
