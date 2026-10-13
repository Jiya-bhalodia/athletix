import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { ExternalLink, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Toaster } from "@/components/ui/sonner";
import { auth, homeFor, type StaffSession } from "@/lib/auth";
import { useRouterState } from "@tanstack/react-router";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ name: "robots", content: "noindex" }] }),
  component: AdminLayout,
});

function AdminLayout() {
  const navigate = useNavigate();
  const path = useRouterState({ select: (r) => r.location.pathname });
  const [user, setUser] = useState<StaffSession | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    auth
      .restore()
      .then((s) => {
        if (!active) return;
        if (!s) navigate({ to: "/login" });
        else if (s.role === "Player" || s.role === "Parent") navigate({ to: homeFor(s.role) });
        else if (
          s.role === "Coach" &&
          !["/admin/training", "/admin/matches", "/admin/analytics"].includes(path)
        )
          navigate({ to: "/admin/training" });
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
  }, [navigate, path]);
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
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-muted">
        <AdminSidebar role={user.role} />
        <SidebarInset className="bg-muted">
          <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-3 border-b bg-background/90 px-4 backdrop-blur">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <span className="hidden text-sm font-semibold sm:inline">Coach / Admin</span>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to="/"
                className="hidden items-center gap-1 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground sm:inline-flex"
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
                  <span className="hidden text-sm font-medium sm:inline">{user.name}</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
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
  );
}
