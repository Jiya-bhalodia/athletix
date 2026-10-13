import { createFileRoute } from "@tanstack/react-router";
import { Sports, Cta } from "@/components/sections";

export const Route = createFileRoute("/sports")({
  head: () => ({
    meta: [
      { title: "Sports — Athletix" },
      { name: "description", content: "Six sports offered at Athletix academy." },
      { property: "og:title", content: "Sports — Athletix" },
      { property: "og:description", content: "Six sports offered at Athletix academy." },
    ],
  }),
  component: () => (
    <>
      <Sports />
      <Cta />
    </>
  ),
});
