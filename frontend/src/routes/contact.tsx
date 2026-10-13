import { createFileRoute } from "@tanstack/react-router";
import { Contact, Cta } from "@/components/sections";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Athletix" },
      { name: "description", content: "Get in touch with Athletix sports academy." },
      { property: "og:title", content: "Contact — Athletix" },
      { property: "og:description", content: "Get in touch with Athletix sports academy." },
    ],
  }),
  component: () => (
    <>
      <Contact />
      <div className="pt-20" />
      <Cta />
    </>
  ),
});
