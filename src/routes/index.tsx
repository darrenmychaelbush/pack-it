import { createFileRoute, Link } from "@tanstack/react-router";
import { Lock, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Stars } from "@/components/game/Stamp";
import { LEVELS } from "@/game/levels";
import { useProgress } from "@/game/progress";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Pack It! — Puzzle your way around the world" },
      { name: "description", content: "A cozy travel packing puzzle. Drag, rotate and fit everything in your suitcase, then collect passport stamps." },
      { property: "og:title", content: "Pack It! — Puzzle your way around the world" },
      { property: "og:description", content: "Drag, rotate and fit every item into the suitcase. Earn stars and passport stamps." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Home,
});

function Home() {
  const { progress } = useProgress();
  const current = LEVELS.find((l) => l.levelNumber === progress.unlockedLevel) ?? LEVELS[LEVELS.length - 1];
  const totalStars = Object.values(progress.levels).reduce((a, l) => a + l.stars, 0);

  return (
    <main className="mx-auto min-h-dvh max-w-md px-5 pb-16 pt-6">
      <header className="flex items-center justify-between">
        <div className="rounded-full bg-card px-3 py-1 text-sm font-bold shadow-soft">⭐ {totalStars}</div>
        <Link to="/passport" className="flex items-center gap-1.5 rounded-full bg-shell px-3 py-1.5 text-sm font-bold text-primary-foreground shadow-soft">
          <BookOpen className="h-4 w-4" /> Passport
        </Link>
      </header>

      <div className="mt-6 text-center">
        <h1 className="text-6xl font-bold tracking-tight text-shell">
          Pack <span className="text-leather">It!</span>
        </h1>
        <p className="mt-1 text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground">Puzzle your way around the world</p>
      </div>

      <section className="float-in mt-7 rounded-3xl bg-card p-5 shadow-lift">
        <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Next destination</div>
        <div className="mt-2 flex items-center gap-4">
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-accent text-4xl">{current.landmark}</div>
          <div className="min-w-0">
            <h2 className="truncate text-2xl font-semibold leading-tight">{current.flag} {current.destination}</h2>
            <p className="text-sm text-muted-foreground">{current.days} days · {current.tripType} · {current.weather}</p>
          </div>
        </div>
        <Button asChild variant="success" size="xl" className="mt-4">
          <Link to="/play/$levelId" params={{ levelId: current.id }}>Play Level {current.levelNumber}</Link>
        </Button>
      </section>

      <section className="mt-9">
        <h3 className="mb-4 text-center text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground">Your journey</h3>
        <ol className="relative">
          <div className="absolute bottom-6 left-1/2 top-6 -translate-x-1/2 border-l-[3px] border-dashed border-leather/40" />
          {LEVELS.map((l, i) => {
            const lp = progress.levels[l.id];
            const unlocked = l.levelNumber <= progress.unlockedLevel;
            const isCurrent = l.id === current.id && !lp?.completed;
            const side = i % 2 === 0;
            const card = (
              <div
                className={cn(
                  "flex w-[calc(50%-1.75rem)] min-w-0 flex-col rounded-2xl border bg-card p-3 shadow-soft transition",
                  side ? "mr-auto items-end text-right" : "ml-auto items-start text-left",
                  isCurrent ? "border-primary ring-2 ring-primary/30" : "border-border",
                  !unlocked && "opacity-55",
                )}
              >
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Level {l.levelNumber}{l.type === "forgot" ? " · Forgot It!" : ""}
                </div>
                <div className="w-full truncate font-display text-base font-semibold">{l.flag} {l.destination}</div>
                {lp?.completed ? <Stars count={lp.stars} size={14} /> : <div className="text-xs text-muted-foreground">{unlocked ? "Ready to pack" : "Locked"}</div>}
              </div>
            );
            return (
              <li key={l.id} className="relative mb-4 flex items-center">
                <div
                  className={cn(
                    "absolute left-1/2 z-10 grid h-11 w-11 -translate-x-1/2 place-items-center rounded-full border-[3px] text-xl",
                    lp?.completed ? "border-stamp bg-card" : isCurrent ? "pulse-ring border-primary bg-card" : "border-border bg-muted",
                  )}
                >
                  {unlocked ? l.landmark : <Lock className="h-4 w-4 text-muted-foreground" />}
                </div>
                {unlocked ? (
                  <Link to="/play/$levelId" params={{ levelId: l.id }} className={cn("flex w-full", side ? "justify-start" : "justify-end")}>
                    {card}
                  </Link>
                ) : (
                  <div className="flex w-full">{card}</div>
                )}
              </li>
            );
          })}
        </ol>
      </section>
    </main>
  );
}
