import { createFileRoute } from "@tanstack/react-router";
import {
  About,
  Achievements,
  Coaching,
  Contact,
  Cta,
  Events,
  Hero,
  Sports,
} from "@/components/sections";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Athletix — Multi-Sport Training Academy" },
      {
        name: "description",
        content:
          "Football, cricket, basketball, badminton, tennis and athletics coaching at Athletix.",
      },
      { property: "og:title", content: "Athletix — Multi-Sport Training Academy" },
      {
        property: "og:description",
        content: "Structured coaching across six sports for young players.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <>
      <Hero />
      <About />
      <Sports />
      <Coaching />
      <Achievements />
      <Events />
      <Cta />
      <Contact />
    </>
  );
}
