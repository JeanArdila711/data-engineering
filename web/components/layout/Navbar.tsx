'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import {
  motion,
  AnimatePresence,
  useMotionTemplate,
  useScroll,
  useSpring,
  useTransform,
} from 'framer-motion';
import { RevealButton } from '@/components/ui/reveal-button';
import { ExternalLink, Radio } from 'lucide-react';

const LINKS = [
  { label: 'Radar', id: 'radar', href: '#radar' },
  { label: 'Manifiesto', id: 'manifiesto', href: '#manifiesto' },
  { label: 'Ecosistema', id: 'ecosystem', href: '#ecosystem' },
];

// Dark engineering theme RGB tokens for dynamic scroll alpha interpolation
const CARD_RGB = '10, 10, 10';
const BORDER_RGB = '38, 38, 38';
const INK_RGB = '0, 0, 0';

// Light pill spring physics: fast arrival and settles cleanly without excessive bounce
const PILL_SPRING = {
  type: 'spring',
  mass: 0.6,
  stiffness: 380,
  damping: 32,
} as const;

const IOS_EASE = [0.4, 0, 0.2, 1] as const;

// Desktop Container entrance animation variants
const CONTAINER_VARIANTS = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, ease: IOS_EASE, staggerChildren: 0.06 },
  },
};

const LIST_VARIANTS = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const ITEM_VARIANTS = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: IOS_EASE } },
};

// Mobile overlay animation variants
const MOBILE_MENU_VARIANTS = {
  open: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.45, ease: IOS_EASE },
  },
  closed: {
    opacity: 0,
    y: 24,
    filter: 'blur(8px)',
    transition: { duration: 0.25, ease: IOS_EASE },
  },
};

