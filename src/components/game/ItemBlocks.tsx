import type { PackingItemDefinition, Shape } from "@/game/types";

interface Props {
  shape: Shape;
  cell: number;
  item: PackingItemDefinition;
  selected?: boolean;
  className?: string;
}

/** Renders an item as a single soft packing-cube object following its logical shape. */
export function ItemBlocks({ shape, cell, item, selected, className }: Props) {
  const r = cell * 0.24;
  const filled: { i: number; j: number }[] = [];
  shape.forEach((row, i) => row.forEach((v, j) => v && filled.push({ i, j })));
  const has = (i: number, j: number) => !!shape[i]?.[j];
  // Emoji sits on the filled cell closest to the centroid.
  const ci = filled.reduce((a, f) => a + f.i, 0) / filled.length;
  const cj = filled.reduce((a, f) => a + f.j, 0) / filled.length;
  const anchor = filled.reduce((best, f) =>
    Math.hypot(f.i - ci, f.j - cj) < Math.hypot(best.i - ci, best.j - cj) ? f : best,
  );
  const minDim = Math.min(shape.length, shape[0].length);
  const emojiSize = Math.max(cell * 0.7, Math.min(minDim * cell * 0.62, cell * 1.9));
  const emojiTop = (has(Math.round(ci), Math.round(cj)) ? ci : anchor.i) * cell + cell / 2;
  const emojiLeft = (has(Math.round(ci), Math.round(cj)) ? cj : anchor.j) * cell + cell / 2;

  return (
    <div
      className={className}
      style={{
        position: "relative",
        width: shape[0].length * cell,
        height: shape.length * cell,
        filter: selected
          ? "drop-shadow(0 0 1.5px var(--gold)) drop-shadow(0 0 1.5px var(--gold)) drop-shadow(0 4px 4px oklch(0 0 0 / 0.35))"
          : "drop-shadow(0 3px 3px oklch(0 0 0 / 0.3))",
      }}
    >
      {filled.map(({ i, j }) => (
        <div
          key={`${i}-${j}`}
          style={{
            position: "absolute",
            top: i * cell,
            left: j * cell,
            width: cell,
            height: cell,
            background: `linear-gradient(160deg, color-mix(in oklab, ${item.color} 82%, white), ${item.color})`,
            borderTopLeftRadius: !has(i - 1, j) && !has(i, j - 1) ? r : 0,
            borderTopRightRadius: !has(i - 1, j) && !has(i, j + 1) ? r : 0,
            borderBottomLeftRadius: !has(i + 1, j) && !has(i, j - 1) ? r : 0,
            borderBottomRightRadius: !has(i + 1, j) && !has(i, j + 1) ? r : 0,
          }}
        />
      ))}
      <span
        aria-hidden
        style={{
          position: "absolute",
          top: emojiTop,
          left: emojiLeft,
          transform: "translate(-50%, -50%)",
          fontSize: emojiSize,
          lineHeight: 1,
          pointerEvents: "none",
          filter: "drop-shadow(0 1px 1px oklch(0 0 0 / 0.3))",
        }}
      >
        {item.emoji}
      </span>
    </div>
  );
}
