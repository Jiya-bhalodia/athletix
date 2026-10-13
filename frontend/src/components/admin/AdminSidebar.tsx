import { Link, useRouterState } from "@tanstack/react-router";
import {
  Award,
  BarChart3,
  CalendarCheck,
  FileText,
  LayoutDashboard,
  Megaphone,
  Shirt,
  Trophy,
  UserCog,
  Users,
  Wallet,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Logo } from "@/components/site/Logo";
import type { Role } from "@/lib/auth";

const groups = [
  { label: "Overview", items: [{ title: "Dashboard", url: "/admin", icon: LayoutDashboard }] },
  {
    label: "People",
    items: [
      { title: "Players", url: "/admin/players", icon: Users },
      { title: "Parents & guardians", url: "/admin/parents", icon: Users },
      { title: "Coaches", url: "/admin/coaches", icon: UserCog },
      { title: "Sports & teams", url: "/admin/teams", icon: Shirt },
    ],
  },
  {
    label: "Training & matches",
    items: [
      { title: "Training & attendance", url: "/admin/training", icon: CalendarCheck },
      { title: "Matches", url: "/admin/matches", icon: Trophy },
      { title: "Performance", url: "/admin/analytics", icon: BarChart3 },
      { title: "Achievements", url: "/admin/achievements", icon: Award },
    ],
  },
  {
    label: "Operations",
    items: [
      { title: "Fees & payments", url: "/admin/fees", icon: Wallet },
      { title: "Announcements", url: "/admin/announcements", icon: Megaphone },
      { title: "Reports", url: "/admin/reports", icon: FileText },
    ],
  },
] as const;

export function AdminSidebar({ role }: { role: Role }) {
  const path = useRouterState({ select: (r) => r.location.pathname });
  const isActive = (url: string) =>
    url === "/admin" ? path === "/admin" || path === "/admin/" : path.startsWith(url);
  const visibleGroups =
    role === "Coach"
      ? groups
          .filter((g) => g.label === "Training & matches")
          .map((g) => ({
            ...g,
            items: g.items.filter(
              (i) =>
                i.url === "/admin/training" ||
                i.url === "/admin/matches" ||
                i.url === "/admin/analytics",
            ),
          }))
      : groups;
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-16 justify-center border-b px-4 group-data-[collapsible=icon]:px-2">
        <Logo />
      </SidebarHeader>
      <SidebarContent>
        {visibleGroups.map((g) => (
          <SidebarGroup key={g.label}>
            <SidebarGroupLabel>{g.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {g.items.map((i) => (
                  <SidebarMenuItem key={i.url}>
                    <SidebarMenuButton asChild isActive={isActive(i.url)} tooltip={i.title}>
                      <Link to={i.url}>
                        <i.icon className="h-4 w-4" />
                        <span>{i.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
