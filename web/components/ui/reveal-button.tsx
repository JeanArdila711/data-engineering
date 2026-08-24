'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

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
      whileTap={{ scale: 0.94 }}
      initial="rest"
      animate="rest"
      className={`group relative inline-flex items-center justify-center gap-1.5 overflow-hidden rounded-full bg-white px-4 py-2 text-xs font-semibold text-black transition-all duration-200 hover:bg-neutral-100 cursor-pointer shadow-[0_0_20px_rgba(255,255,255,0.12),inset_0_1px_0_0_rgba(255,255,255,0.8)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black ${className}`}
    >
      <span className="relative z-10 flex items-center gap-1.5 overflow-hidden">
        {/* Rolling Text Container */}
        <span className="relative inline-block overflow-hidden">
          <span className="inline-block transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:-translate-y-full">
            {children}
          </span>
          <span className="absolute inset-0 inline-block translate-y-full transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:translate-y-0 text-emerald-700 font-bold">
            {children}
          </span>
        </span>

        {/* Micro Arrow with Diagonal Translation */}
        <ArrowUpRight 
          size={13} 
          className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-emerald-700" 
        />
      </span>
    </motion.span>
  );

  if (href) {
    return (
      <Link href={href} onClick={onClick} className="focus-visible:outline-none">
        {content}
      </Link>
    );
  }

  return <button onClick={onClick} className="focus-visible:outline-none">{content}</button>;
}
