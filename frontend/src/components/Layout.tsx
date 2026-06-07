import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  FolderKanban,
  ListChecks,
  Microscope,
  FileText,
  Settings as SettingsIcon,
  Rocket,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { HealthBadge } from "@/components/HealthBadge";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/projects", label: "Projects", icon: FolderKanban },
  { to: "/tasks", label: "Tasks", icon: ListChecks },
  { to: "/research", label: "Research", icon: Microscope },
  { to: "/plans", label: "Startup Plans", icon: FileText },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-gradient flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border/60 bg-card/40 backdrop-blur md:flex">
        <div className="flex items-center gap-2 px-4 py-5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Rocket className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold leading-tight">FounderOS</div>
            <div className="text-xs text-muted-foreground">AI Startup Copilot</div>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-0.5">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "mx-2 flex items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
                  isActive && "bg-accent text-accent-foreground",
                )
              }
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-4 pb-4">
          <HealthBadge />
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-4 py-5 md:px-8 md:py-6">{children}</main>
    </div>
  );
}
