import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Activity,
  Crown,
  Lightbulb,
  Loader2,
  LogOut,
  MessageSquare,
  Search,
  Shield,
  ShieldCheck,
  ShieldOff,
  Trash2,
  Users,
  Video,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;
type Invention = Tables<"inventions">;
type Post = Tables<"posts">;
type Reel = Tables<"reels">;

type UserRow = Profile & {
  isAdmin: boolean;
  inventionCount: number;
  postCount: number;
  reelCount: number;
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [unlocked, setUnlocked] = useState<boolean>(
    () => sessionStorage.getItem("admin_unlocked") === "1",
  );
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [query, setQuery] = useState("");
  const [acting, setActing] = useState<string | null>(null);
  const [totals, setTotals] = useState({ users: 0, inventions: 0, posts: 0, reels: 0 });
  const [inventions, setInventions] = useState<Invention[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [reels, setReels] = useState<Reel[]>([]);

  const load = async () => {
    setLoading(true);
    const [profilesRes, rolesRes, invRes, postsRes, reelsRes] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(500),
      supabase.from("user_roles").select("user_id, role"),
      supabase.from("inventions").select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("posts").select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("reels").select("*").order("created_at", { ascending: false }).limit(200),
    ]);

    setInventions((invRes.data ?? []) as Invention[]);
    setPosts((postsRes.data ?? []) as Post[]);
    setReels((reelsRes.data ?? []) as Reel[]);


    const adminSet = new Set(
      (rolesRes.data ?? []).filter((r: any) => r.role === "admin").map((r: any) => r.user_id),
    );
    const tally = (rows: { user_id: string }[] | null) => {
      const m = new Map<string, number>();
      (rows ?? []).forEach((r) => m.set(r.user_id, (m.get(r.user_id) ?? 0) + 1));
      return m;
    };
    const invMap = tally(invRes.data as any);
    const postMap = tally(postsRes.data as any);
    const reelMap = tally(reelsRes.data as any);

    const rows: UserRow[] = (profilesRes.data ?? []).map((p) => ({
      ...p,
      isAdmin: adminSet.has(p.user_id),
      inventionCount: invMap.get(p.user_id) ?? 0,
      postCount: postMap.get(p.user_id) ?? 0,
      reelCount: reelMap.get(p.user_id) ?? 0,
    }));

    setUsers(rows);
    setTotals({
      users: profilesRes.data?.length ?? 0,
      inventions: invRes.data?.length ?? 0,
      posts: postsRes.data?.length ?? 0,
      reels: reelsRes.data?.length ?? 0,
    });
    setLoading(false);
  };

  useEffect(() => {
    if (unlocked) void load();
  }, [unlocked]);

  const filtered = useMemo(() => {
    if (!query.trim()) return users;
    const q = query.toLowerCase();
    return users.filter(
      (u) =>
        u.username?.toLowerCase().includes(q) ||
        u.display_name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q),
    );
  }, [users, query]);

  const toggleAdmin = async (row: UserRow) => {
    setActing(row.user_id);
    if (row.isAdmin) {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", row.user_id)
        .eq("role", "admin");
      if (error) toast.error(error.message);
      else toast.success(`Removed admin from ${row.display_name || row.username}`);
    } else {
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: row.user_id, role: "admin" });
      if (error) toast.error(error.message);
      else toast.success(`Promoted ${row.display_name || row.username} to admin`);
    }
    setActing(null);
    void load();
  };

  const wipeContent = async (row: UserRow) => {
    setActing(row.user_id);
    const [{ error: e1 }, { error: e2 }, { error: e3 }] = await Promise.all([
      supabase.from("inventions").delete().eq("user_id", row.user_id),
      supabase.from("posts").delete().eq("user_id", row.user_id),
      supabase.from("reels").delete().eq("user_id", row.user_id),
    ]);
    setActing(null);
    if (e1 || e2 || e3) toast.error("Some content could not be removed.");
    else toast.success(`All content removed for ${row.display_name || row.username}`);
    void load();
  };

  const deleteItem = async (table: "inventions" | "posts" | "reels", id: string) => {
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Removed.");
    if (table === "inventions") setInventions((p) => p.filter((x) => x.id !== id));
    if (table === "posts") setPosts((p) => p.filter((x) => x.id !== id));
    if (table === "reels") setReels((p) => p.filter((x) => x.id !== id));
  };

  const lockOut = () => {
    sessionStorage.removeItem("admin_unlocked");
    setUnlocked(false);
    toast.message("Admin session locked");
    navigate("/");
  };

  if (!unlocked) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <main className="flex flex-1 items-center justify-center p-6">
          <Card className="max-w-md p-10 text-center">
            <Shield className="mx-auto mb-4 h-12 w-12 text-primary" />
            <h1 className="text-2xl font-bold">Admin area locked</h1>
            <p className="mt-3 text-muted-foreground">
              Tap the Invenity logo 5 times quickly, then enter the admin password to unlock this dashboard.
            </p>
            <Button asChild className="mt-6 rounded-full">
              <Link to="/">Return home</Link>
            </Button>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  const statCards = [
    { label: "Members", value: totals.users, icon: Users, tint: "from-primary/20 to-primary/5" },
    { label: "Inventions", value: totals.inventions, icon: Lightbulb, tint: "from-amber-500/20 to-amber-500/5" },
    { label: "Posts", value: totals.posts, icon: MessageSquare, tint: "from-emerald-500/20 to-emerald-500/5" },
    { label: "Reels", value: totals.reels, icon: Video, tint: "from-fuchsia-500/20 to-fuchsia-500/5" },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1 px-4 py-8 md:px-6 md:py-12">
        <div className="mx-auto max-w-6xl">
          {/* Hero */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-[2rem] border border-border/60 bg-gradient-hero p-6 md:p-10"
          >
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
            <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <Badge className="mb-4 rounded-full border-primary/20 bg-primary/10 px-4 py-1 text-primary">
                  <Activity className="mr-1 h-3 w-3" /> Admin Control Room
                </Badge>
                <h1 className="text-3xl font-bold md:text-5xl">Mission control</h1>
                <p className="mt-3 max-w-2xl text-muted-foreground md:text-lg">
                  Oversee the Invenity community — promote admins, search members, and clean up rule-breaking content.
                </p>
              </div>
              <Button variant="outline" onClick={lockOut} className="self-start rounded-full">
                <LogOut className="mr-2 h-4 w-4" /> Lock session
              </Button>
            </div>
          </motion.section>

          {/* Stats */}
          <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {statCards.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className={`relative overflow-hidden p-5 bg-gradient-to-br ${s.tint}`}>
                  <s.icon className="h-5 w-5 text-primary" />
                  <p className="mt-3 text-3xl font-bold">{loading ? "—" : s.value}</p>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                </Card>
              </motion.div>
            ))}
          </section>

          {/* Users */}
          <Card className="mt-6 p-5 md:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-primary" />
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
                      <Avatar className="h-12 w-12 border border-border/60">
                        <AvatarImage src={u.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/15 text-primary">
                          {(u.display_name || u.username || "U").slice(0, 1).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate font-semibold">{u.display_name || u.username || "Unnamed"}</p>
                          {u.isAdmin && (
                            <Badge className="rounded-full border-primary/30 bg-primary/10 px-2 py-0 text-[10px] text-primary">
                              <Crown className="mr-1 h-3 w-3" /> ADMIN
                            </Badge>
                          )}
                        </div>
                        <p className="truncate text-xs text-muted-foreground">
                          @{u.username || "—"} · {u.email || "no email"}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {u.inventionCount} inventions · {u.postCount} posts · {u.reelCount} reels
                        </p>
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

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="rounded-full"
                            disabled={acting === u.user_id}
                          >
                            <Trash2 className="mr-1 h-3.5 w-3.5" /> Wipe content
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete all content from this user?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This permanently removes every invention, post, and reel posted by{" "}
                              <span className="font-medium">{u.display_name || u.username}</span>. The account
                              itself is kept. This cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => wipeContent(u)}>Delete content</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </Card>

          {/* Content moderation */}
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            {([
              { label: "Inventions", icon: Lightbulb, table: "inventions" as const, items: inventions.map(i => ({ id: i.id, title: i.title, sub: i.user_id })) },
              { label: "Posts", icon: MessageSquare, table: "posts" as const, items: posts.map(p => ({ id: p.id, title: p.content.slice(0, 80), sub: p.user_id })) },
              { label: "Reels", icon: Video, table: "reels" as const, items: reels.map(r => ({ id: r.id, title: r.caption || "Reel", sub: r.user_id })) },
            ]).map((section) => (
              <Card key={section.label} className="p-5">
                <div className="mb-3 flex items-center gap-2">
                  <section.icon className="h-4 w-4 text-primary" />
                  <h3 className="font-bold">{section.label}</h3>
                  <Badge variant="outline" className="ml-auto rounded-full">{section.items.length}</Badge>
                </div>
                <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
                  {section.items.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nothing here.</p>
                  ) : section.items.map((it) => (
                    <div key={it.id} className="flex items-start justify-between gap-2 rounded-xl border border-border/60 p-3">
                      <p className="line-clamp-2 text-sm">{it.title}</p>
                      <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-destructive" onClick={() => deleteItem(section.table, it.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
