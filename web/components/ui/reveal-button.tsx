'use client';

import React from 'react';
import { motion } from 'framer-motion';
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
  const sizeClasses = size === 'sm' 
    ? 'px-4 py-2 text-xs gap-1.5' 
    : size === 'lg' 
      ? 'px-7 py-3.5 text-base gap-2.5 font-bold' 
      : 'px-5 py-2.5 text-sm gap-2';

  const iconSize = size === 'sm' ? 13 : size === 'lg' ? 17 : 14;

  const content = (
    <motion.span
      whileHover="hover"
      whileTap={{ scale: 0.94 }}
      transition={{ type: 'spring', stiffness: 450, damping: 25 }}
      className={`group relative inline-flex items-center justify-center rounded-full font-semibold overflow-hidden bg-white text-neutral-950 border border-white/60 shadow-[0_0_20px_rgba(255,255,255,0.16),inset_0_1px_0_0_rgba(255,255,255,1)] hover:shadow-[0_0_32px_rgba(255,255,255,0.3),inset_0_1px_0_0_rgba(255,255,255,1)] transition-shadow duration-300 cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black ${sizeClasses} ${className}`}
    >
      {/* 1. Metallic Shimmer Light Shard (Slides across on hover) */}
      <span 
        aria-hidden="true" 
        className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] bg-gradient-to-r from-transparent via-white/80 to-transparent skew-x-[-20deg] z-10" 
      />

      {/* 2. Stable High-Contrast Text */}
      <span className="relative z-20 font-medium tracking-tight">
        {children}
      </span>

      {/* 3. Micro Arrow with Smooth Glide */}
      <ArrowRight 
        size={iconSize}
        strokeWidth={2}
        className="relative z-20 transition-transform duration-200 ease-out group-hover:translate-x-1" 
      />
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
