'use client';

import React, { useRef, useMemo } from 'react';
import { motion, useScroll, useTransform, MotionValue } from 'framer-motion';

function ScrollRevealChar({
  children,
  progress,
  range,
}: {
  children: React.ReactNode;
  progress: MotionValue<number>;
  range: number[];
}) {
  const opacity = useTransform(progress, range, [0.18, 1]);
  // Transitions smoothly from dark neutral-800 to pure white as user scrolls
  const color = useTransform(progress, range, ['#262626', '#ffffff']);

  return (
    <motion.span style={{ opacity, color }}>
      {children}
    </motion.span>
  );
}

interface ScrollRevealTitleProps {
  text: string;
  as?: 'h1' | 'h2' | 'h3';
  className?: string;
  offset?: [string, string];
}

export function ScrollRevealTitle({
  text,
  as = 'h2',
  className = 'text-2xl sm:text-4xl font-bold tracking-tight uppercase leading-[1.1]',
  offset = ['start 90%', 'end 45%'],
}: ScrollRevealTitleProps) {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const { scrollYProgress } = useScroll({
    target: titleRef,
    // @ts-expect-error framer-motion accepts string tuple for offset
    offset,
  });

  const { wordsWithIndices, totalChars } = useMemo(() => {
    const words = text.split(' ');
    let absoluteIndex = 0;
    const totalChars = text.replace(/\s/g, '').length;

    const wordsWithIndices = words.map(word => {
      return word.split('').map(char => {
        const index = absoluteIndex++;
        return { char, index };
      });
    });

    return { wordsWithIndices, totalChars };
  }, [text]);

  const Tag = as;

  return (
    <Tag ref={titleRef} className={className}>
      {wordsWithIndices.map((word, i) => (
        <span key={i} className="inline-block mr-[0.25em]">
          {word.map(letterInfo => {
            const start = letterInfo.index / (totalChars * 1.5);
            const end = Math.min(1, start + 0.3);
            return (
              <ScrollRevealChar key={letterInfo.index} progress={scrollYProgress} range={[start, end]}>
                {letterInfo.char}
              </ScrollRevealChar>
            );
          })}
        </span>
      ))}
    </Tag>
  );
}
