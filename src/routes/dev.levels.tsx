import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ItemBlocks } from "@/components/game/ItemBlocks";
import { ITEMS } from "@/game/items";
import { LEVELS } from "@/game/levels";
import { rotateN } from "@/game/engine";
import { validateLevelDefinition, type SolvedPlacement } from "@/game/solver";
import type { LevelDefinition } from "@/game/types";

export const Route = createFileRoute("/dev/levels")({
  beforeLoad: () => {
    if (!import.meta.env.DEV) throw notFound();
  },
  head: () => ({
    meta: [
      { title: "Level Debugger — Pack It!" },
      { name: "description", content: "Developer-only puzzle solver and level validation view for Pack It!" },
      { property: "og:title", content: "Level Debugger — Pack It!" },
      { property: "og:description", content: "Developer-only puzzle solver view." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DevLevels,
});

function difficulty(n: number) {
  return n <= 2 ? "Beginner" : n <= 5 ? "Easy" : n <= 8 ? "Intermediate" : "Advanced";
}

function LevelCard({ level }: { level: LevelDefinition }) {
  const [result, setResult] = useState<ReturnType<typeof validateLevelDefinition> | null>(null);
  const [ms, setMs] = useState(0);
  const [show, setShow] = useState<SolvedPlacement[] | null>(null);
  const occupied = level.items.reduce((s, i) => s + i.shape.flat().filter(Boolean).length, 0);
  const cell = 26;
  const run = () => {
    const t = performance.now();
    setResult(validateLevelDefinition(level));
    setMs(Math.round(performance.now() - t));
  };
  return (
    <div className="rounded-2xl bg-card p-4 shadow-soft">
      <h2 className="text-xl font-semibold">Level {level.levelNumber} — {level.destination}{level.type === "forgot" ? " (Forgot It!)" : ""}</h2>
      <dl className="mt-2 grid grid-cols-2 gap-x-4 text-sm">
        <dt className="text-muted-foreground">Grid</dt><dd>{level.rows} × {level.cols}</dd>
        <dt className="text-muted-foreground">Usable cells</dt><dd>{level.usableCells}</dd>
        <dt className="text-muted-foreground">Occupied cells</dt><dd>{occupied}</dd>
        <dt className="text-muted-foreground">Occupancy</dt><dd>{((occupied / level.usableCells) * 100).toFixed(1)}%</dd>
        <dt className="text-muted-foreground">Items</dt><dd>{level.items.length}</dd>
        <dt className="text-muted-foreground">Max solutions</dt><dd>{level.maxSolutions}</dd>
        <dt className="text-muted-foreground">Solver</dt>
        <dd className={result ? (result.valid ? "font-bold text-valid" : "font-bold text-invalid") : ""}>
          {result ? `${result.error ?? `${result.solutionCount} VALID SOLUTION${result.solutionCount > 1 ? "S" : ""}`} (${ms}ms)` : "not run"}
        </dd>
        <dt className="text-muted-foreground">Difficulty</dt><dd>{difficulty(level.levelNumber)}</dd>
      </dl>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" variant="paper" onClick={() => setShow(level.intendedSolution)}>View solution</Button>
        <Button size="sm" variant="paper" onClick={run}>Run solver</Button>
        {result?.solutions.slice(0, level.maxSolutions + 1).map((s, i) => (
          <Button key={i} size="sm" variant="paper" onClick={() => setShow(s)}>Solver #{i + 1}</Button>
        ))}
        <Button size="sm" variant="paper" onClick={() => { setResult(null); setShow(null); }}>Reset</Button>
      </div>
      {show && (
        <div className="relative mt-3 rounded-md bg-muted" style={{ width: level.cols * cell, height: level.rows * cell }}>
          {level.blockedCells.map((b) => (
            <div key={`${b.row}-${b.col}`} className="absolute bg-foreground/60" style={{ top: b.row * cell, left: b.col * cell, width: cell, height: cell }} />
          ))}
          {show.map((p) => {
            const it = level.items.find((i) => i.instanceId === p.instanceId)!;
            return (
              <div key={p.instanceId} className="absolute" style={{ top: p.row * cell, left: p.col * cell }}>
                <ItemBlocks shape={rotateN(it.shape, p.rotation)} cell={cell} item={ITEMS[it.itemId]} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function DevLevels() {
  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4">
      <Link to="/" className="text-sm font-bold text-primary">← Home</Link>
      <h1 className="text-3xl font-bold">Puzzle debugger</h1>
      <p className="text-sm text-muted-foreground">Developer only — hidden in published builds.</p>
      {LEVELS.map((l) => <LevelCard key={l.id} level={l} />)}
    </div>
  );
}
