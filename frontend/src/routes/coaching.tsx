import { createFileRoute } from "@tanstack/react-router";
import { Coaching, Events } from "@/components/sections";

export const Route = createFileRoute("/coaching")({
  head: () => ({
    meta: [
      { title: "Coaching & Facilities — Athletix" },
      { name: "description", content: "Coaching, facilities and training batches at Athletix." },
      { property: "og:title", content: "Coaching & Facilities — Athletix" },
      {
        property: "og:description",
        content: "Coaching, facilities and training batches at Athletix.",
      },
    ],
  }),
  component: () => (
    <>
      <Coaching />
      <Events />
    </>
  ),
});
