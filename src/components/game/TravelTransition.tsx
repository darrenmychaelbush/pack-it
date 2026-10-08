import { useEffect, useId, useState } from "react";
import type { LevelDefinition } from "@/game/types";
import type { LevelTransition } from "@/game/transitions";

interface Props {
  from: LevelDefinition;
  to: LevelDefinition;
  transition: LevelTransition;
  onArrive: () => void;
}

export function TravelTransition({ from, to, transition, onArrive }: Props) {
  const pathId = useId().replace(/:/g, "");
  const [leaving, setLeaving] = useState(false);
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(onArrive, reduce ? 750 : 1800);
    return () => window.clearTimeout(timer);
  }, [onArrive]);
  const skip = () => {
    if (leaving) return;
    setLeaving(true);
    onArrive();
  };
  return (
    <button type="button" onClick={skip} className={`travel-transition fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-background text-foreground ${leaving ? "opacity-0" : ""}`} aria-label={`Travel from ${from.destination} to ${to.destination}. Tap to skip.`}>
      <div className="absolute left-5 top-5 rounded-full border border-border bg-card px-3 py-1 text-xs font-bold uppercase text-muted-foreground">Tap to skip</div>
      <div className="mb-5 text-center">
        <div className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Next destination</div>
        <h2 className="font-display text-3xl font-semibold">{to.flag} {to.destination}</h2>
        <p className="text-sm font-bold uppercase text-primary">{to.tripType}</p>
      </div>
      <svg viewBox="0 0 360 230" className="w-full max-w-md" role="img" aria-label={`Dotted flight path from ${from.destination} to ${to.destination}`}>
        <defs><path id={pathId} d="M 48 172 Q 172 38 312 76" /></defs>
        <path d="M14 34 C72 12 125 42 165 31 C214 17 263 26 346 12 L356 205 C271 218 207 193 157 210 C102 228 52 202 3 216 Z" className="travel-land" />
        <use href={`#${pathId}`} className="travel-route" pathLength="1" />
        <circle cx="48" cy="172" r="8" className="travel-pin travel-pin-done" />
        <circle cx="312" cy="76" r="10" className="travel-pin travel-pin-next" />
        <text x="30" y="199" className="travel-label">✓ {from.destination}</text>
        <text x="274" y="56" className="travel-label travel-label-next">{to.destination}</text>
        <g className="travel-plane">
          <animateMotion dur="1.25s" begin=".22s" fill="freeze" rotate="auto"><mpath href={`#${pathId}`} /></animateMotion>
          <path d="M-12,-4 L2,-4 L10,-12 L14,-11 L9,-4 L17,0 L9,4 L14,11 L10,12 L2,4 L-12,4 L-17,8 L-19,7 L-16,0 L-19,-7 L-17,-8 Z" />
        </g>
      </svg>
      <div className="mt-3 rounded-full bg-card px-4 py-2 text-sm font-semibold shadow-soft">{transition.transportType === "plane" ? "✈" : ""} {from.destination} → {to.destination}</div>
    </button>
  );
}
