'use client';

import { useState, useEffect } from 'react';
import { motion, useMotionValue, useMotionTemplate } from 'framer-motion';
import { ArrowRight, Terminal as TerminalIcon } from 'lucide-react';
import ParticlesBackground from './ParticlesBackground';

const customEase = [0.4, 0, 0.2, 1] as const;
const SCRAMBLE_CHARS = "!@#$%^&*()_+-=[]{}|;:,.<>?/0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

// Typewriter effect for terminal lines
function TypewriterLine({ text, color, onComplete }: { text: string; color: string; onComplete: () => void }) {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setDisplayedText(text.slice(0, i + 1));
      i++;
      if (i >= text.length) {
        clearInterval(interval);
        setTimeout(onComplete, 150);
      }
    }, 20);
    return () => clearInterval(interval);
  }, [text, onComplete]);

  return <span className={color}>{displayedText}</span>;
}

// Pro Scramble Decode Effect
function ScrambleText({ text, delay = 0, duration = 1.2 }: { text: string, delay?: number, duration?: number }) {
  const [displayed, setDisplayed] = useState(text.replace(/./g, "0"));
  
  useEffect(() => {
    let animationFrame: number;
    let isCancelled = false;
    const startTime = Date.now() + delay * 1000;
    const endTime = startTime + duration * 1000;

    const animate = () => {
      if (isCancelled) return;
      const now = Date.now();
      
      if (now < startTime) {
        animationFrame = requestAnimationFrame(animate);
        return;
      }
      
      if (now >= endTime) {
        setDisplayed(text);
        return;
      }

      const progress = (now - startTime) / (duration * 1000);
      const revealCount = Math.floor(progress * text.length);

      const nextDisplayed = text.split("").map((char, i) => {
        if (i < revealCount) return text[i];
        return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
      }).join("");

      setDisplayed(nextDisplayed);
      setTimeout(() => {
        animationFrame = requestAnimationFrame(animate);
      }, 40);
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      isCancelled = true;
      cancelAnimationFrame(animationFrame);
    };
  }, [text, delay, duration]);

  return <span>{displayed}</span>;
}

