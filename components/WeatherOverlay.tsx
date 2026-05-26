'use client';

import React, { useEffect, useRef } from 'react';

interface WeatherOverlayProps {
  weather: 'sunny' | 'rainy' | 'foggy' | 'sunset_glow';
}

interface Particle {
  x: number;
  y: number;
  speed: number;
  length: number;
  opacity: number;
  angle: number;
  size: number;
  vx: number;
  vy: number;
}

export default function WeatherOverlay({ weather }: WeatherOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];
    const maxParticles = weather === 'rainy' ? 120 : weather === 'foggy' ? 8 : 0;

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize particles
    particles = [];
    if (weather === 'rainy') {
      for (let i = 0; i < maxParticles; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height - canvas.height,
          speed: 8 + Math.random() * 6,
          length: 15 + Math.random() * 15,
          opacity: 0.15 + Math.random() * 0.45,
          angle: -0.2 + Math.random() * 0.1, // diagonal rain
          size: 1 + Math.random() * 1.5,
          vx: 0,
          vy: 0
        });
      }
    } else if (weather === 'foggy') {
      for (let i = 0; i < maxParticles; i++) {
        particles.push({
          x: Math.random() * canvas.width * 1.5 - canvas.width * 0.25,
          y: Math.random() * canvas.height,
          speed: 0.15 + Math.random() * 0.35,
          length: 0,
          opacity: 0.05 + Math.random() * 0.12,
          angle: 0,
          size: 80 + Math.random() * 80, // large fog clouds
          vx: 0.2 + Math.random() * 0.5,
          vy: (Math.random() - 0.5) * 0.1
        });
      }
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (weather === 'rainy') {
        ctx.strokeStyle = 'rgba(186, 230, 253, 0.65)';
        ctx.lineWidth = 1.2;
        ctx.lineCap = 'round';

        particles.forEach((p) => {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + p.angle * p.length, p.y + p.length);
          ctx.strokeStyle = `rgba(186, 230, 253, ${p.opacity})`;
          ctx.stroke();

          // Move particle
          p.y += p.speed;
          p.x += p.angle * p.speed;

          // Reset when falling offscreen
          if (p.y > canvas.height) {
            p.y = -p.length;
            p.x = Math.random() * canvas.width;
          }
        });
      } else if (weather === 'foggy') {
        particles.forEach((p) => {
          // Draw a soft cloud gradient
          const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
          gradient.addColorStop(0, `rgba(228, 228, 231, ${p.opacity})`);
          gradient.addColorStop(0.5, `rgba(228, 228, 231, ${p.opacity * 0.4})`);
          gradient.addColorStop(1, 'rgba(228, 228, 231, 0)');

          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();

          // Drifting movement
          p.x += p.vx;
          p.y += p.vy;

          // Wrap around screen boundaries
          if (p.x - p.size > canvas.width) {
            p.x = -p.size;
            p.y = Math.random() * canvas.height;
          }
        });
      } else if (weather === 'sunset_glow') {
        // Flat warm sunset hue filter on canvas
        ctx.fillStyle = 'rgba(239, 68, 68, 0.04)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [weather]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-30"
      style={{ mixBlendMode: weather === 'foggy' ? 'overlay' : 'screen' }}
    />
  );
}
