import { NavLink } from "react-router-dom";
import { Home, Zap, Inbox, Compass, User } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/network/feed", label: "Home", icon: Home },
  { to: "/network/explore", label: "Explore", icon: Compass },
  { to: "/network/spark", label: "Spark", icon: Zap },
  { to: "/network/inbox", label: "Inbox", icon: Inbox },
  { to: "/network/profile", label: "Profile", icon: User },
];

export function BottomNav() {
  return (
    <nav
      aria-label="Network sections"
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/60 bg-background/90 backdrop-blur-xl md:hidden"
    >
      <ul className="mx-auto flex max-w-md items-center justify-between px-2 py-1.5">
        {items.map(({ to, label, icon: Icon }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-2 text-[10px] font-medium transition-smooth",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={cn("h-5 w-5", isActive && "scale-110")} strokeWidth={isActive ? 2.5 : 2} />
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
