"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { X, Plus, ExternalLink } from "lucide-react";

export interface ExpandableCardProps {
  title: string;
  src: string;
  description: string;
  children?: React.ReactNode;
  className?: string;
  classNameExpanded?: string;
  badge?: string;
  badgeClassName?: string;
  ctaText?: string;
  ctaLink?: string;
  [key: string]: any;
}

export function ExpandableCard({
  title,
  src,
  description,
  children,
  className,
  classNameExpanded,
  badge,
  badgeClassName,
  ctaText,
  ctaLink,
  ...props
}: ExpandableCardProps) {
  const [active, setActive] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(false);
  const cardRef = React.useRef<HTMLDivElement>(null);
  const reactId = React.useId();
  // Safe ID string without colons for Framer Motion layoutId
  const id = React.useMemo(() => reactId.replace(/:/g, "-"), [reactId]);

  React.useEffect(() => {
    setIsMobile(window.innerWidth < 640);
  }, []);

  // Lock body scroll and handle Escape key on active state
  React.useEffect(() => {
    if (!active) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActive(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [active]);

  // Apple-calibrated spring physics for instant, zero-lag shared layout morphing
  const springTransition = {
    type: "spring" as const,
    stiffness: 380,
    damping: 32,
    mass: 0.6,
  };

  return (
    <>
      {/* Expanded Modal & Backdrop (Single AnimatePresence for synchronized exit) */}
      <AnimatePresence mode="sync">
        {active && (
          <div key={`portal-overlay-${id}`} className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center pointer-events-none">
            {/* Backdrop with progressive blur & synchronized deceleration exit */}
            <motion.div
              key={`backdrop-${id}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] as const }}
              onClick={() => setActive(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md pointer-events-auto cursor-pointer"
            />

            {/* Expanded Card Modal / Mobile Bottom Sheet with Drag-to-Dismiss */}
            <motion.div
              layoutId={`card-${title}-${id}`}
              ref={cardRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={`card-title-${id}`}
              style={{ willChange: "transform" }}
              transition={springTransition}
              drag={isMobile ? "y" : false}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0.02, bottom: 0.55 }}
              onDragEnd={(_, info) => {
                if (info.offset.y > 75 || info.velocity.y > 300) {
                  setActive(false);
                }
              }}
              className={cn(
                "pointer-events-auto relative z-10 w-full max-w-2xl max-h-[92vh] sm:max-h-[85vh] flex flex-col overflow-hidden touch-pan-y",
                "bg-zinc-950 border border-zinc-800 shadow-2xl",
                "rounded-t-[28px] sm:rounded-3xl",
                classNameExpanded
              )}
              {...props}
            >
              {/* Mobile Drag/Swipe Indicator Handle */}
              <div className="w-12 h-1.5 bg-zinc-700/80 rounded-full mx-auto mt-3 mb-1 sm:hidden shrink-0" />

              {/* Scrollable Container */}
              <div className="overflow-y-auto overflow-x-hidden flex flex-col flex-1 scrollbar-thin scrollbar-thumb-zinc-800">
                {/* Expanded Header Image */}
                <motion.div
                  layoutId={`image-${title}-${id}`}
                  transition={springTransition}
                  className="relative w-full h-56 sm:h-72 shrink-0 overflow-hidden bg-zinc-900"
                >
                  <img
                    src={src}
                    alt={title}
                    className="w-full h-full object-cover object-center select-none"
                  />
                  {/* Subtle bottom gradient to blend image with card body */}
                  <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent" />
                </motion.div>

                {/* Header Information: Title, Description, Badge, Close Button */}
                <div className="p-6 sm:p-8 flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <motion.p
                          layoutId={`description-${description}-${id}`}
                          transition={springTransition}
                          className="text-zinc-400 font-mono text-xs sm:text-sm uppercase tracking-wider font-medium"
                        >
                          {description}
                        </motion.p>
                        {badge && (
                          <motion.span
                            layoutId={`badge-${badge}-${id}`}
                            transition={springTransition}
                            className={cn(
                              "font-mono text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-500/30 bg-emerald-950/40 text-emerald-400",
                              badgeClassName
                            )}
                          >
                            {badge}
                          </motion.span>
                        )}
                      </div>

                      <motion.h3
                        id={`card-title-${id}`}
                        layoutId={`title-${title}-${id}`}
                        transition={springTransition}
                        className="font-bold text-white text-2xl sm:text-4xl tracking-tight"
                      >
                        {title}
                      </motion.h3>
                    </div>

                    {/* Close Button with spring hover & touch feedback */}
                    <motion.button
                      aria-label="Cerrar tarjeta"
                      layoutId={`button-${title}-${id}`}
                      transition={springTransition}
                      whileHover={{ scale: 1.06 }}
                      whileTap={{ scale: 0.88, rotate: -45 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActive(false);
                      }}
                      className="size-10 sm:size-11 shrink-0 flex items-center justify-center rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 hover:border-zinc-700 transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
                    >
                      <X size={18} />
                    </motion.button>
                  </div>

                  {/* Body Content: Ultra-fast implosion exit (90ms) with micro-scale to eliminate text stretch */}
                  <motion.div
                    initial={{ opacity: 0, y: 14, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ 
                      opacity: 0, 
                      scale: 0.96, 
                      y: -4, 
                      transition: { duration: 0.09, ease: [0.32, 0, 0.67, 0] as const } 
                    }}
                    transition={{ duration: 0.24, delay: 0.05, ease: [0.16, 1, 0.3, 1] as const }}
                    className="mt-2 text-zinc-300 text-sm sm:text-base leading-relaxed flex flex-col gap-4"
                  >
                    {children}

                    {/* Optional CTA Link */}
                    {ctaLink && (
                      <div className="pt-4 mt-2 border-t border-zinc-900 flex justify-end">
                        <a
                          href={ctaLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-black hover:bg-zinc-200 font-semibold py-3 px-6 rounded-xl text-sm transition-all shadow-lg active:scale-95 cursor-pointer"
                        >
                          <span>{ctaText || "Ver más"}</span>
                          <ExternalLink size={15} />
                        </a>
                      </div>
                    )}
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Collapsed Base Card (Interactive Trigger in Grid) */}
      <motion.div
        role="button"
        tabIndex={0}
        aria-label={`Abrir detalle de ${title}`}
        layoutId={`card-${title}-${id}`}
        transition={springTransition}
        style={{ willChange: "transform" }}
        onClick={() => setActive(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setActive(true);
          }
        }}
        className={cn(
          "group relative flex flex-col justify-between overflow-hidden rounded-2xl p-4 sm:p-5 cursor-pointer",
          "bg-zinc-950/90 border border-zinc-800/80 hover:border-zinc-700 transition-colors shadow-sm",
          "hover:-translate-y-1 active:scale-[0.985] duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-400/40",
          className
        )}
      >
        <div className="flex flex-col gap-4">
          {/* Card Thumbnail Image */}
          <motion.div
            layoutId={`image-${title}-${id}`}
            transition={springTransition}
            className="w-full h-48 sm:h-52 rounded-xl overflow-hidden bg-zinc-900 relative"
          >
            <img
              src={src}
              alt={title}
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
            />
          </motion.div>

          {/* Card Content & Action Button */}
          <div className="flex items-center justify-between gap-3 pt-1">
            <div className="flex flex-col gap-0.5 overflow-hidden">
              <div className="flex items-center gap-2">
                <motion.p
                  layoutId={`description-${description}-${id}`}
                  transition={springTransition}
                  className="text-zinc-400 font-mono text-xs uppercase tracking-wider truncate"
                >
                  {description}
                </motion.p>
                {badge && (
                  <motion.span
                    layoutId={`badge-${badge}-${id}`}
                    transition={springTransition}
                    className={cn(
                      "font-mono text-[9px] font-bold px-1.5 py-0.2 rounded border border-emerald-500/30 bg-emerald-950/40 text-emerald-400 shrink-0",
                      badgeClassName
                    )}
                  >
                    {badge}
                  </motion.span>
                )}
              </div>

              <motion.h3
                layoutId={`title-${title}-${id}`}
                transition={springTransition}
                className="text-white font-semibold text-base sm:text-lg tracking-tight truncate group-hover:text-emerald-400 transition-colors"
              >
                {title}
              </motion.h3>
            </div>

            {/* Floating Action Button */}
            <motion.button
              aria-label={`Expandir ${title}`}
              layoutId={`button-${title}-${id}`}
              transition={springTransition}
              tabIndex={-1}
              className="size-9 shrink-0 flex items-center justify-center rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 group-hover:text-white group-hover:bg-zinc-800 group-hover:border-zinc-700 transition-all duration-200"
            >
              <Plus size={16} className="group-hover:rotate-90 transition-transform duration-300 group-hover:text-emerald-400" />
            </motion.button>
          </div>
        </div>
      </motion.div>
    </>
  );
}

export default ExpandableCard;