export default function Navbar() {
  const [active, setActive] = useState<string | null>('radar');
  const [hovered, setHovered] = useState<string | null>(null);
  const [lean, setLean] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileHidden, setMobileHidden] = useState(false);

  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const targetRef = useRef<string | null>(null);
  const lastScrollY = useRef(0);

  // Target item for magnetic pill
  const target = hovered ?? active;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Update pill travel direction lean (-1: left, 1: right)
  function updateLean(next: string | null) {
    const prevIndex = LINKS.findIndex((link) => link.id === targetRef.current);
    const nextIndex = LINKS.findIndex((link) => link.id === next);
    setLean(
      prevIndex !== -1 && nextIndex !== -1 && prevIndex !== nextIndex
        ? Math.sign(nextIndex - prevIndex)
        : 0
    );
    targetRef.current = next;
  }

  // Active section tracking via IntersectionObserver for Desktop
  useEffect(() => {
    const sections = LINKS.map((link) => document.getElementById(link.id)).filter(
      (el): el is HTMLElement => el !== null
    );
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        updateLean(visible.target.id);
        setActive(visible.target.id);
      },
      { rootMargin: '-30% 0px -40% 0px', threshold: [0, 0.25, 0.5, 1] }
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  // Mobile scroll behavior: auto-hide on scroll down, reveal on scroll up
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const prev = lastScrollY.current;
      setScrolled(y > 30);

      if (y < 30) {
        setMobileHidden(false);
      } else if (y > prev + 10) {
        setMobileHidden(true);
      } else if (y < prev - 10) {
        setMobileHidden(false);
      }
      lastScrollY.current = y;
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Mobile modal lock body scroll
  const openMenu = () => {
    setMobileOpen(true);
    document.documentElement.style.overflow = 'hidden';
  };

  const closeMenu = () => {
    setMobileOpen(false);
    document.documentElement.style.overflow = '';
  };

  function handleEnter(id: string) {
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
    updateLean(id);
    setHovered(id);
  }

  function handleLeave() {
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
    leaveTimer.current = setTimeout(() => {
      setLean(0);
      targetRef.current = null;
      setHovered(null);
    }, 140);
  }

  // Desktop Condensation via Framer Motion Scroll
  const { scrollY, scrollYProgress } = useScroll();
  const compactRaw = useTransform(scrollY, [40, 160], [0, 1]);
  const compact = useSpring(compactRaw, {
    stiffness: 200,
    damping: 32,
    mass: 0.4,
  });

  const maxWidthRem = useTransform(compact, [0, 1], [72, 46]);
  const maxWidth = useMotionTemplate`${maxWidthRem}rem`;

  const bgAlpha = useTransform(compact, [0, 1], [0.35, 0.92]);
  const borderAlpha = useTransform(compact, [0, 1], [0.4, 0.85]);
  const shadowAlpha = useTransform(compact, [0, 1], [0, 0.4]);
  const blur = useTransform(compact, [0, 1], [4, 16]);

  const backgroundColor = useMotionTemplate`rgba(${CARD_RGB}, ${bgAlpha})`;
  const borderColor = useMotionTemplate`rgba(${BORDER_RGB}, ${borderAlpha})`;
  const boxShadow = useMotionTemplate`0 12px 40px rgba(${INK_RGB}, ${shadowAlpha})`;
  const backdropFilter = useMotionTemplate`blur(${blur}px)`;

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. DESKTOP FLOATING PILL NAVBAR (Hidden on mobile, active on md+)        */}
      {/* ========================================================================= */}
      <header className="fixed inset-x-0 top-4 z-50 hidden md:block px-6 pointer-events-none">
        <motion.nav
          aria-label="Navegación principal"
          variants={CONTAINER_VARIANTS}
          initial="hidden"
          animate="visible"
          style={{ maxWidth }}
          className="pointer-events-auto relative mx-auto flex items-center justify-between gap-6 rounded-full py-2 pl-5 pr-2"
        >
          {/* Interpolated dynamic backdrop and border */}
          <motion.div
            aria-hidden="true"
            style={{
              backgroundColor,
              borderColor,
              boxShadow,
              backdropFilter,
              WebkitBackdropFilter: backdropFilter,
            }}
            className="absolute inset-0 rounded-full border shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]"
          />

          {/* Reading progress hairline along the bottom of the pill */}
          <motion.div
            aria-hidden="true"
            style={{ scaleX: scrollYProgress }}
            className="absolute inset-x-7 bottom-0 h-[1.5px] origin-left bg-gradient-to-r from-emerald-500 to-emerald-400 z-20"
          />

          {/* Brand / Logo with live signal */}
          <motion.div variants={ITEM_VARIANTS} className="relative z-10 flex items-center gap-2.5">
            <Link
              href="#radar"
              className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.25em] text-white hover:text-neutral-200 transition-colors"
            >
              <span className="relative flex size-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full size-2 bg-emerald-500 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              </span>
              <span>DE RADAR</span>
            </Link>
          </motion.div>

          {/* Center: Magnetic Pill Section Navigation */}
          <motion.ul
            variants={LIST_VARIANTS}
            onMouseLeave={handleLeave}
            className="relative z-10 flex items-center gap-1"
          >
            {LINKS.map((link) => {
              const isTarget = target === link.id;

              return (
                <li key={link.id} className="relative">
                  {isTarget && (
                    <motion.span
                      layoutId="nav-pill"
                      aria-hidden="true"
                      style={{ borderRadius: 9999 }}
                      transition={PILL_SPRING}
                      className="absolute inset-0 z-0 bg-neutral-900 border border-neutral-700/80 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]"
                    >
                      {/* Squash & stretch arrival animation */}
                      <motion.span
                        key={link.id}
                        initial={{ scaleX: 1.12 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: 0.4, ease: IOS_EASE }}
                        className="block h-full w-full rounded-full"
                      />
                    </motion.span>
                  )}

                  <a
                    href={link.href}
                    onMouseEnter={() => handleEnter(link.id)}
                    onFocus={() => handleEnter(link.id)}
                    onBlur={handleLeave}
                    className={`relative z-10 block rounded-full px-3.5 py-1.5 text-xs font-mono tracking-wider uppercase transition-colors duration-150 ${
                      isTarget ? 'text-white font-medium' : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    <motion.span
                      key={isTarget ? 'target' : 'idle'}
                      initial={isTarget ? { x: lean * 5 } : false}
                      animate={{ x: 0 }}
                      transition={PILL_SPRING}
                      className="block"
                    >
                      {link.label}
                    </motion.span>
                  </a>
                </li>
              );
            })}
          </motion.ul>

          {/* Right CTA Button with Reveal Effect */}
          <motion.div variants={ITEM_VARIANTS} className="relative z-10">
            <RevealButton href="#ecosystem">
              Explorar Stack
            </RevealButton>
          </motion.div>
        </motion.nav>
      </header>

      {/* ========================================================================= */}
      {/* 2. MOBILE TOP HEADER (Auto-hide on scroll down, active on < md)          */}
      {/* ========================================================================= */}
      <motion.header
        className={`fixed inset-x-0 top-0 z-50 md:hidden transition-colors duration-300 ${
          scrolled
            ? 'bg-black/90 backdrop-blur-md border-b border-neutral-800/80 shadow-[0_4px_24px_rgba(0,0,0,0.4)]'
            : 'bg-transparent'
        } ${mobileHidden && !mobileOpen ? 'pointer-events-none' : ''}`}
        animate={
          mobileHidden && !mobileOpen
            ? { opacity: 0, filter: 'blur(6px)', y: -12 }
            : { opacity: 1, filter: 'blur(0px)', y: 0 }
        }
        transition={
          mobileHidden && !mobileOpen
            ? { duration: 0.2, ease: [0.4, 0, 1, 1] }
            : { duration: 0.45, ease: [0, 0, 0.2, 1] }
        }
      >
        <nav className="flex items-center justify-between px-5 py-3.5">
          {/* Mobile Logo */}
          <Link
            href="#radar"
            className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.25em] text-white"
          >
            <span className="relative flex size-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full size-2 bg-emerald-500 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            </span>
            <span>DE RADAR</span>
          </Link>

          {/* Mobile Actions: GitHub Link + Animated Hamburger Button */}
          <div className="flex items-center gap-2">
            <a
              href="https://github.com/JeanArdila711/data-engineering"
              target="_blank"
              rel="noopener noreferrer"
              className="size-8 rounded-full border border-neutral-800 bg-neutral-950 flex items-center justify-center text-neutral-400 hover:text-white transition-colors"
              aria-label="GitHub Repository"
            >
                        <svg className="size-3.5 fill-current" viewBox="0 0 24 24">
                          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                        </svg>
            </a>

            {/* 3-line to X morphing Hamburger Button */}
            <button
              onClick={() => (mobileOpen ? closeMenu() : openMenu())}
              className="flex flex-col justify-center items-center gap-[4.5px] size-9 rounded-full border border-neutral-800 bg-neutral-900/90 text-neutral-200 active:scale-95 transition-all"
              aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
            >
              <motion.span
                animate={mobileOpen ? { rotate: 45, y: 5 } : { rotate: 0, y: 0 }}
                transition={{ duration: 0.25 }}
                className="block h-[1.5px] w-4.5 bg-white origin-center"
              />
              <motion.span
                animate={mobileOpen ? { opacity: 0 } : { opacity: 1 }}
                transition={{ duration: 0.15 }}
                className="block h-[1.5px] w-4.5 bg-white"
              />
              <motion.span
                animate={mobileOpen ? { rotate: -45, y: -5 } : { rotate: 0, y: 0 }}
                transition={{ duration: 0.25 }}
                className="block h-[1.5px] w-4.5 bg-white origin-center"
              />
            </button>
          </div>
        </nav>
      </motion.header>

      {/* ========================================================================= */}
      {/* 3. FULLSCREEN MOBILE PORTAL OVERLAY (Smooth clip-path wipe animation)     */}
      {/* ========================================================================= */}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {mobileOpen && (
              <motion.div
                initial={{ clipPath: 'inset(0 0 100% 0)' }}
                animate={{ clipPath: 'inset(0 0 0% 0)' }}
                exit={{ clipPath: 'inset(0 0 100% 0)' }}
                transition={{ duration: 0.55, ease: [0.76, 0, 0.24, 1] }}
                className="fixed inset-0 z-[9999] flex flex-col bg-black/98 backdrop-blur-2xl text-white select-none touch-none"
              >
                <motion.div
                  className="flex flex-col h-full justify-between px-6 pt-6 pb-10"
                  initial="closed"
                  animate="open"
                  exit="closed"
                  variants={{
                    open: {
                      transition: { staggerChildren: 0.07, delayChildren: 0.2 },
                    },
                    closed: {
                      transition: {
                        staggerChildren: 0.03,
                        staggerDirection: -1,
                      },
                    },
                  }}
                >
                  {/* Overlay Top Bar */}
                  <motion.div
                    className="flex items-center justify-between border-b border-neutral-900 pb-5"
                    variants={MOBILE_MENU_VARIANTS}
                  >
                    <span className="font-mono text-xs font-semibold tracking-widest text-emerald-400 uppercase flex items-center gap-2">
                      <Radio size={13} className="animate-pulse" />
                      <span>MENU // DE RADAR</span>
                    </span>

                    <button
                      onClick={closeMenu}
                      aria-label="Cerrar menú"
                      className="size-9 rounded-full border border-neutral-800 bg-neutral-900/80 flex items-center justify-center text-neutral-400 hover:text-white active:scale-90 transition-all cursor-pointer"
                    >
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                        <path
                          d="M1 1l14 14M15 1L1 15"
                          stroke="currentColor"
                          strokeWidth="1.75"
                          strokeLinecap="round"
                        />
                      </svg>
                    </button>
                  </motion.div>

                  {/* Centered Large Numbered Navigation Links */}
                  <nav className="flex flex-col items-start justify-center gap-2 my-auto">
                    {LINKS.map((link, i) => (
                      <motion.a
                        key={link.id}
                        href={link.href}
                        onClick={closeMenu}
                        variants={MOBILE_MENU_VARIANTS}
                        className="group flex items-baseline gap-4 py-3 w-full border-b border-neutral-900/70"
                      >
                        <span className="font-mono text-xs tracking-widest text-emerald-500/80">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <span className="font-heading text-3xl font-bold tracking-tight text-neutral-300 group-hover:text-white group-hover:translate-x-1.5 transition-all duration-200 uppercase">
                          {link.label}
                        </span>
                      </motion.a>
                    ))}
                  </nav>

                  {/* Overlay Bottom Footer */}
                  <motion.div
                    className="flex flex-col gap-4 border-t border-neutral-900 pt-6"
                    variants={MOBILE_MENU_VARIANTS}
                  >
                    <div className="flex items-center justify-between text-xs font-mono text-neutral-500">
                      <span className="flex items-center gap-1.5 text-emerald-400">
                        <span className="size-1.5 rounded-full bg-emerald-400" />
                        <span>PIPELINE ONLINE</span>
                      </span>
                      <span>v1.0.0 STABLE</span>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <a
                        href="https://github.com/JeanArdila711/data-engineering"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={closeMenu}
                        className="inline-flex items-center gap-2 text-xs font-mono text-neutral-400 hover:text-white transition-colors"
                      >
                                  <svg className="size-3.5 fill-current" viewBox="0 0 24 24">
                          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                        </svg>
                        <span>JeanArdila711/data-engineering</span>
                        <ExternalLink size={11} />
                      </a>
                    </div>
                  </motion.div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}

export { Navbar };
