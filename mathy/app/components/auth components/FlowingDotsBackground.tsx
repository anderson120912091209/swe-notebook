'use client';

import React, { useEffect, useRef } from 'react';

interface Point {
  x: number;
  y: number;
  vx: number; // Interaction velocity x
  vy: number; // Interaction velocity y
  radius: number;
  baseX: number; // Base flow direction/speed factor
  baseY: number;
  phase: number; // Random phase for independent oscillation
}

export default function FlowingDotsBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const mouseEnteredRef = useRef(false);
  
  const dimensions = useRef({ width: 0, height: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let points: Point[] = [];
    let animationFrameId: number;
    let time = 0;

    const initPoints = () => {
      const { width, height } = dimensions.current;
      points = [];
      // Increased density: reduced divider from 5000 to 2000
      const numberOfPoints = Math.floor((width * height) / 2000); 

      for (let i = 0; i < numberOfPoints; i++) {
        points.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: 0,
          vy: 0,
          radius: Math.random() * 1.5 + 0.5,
          baseX: (Math.random() - 0.5) * 0.1, // Reduced base drift speed even more
          baseY: (Math.random() - 0.5) * 0.1,
          phase: Math.random() * Math.PI * 2,
        });
      }
    };

    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      dimensions.current = { width, height };
      
      canvas.width = width;
      canvas.height = height;
      
      initPoints();
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
      if (!mouseEnteredRef.current) mouseEnteredRef.current = true;
    };
    
    // Also handle mouse enter/leave to gracefully show/hide
    const handleMouseEnter = () => { mouseEnteredRef.current = true; };
    const handleMouseLeave = () => { mouseEnteredRef.current = false; };

    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseenter', handleMouseEnter);
    document.addEventListener('mouseleave', handleMouseLeave);

    const animate = () => {
      const { width, height } = dimensions.current;
      ctx.clearRect(0, 0, width, height);
      
      ctx.fillStyle = '#68AAEC'; 
      ctx.beginPath();
      
      // Radius within which particles are visible and interactive
      // Same as interaction radius for consistency, or can be slightly larger
      const interactionRadius = 250; 
      const mouseX = mouseRef.current.x;
      const mouseY = mouseRef.current.y;
      
      // Even slower time increment for very gentle wave motion
      time += 0.001;

      // Only animate if mouse has interacted at least once or is on screen?
      // User said "only want particles to be shown wherever my cursor is at"
      // So if mouse isn't on screen (or just loaded), maybe don't show?
      // Assuming mouseRef starts at 0,0 which might be top-left.
      // Let's rely on distance check.
      
      if (mouseEnteredRef.current) {
        for (let i = 0; i < points.length; i++) {
          const point = points[i];

          // 1. Natural "Water-like" Movement
          const waveX = Math.sin(point.y * 0.002 + time + point.phase) * 0.15;
          const waveY = Math.cos(point.x * 0.002 + time + point.phase) * 0.15;
          
          // 2. Mouse Interaction & Visibility Check
          const dx = mouseX - point.x;
          const dy = mouseY - point.y;
          const distSq = dx * dx + dy * dy;
          
          // Check if point is within visible radius
          if (distSq < interactionRadius * interactionRadius) {
            const distance = Math.sqrt(distSq);
            const force = (interactionRadius - distance) / interactionRadius;
            
            // Interaction force
            const angle = Math.atan2(dy, dx);
            const forceX = -Math.cos(angle) * force * 0.05; // Drastically reduced force for gentle nudge
            const forceY = -Math.sin(angle) * force * 0.05;

            point.vx += forceX;
            point.vy += forceY;

            // Only draw if visible
            // Fade out at edges for smoother look? 
            // The fillStyle is solid, so simple inclusion is simplest for performance.
            // For smoother edge, we could use point-specific opacity but that breaks batching.
            // Keeping it simple as requested: "radius around the cursor will show"
            
            ctx.moveTo(point.x + point.radius, point.y);
            ctx.arc(point.x, point.y, point.radius, 0, Math.PI * 2);
          }

          // Always update physics so they flow even when not visible
          // This ensures that when you move your mouse to a new area, the dots there are already "moving" naturally
          point.x += point.baseX + waveX + point.vx;
          point.y += point.baseY + waveY + point.vy;

          // Friction
          point.vx *= 0.95;
          point.vy *= 0.95;

          // Screen wrapping
          if (point.x < -50) point.x = width + 50;
          else if (point.x > width + 50) point.x = -50;
          
          if (point.y < -50) point.y = height + 50;
          else if (point.y > height + 50) point.y = -50;
        }
      }
      
      ctx.fill();
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseenter', handleMouseEnter);
      document.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.6 }}
    />
  );
}
