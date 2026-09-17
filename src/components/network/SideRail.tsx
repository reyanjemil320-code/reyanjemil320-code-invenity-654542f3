import { NavLink, Link } from "react-router-dom";
import { Home, Zap, Inbox, Compass, User, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const items = [
  { to: "/network/feed", label: "Home", icon: Home },
  { to: "/network/explore", label: "Explore", icon: Compass },
  { to: "/network/spark", label: "Spark", icon: Zap },
  { to: "/network/inbox", label: "Inbox", icon: Inbox },
  { to: "/network/profile", label: "Profile", icon: User },
];

export function SideRail() {
  return (
    <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-60 shrink-0 border-r border-border/60 bg-background/40 px-3 py-6 md:flex md:flex-col animate-fade-in">
      <p className="mb-4 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Network</p>
      <nav className="flex flex-1 flex-col gap-1">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-smooth",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground/80 hover:bg-secondary",
              )
            }
          >
            <Icon className="h-5 w-5" />
            {label}
          </NavLink>
        ))}
      </nav>
      <Button asChild className="mt-4 rounded-full">
        <Link to="/post">
          <PlusCircle className="mr-2 h-4 w-4" /> Post Idea
        </Link>
      </Button>
    </aside>
  );
}
