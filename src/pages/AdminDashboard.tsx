import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Activity,
  Crown,
  Lightbulb,
  Loader2,
  LogOut,
  Search,
  Shield,
  ShieldCheck,
  ShieldOff,
  Trash2,
  Users,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { fetchAdminOverview, fetchAuth, type AdminMember } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, isAdmin, loading: authLoading, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<AdminMember[]>([]);
  const [inventions, setInventions] = useState<AdminOverviewInventions>([]);
  const [totals, setTotals] = useState({ members: 0, inventions: 0, admins: 0 });
  const [query, setQuery] = useState("");
  const [acting, setActing] = useState<string | null>(null);

  type AdminOverviewInventions = Awaited<ReturnType<typeof fetchAdminOverview>>["inventions"];

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchAdminOverview();
      setMembers(data.members);
      setInventions(data.inventions);
      setTotals(data.totals);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load admin data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && isAdmin) void load();
  }, [authLoading, isAdmin]);

  const filtered = useMemo(() => {
    if (!query.trim()) return members;
    const q = query.toLowerCase();
    return members.filter(
      (u) =>
        u.username?.toLowerCase().includes(q) ||
        u.display_name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q),
    );
  }, [members, query]);

  const toggleAdmin = async (row: AdminMember) => {
    setActing(row.user_id);
    try {
      await fetchAuth("/api/admin-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: row.user_id, make_admin: !row.isAdmin }),
      });
      toast.success(row.isAdmin ? `Removed admin from ${row.display_name || row.username}` : `Promoted ${row.display_name || row.username} to admin`);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setActing(null);
    }
  };

  const deleteInvention = async (id: string) => {
    setActing(id);
    try {
      await fetchAuth(`/api/inventions-delete?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      setInventions((prev) => prev.filter((x) => x.id !== id));
      toast.success("Removed.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete.");
    } finally {
      setActing(null);
    }
  };

  const lockOut = async () => {
    await signOut();
    toast.message("Signed out of admin");
    navigate("/");
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <main className="flex flex-1 items-center justify-center p-6">
          <Loader2 className="text-accent h-8 w-8 animate-spin" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <main className="flex flex-1 items-center justify-center p-6">
          <Card className="glass-strong max-w-md p-10 text-center">
            <Shield className="text-accent mx-auto mb-4 h-12 w-12" />
            <h1 className="text-2xl font-bold">Admin area locked</h1>
            <p className="mt-3 text-muted-foreground">
              This dashboard is only visible to verified admin accounts. Admin access is managed
              server-side — ask an existing admin to promote your account.
            </p>
            <Button asChild className="mt-6 rounded-full bg-gradient-primary">
              <Link to="/">Return home</Link>
            </Button>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  const statCards = [
    { label: "Members", value: totals.members, icon: Users },
    { label: "Inventions", value: totals.inventions, icon: Lightbulb },
    { label: "Admins", value: totals.admins, icon: Crown },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="relative flex-1 px-4 py-8 md:px-6 md:py-12">
        <div className="bg-gradient-mesh pointer-events-none absolute inset-0 opacity-40" />
        <div className="relative mx-auto max-w-6xl">
          {/* Hero */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-[2rem] border border-accent/20 bg-gradient-hero p-6 md:p-10"
          >
            <div className="starfield pointer-events-none absolute inset-0 opacity-40" />
            <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-accent/15 blur-3xl" />
            <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <Badge className="gold-text mb-4 rounded-full border border-accent/40 bg-accent/10 px-4 py-1">
                  <Activity className="mr-1 h-3 w-3" /> Admin Control Room
                </Badge>
                <h1 className="text-3xl font-bold md:text-5xl">Mission control</h1>
                <p className="mt-3 max-w-2xl text-muted-foreground md:text-lg">
                  Oversee the Invenity community — promote admins, search members, and clean up rule-breaking content.
                </p>
              </div>
              <Button variant="outline" onClick={lockOut} className="self-start rounded-full border-accent/40 hover:border-accent hover:text-accent">
                <LogOut className="mr-2 h-4 w-4" /> Sign out
              </Button>
            </div>
          </motion.section>

          {/* Stats */}
          <section className="mt-6 grid gap-4 sm:grid-cols-3">
            {statCards.map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className="glass-strong card-lift p-5">
                  <s.icon className="text-accent h-5 w-5" />
                  <p className="text-shine mt-3 text-3xl font-bold">{loading ? "—" : s.value}</p>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                </Card>
              </motion.div>
            ))}
          </section>

          {/* Users */}
          <Card className="glass-strong mt-6 p-5 md:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <Users className="text-accent h-5 w-5" />
                <h2 className="text-xl font-bold">Members</h2>
                <Badge variant="outline" className="rounded-full">{filtered.length}</Badge>
              </div>
              <div className="relative w-full md:w-80">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search name, username, or email"
                  className="rounded-full pl-9"
                />
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)
              ) : filtered.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border/60 p-10 text-center text-muted-foreground">
                  No members match your search.
                </div>
              ) : (
                filtered.map((u) => (
                  <motion.div
                    key={u.user_id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col gap-4 rounded-2xl border border-border/60 p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      <Avatar className="h-12 w-12 border border-accent/30">
                        <AvatarImage src={u.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/15 text-primary">
                          {(u.display_name || u.username || "U").slice(0, 1).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate font-semibold">{u.display_name || u.username || "Unnamed"}</p>
                          {u.isAdmin && (
                            <Badge className="gold-text rounded-full border border-accent/40 bg-accent/10 px-2 py-0 text-[10px]">
                              <Crown className="mr-1 h-3 w-3" /> ADMIN
                            </Badge>
                          )}
                        </div>
                        <p className="truncate text-xs text-muted-foreground">
                          @{u.username || "—"} · {u.email || "no email"}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">{u.invention_count} inventions</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        size="sm"
                        variant={u.isAdmin ? "outline" : "default"}
                        className="rounded-full"
                        disabled={acting === u.user_id}
                        onClick={() => toggleAdmin(u)}
                      >
                        {acting === u.user_id ? (
                          <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                        ) : u.isAdmin ? (
                          <ShieldOff className="mr-1 h-3.5 w-3.5" />
                        ) : (
                          <ShieldCheck className="mr-1 h-3.5 w-3.5" />
                        )}
                        {u.isAdmin ? "Remove admin" : "Make admin"}
                      </Button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </Card>

          {/* Content moderation */}
          <Card className="glass-strong mt-6 p-5">
            <div className="mb-3 flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-accent" />
              <h3 className="font-bold">Inventions</h3>
              <Badge variant="outline" className="ml-auto rounded-full">{inventions.length}</Badge>
            </div>
            <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : inventions.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nothing here yet.</p>
              ) : (
                inventions.map((it) => (
                  <div key={it.id} className="flex items-start justify-between gap-2 rounded-xl border border-border/60 p-3">
                    <div className="min-w-0">
                      <p className="line-clamp-2 text-sm">{it.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{it.category.replace(/_/g, " ")}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-muted-foreground hover:text-destructive"
                      disabled={acting === it.id}
                      onClick={() => deleteInvention(it.id)}
                    >
                      {acting === it.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
