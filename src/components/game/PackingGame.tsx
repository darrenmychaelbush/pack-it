import { useNavigate, useRouter } from "@tanstack/react-router";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Lightbulb, RotateCcw, RotateCw, X } from "lucide-react";
import { useTrayScroll } from "@/hooks/use-tray-scroll";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ItemBlocks } from "./ItemBlocks";
import { Stamp, Stars } from "./Stamp";
import { TravelTransition } from "./TravelTransition";
import {
  calculateStars,
  canPlaceItem,
  getHintPlacement,
  getItemShape,
  getOccupiedCells,
  isLevelComplete,
  loadLevel,
  placeItem,
  removeItem,
} from "@/game/engine";
import { ITEMS } from "@/game/items";
import { getNextLevel } from "@/game/levels";
import { feedback } from "@/game/feedback";
import { clearSavedPuzzle, loadSavedPuzzle, recordCompletion, restoreSavedPuzzle, savePuzzle, toSavedPuzzle, useProgress } from "@/game/progress";
import { transitionFor } from "@/game/transitions";
import { warmTravelAtlas } from "@/game/geography";
import type { GameItems, LevelDefinition, Rotation, Shape } from "@/game/types";
import { cn } from "@/lib/utils";

type Phase = "briefing" | "playing" | "zipping" | "results" | "traveling";
interface Ghost {
  row: number;
  col: number;
  valid: boolean;
}

interface DragInfo {
  id: string;
  pointerId: number;
  x: number;
  y: number;
  offX: number;
  offY: number;
  shape: Shape;
  rotation: Rotation;
}

function useCellSize(level: LevelDefinition) {
  const [cell, setCell] = useState(40);
  useEffect(() => {
    const f = () => {
      const w = Math.min(window.innerWidth, 480) - 64;
      const h = window.innerHeight - 380;
      setCell(Math.max(26, Math.floor(Math.min(w / level.cols, h / level.rows, 58))));
    };
    f();
    window.addEventListener("resize", f);
    return () => window.removeEventListener("resize", f);
  }, [level]);
  return cell;
}

const NUDGES = [
  [0, 0], [0, -1], [-1, 0], [-1, -1], [0, -2], [-2, 0], [1, 0], [0, 1],
];

