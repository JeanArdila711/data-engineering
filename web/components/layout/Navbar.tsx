'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import {
  motion,
  AnimatePresence,
  useMotionTemplate,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
} from 'framer-motion';
import {
  ExternalLink,
  Radio,
  ArrowRight,
  Search,
  ArrowUp,
  Command,
  Sparkles,
  Star,
} from 'lucide-react';

const LINKS = [
  { label: 'Radar', id: 'radar', href: '#radar' },
  { label: 'Manifiesto', id: 'manifiesto', href: '#manifiesto' },
  { label: 'Ecosistema', id: 'ecosystem', href: '#ecosystem' },
  { label: 'Artículos', id: 'articulos', href: '#articulos' },
  { label: 'Digest', id: 'digest', href: '#digest' },
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
  const [showTelemetry, setShowTelemetry] = useState(false);

  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const targetRef = useRef<string | null>(null);
  const lastScrollY = useRef(0);

  // Desktop Spotlight Mouse Tracking via useMotionValue (Zero React re-renders)
  const desktopMouseX = useMotionValue(0);
  const desktopMouseY = useMotionValue(0);

  function handleDesktopMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent<HTMLElement>) {
    const { left, top } = currentTarget.getBoundingClientRect();
    desktopMouseX.set(clientX - left);
    desktopMouseY.set(clientY - top);
  }

  const desktopSpotlight = useMotionTemplate`radial-gradient(180px circle at ${desktopMouseX}px ${desktopMouseY}px, rgba(52, 211, 153, 0.25), rgba(255, 255, 255, 0.1), transparent 80%)`;

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

  // Robust Scroll Spy for Active Section (Eliminates ratio jumping between sections of different heights)
  useEffect(() => {
    let ticking = false;

    const onScrollSpy = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const y = window.scrollY;

          // 1. Top of page always locks to 'radar'
          if (y < 150) {
            if (targetRef.current !== 'radar') {
              updateLean('radar');
              setActive('radar');
            }
            ticking = false;
            return;
          }

          // 2. Check if reached bottom of the page (locks to last section: 'digest')
          if (window.innerHeight + y >= document.documentElement.scrollHeight - 80) {
            const lastLink = LINKS[LINKS.length - 1].id;
            if (targetRef.current !== lastLink) {
              updateLean(lastLink);
              setActive(lastLink);
            }
            ticking = false;
            return;
          }

          // 3. Scan section positions relative to viewport
          const threshold = 260; // pixels from viewport top
          let currentSection: string = 'radar';

          for (const link of LINKS) {
            const el = document.getElementById(link.id);
            if (el) {
              const top = el.getBoundingClientRect().top;
              if (top <= threshold) {
                currentSection = link.id;
              }
            }
          }

          if (currentSection !== targetRef.current) {
            updateLean(currentSection);
            setActive(currentSection);
          }

          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScrollSpy, { passive: true });
    onScrollSpy();
    return () => window.removeEventListener('scroll', onScrollSpy);
  }, []);

  // Smooth click navigation with fixed navbar offset
  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const id = href.replace('#', '');
    const el = document.getElementById(id);
    if (el) {
      updateLean(id);
      setActive(id);

      const navbarHeight = 80;
      const elementPosition = el.getBoundingClientRect().top + window.scrollY;
      const offsetPosition = Math.max(0, elementPosition - navbarHeight);

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };

  // Quick Search Command Palette Trigger
  const handleOpenSearch = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    window.dispatchEvent(new CustomEvent('open-command-palette'));
  };

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
      targetRef.current = active;
      setHovered(null);
    }, 140);
  }

  // Desktop Condensation via Framer Motion Scroll
  const { scrollY } = useScroll();
  const compactRaw = useTransform(scrollY, [40, 160], [0, 1]);
  const compact = useSpring(compactRaw, {
    stiffness: 200,
    damping: 32,
    mass: 0.4,
  });

  const maxWidthRem = useTransform(compact, [0, 1], [78, 64]);
  const maxWidth = useMotionTemplate`${maxWidthRem}rem`;

  const bgAlpha = useTransform(compact, [0, 1], [0.4, 0.94]);
  const borderAlpha = useTransform(compact, [0, 1], [0.4, 0.85]);
  const shadowAlpha = useTransform(compact, [0, 1], [0, 0.4]);
  const blur = useTransform(compact, [0, 1], [6, 16]);

  const backgroundColor = useMotionTemplate`rgba(${CARD_RGB}, ${bgAlpha})`;
  const borderColor = useMotionTemplate`rgba(${BORDER_RGB}, ${borderAlpha})`;
  const boxShadow = useMotionTemplate`0 12px 40px rgba(${INK_RGB}, ${shadowAlpha})`;
  const backdropFilter = useMotionTemplate`blur(${blur}px)`;

  const isLowerPage = active === 'ecosystem' || active === 'articulos' || active === 'digest';

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
          onMouseMove={handleDesktopMouseMove}
          style={{ maxWidth }}
          className="group pointer-events-auto relative mx-auto flex items-center justify-between gap-3 lg:gap-5 rounded-full py-2 px-3 sm:px-4"
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

          {/* Dynamic GPU Metallic Spotlight on Desktop Pill Border */}
          <motion.div
            aria-hidden="true"
            className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10"
            style={{
              background: desktopSpotlight,
            }}
          />

          {/* Brand / Logo with Live Telemetry Beacon Popover */}
          <motion.div 
            variants={ITEM_VARIANTS} 
            className="relative z-20 flex items-center shrink-0"
            onMouseEnter={() => setShowTelemetry(true)}
            onMouseLeave={() => setShowTelemetry(false)}
          >
            <a
              href="#radar"
              onClick={(e) => handleNavClick(e, '#radar')}
              className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.2em] text-white hover:text-neutral-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded-sm transition-colors cursor-pointer select-none py-1 pl-1 pr-2 shrink-0 whitespace-nowrap"
            >
              <span className="relative flex size-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full size-2 bg-emerald-500 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              </span>
              <span className="whitespace-nowrap font-bold tracking-[0.2em]">DE RADAR</span>
            </a>

            {/* Live Telemetry Floating Holographic Popover */}
            <AnimatePresence>
              {showTelemetry && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.95 }}
                  transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute left-0 top-full mt-3 w-64 p-3.5 rounded-2xl bg-neutral-950/95 border border-neutral-800/90 shadow-[0_16px_36px_rgba(0,0,0,0.8),inset_0_1px_0_0_rgba(255,255,255,0.08)] backdrop-blur-xl z-50 flex flex-col gap-2.5 pointer-events-none"
                >
                  <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2">
                    <span className="text-[10px] font-mono font-bold tracking-widest text-emerald-400 uppercase flex items-center gap-1.5">
                      <Radio size={11} className="animate-pulse" />
                      <span>TELEMETRÍA // LIVE</span>
                    </span>
                    <span className="text-[9px] font-mono text-neutral-500">v1.0 STABLE</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="flex flex-col gap-0.5 p-1.5 rounded-lg bg-neutral-900/60 border border-neutral-800/50">
                      <span className="text-[9px] text-neutral-500">Pipeline</span>
                      <span className="text-emerald-400 font-semibold text-[11px] flex items-center gap-1">
                        <span className="size-1.5 rounded-full bg-emerald-400" />
                        100% Online
                      </span>
                    </div>
                    <div className="flex flex-col gap-0.5 p-1.5 rounded-lg bg-neutral-900/60 border border-neutral-800/50">
                      <span className="text-[9px] text-neutral-500">Almacenamiento</span>
                      <span className="text-neutral-200 text-[11px]">PostgreSQL</span>
                    </div>
                    <div className="flex flex-col gap-0.5 p-1.5 rounded-lg bg-neutral-900/60 border border-neutral-800/50">
                      <span className="text-[9px] text-neutral-500">Motores Core</span>
                      <span className="text-neutral-200 text-[11px]">10 Oficiales</span>
                    </div>
                    <div className="flex flex-col gap-0.5 p-1.5 rounded-lg bg-neutral-900/60 border border-neutral-800/50">
                      <span className="text-[9px] text-neutral-500">Validación</span>
                      <span className="text-neutral-200 text-[11px]">Anclaje NLI</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Center: Magnetic Pill Section Navigation */}
          <motion.ul
            variants={LIST_VARIANTS}
            onMouseLeave={handleLeave}
            className="relative z-10 flex items-center gap-0.5 lg:gap-1 shrink-0"
          >
            {LINKS.map((link) => {
              const isTarget = target === link.id;

              return (
                <li key={link.id} className="relative shrink-0">
                  {isTarget && (
                    <motion.span
                      layoutId="nav-pill"
                      aria-hidden="true"
                      style={{ borderRadius: 9999 }}
                      transition={PILL_SPRING}
                      className="absolute inset-0 z-0 bg-neutral-900 border border-neutral-700/80 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]"
                    />
                  )}

                  <a
                    href={link.href}
                    onClick={(e) => handleNavClick(e, link.href)}
                    onMouseEnter={() => handleEnter(link.id)}
                    onFocus={() => handleEnter(link.id)}
                    onBlur={handleLeave}
                    className={`relative z-10 block rounded-full px-2.5 lg:px-3 py-1.5 text-xs font-mono tracking-wider uppercase whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black transition-colors duration-150 cursor-pointer ${
                      isTarget ? 'text-white font-medium' : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    <span className="block whitespace-nowrap">
                      {link.label}
                    </span>
                  </a>
                </li>
              );
            })}
          </motion.ul>

          {/* Right Actions: Quick Search ⌘K + Smart Morphing Action Button */}
          <div className="relative z-10 flex items-center gap-2 lg:gap-2.5 shrink-0">
            {/* Quick Search Button */}
            <button
              onClick={handleOpenSearch}
              className="flex items-center gap-1.5 px-2.5 lg:px-3 py-1.5 rounded-full border border-neutral-800 bg-neutral-950/80 hover:bg-neutral-900 text-neutral-400 hover:text-white text-xs font-mono transition-all cursor-pointer shadow-inner active:scale-95 group shrink-0 whitespace-nowrap"
              title="Buscar herramienta (⌘K)"
            >
              <Search size={12} className="text-neutral-500 group-hover:text-emerald-400 transition-colors shrink-0" />
              <span className="text-[11px] whitespace-nowrap">Buscar</span>
              <kbd className="flex items-center gap-0.5 text-[9px] font-mono text-neutral-500 bg-neutral-900 border border-neutral-800 px-1 py-0.5 rounded shrink-0">
                <Command size={9} />
                <span>K</span>
              </kbd>
            </button>

            {/* GitHub Star Button (Stable, High-End CTA) */}
            <motion.a
              href="https://github.com/JeanArdila711/data-engineering"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              className="group relative inline-flex items-center justify-center gap-2 rounded-full bg-neutral-900/90 hover:bg-neutral-800 text-neutral-200 hover:text-white border border-neutral-750 hover:border-neutral-600 px-3 py-1.5 font-mono text-xs font-medium tracking-wide transition-all duration-200 cursor-pointer shadow-sm overflow-hidden shrink-0 whitespace-nowrap"
            >
              {/* Ambient shimmer ray on hover */}
              <div 
                aria-hidden="true"
                className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none"
              />

              <svg className="size-3.5 fill-current text-white shrink-0" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              
              <span className="font-semibold text-white">GitHub</span>
              
              <span className="flex items-center gap-1 text-[10px] text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded-full border border-amber-400/20 group-hover:border-amber-400/40 transition-colors">
                <Star size={10} className="fill-amber-400 text-amber-400" />
                <span>Star</span>
              </span>
            </motion.a>
          </div>
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
        <nav className="flex items-center justify-between px-5 pt-[max(0.875rem,env(safe-area-inset-top))] pb-3.5">
          {/* Mobile Logo */}
          <Link
            href="#radar"
            className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.25em] text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 rounded-sm"
          >
            <span className="relative flex size-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full size-2 bg-emerald-500 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            </span>
            <span>DE RADAR</span>
          </Link>

          {/* Mobile Actions: Search + GitHub Link + Animated Hamburger Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenSearch}
              className="size-9 rounded-full border border-neutral-800 bg-neutral-950 flex items-center justify-center text-neutral-400 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 cursor-pointer"
              aria-label="Buscar"
            >
              <Search size={14} />
            </button>

            <a
              href="https://github.com/JeanArdila711/data-engineering"
              target="_blank"
              rel="noopener noreferrer"
              className="size-9 rounded-full border border-neutral-800 bg-neutral-950 flex items-center justify-center text-neutral-400 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
              aria-label="GitHub Repository"
            >
              <svg className="size-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
            </a>

            {/* 3-line to X morphing Hamburger Button */}
            <button
              onClick={() => (mobileOpen ? closeMenu() : openMenu())}
              className="flex flex-col justify-center items-center gap-[4.5px] size-9 rounded-full border border-neutral-800 bg-neutral-900/90 text-neutral-200 active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 cursor-pointer"
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
      {/* 3. FULLSCREEN MOBILE PORTAL OVERLAY (CRT Matrix Grid + Tactile Feedback)  */}
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
                className="fixed inset-0 z-[9999] flex flex-col bg-black/98 backdrop-blur-2xl text-white select-none touch-none overflow-hidden"
              >
                {/* Subtle Technical Matrix / CRT Grid Pattern */}
                <div 
                  aria-hidden="true" 
                  className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:28px_28px] opacity-70" 
                />
                <div 
                  aria-hidden="true" 
                  className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(52,211,153,0.06)_0%,transparent_75%)]" 
                />

                <motion.div
                  className="relative z-10 flex flex-col h-full justify-between px-6 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))]"
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
                    className="flex items-center justify-between border-b border-neutral-900/80 pb-5"
                    variants={MOBILE_MENU_VARIANTS}
                  >
                    <span className="font-mono text-xs font-semibold tracking-widest text-emerald-400 uppercase flex items-center gap-2">
                      <Radio size={13} className="animate-pulse" />
                      <span>CONSOLE // RADAR</span>
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

                  {/* Centered Large Numbered Navigation Links with Tactile Feedback */}
                  <nav className="flex flex-col items-start justify-center gap-2 my-auto">
                    {LINKS.map((link, i) => (
                      <motion.a
                        key={link.id}
                        href={link.href}
                        onClick={(e) => {
                          closeMenu();
                          handleNavClick(e, link.href);
                        }}
                        variants={MOBILE_MENU_VARIANTS}
                        className="group flex items-center justify-between py-3.5 w-full border-b border-neutral-900/70 active:bg-neutral-900/30 px-2 rounded-xl transition-all cursor-pointer"
                      >
                        <div className="flex items-baseline gap-4">
                          <span className="font-mono text-xs tracking-widest text-neutral-500 group-hover:text-emerald-400 transition-colors">
                            {String(i + 1).padStart(2, '0')}
                          </span>
                          <span className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-neutral-200 group-hover:text-white group-hover:translate-x-1.5 transition-all duration-200 uppercase">
                            {link.label}
                          </span>
                        </div>

                        <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-600 group-hover:text-emerald-400 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <span>Ir</span>
                          <ArrowRight size={12} />
                        </span>
                      </motion.a>
                    ))}

                    {/* Quick Engine Direct Filter Pills */}
                    <div className="w-full flex flex-col gap-2 my-2 py-3 border-y border-neutral-900/60">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 flex items-center gap-1.5">
                        <Sparkles size={11} className="text-emerald-400" />
                        <span>Acceso Rápido a Motores</span>
                      </span>
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                        {[
                          { label: 'DuckDB', slug: 'duckdb' },
                          { label: 'Polars', slug: 'polars' },
                          { label: 'Airflow', slug: 'apache-airflow' },
                          { label: 'dbt Core', slug: 'dbt-core' },
                          { label: 'Kafka', slug: 'apache-kafka' },
                        ].map((eng) => (
                          <button
                            key={eng.slug}
                            onClick={(e) => {
                              closeMenu();
                              handleNavClick(e as any, '#ecosystem');
                            }}
                            className="px-2.5 py-1 rounded-lg border border-neutral-800 bg-neutral-900/80 text-[11px] font-mono text-neutral-300 active:bg-neutral-800 hover:text-white shrink-0 transition-colors cursor-pointer"
                          >
                            {eng.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </nav>

                  {/* Overlay Bottom Footer with Engineering Telemetry */}
                  <motion.div
                    className="flex flex-col gap-4 border-t border-neutral-900/80 pt-6"
                    variants={MOBILE_MENU_VARIANTS}
                  >
                    <div className="flex items-center justify-between text-xs font-mono text-neutral-500">
                      <span className="flex items-center gap-1.5 text-emerald-400">
                        <span className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
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

