'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const letterBounceVariants = {
  rest: { y: 0 },
  hover: (i: number) => ({
    y: [0, -4, 0],
    transition: {
      duration: 0.38,
      delay: i * 0.016,
      ease: [0.34, 1.56, 0.64, 1] as const,
    },
  }),
};

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
  const textString = typeof children === 'string' ? children : null;

  const sizeClasses = size === 'sm' 
    ? 'px-4 py-2 text-xs' 
    : size === 'lg' 
      ? 'px-7 py-3.5 text-base' 
      : 'px-5 py-2.5 text-sm';

  const content = (
    <motion.span
      initial="rest"
      whileHover="hover"
      whileTap={{ scale: 0.95 }}
      animate="rest"
      className={`group relative inline-flex items-center justify-center rounded-full font-semibold active:scale-95 overflow-hidden shadow-[0_0_15px_rgba(255,255,255,0.15)] hover:shadow-[0_0_25px_rgba(255,255,255,0.22)] bg-white border border-transparent transition-all duration-500 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black ${sizeClasses} ${className}`}
    >
      {/* Expanding Black Hole Circle with Smooth Easing */}
      <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[160%] aspect-square bg-neutral-950 rounded-full scale-0 group-hover:scale-100 transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] z-0 pointer-events-none" />

      {/* Text Container with Staggered Letter Bounce & White Transition */}
      <span className="relative z-10 flex items-center gap-2 text-black group-hover:text-white transition-colors duration-300 pointer-events-none">
        {textString ? (
          <span className="flex">
            {textString.split("").map((char, index) => (
              <motion.span
                key={index}
                custom={index}
                variants={letterBounceVariants}
                className="inline-block"
              >
                {char === " " ? "\u00A0" : char}
              </motion.span>
            ))}
          </span>
        ) : (
          <span>{children}</span>
        )}
        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-300" />
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

  return (
    <button onClick={onClick} className="focus-visible:outline-none">
      {content}
    </button>
  );
}
