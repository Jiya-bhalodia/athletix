import { createFileRoute } from "@tanstack/react-router";
import { About, Cta } from "@/components/sections";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Athletix" },
      { name: "description", content: "Our purpose, training philosophy and player pathway." },
      { property: "og:title", content: "About — Athletix" },
      {
        property: "og:description",
        content: "Our purpose, training philosophy and player pathway.",
      },
    ],
  }),
  component: () => (
    <>
      <About />
      <Cta />
    </>
  ),
});
