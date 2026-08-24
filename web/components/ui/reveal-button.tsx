'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface RevealButtonProps {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
}

export function RevealButton({
  children,
  href = '#ecosystem',
  onClick,
  className = '',
}: RevealButtonProps) {
  const content = (
    <motion.span
      whileHover="hover"
      initial="rest"
      animate="rest"
      className={`group relative inline-flex items-center justify-center overflow-hidden rounded-full bg-white px-4 py-2 text-xs font-semibold text-black transition-colors duration-200 hover:bg-neutral-200 active:scale-95 cursor-pointer shadow-[0_0_15px_rgba(255,255,255,0.15)] ${className}`}
    >
      <span className="relative z-10 flex items-center gap-1.5 overflow-hidden">
        <span className="inline-block transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:-translate-y-full">
          {children}
        </span>
        <span className="absolute inset-0 inline-block translate-y-full transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:translate-y-0 text-emerald-600 font-bold">
          {children}
        </span>
      </span>
    </motion.span>
  );

  if (href) {
    return (
      <Link href={href} onClick={onClick}>
        {content}
      </Link>
    );
  }

  return <button onClick={onClick}>{content}</button>;
}
