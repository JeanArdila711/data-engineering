'use client';

import { useRef, useMemo } from 'react';
import { motion, useScroll, useTransform, MotionValue } from 'framer-motion';
import { GitCommit } from 'lucide-react';

function ScrollRevealChar({ children, progress, range }: { children: React.ReactNode, progress: MotionValue<number>, range: number[] }) {
  const opacity = useTransform(progress, range, [0.15, 1]);
  // Transitions from very dark gray to pure white
  const color = useTransform(progress, range, ["#262626", "#ffffff"]);
  
  return (
    <motion.span style={{ opacity, color }}>
      {children}
    </motion.span>
  );
}

export default function Manifesto() {
  const titleRef = useRef<HTMLDivElement>(null);
  
  // Track scroll position specifically over the title to slow down the animation
  const { scrollYProgress } = useScroll({
    target: titleRef,
    offset: ["start 90%", "end 35%"]
  });

  const titleText = "Filtramos el ruido. Destacamos lo crítico.";
  
  // Pre-calculate exact character indices so React Strict Mode doesn't mess up rendering math
  const { wordsWithIndices, totalChars } = useMemo(() => {
    const words = titleText.split(" ");
    let absoluteIndex = 0;
    const totalChars = titleText.replace(/\s/g, "").length;
    
    const wordsWithIndices = words.map(word => {
      return word.split("").map(char => {
        const index = absoluteIndex++;
        return { char, index };
      });
    });
    
    return { wordsWithIndices, totalChars };
  }, [titleText]);

  return (
    <section id="manifiesto" className="w-full max-w-5xl mx-auto px-6 py-16 md:py-32 relative flex flex-col gap-12 md:gap-16">
      
      {/* Scroll Reveal Title (Letter by Letter) */}
      <div className="w-full" ref={titleRef}>
        <h2 className="text-[clamp(2.5rem,6vw,5rem)] font-bold tracking-tighter leading-[1.1] text-white">
          {wordsWithIndices.map((word, i) => (
            <span key={i} className="inline-block mr-[0.25em] mt-[0.1em]">
              {word.map((letterInfo, j) => {
                // Smooth overlap math for letter-by-letter
                const start = letterInfo.index / (totalChars * 1.5);
                const end = start + 0.3; // 30% scroll span per letter ensures heavy fluid overlap
                return (
                  <ScrollRevealChar key={j} progress={scrollYProgress} range={[start, end]}>
                    {letterInfo.char}
                  </ScrollRevealChar>
                );
              })}
            </span>
          ))}
        </h2>
      </div>

      {/* High-end Git Diff Viewer (Zero AI-Slop) */}
      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-10%" }}
        transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        className="w-full rounded-xl overflow-hidden border border-neutral-800 bg-[#0d1117] shadow-2xl font-mono text-xs md:text-sm lg:text-base"
      >
        {/* Diff Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#161b22] border-b border-neutral-800 text-neutral-400 text-xs md:text-sm">
          <div className="flex items-center gap-3">
            <GitCommit className="w-4 h-4 text-neutral-500" />
            <span>commit 8f3a9b2: Refactor data engineering workflow</span>
          </div>
          <div className="hidden md:flex items-center gap-4">
            <span className="text-red-400">- 3 additions</span>
            <span className="text-emerald-400">+ 3 additions</span>
          </div>
        </div>
        
        {/* Diff Body */}
        <div className="flex flex-col py-2">
          
          {/* Removals (The Problem) */}
          <div className="flex bg-[#2c1418] text-[#ff7b72] hover:bg-[#3a1a1f] transition-colors">
            <div className="w-10 md:w-12 shrink-0 text-right pr-3 md:pr-4 py-2 md:py-1.5 select-none text-neutral-600 border-r border-neutral-800">1</div>
            <div className="w-8 shrink-0 text-center py-2 md:py-1.5 select-none">-</div>
            <div className="py-2 md:py-1.5 pl-2 pr-4">Revisar 50 changelogs manualmente cada semana</div>
          </div>
          <div className="flex bg-[#2c1418] text-[#ff7b72] hover:bg-[#3a1a1f] transition-colors">
            <div className="w-10 md:w-12 shrink-0 text-right pr-3 md:pr-4 py-2 md:py-1.5 select-none text-neutral-600 border-r border-neutral-800">2</div>
            <div className="w-8 shrink-0 text-center py-2 md:py-1.5 select-none">-</div>
            <div className="py-2 md:py-1.5 pl-2 pr-4">Romper producción por un 'breaking change' silencioso</div>
          </div>
          <div className="flex bg-[#2c1418] text-[#ff7b72] hover:bg-[#3a1a1f] transition-colors">
            <div className="w-10 md:w-12 shrink-0 text-right pr-3 md:pr-4 py-2 md:py-1.5 select-none text-neutral-600 border-r border-neutral-800">3</div>
            <div className="w-8 shrink-0 text-center py-2 md:py-1.5 select-none">-</div>
            <div className="py-2 md:py-1.5 pl-2 pr-4">Elegir herramientas basándose en el hype de Twitter</div>
          </div>

          {/* Separator / Context line */}
          <div className="flex text-neutral-500 hover:bg-[#161b22] transition-colors bg-[#0d1117] my-1">
            <div className="w-10 md:w-12 shrink-0 text-right pr-3 md:pr-4 py-1 md:py-1.5 select-none border-r border-neutral-800">...</div>
            <div className="w-8 shrink-0 text-center py-1 md:py-1.5 select-none"></div>
            <div className="py-1 md:py-1.5 pl-2 pr-4 text-neutral-600">@@ -4,3 +4,3 @@</div>
          </div>

          {/* Additions (The Solution) */}
          <div className="flex bg-[#122b22] text-[#3fb950] hover:bg-[#1a3d31] transition-colors">
            <div className="w-10 md:w-12 shrink-0 text-right pr-3 md:pr-4 py-2 md:py-1.5 select-none text-neutral-600 border-r border-neutral-800">4</div>
            <div className="w-8 shrink-0 text-center py-2 md:py-1.5 select-none">+</div>
            <div className="py-2 md:py-1.5 pl-2 pr-4 font-semibold tracking-wide">Centralizar la evolución del Modern Data Stack</div>
          </div>
          <div className="flex bg-[#122b22] text-[#3fb950] hover:bg-[#1a3d31] transition-colors">
            <div className="w-10 md:w-12 shrink-0 text-right pr-3 md:pr-4 py-2 md:py-1.5 select-none text-neutral-600 border-r border-neutral-800">5</div>
            <div className="w-8 shrink-0 text-center py-2 md:py-1.5 select-none">+</div>
            <div className="py-2 md:py-1.5 pl-2 pr-4 font-semibold tracking-wide">Alertas rojas para cambios arquitectónicos reales</div>
          </div>
          <div className="flex bg-[#122b22] text-[#3fb950] hover:bg-[#1a3d31] transition-colors">
            <div className="w-10 md:w-12 shrink-0 text-right pr-3 md:pr-4 py-2 md:py-1.5 select-none text-neutral-600 border-r border-neutral-800">6</div>
            <div className="w-8 shrink-0 text-center py-2 md:py-1.5 select-none">+</div>
            <div className="py-2 md:py-1.5 pl-2 pr-4 font-semibold tracking-wide">Decisiones basadas en datos y releases oficiales</div>
          </div>
          
        </div>
      </motion.div>
    </section>
  );
}
