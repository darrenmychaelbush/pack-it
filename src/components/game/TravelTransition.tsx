import { useEffect, useMemo, useRef, useState } from "react";
import type { FeatureCollection } from "geojson";
import { Button } from "@/components/ui/button";
import { createTravelGeography, REDUCED_TRAVEL_DURATION_MS, TRAVEL_DURATION_MS, warmTravelAtlas } from "@/game/geography";
import type { LevelDefinition } from "@/game/types";
import type { LevelTransition } from "@/game/transitions";

interface Props {
  from: LevelDefinition;
  to: LevelDefinition;
  transition: LevelTransition;
  onArrive: () => void;
}

export function TravelTransition({ from, to, transition, onArrive }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 640 });
  const geography = useMemo(() => createTravelGeography(from.id, to.id, dimensions.width, dimensions.height), [from.id, to.id, dimensions]);
  const [atlas, setAtlas] = useState<FeatureCollection | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [reduced, setReduced] = useState(false);
  const done = useRef(false);
  const arriveRef = useRef(onArrive);
  arriveRef.current = onArrive;
  useEffect(() => {
    const element = mapRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry && entry.contentRect.width > 0 && entry.contentRect.height > 0) setDimensions({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const skip = () => {
    if (done.current) return;
    done.current = true;
    arriveRef.current();
  };
  useEffect(() => {
    let active = true;
    void warmTravelAtlas().then((data) => { if (active) setAtlas(data); }).catch(() => {});
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const reduce = preference.matches;
    setReduced(reduce);
    const duration = reduce ? REDUCED_TRAVEL_DURATION_MS : TRAVEL_DURATION_MS;
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      if (done.current) return;
      setElapsed(now - start);
      if (now - start >= duration) {
        done.current = true;
        arriveRef.current();
      } else frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => { active = false; cancelAnimationFrame(frame); };
  }, []);
  const flight = reduced ? 1 : Math.min(1, Math.max(0, (elapsed - 450) / 1050));
  const ink = reduced ? 1 : Math.min(1, Math.max(0, (elapsed - 350) / 1050));
  const plane = geography.planeAt(flight);
  const arrived = reduced || elapsed >= 1500;
  const countryPaths = useMemo(() => atlas?.features.map((feature, index) => <path key={index} d={geography.countryPath(feature) ?? ""} />), [atlas, geography]);
  const originRight = geography.origin[0] > geography.destination[0];
  return (
    <div className="travel-transition fixed inset-0 z-[100] flex flex-col overflow-hidden text-foreground" data-region={transition.mapRegion}>
      <div className="travel-atlas-heading relative z-10 px-5 pt-8 text-center">
        <p className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">Next destination</p>
        <h2 className={`mt-2 font-display text-4xl font-semibold ${arrived ? "travel-arrived-title" : ""}`}>{to.flag} {to.destination}</h2>
        <p className="mt-1 text-sm font-extrabold uppercase text-primary">{to.tripType}</p>
      </div>
      <div ref={mapRef} className="relative flex min-h-0 flex-1 items-center justify-center">
        <svg viewBox={`0 0 ${dimensions.width} ${dimensions.height}`} className="travel-atlas" role="img" aria-label={`Geographic flight route from ${from.destination} to ${to.destination}`}>
          <g className="travel-countries">{countryPaths}</g>
          <path d={geography.path(1)} className="travel-route-guide" />
          {ink > 0 && <path d={geography.path(ink)} className="travel-route" />}
          <g transform={`translate(${geography.origin.join(" ")})`}>
            <g className="travel-origin-stamp"><circle r="17" /><circle r="13" /><path d="M-7 0 L-2 5 L8 -6" /></g>
            <text x={originRight ? 26 : -26} y="-24" textAnchor={originRight ? "start" : "end"} className="travel-label">{from.destination}</text>
          </g>
          <g transform={`translate(${geography.destination.join(" ")})`}>
            <g className={`travel-destination-pin ${arrived ? "is-arrived" : ""}`}><circle className="travel-pin-halo" r="27" /><path d="M0 11 C-4 5 -15 -4 -15 -13 A15 15 0 1 1 15 -13 C15 -4 4 5 0 11Z" /><circle className="travel-pin-center" cy="-13" r="5" /></g>
            <text x={originRight ? -26 : 26} y="34" textAnchor={originRight ? "end" : "start"} className="travel-label">{to.destination}</text>
          </g>
          {!reduced && elapsed >= 450 && transition.transportType === "plane" && <g transform={`translate(${plane.x} ${plane.y}) rotate(${plane.heading})`} className="travel-plane">
            <path d="M0 -28 C4 -27 5 -20 5 -12 L27 2 L27 8 L5 2 L4 17 L12 23 L12 27 L0 23 L-12 27 L-12 23 L-4 17 L-5 2 L-27 8 L-27 2 L-5 -12 C-5 -20 -4 -27 0 -28Z" />
            <path className="travel-plane-detail" d="M-2 -19 Q0 -22 2 -19 M0 -10 V16" />
          </g>}
        </svg>
      </div>
      <footer className="relative z-10 flex flex-col items-center gap-3 px-5 pb-6 text-center">
        <p className="text-sm font-bold">{from.destination} <span className="px-2 text-primary">→</span> {to.destination}</p>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Natural Earth · Pack It! travel atlas</p>
        <Button variant="ghost" onClick={skip} className="text-xs font-extrabold uppercase tracking-widest">Tap to skip</Button>
      </footer>
      <Button variant="ghost" onClick={skip} className="absolute inset-0 z-0 h-full w-full rounded-none p-0 hover:bg-transparent" aria-label={`Skip travel from ${from.destination} to ${to.destination}`} />
    </div>
  );
}