// Spotlight Cursor Tracker Card
function SpotlightCard({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <div
      className={`relative group overflow-hidden ${className}`}
      onMouseMove={handleMouseMove}
    >
      <motion.div
        className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-300 group-hover:opacity-100 z-0"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              350px circle at ${mouseX}px ${mouseY}px,
              rgba(52, 211, 153, 0.12),
              transparent 80%
            )
          `,
        }}
      />
      {children}
    </div>
  );
}

// Terminal Component
function PipelineTerminal() {
  const [currentLineIndex, setCurrentLineIndex] = useState<number>(0);
  
  const logSequence = [
    { text: "[INFO] Initializing DE Radar Pipeline v1.0...", color: "text-neutral-400" },
    { text: "[FETCH] Syncing apache/airflow...", color: "text-neutral-300" },
    { text: "[SUCCESS] 1 new release found: v2.9.0", color: "text-emerald-400" },
    { text: "[FETCH] Syncing dbt-labs/dbt-core...", color: "text-neutral-300" },
    { text: "[SUCCESS] No new releases.", color: "text-neutral-500" },
    { text: "[VALIDATE] Running breaking changes detection...", color: "text-amber-400" },
    { text: "[DONE] Database synchronized and ready.", color: "text-emerald-400 font-semibold" },
  ];

  return (
    <div className="absolute inset-0 m-3 md:m-8 bg-black border border-neutral-800 rounded-xl shadow-2xl overflow-hidden font-mono text-[10px] sm:text-xs md:text-sm flex flex-col">
      <div className="flex items-center px-3 md:px-4 py-2 md:py-2 bg-neutral-950 border-b border-neutral-800">
        <div className="flex gap-1 md:gap-1.5">
          <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-red-500/80"></div>
          <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-amber-500/80"></div>
          <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-emerald-500/80"></div>
        </div>
        <div className="mx-auto flex items-center gap-1.5 md:gap-2 text-neutral-500 font-sans text-[10px] md:text-xs">
          <TerminalIcon className="w-2.5 h-2.5 md:w-3 md:h-3" />
          <span>pipeline-sync.sh</span>
        </div>
      </div>
      <div className="p-3 md:p-4 flex flex-col gap-1 md:gap-1.5 overflow-hidden">
        {logSequence.map((log, index) => (
          index <= currentLineIndex && (
            <div key={index} className="flex gap-1.5 md:gap-2">
              <span className="text-neutral-600 shrink-0">~</span>
              {index === currentLineIndex ? (
                <TypewriterLine text={log.text} color={log.color} onComplete={() => setCurrentLineIndex(prev => prev + 1)} />
              ) : (
                <span className={log.color}>{log.text}</span>
              )}
            </div>
          )
        ))}
        <motion.div
          animate={{ opacity: [1, 0] }}
          transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
          className={`w-1.5 md:w-2 h-3 md:h-4 bg-emerald-500 ml-3 md:ml-4 mt-0.5 md:mt-1 ${currentLineIndex < logSequence.length ? 'inline-block absolute' : 'inline-block'}`}
        />
      </div>
    </div>
  );
}

const letterBounceVariants = {
  rest: { y: 0 },
  hover: (i: number) => ({
    y: [0, -5, 0],
    transition: {
      duration: 0.38,
      delay: i * 0.018,
      ease: [0.34, 1.56, 0.64, 1] as const,
    },
  }),
};

export default function Hero() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { ease: customEase, duration: 0.8 } },
  };

  return (
    <section id="radar" className="relative w-full max-w-7xl mx-auto px-5 md:px-6 pt-24 md:pt-28 pb-12 md:pb-16 mt-4 md:mt-8 flex flex-col gap-8 md:gap-10 overflow-hidden lg:overflow-visible">
      
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 md:gap-8 relative z-10">
        <div className="flex flex-col gap-4 md:gap-5 max-w-3xl">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ ease: customEase, duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900/80 backdrop-blur-sm border border-neutral-800 text-[10px] md:text-xs font-medium text-emerald-400 w-fit"
          >
            <span className="relative flex h-1.5 w-1.5 md:h-2 md:w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 md:h-2 md:w-2 bg-emerald-500"></span>
            </span>
            Pipeline Sincronizado
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ease: customEase, duration: 0.8, delay: 0.1 }}
            className="text-[clamp(2.5rem,8vw,5.5rem)] font-bold tracking-tighter text-white uppercase leading-[0.9]"
          >
            El radar del <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-neutral-500">Data Engineer.</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ease: customEase, duration: 0.8, delay: 0.2 }}
            className="text-neutral-400 text-base md:text-lg lg:text-xl max-w-xl mt-1 md:mt-2 font-light leading-relaxed"
          >
            Releases, breaking changes y actualizaciones críticas del ecosistema. Extraído de fuentes oficiales y validado automáticamente.
          </motion.p>
        </div>
        
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ ease: customEase, duration: 0.8, delay: 0.3 }}
          className="w-full lg:w-auto mt-4 lg:mt-0"
        >
          <motion.button 
            initial="rest"
            whileHover="hover"
            animate="rest"
            className="relative w-full lg:w-auto group flex items-center justify-center px-6 md:px-7 py-3 md:py-3.5 rounded-full font-semibold text-sm md:text-base active:scale-95 overflow-hidden shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] bg-white border border-transparent transition-all duration-500 cursor-pointer"
          >
            
            {/* El agujero negro con timing balanceado y suave */}
            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] aspect-square bg-neutral-950 rounded-full scale-0 group-hover:scale-100 transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] z-0 pointer-events-none"></span>
            
            {/* Contenedor del texto con rebote letra por letra que vuelve a su sitio y color blanco */}
            <span className="relative z-10 flex items-center gap-3 text-black group-hover:text-white transition-colors duration-300 pointer-events-none">
              <span className="flex">
                {"Explorar Stack".split("").map((char, index) => (
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
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform duration-300" />
            </span>
          </motion.button>
        </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ ease: customEase, duration: 1, delay: 0.4 }}
        className="w-full h-[250px] sm:h-[300px] md:h-[380px] rounded-[1.5rem] md:rounded-[2rem] overflow-hidden relative border border-neutral-800/80 bg-black backdrop-blur-sm group"
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-emerald-950/20 via-transparent to-neutral-900/40 mix-blend-screen"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(52,211,153,0.05)_0,transparent_70%)]"></div>
        <PipelineTerminal />
      </motion.div>

      {/* High-end Stats Strip - Scramble & Spotlight Enabled */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full mt-4 md:mt-8"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-neutral-800/80 border-y border-neutral-800/80 bg-neutral-950/40 backdrop-blur-sm relative">
          
          <div className="absolute -top-1.5 -left-1.5 text-neutral-600 pointer-events-none text-[10px] md:text-xs font-mono">+</div>
          <div className="absolute -top-1.5 -right-1.5 text-neutral-600 pointer-events-none text-[10px] md:text-xs font-mono">+</div>
          <div className="absolute -bottom-1.5 -left-1.5 text-neutral-600 pointer-events-none text-[10px] md:text-xs font-mono">+</div>
          <div className="absolute -bottom-1.5 -right-1.5 text-neutral-600 pointer-events-none text-[10px] md:text-xs font-mono">+</div>

          <motion.div variants={itemVariants}>
            <SpotlightCard className="px-6 py-8 md:px-8 md:py-10 flex flex-col justify-center h-full">
              <div className="relative z-10">
                <span className="text-neutral-500 text-[10px] md:text-xs font-semibold uppercase tracking-[0.2em] md:tracking-[0.25em] mb-3 md:mb-4 flex items-center gap-2 md:gap-3">
                  <span className="w-3 md:w-4 h-[1px] bg-neutral-700"></span> Core
                </span>
                <span className="text-4xl sm:text-5xl lg:text-6xl font-light tracking-tighter text-white font-mono flex items-baseline gap-1">
                  <ScrambleText text="10" delay={0.5} duration={1} />
                </span>
                <span className="text-neutral-500 text-xs md:text-sm mt-2 md:mt-3 font-light block">Herramientas traqueadas.</span>
              </div>
            </SpotlightCard>
          </motion.div>

          <motion.div variants={itemVariants}>
            <SpotlightCard className="px-6 py-8 md:px-8 md:py-10 flex flex-col justify-center h-full">
              <div className="relative z-10">
                <span className="text-neutral-500 text-[10px] md:text-xs font-semibold uppercase tracking-[0.2em] md:tracking-[0.25em] mb-3 md:mb-4 flex items-center gap-2 md:gap-3">
                  <span className="w-3 md:w-4 h-[1px] bg-neutral-700"></span> Registros
                </span>
                <span className="text-4xl sm:text-5xl lg:text-6xl font-light tracking-tighter text-white font-mono flex items-baseline gap-1">
                  <ScrambleText text="180" delay={0.65} duration={1.2} />
                  <span className="text-emerald-500 text-3xl md:text-4xl font-normal">+</span>
                </span>
                <span className="text-neutral-500 text-xs md:text-sm mt-2 md:mt-3 font-light block">Releases en base de datos.</span>
              </div>
            </SpotlightCard>
          </motion.div>

          <motion.div variants={itemVariants}>
            <SpotlightCard className="px-6 py-8 md:px-8 md:py-10 flex flex-col justify-center h-full">
              <div className="relative z-10">
                <span className="text-neutral-500 text-[10px] md:text-xs font-semibold uppercase tracking-[0.2em] md:tracking-[0.25em] mb-3 md:mb-4 flex items-center gap-2 md:gap-3">
                  <span className="w-3 md:w-4 h-[1px] bg-neutral-700"></span> Status
                </span>
                <div className="flex items-center gap-3 md:gap-4">
                  <span className="text-4xl sm:text-5xl lg:text-6xl font-light tracking-tighter text-emerald-400 font-mono flex items-baseline gap-1">
                    <ScrambleText text="100" delay={0.8} duration={1.5} />
                    <span className="text-neutral-600 text-3xl md:text-4xl">%</span>
                  </span>
                  <span className="relative flex h-2.5 w-2.5 md:h-3 md:w-3 mt-1.5 md:mt-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-50"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 md:h-3 md:w-3 bg-emerald-500 border border-black"></span>
                  </span>
                </div>
                <span className="text-neutral-500 text-xs md:text-sm mt-2 md:mt-3 font-light block">Sincronización automatizada continua.</span>
              </div>
            </SpotlightCard>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
