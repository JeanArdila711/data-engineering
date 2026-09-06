import React from "react";
import { cn } from "@/lib/utils";

export interface FlippingCardProps {
  className?: string;
  height?: number;
  width?: number | string;
  frontContent?: React.ReactNode;
  backContent?: React.ReactNode;
}

export function FlippingCard({
  className,
  frontContent,
  backContent,
  height = 390,
  width = "100%",
}: FlippingCardProps) {
  return (
    <div
      className="group/flipping-card [perspective:1200px] w-full h-[var(--height)] cursor-pointer select-none"
      style={
        {
          "--height": `${height}px`,
          "--width": typeof width === "number" ? `${width}px` : width,
        } as React.CSSProperties
      }
    >
      <div
        className={cn(
          "relative h-[var(--height)] w-[var(--width)] rounded-2xl border border-neutral-800 bg-neutral-950 text-neutral-50 shadow-lg transition-[transform,box-shadow,border-color] duration-700 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] [transform-style:preserve-3d] [-webkit-transform-style:preserve-3d] will-change-transform group-hover/flipping-card:[transform:rotateY(180deg)] group-hover/flipping-card:shadow-2xl group-hover/flipping-card:shadow-cyan-950/20 group-hover/flipping-card:border-neutral-700",
          className
        )}
      >
        {/* Front Face */}
        <div className="absolute inset-0 h-full w-full rounded-[inherit] bg-neutral-950 text-neutral-50 [transform-style:preserve-3d] [-webkit-transform-style:preserve-3d] [backface-visibility:hidden] [-webkit-backface-visibility:hidden] [transform:rotateY(0deg)]">
          <div className="h-full w-full [transform:translateZ(26px)] [-webkit-transform:translateZ(26px)]">
            {frontContent}
          </div>
        </div>

        {/* Back Face */}
        <div className="absolute inset-0 h-full w-full rounded-[inherit] bg-neutral-950 text-neutral-50 [transform-style:preserve-3d] [-webkit-transform-style:preserve-3d] [backface-visibility:hidden] [-webkit-backface-visibility:hidden] [transform:rotateY(180deg)]">
          <div className="h-full w-full [transform:translateZ(26px)] [-webkit-transform:translateZ(26px)]">
            {backContent}
          </div>
        </div>
      </div>
    </div>
  );
}
