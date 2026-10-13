import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { ChevronRight, ExternalLink, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Toaster } from "@/components/ui/sonner";
import { Logo } from "@/components/site/Logo";
import { auth, homeFor, type DemoSession, type Role } from "@/lib/auth";
import { SessionProvider } from "./session-context";

export type NavItem = {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
};

/** Session-backed route guard + shell for the Player and Parent portals. */
export function PortalLayout({
  role,
  base,
  label,
  nav,
  children,
}: {
  role: Role;
  base: string;
  label: string;
  nav: NavItem[];
  children?: React.ReactNode;
}) {
  const navigate = useNavigate();
  const path = useRouterState({ select: (r) => r.location.pathname.replace(/\/$/, "") || "/" });
  const [user, setUser] = useState<DemoSession | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    auth
      .restore()
      .then((s) => {
        if (!active) return;
        if (!s) navigate({ to: "/login" });
        else if (s.role !== role) navigate({ to: homeFor(s.role) });
        else setUser(s);
      })
      .catch(() => {
        if (active) setUser(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    const expired = () => {
      auth.clear();
      setUser(null);
      navigate({ to: "/login" });
    };
    window.addEventListener("athletix:session-expired", expired);
    return () => {
      active = false;
      window.removeEventListener("athletix:session-expired", expired);
    };
  }, [navigate, role]);
  if (loading)
    return (
      <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">
        Restoring your session…
      </div>
    );
  if (!user)
    return (
      <div className="grid min-h-screen place-items-center p-6 text-sm text-muted-foreground">
        Unable to verify your session. Please sign in again.
      </div>
    );

  const logout = async () => {
    try {
      await auth.signOut();
    } finally {
      navigate({ to: "/login" });
    }
  };
  const isActive = (url: string) => (url === base ? path === base : path.startsWith(url));
  const current = nav.find((n) => n.url !== base && isActive(n.url));

  return (
    <SessionProvider value={user}>
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-muted">
          <Sidebar collapsible="icon">
            <SidebarHeader className="h-16 justify-center border-b px-4 group-data-[collapsible=icon]:px-2">
              <Logo />
            </SidebarHeader>
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupLabel>{label}</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {nav.map((i) => (
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
            </SidebarContent>
          </Sidebar>
          <SidebarInset className="bg-muted">
            <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-3 border-b bg-background/90 px-4 backdrop-blur">
              <div className="flex min-w-0 items-center gap-2 text-sm">
                <SidebarTrigger />
                <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1">
                  <Link to={base} className="font-semibold hover:text-highlight">
                    {label}
                  </Link>
                  {current && (
                    <>
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="truncate text-muted-foreground">{current.title}</span>
                    </>
                  )}
                </nav>
                <span className="ml-2 hidden rounded-full bg-accent px-2 py-0.5 text-xs font-medium md:inline">
                  Connected account
                </span>
              </div>
              <div className="flex items-center gap-2">
                {children}
                <Link
                  to="/"
                  className="hidden items-center gap-1 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground lg:inline-flex"
                >
                  View site <ExternalLink className="h-3.5 w-3.5" />
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    className="flex items-center gap-2 rounded-md p-1 pr-2 hover:bg-secondary"
                    aria-label="Profile menu"
                  >
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-primary text-sm font-bold">
                      {user.name[0]}
                    </span>
                    <span className="hidden text-left leading-tight sm:block">
                      <span className="block text-sm font-medium">{user.name}</span>
                      <span className="block text-xs text-muted-foreground">{user.role}</span>
                    </span>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="text-sm">{user.name}</div>
                      <div className="text-xs font-normal text-muted-foreground">
                        {user.email} · {user.role}
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout}>
                      <LogOut className="h-4 w-4" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </header>
            <main className="flex-1 p-4 md:p-6">
              <Outlet />
            </main>
          </SidebarInset>
        </div>
        <Toaster position="top-right" />
      </SidebarProvider>
    </SessionProvider>
  );
}
