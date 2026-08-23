'use client';

import { useEffect, useRef } from 'react';

export default function ParticlesBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particlesArray: Particle[] = [];

    // Screen dimensions & device pixel ratio
    let w = 0;
    let h = 0;
    let isMobile = false;

    const pointer = {
      x: -1000,
      y: -1000,
      radius: 180,
      isActive: false,
    };

    function setCanvasDimensions() {
      if (!canvas || !ctx) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      isMobile = w < 768;

      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.scale(dpr, dpr);
      pointer.radius = isMobile ? 120 : 190;
    }

    // Pointer events (Desktop Mouse + Mobile Touch)
    const handleMouseMove = (e: MouseEvent) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.isActive = true;
    };

    const handleMouseLeave = () => {
      pointer.isActive = false;
      pointer.x = -1000;
      pointer.y = -1000;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        pointer.x = e.touches[0].clientX;
        pointer.y = e.touches[0].clientY;
        pointer.isActive = true;
      }
    };

    const handleTouchEnd = () => {
      pointer.isActive = false;
      pointer.x = -1000;
      pointer.y = -1000;
    };

    const handleResize = () => {
      setCanvasDimensions();
      init();
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseout', handleMouseLeave);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('resize', handleResize);

    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      isHub: boolean;
      pulseAngle: number;
      pulseSpeed: number;
      baseColor: string;

      constructor() {
        this.x = Math.random() * w;
        this.y = Math.random() * h;
        
        // 10% are major "Data Hubs", 90% are lightweight data packets
        this.isHub = Math.random() < 0.1;
        this.size = this.isHub ? Math.random() * 1.5 + 2.5 : Math.random() * 1.2 + 0.8;
        
        // Smooth cosmic drift
        const speed = this.isHub ? 0.2 : 0.45;
        this.vx = (Math.random() - 0.5) * speed;
        this.vy = (Math.random() - 0.5) * speed;

        this.pulseAngle = Math.random() * Math.PI * 2;
        this.pulseSpeed = Math.random() * 0.03 + 0.01;
        this.baseColor = this.isHub ? '#34d399' : '#10b981';
      }

      draw() {
        if (!ctx) return;
        this.pulseAngle += this.pulseSpeed;
        const pulse = Math.sin(this.pulseAngle) * 0.3 + 0.7; // 0.4 to 1.0

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * (this.isHub ? pulse : 1), 0, Math.PI * 2, false);

        if (this.isHub) {
          // Hubs have an atmospheric glowing halo
          ctx.shadowColor = 'rgba(52, 211, 153, 0.8)';
          ctx.shadowBlur = isMobile ? 6 : 10;
          ctx.fillStyle = `rgba(52, 211, 153, ${0.8 * pulse})`;
          ctx.fill();
          ctx.shadowBlur = 0; // reset for performance
        } else {
          ctx.fillStyle = `rgba(52, 211, 153, ${0.45 * pulse})`;
          ctx.fill();
        }
      }

      update() {
        // Continuous wrap-around flow (no hard bounces)
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < -20) this.x = w + 20;
        if (this.x > w + 20) this.x = -20;
        if (this.y < -20) this.y = h + 20;
        if (this.y > h + 20) this.y = -20;

        // Interactive pointer magnetism & repulsion
        if (pointer.isActive) {
          const dx = pointer.x - this.x;
          const dy = pointer.y - this.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < pointer.radius) {
            const force = (pointer.radius - distance) / pointer.radius;
            // Gentle orbital attraction
            this.x += (dx / distance) * force * (this.isHub ? 0.8 : 1.6);
            this.y += (dy / distance) * force * (this.isHub ? 0.8 : 1.6);
          }
        }

        this.draw();
      }
    }

    function init() {
      particlesArray = [];
      // Adaptive particle density (mobile: ~35 nodes, desktop: ~75-90 nodes)
      const count = isMobile ? 36 : Math.min(Math.floor((w * h) / 14000), 95);

      for (let i = 0; i < count; i++) {
        particlesArray.push(new Particle());
      }
    }

    function connect() {
      const maxDistance = isMobile ? 95 : 135;
      
      for (let a = 0; a < particlesArray.length; a++) {
        for (let b = a + 1; b < particlesArray.length; b++) {
          const pA = particlesArray[a];
          const pB = particlesArray[b];
          const dx = pA.x - pB.x;
          const dy = pA.y - pB.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < maxDistance) {
            const opacity = (1 - distance / maxDistance) * (pA.isHub || pB.isHub ? 0.35 : 0.18);
            if (!ctx) return;
            ctx.strokeStyle = `rgba(52, 211, 153, ${opacity})`;
            ctx.lineWidth = pA.isHub || pB.isHub ? 1.2 : 0.8;
            ctx.beginPath();
            ctx.moveTo(pA.x, pA.y);
            ctx.lineTo(pB.x, pB.y);
            ctx.stroke();
          }
        }

        // Connect particles directly to the user's cursor / finger
        if (pointer.isActive) {
          const dx = pointer.x - particlesArray[a].x;
          const dy = pointer.y - particlesArray[a].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < pointer.radius) {
            const opacity = (1 - distance / pointer.radius) * 0.45;
            if (!ctx) return;
            ctx.strokeStyle = `rgba(52, 211, 153, ${opacity})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
            ctx.lineTo(pointer.x, pointer.y);
            ctx.stroke();
          }
        }
      }
    }

    function animate() {
      if (!ctx) return;
      ctx.clearRect(0, 0, w, h);

      for (let i = 0; i < particlesArray.length; i++) {
        particlesArray[i].update();
      }
      connect();

      animationFrameId = requestAnimationFrame(animate);
    }

    setCanvasDimensions();
    init();
    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseout', handleMouseLeave);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 w-full h-full"
      style={{
        maskImage: 'radial-gradient(ellipse at 50% 30%, black 40%, rgba(0,0,0,0.3) 80%, transparent 100%)',
        WebkitMaskImage: 'radial-gradient(ellipse at 50% 30%, black 40%, rgba(0,0,0,0.3) 80%, transparent 100%)',
      }}
    />
  );
}
