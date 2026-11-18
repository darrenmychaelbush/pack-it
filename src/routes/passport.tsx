import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Stamp } from "@/components/game/Stamp";
import { LEVELS } from "@/game/levels";
import { useProgress } from "@/game/progress";

export const Route = createFileRoute("/passport")({
  head: () => ({
    meta: [
      { title: "My Passport — Pack It!" },
      { name: "description", content: "Every destination you've packed for, stamped in your travel passport." },
      { property: "og:title", content: "My Passport — Pack It!" },
      { property: "og:description", content: "Collect a passport stamp for every trip you pack." },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "https://packit.dmbush.com/og-image.png" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: "Pack It! logo" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: "https://packit.dmbush.com/og-image.png" },
    ],
  }),
  component: PassportPage,
});

const COUNTRIES = [
  { name: "USA", flag: "🇺🇸" },
  { name: "Mexico", flag: "🇲🇽" },
  { name: "Canada", flag: "🇨🇦" },
  { name: "United Kingdom", flag: "🇬🇧" },
  { name: "France", flag: "🇫🇷" },
  { name: "Greece", flag: "🇬🇷" },
];

function PassportPage() {
  const { progress } = useProgress();
  const stamps = Object.values(progress.stamps);
  const countries = new Set(stamps.map((s) => s.country)).size;
  const stars = Object.values(progress.levels).reduce((a, l) => a + l.stars, 0);

  return (
    <main className="mx-auto min-h-dvh max-w-md px-5 pb-16 pt-6">
      <header className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
        <Link to="/" aria-label="Back" className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-card shadow-soft">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-center text-2xl font-semibold">My Passport</h1>
        <div className="w-10" />
      </header>

      <section className="mt-5 rounded-3xl bg-shell p-5 text-primary-foreground shadow-lift">
        <div className="text-[11px] font-bold uppercase tracking-[0.25em] opacity-70">World exploration</div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          {[
            [countries, "Countries"],
            [stamps.length, "Destinations"],
            [stars, "Stars"],
          ].map(([n, label]) => (
            <div key={label} className="rounded-2xl bg-primary-foreground/10 py-3">
              <div className="font-display text-3xl font-semibold">{n}</div>
              <div className="text-[11px] font-bold uppercase tracking-wider opacity-70">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {COUNTRIES.map((c) => {
        const levels = LEVELS.filter((l) => l.country === c.name);
        const got = levels.filter((l) => progress.stamps[l.passportStampId]).length;
        return (
          <section key={c.name} className="mt-5 rounded-3xl border border-border bg-card p-4 shadow-soft">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{c.flag} {c.name}</h2>
              <span className="text-sm font-bold text-muted-foreground">{got} / {levels.length}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-4">
              {levels.map((l) => (
                <Stamp key={l.id} level={l} size={92} faded={!progress.stamps[l.passportStampId]} />
              ))}
            </div>
          </section>
        );
      })}
    </main>
  );
}
