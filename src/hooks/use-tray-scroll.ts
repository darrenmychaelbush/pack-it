import { useCallback, useEffect, useRef, useState } from "react";
import { trayStepTarget } from "@/game/tray";

/** Arrow navigation for a horizontal card strip: one card per step, clamped, tracking resize/scroll/content changes. */
export function useTrayScroll(contentKey: string) {
  const ref = useRef<HTMLDivElement>(null);
  const target = useRef<number | null>(null);
  const [edges, setEdges] = useState({ start: true, end: true });

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    if (target.current !== null && Math.abs(el.scrollLeft - target.current) < 2) target.current = null;
    const pos = target.current ?? el.scrollLeft;
    setEdges({ start: pos <= 1, end: pos >= max - 1 });
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    update();
    const ro = new ResizeObserver(() => { target.current = null; update(); });
    ro.observe(el);
    const onScroll = () => update();
    const onUser = () => { target.current = null; };
    el.addEventListener("scroll", onScroll, { passive: true });
    el.addEventListener("wheel", onUser, { passive: true });
    el.addEventListener("touchstart", onUser, { passive: true });
    el.addEventListener("scrollend", () => { target.current = null; update(); });
    return () => { ro.disconnect(); el.removeEventListener("scroll", onScroll); el.removeEventListener("wheel", onUser); el.removeEventListener("touchstart", onUser); };
  }, [update]);

  // Cards added/removed: clamp any pending target and refresh edges.
  useEffect(() => { target.current = null; update(); }, [contentKey, update]);

  const step = useCallback((dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    const pad = el.firstElementChild ? (el.firstElementChild as HTMLElement).offsetLeft : 0;
    const offsets = [...el.children].map((c) => (c as HTMLElement).offsetLeft - pad);
    const max = el.scrollWidth - el.clientWidth;
    const base = target.current ?? el.scrollLeft;
    const next = trayStepTarget(offsets, base, max, dir);
    target.current = next;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ left: next, behavior: reduce ? "auto" : "smooth" });
    update();
  }, [update]);

  return { ref, step, atStart: edges.start, atEnd: edges.end };
}
