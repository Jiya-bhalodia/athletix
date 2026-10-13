import { createFileRoute } from "@tanstack/react-router";
import { Achievements, Cta } from "@/components/sections";

export const Route = createFileRoute("/achievements")({
  head: () => ({
    meta: [
      { title: "Achievements — Athletix" },
      { name: "description", content: "Team trophies, medals and player milestones." },
      { property: "og:title", content: "Achievements — Athletix" },
      { property: "og:description", content: "Team trophies, medals and player milestones." },
    ],
  }),
  component: () => (
    <>
      <Achievements showLink={false} />
      <Cta />
    </>
  ),
});