export function PackingGame({ level }: { level: LevelDefinition }) {
  const navigate = useNavigate();
  const router = useRouter();
  useEffect(() => {
    void warmTravelAtlas().catch(() => {});
    const next = getNextLevel(level);
    if (next) void router.preloadRoute({ to: "/play/$levelId", params: { levelId: next.id } }).catch(() => {});
  }, [level, router]);
  const { progress } = useProgress();
  const [phase, setPhase] = useState<Phase>("briefing");
  const [items, setItems] = useState<GameItems>(() => loadLevel(level));
  const [moves, setMoves] = useState(0);
  const [hintUsed, setHintUsed] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragRotation, setDragRotation] = useState<Rotation | null>(null);
  // Packed items keep their old footprint until their rotated preview is dropped legally.
  const [pendingRotation, setPendingRotation] = useState<{ id: string; rotation: Rotation } | null>(null);
  const [ghost, setGhost] = useState<Ghost | null>(null);
  const [hint, setHint] = useState<ReturnType<typeof getHintPlacement>>(null);
  const [shakeId, setShakeId] = useState<string | null>(null);
  const [snap, setSnap] = useState<{ id: string; key: number } | null>(null);
  const [result, setResult] = useState<{ stars: number; newStamp: boolean; moves: number } | null>(null);
  const cell = useCellSize(level);
  const trayCell = Math.min(20, Math.floor(cell * 0.5));

  const boardRef = useRef<HTMLDivElement>(null);
  const trayRef = useRef<HTMLDivElement>(null);
  const floatRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const movesRef = useRef(moves);
  movesRef.current = moves;
  const hintRef = useRef(hintUsed);
  hintRef.current = hintUsed;
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const [resume, setResume] = useState<{ items: GameItems; moves: number; hintUsed: boolean } | null>(null);

  // Look for an unfinished save after mount (localStorage is client-only).
  useEffect(() => {
    const saved = loadSavedPuzzle(level.id);
    if (!saved) return;
    const restored = restoreSavedPuzzle(level, saved);
    if (restored) setResume({ items: restored, moves: saved.moveCount, hintUsed: saved.hintUsed });
    else clearSavedPuzzle(level.id);
  }, [level]);

  const saveNow = useCallback(() => {
    if (phaseRef.current !== "playing") return;
    savePuzzle(toSavedPuzzle(level, itemsRef.current, movesRef.current, hintRef.current));
  }, [level]);

  // Autosave after every state change while playing (placement, move, rotation, hint, reset).
  useEffect(() => {
    if (phase === "playing") saveNow();
  }, [items, moves, hintUsed, phase, saveNow]);

  useEffect(() => {
    const onHide = () => document.visibilityState === "hidden" && saveNow();
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", saveNow);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", saveNow);
    };
  }, [saveNow]);

  const exitPuzzle = () => {
    if (phase === "playing") {
      saveNow();
      toast("Progress saved", { duration: 1000 });
    }
    navigate({ to: "/" });
  };

  const dragInfo = useRef<DragInfo | null>(null);
  const ghostRef = useRef<Ghost | null>(null);

  const packedCount = level.items.filter((i) => items[i.instanceId].placement).length;
  const prevBest = progress.levels[level.id];

  const finish = useCallback(
    (finalMoves: number) => {
      setSelected(null);
      feedback("complete");
      setTimeout(() => {
        setPhase("zipping");
        feedback("zip");
      }, 450);
      setTimeout(() => {
        const stars = calculateStars(true, hintRef.current, finalMoves, level.parMoves);
        const { newStamp } = recordCompletion(level, stars, finalMoves, hintRef.current);
        setResult({ stars, newStamp, moves: finalMoves });
        setPhase("results");
        if (newStamp) setTimeout(() => feedback("stamp"), 1500);
      }, 3000);
    },
    [level],
  );

  const commit = useCallback(
    (next: GameItems, id: string) => {
      setItems(next);
      const m = movesRef.current + 1;
      setMoves(m);
      feedback("place");
      setSnap({ id, key: Date.now() });
      if (isLevelComplete(level, next)) finish(m);
    },
    [level, finish],
  );

  const shake = (id: string) => {
    feedback("invalid");
    setShakeId(id);
    setTimeout(() => setShakeId(null), 480);
  };

  const positionFloat = () => {
    const d = dragInfo.current;
    if (floatRef.current && d) {
      floatRef.current.style.transform = "translate3d(" + (d.x - d.offX) + "px, " + (d.y - d.offY) + "px, 0)";
    }
  };
  useLayoutEffect(positionFloat, [dragId, dragRotation]);

  const getDropGhost = (id: string, d: DragInfo): Ghost | null => {
    const b = boardRef.current?.getBoundingClientRect();
    if (!b) return null;
    const left = d.x - d.offX - b.left;
    const top = d.y - d.offY - b.top;
    const w = d.shape[0].length * cell;
    const h = d.shape.length * cell;
    const cx = left + w / 2;
    const cy = top + h / 2;
    if (cx <= -cell || cx >= b.width + cell || cy <= -cell || cy >= b.height + cell) return null;
    const row = Math.round(top / cell);
    const col = Math.round(left / cell);
    return { row, col, valid: canPlaceItem(level, itemsRef.current, id, d.shape, row, col) };
  };

  const refreshGhost = (id: string, d: DragInfo) => {
    const next = getDropGhost(id, d);
    const previous = ghostRef.current;
    ghostRef.current = next;
    if (previous?.row !== next?.row || previous?.col !== next?.col || previous?.valid !== next?.valid) setGhost(next);
  };

  // Rotate the floating piece, not its former occupied cells.
  // During a drag, use Rotate with a second finger or tap the suitcase with a second finger.
  const rotateInFlight = (id: string, d: DragInfo) => {
    const w = d.shape[0].length * cell;
    const h = d.shape.length * cell;
    d.rotation = ((d.rotation + 1) % 4) as Rotation;
    d.shape = getItemShape(level, id, d.rotation);
    d.offX += (d.shape[0].length * cell - w) / 2;
    d.offY += (d.shape.length * cell - h) / 2;
    setDragRotation(d.rotation);
    refreshGhost(id, d);
    positionFloat();
    feedback("rotate");
  };

  const onPointerDown = (e: React.PointerEvent<HTMLElement>, id: string, source: "tray" | "board") => {
    if (phase !== "playing" || e.button > 0 || dragInfo.current) return;
    e.preventDefault();
    const st = itemsRef.current[id];
    const rotation = pendingRotation?.id === id ? pendingRotation.rotation : st.rotation;
    const shape = getItemShape(level, id, rotation);
    const rect = e.currentTarget.getBoundingClientRect();
    const w = shape[0].length * cell;
    const h = shape.length * cell;
    const awaitingRotation = source === "board" && rotation !== st.rotation;
    const offX = source === "board" && !awaitingRotation ? e.clientX - rect.left : w / 2;
    const offY = source === "board" && !awaitingRotation ? e.clientY - rect.top : h / 2 + (source === "tray" ? Math.min(44, cell) : 0);
    const sx = e.clientX;
    const sy = e.clientY;
    let moved = false;
    const d: DragInfo = { id, pointerId: e.pointerId, x: sx, y: sy, offX, offY, shape, rotation };
    dragInfo.current = d;
    ghostRef.current = null;

    const move = (ev: PointerEvent) => {
      if (ev.pointerId !== d.pointerId) return;
      d.x = ev.clientX;
      d.y = ev.clientY;
      if (!moved) {
        if (Math.hypot(ev.clientX - sx, ev.clientY - sy) < 6) return;
        moved = true;
        setDragId(id);
        setDragRotation(d.rotation);
        setSelected(id);
        if (pendingRotation?.id !== id) setPendingRotation(null);
        feedback("pickup");
      }
      positionFloat();
      refreshGhost(id, d);
    };

    const secondaryDown = (ev: PointerEvent) => {
      if (!moved || ev.pointerId === d.pointerId || ev.pointerType !== "touch") return;
      if (!boardRef.current?.contains(ev.target as Node)) return;
      ev.preventDefault();
      rotateInFlight(id, d);
    };

    const cleanup = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", cancel);
      window.removeEventListener("pointerdown", secondaryDown);
    };

    const cancel = (ev: PointerEvent) => {
      if (ev.pointerId !== d.pointerId) return;
      cleanup();
      dragInfo.current = null;
      ghostRef.current = null;
      setDragId(null);
      setDragRotation(null);
      setGhost(null);
    };

    const up = (ev: PointerEvent) => {
      // Releasing a second finger must not accidentally drop the piece.
      if (ev.pointerId !== d.pointerId) return;
      cleanup();
      if (!moved) {
        if (selected === id) {
          setSelected(null);
          setPendingRotation(null);
        } else {
          setSelected(id);
          setPendingRotation(null);
        }
        dragInfo.current = null;
        ghostRef.current = null;
        return;
      }
      const finalGhost = ghostRef.current;
      dragInfo.current = null;
      ghostRef.current = null;
      setDragId(null);
      setDragRotation(null);
      setGhost(null);
      const cur = itemsRef.current[id];
      if (finalGhost?.valid) {
        if (!cur.placement || cur.placement.row !== finalGhost.row || cur.placement.col !== finalGhost.col || cur.rotation !== d.rotation) {
          commit(placeItem(itemsRef.current, id, { row: finalGhost.row, col: finalGhost.col }, d.rotation), id);
          setPendingRotation(null);
        }
        return;
      }
      const t = trayRef.current?.getBoundingClientRect();
      if (source === "board" && t && ev.clientY >= t.top) {
        // Forgot It! is rearrangement-only: packed items stay in the suitcase.
        if (level.type === "forgot" && id !== level.missingInstanceId) {
          shake(id);
          toast("Keep packed items in the suitcase", { duration: 1200 });
          return;
        }
        setItems(removeItem(itemsRef.current, id));
        setPendingRotation(null);
        return;
      }
      shake(id);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", cancel);
    window.addEventListener("pointerdown", secondaryDown);
  };

  const rotateSelected = () => {
    if (!selected || phase !== "playing") return;
    const d = dragInfo.current;
    if (dragId === selected && d?.id === selected) {
      rotateInFlight(selected, d);
      return;
    }
    const st = items[selected];
    const currentRotation = pendingRotation?.id === selected ? pendingRotation.rotation : st.rotation;
    const nextRotation = ((currentRotation + 1) % 4) as Rotation;
    if (!st.placement) {
      setItems({ ...items, [selected]: { ...st, rotation: nextRotation } });
      setPendingRotation(null);
    } else {
      // Queue the orientation until legal placement; preview rotation never costs a move.
      setPendingRotation(nextRotation === st.rotation ? null : { id: selected, rotation: nextRotation });
    }
    feedback("rotate");
  };

  const showHint = () => {
    const h = getHintPlacement(level, items);
    if (!h) return;
    setHint(h);
    setHintUsed(true);
    setTimeout(() => setHint(null), 2200);
  };

  const restart = () => {
    setItems(loadLevel(level));
    setMoves(0);
    setHintUsed(false);
    setSelected(null);
    setPendingRotation(null);
    setDragId(null);
    setDragRotation(null);
    setGhost(null);
    dragInfo.current = null;
    ghostRef.current = null;
    setResult(null);
    setPhase("playing");
  };

  const trayItems = level.items.filter((i) => !items[i.instanceId].placement);
  const tray = useTrayScroll(trayItems.map((i) => `${i.instanceId}:${items[i.instanceId].rotation}`).join("|"));
  const dragShape = dragId ? getItemShape(level, dragId, dragRotation ?? items[dragId].rotation) : null;
  const dragDef = dragId ? ITEMS[level.items.find((i) => i.instanceId === dragId)!.itemId] : null;
  const missing = level.missingInstanceId ? level.items.find((i) => i.instanceId === level.missingInstanceId) : undefined;
  const coach =
    phase === "playing" && pendingRotation?.id === selected
      ? "↻ Rotation ready · drag to place"
      : phase === "playing" && moves === 0
      ? level.levelNumber === 1
        ? "Drag an item into the suitcase"
        : level.levelNumber === 6
          ? "Tap item · Rotate · drag to place"
          : level.type === "forgot"
            ? "Move packed items to make room"
            : null
      : level.levelNumber === 4 && phase === "playing" && moves >= 3 && moves <= 5
        ? "Tip: packed items can be moved again"
        : null;

  return (
    <div className="mx-auto flex h-dvh max-w-md select-none flex-col overflow-hidden" style={{ touchAction: "none" }}>
      {/* Header */}
      <header className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 pb-2 pt-3">
        <button type="button" onClick={exitPuzzle} aria-label="Save and exit to trips" className="relative z-[60] grid h-10 w-10 shrink-0 place-items-center rounded-full border border-border bg-card shadow-soft">
          <X className="h-5 w-5" />
        </button>
        <div className="min-w-0 text-center">
          <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Level {level.levelNumber} · {level.tripType}</div>
          <h1 className="truncate text-xl font-semibold leading-tight">
            {level.flag} {level.destination}, {level.country === "United Kingdom" ? "UK" : level.country}
          </h1>
        </div>
        <div className="shrink-0 rounded-xl border border-border bg-card px-2.5 py-1 text-center shadow-soft">
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Moves</div>
          <div className={cn("font-display text-base font-semibold leading-none", moves > level.parMoves && "text-invalid")}>
            {moves}<span className="text-xs text-muted-foreground">/{level.parMoves}</span>
          </div>
        </div>
      </header>
      <div className="flex items-center justify-center gap-2 px-4 pb-2 text-xs font-semibold text-muted-foreground">
        <span className="rounded-full bg-card px-2.5 py-1 shadow-soft">🧳 {packedCount}/{level.items.length} packed</span>
        <span className="rounded-full bg-card px-2.5 py-1 shadow-soft">☀️ {level.weather}</span>
        <span className="rounded-full bg-card px-2.5 py-1 shadow-soft">Par {level.parMoves}</span>
      </div>

      {/* Board */}
      <div className="wood-table relative mx-3 flex flex-1 items-center justify-center rounded-3xl">
        {level.type === "forgot" && phase === "playing" && missing && !items[missing.instanceId].placement && (
          <div className="float-in absolute left-3 right-3 top-2 z-10 rounded-xl bg-card/95 px-3 py-1.5 text-center text-xs font-bold shadow-soft">
            <span className="text-invalid">Oops!</span> {level.missingMessage}
          </div>
        )}
        <div className={cn("relative pt-5", phase === "zipping" && "settle")}>
          <div className="suitcase-handle absolute left-1/2 top-0 h-6 w-20 -translate-x-1/2 rounded-t-xl" />
          <div className="suitcase-shell relative rounded-[22px] p-2.5">
            <div
              ref={boardRef}
              className={cn("suitcase-lining relative overflow-visible rounded-xl", dragId && "show-grid")}
              style={{ width: level.cols * cell, height: level.rows * cell, backgroundSize: `${cell}px ${cell}px` }}
            >
              {level.blockedCells.map((b) => (
                <div key={`${b.row}-${b.col}`} className="blocked-cell absolute rounded-md" style={{ top: b.row * cell + 2, left: b.col * cell + 2, width: cell - 4, height: cell - 4 }} />
              ))}

              {hint && (
                <div className="hint-ghost pointer-events-none absolute z-20" style={{ top: hint.row * cell, left: hint.col * cell }}>
                  {getOccupiedCells(hint.shape, 0, 0).map((c) => (
                    <div key={`${c.row}-${c.col}`} className="absolute rounded-md border-2 border-dashed border-gold bg-gold/30" style={{ top: c.row * cell + 1, left: c.col * cell + 1, width: cell - 2, height: cell - 2 }} />
                  ))}
                  <span className="absolute -top-6 left-0 whitespace-nowrap rounded-full bg-gold px-2 py-0.5 text-[11px] font-bold text-foreground">
                    {ITEMS[level.items.find((i) => i.instanceId === hint.instanceId)!.itemId].name} goes here
                  </span>
                </div>
              )}

              {level.items.map((it) => {
                const st = items[it.instanceId];
                if (!st.placement) return null;
                const shape = getItemShape(level, it.instanceId, st.rotation);
                return (
                  <div
                    key={it.instanceId}
                    onPointerDown={(e) => onPointerDown(e, it.instanceId, "board")}
                    className={cn(
                      "absolute z-10 cursor-grab touch-none transition-[top,left] duration-150",
                      dragId === it.instanceId && "opacity-25",
                      shakeId === it.instanceId && "shake",
                    )}
                    style={{ top: st.placement.row * cell, left: st.placement.col * cell, pointerEvents: "none" }}
                  >
                    <div
                      key={snap?.id === it.instanceId ? snap.key : "s"}
                      className={snap?.id === it.instanceId ? "snap-in" : undefined}
                    >
                      {/* Only filled cells catch the pointer so irregular gaps stay usable */}
                      <div className="relative">
                        <ItemBlocks shape={shape} cell={cell} item={ITEMS[it.itemId]} selected={selected === it.instanceId} packed />
                        {getOccupiedCells(shape, 0, 0).map((c) => (
                          <div key={`${c.row}-${c.col}`} className="absolute" style={{ top: c.row * cell, left: c.col * cell, width: cell, height: cell, pointerEvents: "auto" }} />
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}

              {ghost && dragShape && (
                <div className="pointer-events-none absolute z-30" style={{ top: ghost.row * cell, left: ghost.col * cell }}>
                  {getOccupiedCells(dragShape, 0, 0).map((c) => {
                    const r = ghost.row + c.row;
                    const col = ghost.col + c.col;
                    if (r < 0 || col < 0 || r >= level.rows || col >= level.cols) return null;
                    return (
                      <div
                        key={`${c.row}-${c.col}`}
                        className={cn("absolute rounded-md border-2", ghost.valid ? "border-valid bg-valid/30" : "border-invalid bg-invalid/30")}
                        style={{ top: c.row * cell + 1, left: c.col * cell + 1, width: cell - 2, height: cell - 2 }}
                      />
                    );
                  })}
                </div>
              )}
            </div>

            {(phase === "zipping" || phase === "results") && (
              <div className="lid absolute inset-0 z-40 rounded-[22px]">
                <svg className="zipper absolute inset-3 h-[calc(100%-1.5rem)] w-[calc(100%-1.5rem)]" preserveAspectRatio="none" viewBox="0 0 100 100">
                  <path d="M50 2 H96 a2 2 0 0 1 2 2 V96 a2 2 0 0 1 -2 2 H4 a2 2 0 0 1 -2 -2 V4 a2 2 0 0 1 2 -2 H50" pathLength={1} fill="none" stroke="var(--gold)" strokeWidth="1.4" strokeDasharray="1" vectorEffect="non-scaling-stroke" style={{ strokeWidth: 3 }} />
                </svg>
                <div className="absolute inset-0 grid place-items-center">
                  <div className="float-in rounded-lg border-2 border-leather bg-card px-3 py-1 font-display text-sm font-semibold" style={{ animationDelay: "1.9s" }}>
                    {level.flag} {level.destination}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {coach && (
          <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 animate-bounce whitespace-nowrap rounded-full bg-foreground px-3 py-1.5 text-xs font-bold text-background shadow-soft">
            👇 {coach}
          </div>
        )}
      </div>

      {/* Tray + controls */}
      <div ref={trayRef} className="px-3 pb-4 pt-3">
        <div className="flex items-stretch gap-1.5">
        <TrayArrow dir={-1} disabled={tray.atStart} onClick={() => tray.step(-1)} />
        <div ref={tray.ref} className="no-scrollbar flex min-h-[104px] min-w-0 flex-1 gap-2 overflow-x-auto rounded-2xl border border-border bg-card p-2 shadow-soft">
          {trayItems.length === 0 && (
            <div className="grid w-full place-items-center text-sm font-semibold text-muted-foreground">
              {phase === "playing" ? "Everything's in!" : "Zipping up…"}
            </div>
          )}
          {trayItems.map((it) => {
            const st = items[it.instanceId];
            const shape = getItemShape(level, it.instanceId, st.rotation);
            const def = ITEMS[it.itemId];
            return (
              <button
                key={it.instanceId}
                type="button"
                onPointerDown={(e) => onPointerDown(e, it.instanceId, "tray")}
                className={cn(
                  "flex min-w-[84px] shrink-0 touch-none flex-col items-center justify-between gap-1 rounded-xl bg-muted px-2 py-2 transition",
                  selected === it.instanceId && "ring-2 ring-gold",
                  dragId === it.instanceId && "opacity-30",
                  shakeId === it.instanceId && "shake",
                  it.instanceId === level.missingInstanceId && "pulse-ring",
                )}
              >
                <div className="grid flex-1 place-items-center">
                  <ItemBlocks shape={shape} cell={trayCell} item={def} />
                </div>
                <span className="text-[11px] font-bold leading-none">{def.name}</span>
              </button>
            );
          })}
        </div>
        <TrayArrow dir={1} disabled={tray.atEnd} onClick={() => tray.step(1)} />
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <Button variant="paper" className="h-12" onClick={restart} disabled={phase !== "playing"}>
            <RotateCcw /> Reset
          </Button>
          <Button variant="sky" className="h-12" onClick={rotateSelected} disabled={!selected || phase !== "playing"}>
            <RotateCw /> Rotate
          </Button>
          <Button variant="paper" className="h-12" onClick={showHint} disabled={phase !== "playing" || !!hint}>
            <Lightbulb className="text-gold" /> Hint
          </Button>
        </div>
      </div>

      {/* Floating dragged item */}
      {dragId && dragShape && dragDef && (
        <div ref={floatRef} className="pointer-events-none fixed left-0 top-0 z-50" style={{ willChange: "transform" }}>
          <div className="scale-105" style={{ filter: "drop-shadow(0 18px 14px oklch(0.2 0.05 262 / 0.35))" }}>
            <ItemBlocks shape={dragShape} cell={cell} item={dragDef} />
          </div>
        </div>
      )}

      {phase === "briefing" && (
        <Briefing
          level={level}
          best={prevBest?.stars ?? 0}
          canContinue={!!resume}
          onStart={() => {
            if (resume) {
              setItems(resume.items);
              setMoves(resume.moves);
              setHintUsed(resume.hintUsed);
            }
            setPhase("playing");
          }}
          onRestart={() => {
            setResume(null);
            restart();
          }}
        />
      )}
      {phase === "results" && result && (
        <Results
          level={level}
          {...result}
          hintUsed={hintUsed}
          onReplay={restart}
          onNext={() => {
            const next = getNextLevel(level);
            if (next) setPhase("traveling");
            else navigate({ to: "/passport" });
          }}
        />
      )}
      {phase === "traveling" && (() => {
        const next = getNextLevel(level);
        if (!next) return null;
        const transition = transitionFor(level.id, next.id, level.levelNumber, next.levelNumber);
        return (
          <TravelTransition
            from={level}
            to={next}
            transition={transition}
            onArrive={() => navigate({ to: "/play/$levelId", params: { levelId: next.id } })}
          />
        );
      })()}
    </div>
  );
}

function Postcard({ level }: { level: LevelDefinition }) {
  return (
    <div className="relative mx-auto w-full rotate-[-1.5deg] rounded-md bg-card p-2.5 shadow-lift">
      <div className="relative grid h-36 place-items-center overflow-hidden rounded-sm bg-gradient-to-b from-accent to-primary/60">
        <span className="text-7xl drop-shadow-lg">{level.landmark}</span>
        <span className="absolute bottom-2 left-3 font-display text-2xl font-bold text-primary-foreground drop-shadow">Greetings from</span>
      </div>
      <Stamp level={level} size={78} className="absolute -right-3 -top-4 bg-card/80" />
    </div>
  );
}

function Briefing({
  level, best, canContinue, onStart, onRestart,
}: { level: LevelDefinition; best: number; canContinue: boolean; onStart: () => void; onRestart: () => void }) {
  const counts = new Map<string, number>();
  level.items.forEach((i) => counts.set(i.itemId, (counts.get(i.itemId) ?? 0) + 1));
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-foreground/40 backdrop-blur-[2px]" style={{ touchAction: "auto" }}>
      <div className="mx-auto flex min-h-full max-w-md items-end p-3 sm:items-center">
        <div className="float-in w-full rounded-3xl bg-background p-5 shadow-lift">
          <div className="mb-1 text-center text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            Level {level.levelNumber} · {level.tripType}
          </div>
          <Postcard level={level} />
          <div className="mt-5 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="truncate text-3xl font-semibold leading-none">{level.flag} {level.destination}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{level.country}</p>
            </div>
            {best > 0 && <Stars count={best} size={18} />}
          </div>
          <div className="mt-3 flex gap-2 text-sm font-semibold">
            <span className="rounded-full bg-card px-3 py-1 shadow-soft">📅 {level.days} days</span>
            <span className="rounded-full bg-card px-3 py-1 shadow-soft">☀️ {level.weather}</span>
            <span className="rounded-full bg-card px-3 py-1 shadow-soft">🎯 Par {level.parMoves}</span>
          </div>
          {level.type === "forgot" ? (
            <div className="mt-4 rounded-2xl border-2 border-invalid/40 bg-card p-3">
              <div className="font-display text-lg font-semibold text-invalid">Oops! You forgot something.</div>
              <p className="text-sm">{level.missingMessage}</p>
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">{level.tagline}</p>
          )}
          <div className="mt-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Items to pack</div>
          <div className="mt-2 grid grid-cols-4 gap-2">
            {[...counts.entries()].map(([id, n]) => (
              <div key={id} className="flex flex-col items-center rounded-xl bg-card py-2 shadow-soft">
                <span className="text-2xl">{ITEMS[id].emoji}</span>
                <span className="mt-1 text-center text-[10px] font-bold leading-tight">{ITEMS[id].name}{n > 1 ? ` ×${n}` : ""}</span>
              </div>
            ))}
          </div>
          <Button variant="success" size="xl" className="mt-5" onClick={onStart}>
            {canContinue ? "Continue Packing" : level.type === "forgot" ? "Make It Fit!" : "Start Packing"}
          </Button>
          {canContinue && (
            <Button variant="paper" className="mt-2 h-11 w-full" onClick={onRestart}>
              <RotateCcw /> Restart Level
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

const CONFETTI = ["✈️", "🌴", "⭐", "🧳", "🌍", "🎫"];

function Results({
  level, stars, newStamp, moves, hintUsed, onReplay, onNext,
}: { level: LevelDefinition; stars: number; newStamp: boolean; moves: number; hintUsed: boolean; onReplay: () => void; onNext: () => void }) {
  const next = getNextLevel(level);
  const [pieces] = useState(() =>
    Array.from({ length: 22 }, (_, i) => ({
      left: Math.random() * 100,
      delay: Math.random() * 0.8,
      dur: 2.2 + Math.random() * 1.8,
      e: CONFETTI[i % CONFETTI.length],
    })),
  );
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-foreground/55" style={{ touchAction: "auto" }}>
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        {pieces.map((p, i) => (
          <span key={i} className="confetti absolute -top-6 text-xl" style={{ left: `${p.left}%`, animationDelay: `${p.delay}s`, animationDuration: `${p.dur}s` }}>{p.e}</span>
        ))}
      </div>
      <div className="mx-auto flex min-h-full max-w-md items-center p-4">
        <div className="float-in w-full rounded-3xl bg-background p-6 text-center shadow-lift">
          <h2 className="text-4xl font-bold text-primary">{stars === 3 ? "Perfect Pack!" : "Trip Complete!"}</h2>
          <div className="mt-3 flex justify-center">
            <Stars count={stars} size={44} animate />
          </div>
          <div className="relative mt-5 rounded-2xl border border-border bg-card p-4">
            <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Passport</div>
            <div className="mt-2 flex items-center justify-center gap-4">
              <div className={newStamp ? "stamp-press" : undefined} style={{ animationDelay: "1.4s" }}>
                <Stamp level={level} size={104} />
              </div>
              <div className="text-left">
                <div className="font-display text-xl font-semibold leading-tight">{level.destination}</div>
                <div className="text-sm text-muted-foreground">{level.country}</div>
                <div className="mt-1 text-xs font-bold uppercase text-stamp">
                  {newStamp ? "+ Stamp earned" : "Stamp collected"}
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-xl bg-card p-3 shadow-soft">
              <div className="text-xs font-bold uppercase text-muted-foreground">Moves</div>
              <div className="font-display text-2xl font-semibold">{moves} <span className="text-base text-muted-foreground">/ par {level.parMoves}</span></div>
            </div>
            <div className="rounded-xl bg-card p-3 shadow-soft">
              <div className="text-xs font-bold uppercase text-muted-foreground">No hint</div>
              <div className="font-display text-2xl font-semibold">{hintUsed ? "✗" : "✓"}</div>
            </div>
          </div>
          {next && (
            <p className="mt-4 text-sm font-semibold text-muted-foreground">
              Next stop: <span className="text-foreground">{next.flag} {next.destination}</span> — 1 more trip to your next stamp
            </p>
          )}
          <div className="mt-4 grid grid-cols-[auto_1fr] gap-2">
            <Button variant="paper" className="h-14 px-5" onClick={onReplay}>
              <RotateCcw /> Replay
            </Button>
            <Button variant="success" className="h-14" onClick={onNext}>
              {next ? "Next Destination →" : "Open Passport"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TrayArrow({ dir, disabled, onClick }: { dir: 1 | -1; disabled: boolean; onClick: () => void }) {
  const Icon = dir < 0 ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={dir < 0 ? "Scroll items left" : "Scroll items right"}
      className="grid w-11 shrink-0 place-items-center rounded-2xl border border-border bg-card text-foreground shadow-soft transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-35 disabled:shadow-none"
    >
      <Icon className="size-6" strokeWidth={2.5} />
    </button>
  );
}
