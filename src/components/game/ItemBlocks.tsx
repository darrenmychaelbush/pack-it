import type { PackingItemDefinition, Shape } from "@/game/types";
import { rotateN, shapesEqual } from "@/game/engine";
import { PACKED_SIZES } from "@/game/sizes";

interface Props {
  shape: Shape;
  cell: number;
  item: PackingItemDefinition;
  selected?: boolean;
  className?: string;
  packed?: boolean;
}

/** Renders an item as a single soft packing-cube object following its logical shape. */
export function ItemBlocks(props: Props) {
  const lib = PACKED_SIZES[props.item.id];
  const k = lib?.art ? [0, 1, 2, 3].find((n) => shapesEqual(rotateN(lib.shape, n), props.shape)) : undefined;
  if (lib?.art && k !== undefined) return <ItemArt {...props} art={lib.art} native={lib.shape} turns={k} />;
  return <ItemCube {...props} />;
}

/** The illustrated object itself is the piece: artwork fills its footprint, rotated with it. */
function ItemArt({ shape, cell, item, selected, className, art, native, turns }: Props & { art: string; native: Shape; turns: number }) {
  const W = shape[0].length * cell;
  const H = shape.length * cell;
  const inset = Math.max(1.5, cell * 0.04);
  const nw = native[0].length * cell - inset * 2;
  const nh = native.length * cell - inset * 2;
  return (
    <div className={className} style={{ position: "relative", width: W, height: H }}>
      {selected && (
        <div style={{ position: "absolute", inset: 0, borderRadius: cell * 0.2, background: "color-mix(in oklab, var(--gold) 22%, transparent)", outline: "2px solid var(--gold)" }} />
      )}
      <img
        src={art}
        alt={item.name}
        draggable={false}
        style={{
          position: "absolute",
          left: W / 2 - nw / 2,
          top: H / 2 - nh / 2,
          width: nw,
          height: nh,
          objectFit: "fill",
          transform: `rotate(${turns * 90}deg)`,
          pointerEvents: "none",
          filter: "drop-shadow(0 2px 2px oklch(0 0 0 / 0.35))",
        }}
      />
    </div>
  );
}

function ItemCube({ shape, cell, item, selected, className }: Props) {
  const r = cell * 0.24;
  const filled: { i: number; j: number }[] = [];
  shape.forEach((row, i) => row.forEach((v, j) => v && filled.push({ i, j })));
  const has = (i: number, j: number) => !!shape[i]?.[j];
  // Emoji fills the largest solid square inside the footprint so art and piece read as one object.
  let sq = { i: filled[0].i, j: filled[0].j, k: 1 };
  for (const f of filled)
    for (let k = sq.k + 1; k <= Math.min(shape.length, shape[0].length); k++) {
      let ok = true;
      for (let a = 0; a < k && ok; a++) for (let b = 0; b < k; b++) if (!has(f.i + a, f.j + b)) { ok = false; break; }
      if (!ok) break;
      sq = { i: f.i, j: f.j, k };
    }
  // Prefer a square nearest the centroid among equal sizes.
  const ci = filled.reduce((a, f) => a + f.i, 0) / filled.length;
  const cj = filled.reduce((a, f) => a + f.j, 0) / filled.length;
  for (const f of filled) {
    let ok = true;
    for (let a = 0; a < sq.k && ok; a++) for (let b = 0; b < sq.k; b++) if (!has(f.i + a, f.j + b)) { ok = false; break; }
    const d = (x: { i: number; j: number }) => Math.hypot(x.i + (sq.k - 1) / 2 - ci, x.j + (sq.k - 1) / 2 - cj);
    if (ok && d(f) < d(sq)) sq = { ...sq, i: f.i, j: f.j };
  }
  const elongated = sq.k === 1 && filled.length >= 3;
  const emojiSize = sq.k * cell * (elongated ? 1.05 : 0.9);
  const emojiTop = (sq.i + sq.k / 2) * cell;
  const emojiLeft = (sq.j + sq.k / 2) * cell;

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
            boxShadow: [
              !has(i - 1, j) && "inset 0 2px 0 color-mix(in oklab, white 35%, transparent)",
              !has(i + 1, j) && "inset 0 -3px 0 color-mix(in oklab, black 22%, transparent)",
            ].filter(Boolean).join(", ") || undefined,
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
