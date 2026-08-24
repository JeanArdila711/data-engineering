'use client';

import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring, useMotionTemplate } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface RevealButtonProps {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function RevealButton({
  children,
  href = '#ecosystem',
  onClick,
  className = '',
  size = 'sm',
}: RevealButtonProps) {
  const containerRef = useRef<HTMLSpanElement>(null);

  // 1. Magnetic Physics (agent-13 & agent-15): Smooth 2-3px displacement towards cursor
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);

  const springConfig = { stiffness: 400, damping: 28, mass: 0.5 };
  const magneticX = useSpring(rawX, springConfig);
  const magneticY = useSpring(rawY, springConfig);

  // 2. Local mouse tracking for Border Spotlight (agent-10)
  const localMouseX = useMotionValue(0);

  function handleMouseMove(e: React.MouseEvent<HTMLSpanElement>) {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // Subtle magnetic pull (max 3px in each axis)
    const deltaX = (e.clientX - centerX) * 0.14;
    const deltaY = (e.clientY - centerY) * 0.14;

    rawX.set(Math.max(-3.5, Math.min(3.5, deltaX)));
    rawY.set(Math.max(-3.5, Math.min(3.5, deltaY)));

    localMouseX.set(e.clientX - rect.left);
  }

  function handleMouseLeave() {
    rawX.set(0);
    rawY.set(0);
  }

  const spotlightGlow = useMotionTemplate`radial-gradient(90px circle at ${localMouseX}px 0%, rgba(52, 211, 153, 0.4), rgba(255, 255, 255, 0.6), transparent 80%)`;

  const sizeClasses = size === 'sm' 
    ? 'px-4 py-2 text-xs gap-1.5' 
    : size === 'lg' 
      ? 'px-7 py-3.5 text-base gap-2.5 font-bold' 
      : 'px-5 py-2.5 text-sm gap-2';

  const iconSize = size === 'sm' ? 13 : size === 'lg' ? 17 : 14;

  const content = (
    <motion.span
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        x: magneticX,
        y: magneticY,
      }}
      whileTap={{ scale: 0.94 }}
      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
      className={`group relative inline-flex items-center justify-center rounded-full font-semibold overflow-hidden bg-white text-neutral-950 border border-white/60 shadow-[0_0_20px_rgba(255,255,255,0.16),inset_0_1px_0_0_rgba(255,255,255,1)] hover:shadow-[0_0_32px_rgba(255,255,255,0.32),inset_0_1px_0_0_rgba(255,255,255,1)] transition-shadow duration-300 cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black ${sizeClasses} ${className}`}
    >
      {/* Dynamic Top Border Spotlight Tracker (agent-10) */}
      <motion.span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
        style={{
          background: spotlightGlow,
        }}
      />

      {/* Metallic Shimmer Shard Beam (Slides across on hover) */}
      <span 
        aria-hidden="true" 
        className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] bg-gradient-to-r from-transparent via-white/80 to-transparent skew-x-[-20deg] z-10" 
      />

      {/* High-Contrast Stable Text */}
      <span className="relative z-20 font-medium tracking-tight">
        {children}
      </span>

      {/* Infinite Arrow Loop Reveal (Stripe / Vercel pattern) */}
      <span className="relative z-20 overflow-hidden flex items-center justify-center size-3.5">
        {/* Primary Arrow: Exits to the right */}
        <ArrowRight 
          size={iconSize}
          strokeWidth={2}
          className="absolute inset-0 transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:translate-x-full group-hover:opacity-0" 
        />
        {/* Secondary Arrow: Enters seamlessly from the left */}
        <ArrowRight 
          size={iconSize}
          strokeWidth={2}
          className="absolute inset-0 -translate-x-full opacity-0 transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:translate-x-0 group-hover:opacity-100 text-neutral-950" 
        />
      </span>
    </motion.span>
  );

  if (href) {
    return (
      <Link href={href} onClick={onClick} className="inline-flex focus-visible:outline-none">
        {content}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className="inline-flex focus-visible:outline-none">
      {content}
    </button>
  );
}
