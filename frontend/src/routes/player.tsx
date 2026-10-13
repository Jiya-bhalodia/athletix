import { createFileRoute } from "@tanstack/react-router";
import { Award, BarChart3, CalendarCheck, Home, Trophy, UserRound, Wallet } from "lucide-react";
import { PortalLayout } from "@/components/portal/PortalLayout";

const nav = [
  { title: "Home", url: "/player", icon: Home },
  { title: "My profile", url: "/player/profile", icon: UserRound },
  { title: "Training & attendance", url: "/player/training", icon: CalendarCheck },
  { title: "Matches", url: "/player/matches", icon: Trophy },
  { title: "Performance", url: "/player/performance", icon: BarChart3 },
  { title: "Achievements", url: "/player/achievements", icon: Award },
  { title: "Fees", url: "/player/fees", icon: Wallet },
];

export const Route = createFileRoute("/player")({
  head: () => ({
    meta: [{ title: "Player portal — Athletix" }, { name: "robots", content: "noindex" }],
  }),
  component: () => <PortalLayout role="Player" base="/player" label="Player portal" nav={nav} />,
});
