import { createFileRoute, Link, Outlet, redirect, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { LayoutDashboard, Users2, CreditCard, ClipboardList, UserCog, KeyRound, LogOut, Menu, ChevronDown, X } from "lucide-react";
import { supabase } from "@/lib/external-supabase";
import { isManager, type StaffUser } from "@/lib/auth";
import { titleCase } from "@/lib/format";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { BRAND_LOGO, BRAND_NAME } from "@/lib/brand";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/login" });
    const { data: profile } = await supabase.from("users").select("*").eq("id", data.user.id).maybeSingle();
    if (!profile || !profile.is_active) {
      await supabase.auth.signOut();
      throw redirect({ to: "/login", search: { inactive: true } });
    }
    return { profile: profile as StaffUser };
  },
  component: AppLayout,
});

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, manager: false },
  { to: "/applications", label: "Applications", icon: Users2, manager: false },
  { to: "/payments", label: "Payment History", icon: CreditCard, manager: false },
  { to: "/plans", label: "Plans", icon: ClipboardList, manager: true },
  { to: "/users", label: "Users", icon: UserCog, manager: true },
  { to: "/reset-password", label: "Reset Password", icon: KeyRound, manager: true },
] as const;

function AppLayout() {
  const { profile } = Route.useRouteContext();
  const [open, setOpen] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });
  const qc = useQueryClient();
  const navigate = useNavigate();

  async function logout() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/login", replace: true });
  }

  const items = NAV.filter((n) => !n.manager || isManager(profile));

  return (
    <div className="flex min-h-screen w-full bg-background">
      {open && <div className="fixed inset-0 z-30 bg-foreground/40 lg:hidden" onClick={() => setOpen(false)} />}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-60 flex-col bg-sidebar text-sidebar-foreground transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between border-b border-sidebar-border p-4">
          <img src={BRAND_LOGO} alt={BRAND_NAME} className="h-10 rounded" />
          <button className="lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu"><X className="h-5 w-5" /></button>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {items.map((n) => {
            const active = path === n.to || path.startsWith(n.to + "/");
            return (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active ? "bg-sidebar-primary text-sidebar-primary-foreground" : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                <n.icon className="h-4 w-4" /> {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-sidebar-border p-3">
          <button onClick={logout} className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b bg-card px-4 lg:px-6">
          <button className="lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu"><Menu className="h-5 w-5" /></button>
          <div className="flex-1" />
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-muted">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">
                {profile.name.charAt(0)}
              </div>
              <div className="text-left leading-tight">
                <div className="text-sm font-semibold">{profile.name}</div>
                <div className="text-xs text-muted-foreground">{titleCase(profile.role)}</div>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{profile.username}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout}><LogOut className="h-4 w-4" /> Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
