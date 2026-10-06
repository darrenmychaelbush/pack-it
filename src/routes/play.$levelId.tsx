import { createFileRoute, notFound } from "@tanstack/react-router";
import { PackingGame } from "@/components/game/PackingGame";
import { getLevel } from "@/game/levels";

export const Route = createFileRoute("/play/$levelId")({
  loader: ({ params }) => {
    const level = getLevel(params.levelId);
    if (!level) throw notFound();
    return { levelId: level.id };
  },
  head: ({ loaderData }) => {
    const level = loaderData ? getLevel(loaderData.levelId) : undefined;
    if (!level) return { meta: [{ title: "Trip not found — Pack It!" }, { name: "robots", content: "noindex" }] };
    const title = `Level ${level.levelNumber}: ${level.destination} — Pack It!`;
    const description = `Pack your suitcase for a ${level.days}-day ${level.tripType.toLowerCase()} to ${level.destination}, ${level.country}.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  component: PlayPage,
});

function PlayPage() {
  const { levelId } = Route.useLoaderData();
  const level = getLevel(levelId)!;
  return <PackingGame key={level.id} level={level} />;
}
