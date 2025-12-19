'use client';

import { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';

interface PixiBackgroundProps {
  className?: string;
}

export function PixiBackground({ className = '' }: PixiBackgroundProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    let isMounted = true;

    // Initialize PixiJS Application
    (async () => {
      try {
        const app = new PIXI.Application();

        // Initialize the app
        await app.init({
          width: window.innerWidth,
          height: window.innerHeight,
          backgroundColor: 0x000000,
          backgroundAlpha: 0,
          antialias: true,
          resolution: window.devicePixelRatio || 1,
          autoDensity: true,
        });

        // Check if component is still mounted
        if (!isMounted || !canvasRef.current) {
          app.destroy(true);
          return;
        }

        appRef.current = app;

        // Append canvas to container
        canvasRef.current.appendChild(app.canvas);

        // Create particle container
        const particleContainer = new PIXI.Container();
        app.stage.addChild(particleContainer);

        // Particle settings
        const particleCount = 80;
        const particles: Array<{
          sprite: PIXI.Graphics;
          vx: number;
          vy: number;
          x: number;
          y: number;
        }> = [];

        // Create particles
        for (let i = 0; i < particleCount; i++) {
          const particle = new PIXI.Graphics();
          particle.circle(0, 0, 2);
          particle.fill({ color: 0xfee004, alpha: 0.6 });

          const x = Math.random() * app.screen.width;
          const y = Math.random() * app.screen.height;
          particle.x = x;
          particle.y = y;

          particleContainer.addChild(particle);

          particles.push({
            sprite: particle,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            x,
            y,
          });
        }

        // Connection lines container
        const linesContainer = new PIXI.Graphics();
        app.stage.addChild(linesContainer);

        // Animation loop
        const tickerCallback = () => {
          if (!isMounted) return;

          // Update particles
          particles.forEach((particle) => {
            particle.x += particle.vx;
            particle.y += particle.vy;

            // Bounce off edges
            if (particle.x < 0 || particle.x > app.screen.width) particle.vx *= -1;
            if (particle.y < 0 || particle.y > app.screen.height) particle.vy *= -1;

            // Keep within bounds
            particle.x = Math.max(0, Math.min(app.screen.width, particle.x));
            particle.y = Math.max(0, Math.min(app.screen.height, particle.y));

            particle.sprite.x = particle.x;
            particle.sprite.y = particle.y;
          });

          // Draw connection lines
          linesContainer.clear();
          const maxDistance = 150;

          for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
              const dx = particles[i].x - particles[j].x;
              const dy = particles[i].y - particles[j].y;
              const distance = Math.sqrt(dx * dx + dy * dy);

              if (distance < maxDistance) {
                const alpha = (1 - distance / maxDistance) * 0.3;
                linesContainer.moveTo(particles[i].x, particles[i].y);
                linesContainer.lineTo(particles[j].x, particles[j].y);
                linesContainer.stroke({ width: 1, color: 0xfee004, alpha });
              }
            }
          }
        };

        app.ticker.add(tickerCallback);

        // Handle resize
        const handleResize = () => {
          if (app && app.renderer) {
            app.renderer.resize(window.innerWidth, window.innerHeight);
          }
        };

        window.addEventListener('resize', handleResize);

        // Store cleanup function
        cleanupRef.current = () => {
          window.removeEventListener('resize', handleResize);
          if (tickerCallback) {
            app.ticker.remove(tickerCallback);
          }
          if (app && app.renderer) {
            app.destroy(true);
          }
        };
      } catch (error) {
        console.error('Error initializing PixiJS:', error);
      }
    })();

    // Cleanup on unmount
    return () => {
      isMounted = false;
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
      appRef.current = null;
    };
  }, []);

  return (
    <div
      ref={canvasRef}
      className={`absolute inset-0 ${className}`}
      style={{ opacity: 0.4 }}
    />
  );
}
