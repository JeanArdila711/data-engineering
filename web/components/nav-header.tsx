"use client";

import React, { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";

const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

const ITEM_VARIANTS = {
  open: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.45, ease: [0.4, 0, 0.2, 1] as const },
  },
  closed: {
    opacity: 0,
    y: 24,
    filter: "blur(8px)",
    transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] as const },
  },
};

export interface NavLinkItem {
  label: string;
  href: string;
  isExternal?: boolean;
}

const DEFAULT_LINKS: NavLinkItem[] = [
  { label: "Inicio", href: "/" },
  { label: "Radar Releases", href: "/#radar" },
  { label: "Ecosistema", href: "/#ecosystem" },
  { label: "Deep-Dives", href: "/#articulos" },
  { label: "Digest Semanal", href: "/#digest" },
  { label: "Rumbo (Grafo)", href: "/ruta" },
  { label: "Práctica", href: "/practica" },
  { label: "Glosario DE", href: "/glosario" },
  {
    label: "GitHub Repo",
    href: "https://github.com/JeanArdila711/data-engineering",
    isExternal: true,
  },
];

export interface NavHeaderProps {
  links?: NavLinkItem[];
}

export default function NavHeader({ links = DEFAULT_LINKS }: NavHeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const mounted = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const prev = lastY.current;
      setScrolled(y > 40);
      if (y < 40) {
        setHidden(false);
      } else if (y > prev + 8) {
        setHidden(true);
      } else if (y < prev - 8) {
        setHidden(false);
      }
      lastY.current = y;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const openMenu = () => {
    setMobileOpen(true);
    document.documentElement.style.overflow = "hidden";
  };

  const closeMenu = () => {
    setMobileOpen(false);
    document.documentElement.style.overflow = "";
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mobileOpen) {
        closeMenu();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  useEffect(() => {
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, []);

  return (
    <>
      {/* Mobile Top Header (hidden on md and larger) */}
      <motion.header
        className={[
          "fixed inset-x-0 top-0 z-50 md:hidden",
          scrolled
            ? "bg-black/85 backdrop-blur-md border-b border-neutral-800/80 shadow-[0_4px_24px_rgba(0,0,0,0.6)]"
            : "bg-transparent",
          hidden && !mobileOpen ? "pointer-events-none" : "",
        ].join(" ")}
        animate={
          hidden && !mobileOpen
            ? { opacity: 0, filter: "blur(8px)", y: -10 }
            : { opacity: 1, filter: "blur(0px)", y: 0 }
        }
        transition={
          hidden && !mobileOpen
            ? { duration: 0.22, ease: [0.4, 0, 1, 1] }
            : { duration: 0.55, ease: [0, 0, 0.2, 1] }
        }
      >
        <nav
          className={`flex items-center justify-between px-5 transition-all duration-300 ${
            scrolled ? "py-3.5" : "py-5"
          }`}
        >
          {/* Logo / Marca */}
          <Link
            href="/"
            onClick={closeMenu}
            className="flex items-center gap-2 group"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="font-mono text-xs font-bold uppercase tracking-[0.25em] text-white">
              DE <span className="text-emerald-400">RADAR</span>
            </span>
          </Link>

          {/* Botón Hamburguesa Animado */}
          <button
            type="button"
            className="flex h-9 w-9 flex-col items-center justify-center gap-[5px] rounded-lg border border-neutral-800 bg-neutral-900/60 p-1.5 backdrop-blur-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
            onClick={() => (mobileOpen ? closeMenu() : openMenu())}
            aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={mobileOpen}
          >
            <motion.span
              animate={mobileOpen ? { rotate: 45, y: 6.5 } : { rotate: 0, y: 0 }}
              transition={{ duration: 0.25 }}
              className="block h-[1.5px] w-5 origin-center bg-white transition-colors duration-200"
            />
            <motion.span
              animate={mobileOpen ? { opacity: 0 } : { opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="block h-[1.5px] w-5 bg-white transition-colors duration-200"
            />
            <motion.span
              animate={mobileOpen ? { rotate: -45, y: -6.5 } : { rotate: 0, y: 0 }}
              transition={{ duration: 0.25 }}
              className="block h-[1.5px] w-5 origin-center bg-white transition-colors duration-200"
            />
          </button>
        </nav>
      </motion.header>

      {/* Overlay full-screen — portal al body para escapar de cualquier stacking context */}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {mobileOpen && (
              <motion.div
                initial={{ clipPath: "inset(0 0 100% 0)" }}
                animate={{ clipPath: "inset(0 0 0% 0)" }}
                exit={{ clipPath: "inset(0 0 100% 0)" }}
                transition={{ duration: 0.65, ease: [0.76, 0, 0.24, 1] }}
                className="fixed inset-0 z-[9999] flex flex-col bg-neutral-950 text-white md:hidden"
                role="dialog"
                aria-modal="true"
                aria-label="Menú de navegación"
              >
                {/* Fondo con grid técnico */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(52,211,153,0.08),rgba(0,0,0,0))] pointer-events-none" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />

                <motion.div
                  className="relative z-10 flex flex-col h-full flex-1"
                  initial="closed"
                  animate="open"
                  exit="closed"
                  variants={{
                    open: {
                      transition: { staggerChildren: 0.05, delayChildren: 0.2 },
                    },
                    closed: {
                      transition: {
                        staggerChildren: 0.03,
                        staggerDirection: -1,
                      },
                    },
                  }}
                >
                  {/* Header del overlay */}
                  <motion.div
                    className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-neutral-900/80"
                    variants={ITEM_VARIANTS}
                  >
                    <div className="flex items-center gap-2">
                      <span className="flex h-2 w-2 rounded-full bg-emerald-400" />
                      <span className="font-mono text-xs font-bold uppercase tracking-[0.25em] text-neutral-400">
                        NAVEGACIÓN
                      </span>
                    </div>
                    <motion.button
                      onClick={closeMenu}
                      aria-label="Cerrar menú"
                      whileTap={{ scale: 0.9 }}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-800 bg-neutral-900/80 text-neutral-300 transition-colors hover:text-white hover:border-neutral-700"
                    >
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                        <path
                          d="M1 1l14 14M15 1L1 15"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      </svg>
                    </motion.button>
                  </motion.div>

                  {/* Links centrados con scroll seguro para cualquier altura de pantalla */}
                  <nav className="flex flex-1 flex-col justify-center px-6 py-4 overflow-y-auto gap-1">
                    {links.map((link, i) => (
                      <motion.div key={link.href} variants={ITEM_VARIANTS}>
                        <Link
                          href={link.href}
                          onClick={closeMenu}
                          target={link.isExternal ? "_blank" : undefined}
                          rel={link.isExternal ? "noopener noreferrer" : undefined}
                          className="group flex items-center justify-between py-2.5 px-3 rounded-xl transition-colors hover:bg-white/[0.04]"
                        >
                          <div className="flex items-center gap-4">
                            <span className="font-mono text-[11px] text-neutral-500 transition-colors group-hover:text-emerald-400">
                              {String(i + 1).padStart(2, "0")}
                            </span>
                            <span className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-200 transition-colors group-hover:text-white group-hover:translate-x-1 duration-200">
                              {link.label}
                            </span>
                          </div>
                          {link.isExternal ? (
                            <span className="font-mono text-xs text-neutral-500 group-hover:text-emerald-400">
                              ↗
                            </span>
                          ) : (
                            <span className="text-xs text-neutral-600 opacity-0 group-hover:opacity-100 group-hover:text-emerald-400 transition-opacity">
                              →
                            </span>
                          )}
                        </Link>
                      </motion.div>
                    ))}
                  </nav>

                  {/* Footer del overlay */}
                  <motion.div
                    className="flex items-center justify-between px-6 py-5 border-t border-neutral-900 bg-neutral-950/80"
                    variants={ITEM_VARIANTS}
                  >
                    <a
                      href="https://github.com/JeanArdila711/data-engineering"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-[11px] uppercase tracking-[0.2em] text-neutral-400 hover:text-emerald-400 transition-colors flex items-center gap-1.5"
                    >
                      <GithubIcon className="w-3.5 h-3.5" />
                      <span>GitHub Repo</span>
                    </a>
                    <span className="font-mono text-[10px] tracking-wider text-neutral-600">
                      MODERN DATA STACK
                    </span>
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
