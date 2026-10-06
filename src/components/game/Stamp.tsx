import type { LevelDefinition } from "@/game/types";
import { cn } from "@/lib/utils";

export function Stamp({ level, size = 120, faded, className }: { level: Pick<LevelDefinition, "destination" | "country" | "landmark">; size?: number; faded?: boolean; className?: string }) {
  return (
    <div
      className={cn(
        "relative grid place-items-center rounded-full border-[3px] border-dashed text-center",
        faded ? "border-muted-foreground/30 text-muted-foreground/40" : "border-stamp text-stamp",
        className,
      )}
      style={{ width: size, height: size, transform: "rotate(-8deg)" }}
    >
      <div className={cn("absolute inset-1.5 rounded-full border-2", faded ? "border-muted-foreground/20" : "border-stamp/70")} />
      <div className="relative leading-none">
        <div className="font-display font-bold uppercase" style={{ fontSize: size * 0.13 }}>{level.destination}</div>
        <div style={{ fontSize: size * 0.28, filter: faded ? "grayscale(1)" : undefined }} className="my-0.5">{level.landmark}</div>
        <div className="font-display font-semibold uppercase tracking-wider" style={{ fontSize: size * 0.085 }}>{level.country}</div>
      </div>
    </div>
  );
}

export function Stars({ count, size = 28, animate }: { count: number; size?: number; animate?: boolean }) {
  return (
    <div className="flex items-end gap-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={cn(animate && "star-pop", i < count ? "text-gold" : "text-muted-foreground/25")}
          style={{ fontSize: i === 1 ? size * 1.25 : size, animationDelay: animate ? `${300 + i * 350}ms` : undefined, lineHeight: 1 }}
        >
          ★
        </span>
      ))}
    </div>
  );
}
