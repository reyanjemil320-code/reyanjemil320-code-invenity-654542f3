import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, LogOut, User, Shield, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const navLinks = [
  { label: "Home", path: "/" },
  { label: "Browse", path: "/browse" },
  { label: "Network", path: "/network" },
  { label: "Spark Arena", path: "/spark-arena" },
  { label: "AI Brainstorm", path: "/ai-brainstorm" },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, signOut } = useAuth();

  // Auto-close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Glass intensifies as you scroll — the bar feels alive
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (path: string) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  // Hide top navigation links inside the Network section — SideRail/BottomNav cover that.
  const inNetwork = location.pathname.startsWith("/network");

  return (
    <header
      className={`sticky top-0 z-50 w-full border-b transition-all duration-500 ${
        scrolled
          ? "border-accent/20 bg-background/85 backdrop-blur-2xl shadow-[0_8px_40px_-16px_hsl(0_0%_0%/0.6)]"
          : "border-border/40 bg-background/60 backdrop-blur-xl"
      }`}
    >
      {/* faint gold hairline on top */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
        <Logo />

        <nav className="hidden items-center gap-1 md:flex">
          {!inNetwork && navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`rounded-full px-3.5 py-2 text-sm font-medium transition-smooth ${
                isActive(link.path)
                  ? "bg-gradient-primary text-white shadow-[0_6px_20px_-6px_hsl(var(--primary)/0.6)]"
                  : "text-foreground/70 hover:bg-secondary hover:text-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {user ? (
            <>
              <Button asChild size="sm" className="btn-shine hidden rounded-full md:inline-flex">
                <Link to="/post">
                  <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Post Idea
                </Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Avatar className="h-8 w-8 ring-2 ring-accent/50 transition-smooth hover:ring-accent">
                      <AvatarFallback className="bg-primary/15 text-xs font-bold text-primary">
                        {(user.displayName || user.email || "?").charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 z-[60] glass-strong">
                  <DropdownMenuItem asChild>
                    <Link to="/network/profile" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" /> My Profile
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin" className="cursor-pointer">
                        <Shield className="mr-2 h-4 w-4" /> Admin
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button asChild size="sm" className="btn-shine rounded-full glow-shadow">
              <Link to="/auth">Sign In</Link>
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {mobileOpen && !inNetwork && (
        <div className="border-t border-accent/15 bg-background/95 backdrop-blur-2xl md:hidden animate-fade-in">
          <nav className="flex flex-col gap-1 p-4">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`rounded-xl px-4 py-3 text-sm font-medium transition-smooth ${
                  isActive(link.path)
                    ? "bg-gradient-primary text-white"
                    : "hover:bg-secondary"
                }`}
              >
                {link.label}
              </Link>
            ))}
            {user ? (
              <Link
                to="/post"
                className="rounded-xl bg-gradient-gold px-4 py-3 text-sm font-semibold text-[hsl(228_60%_6%)]"
              >
                + Post Idea
              </Link>
            ) : (
              <Link
                to="/auth"
                className="rounded-xl bg-gradient-primary px-4 py-3 text-sm font-semibold text-white"
              >
                Sign In
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

export default Navbar;
