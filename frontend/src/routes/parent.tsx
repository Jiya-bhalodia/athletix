import { createFileRoute } from "@tanstack/react-router";
import { Award, CalendarCheck, Home, LineChart, UsersRound, Wallet } from "lucide-react";
import { PortalLayout } from "@/components/portal/PortalLayout";

const nav = [
  { title: "Home", url: "/parent", icon: Home },
  { title: "Child profile", url: "/parent/children", icon: UsersRound },
  { title: "Training & attendance", url: "/parent/attendance", icon: CalendarCheck },
  { title: "Matches & progress", url: "/parent/progress", icon: LineChart },
  { title: "Achievements", url: "/parent/achievements", icon: Award },
  { title: "Fees & payments", url: "/parent/fees", icon: Wallet },
];

export const Route = createFileRoute("/parent")({
  head: () => ({
    meta: [{ title: "Parent portal — Athletix" }, { name: "robots", content: "noindex" }],
  }),
  component: ParentLayout,
});

function ParentLayout() {
  return <PortalLayout role="Parent" base="/parent" label="Parent portal" nav={nav} />;
}
