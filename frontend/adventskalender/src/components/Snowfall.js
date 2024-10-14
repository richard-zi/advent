import React, { useEffect, useRef } from 'react';

const Snowfall = ({ isActive }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!isActive) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const snowflakes = [];

    const createSnowflake = () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 5,  // Slightly larger snowflakes
      density: Math.random() * 20 + 1,
      speed: Math.random() * 0.3 + 0.1,
      angle: Math.random() * Math.PI * 2,
      spin: Math.random() < 0.5 ? 0.02 : -0.02,
    });

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      snowflakes.forEach((flake) => {
        flake.y += Math.cos(flake.angle) + 1 + flake.radius / 2;
        flake.x += Math.sin(flake.angle) * 2;
        flake.angle += flake.spin;

        if (flake.y > canvas.height) {
          flake.y = -10;
          flake.x = Math.random() * canvas.width;
        }

        // Create gradient for each snowflake
        const gradient = ctx.createRadialGradient(
          flake.x, flake.y, 0,
          flake.x, flake.y, flake.radius
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(0.5, 'rgba(210, 236, 242, 0.6)');
        gradient.addColorStop(1, 'rgba(237, 247, 249, 0.3)');

        ctx.beginPath();
        ctx.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);
        
        // Enhanced shadow
        ctx.shadowColor = 'rgba(200, 200, 200, 0.8)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;
        
        ctx.fillStyle = gradient;
        ctx.fill();

        // Add a subtle border
        ctx.strokeStyle = 'rgba(200, 200, 200, 0.8)';
        ctx.lineWidth = 0.5;
        ctx.stroke();
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    const init = () => {
      resize();
      for (let i = 0; i < 80; i++) {  // Slightly reduced number of snowflakes
        snowflakes.push(createSnowflake());
      }
      animate();
    };

    window.addEventListener('resize', resize);
    init();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isActive]);

  if (!isActive) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        zIndex: 10,  // Reduzierter z-index
      }}
    />
  );
};

export default Snowfall;