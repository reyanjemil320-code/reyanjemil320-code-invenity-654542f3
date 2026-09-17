import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Globe, Loader2, MapPin, Save, Sparkles } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type ProfileRow = Tables<"profiles">;
type Invention = Tables<"inventions">;
type Post = Tables<"posts">;
type Reel = Tables<"reels">;

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [profile, setProfile] = useState<Partial<ProfileRow>>({});
  const [inventions, setInventions] = useState<Invention[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [reels, setReels] = useState<Reel[]>([]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const [{ data: profileRow }, { data: inventionRows }, { data: postRows }, { data: reelRows }] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("inventions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("posts").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(6),
        supabase.from("reels").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(6),
      ]);

      setProfile(profileRow ?? { display_name: user.email?.split("@")[0], email: user.email });
      setInventions(inventionRows ?? []);
      setPosts(postRows ?? []);
      setReels(reelRows ?? []);
      setLoading(false);
    };

    void load();
  }, [user]);

  const uploadAvatar = async () => {
    if (!user || !avatarFile) return profile.avatar_url ?? null;
    const ext = avatarFile.name.split(".").pop();
    const path = `${user.id}/avatar-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, avatarFile, { upsert: true });
    if (error) {
      toast.error(error.message);
      return profile.avatar_url ?? null;
    }
    return supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
  };

  const saveProfile = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }

    setSaving(true);
    const avatarUrl = await uploadAvatar();
    const payload: any = {
      user_id: user.id,
      email: profile.email ?? user.email ?? null,
      display_name: profile.display_name ?? null,
      username: profile.username ?? null,
      bio: profile.bio ?? null,
      location: profile.location ?? null,
      website: profile.website ?? null,
      twitter: profile.twitter ?? null,
      whatsapp: profile.whatsapp ?? null,
      avatar_url: avatarUrl ?? profile.avatar_url ?? null,
    };
    const { error } = await supabase
      .from("profiles")
      .upsert(payload, { onConflict: "user_id" });
    setSaving(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    if (avatarUrl) setProfile((prev) => ({ ...prev, avatar_url: avatarUrl }));
    setAvatarFile(null);
    toast.success("Profile updated.");
  };

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <main className="flex flex-1 items-center justify-center p-6">
          <Card className="max-w-md p-10 text-center">
            <h1 className="text-2xl font-bold">Sign in to edit your profile</h1>
            <p className="mt-3 text-muted-foreground">Your inventor profile lives here.</p>
            <Button asChild className="mt-6 rounded-full">
              <Link to="/auth">Go to sign in</Link>
            </Button>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1 px-4 py-8 md:px-6 md:py-12">
        <div className="mx-auto max-w-6xl space-y-6">
          <section className="rounded-[2rem] border border-border/60 bg-gradient-hero p-6 md:p-10 relative overflow-hidden animate-fade-in">
            <div className="pointer-events-none absolute -top-20 -left-20 h-64 w-64 rounded-full bg-primary/20 blur-3xl animate-blob" />
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between relative">
              <div className="flex items-center gap-4">
                <Avatar className="h-24 w-24 border-2 border-primary/30 ring-4 ring-primary/10">
                  <AvatarImage src={profile.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-2xl text-primary">
                    {(profile.display_name || profile.username || user.email || "S").slice(0, 1).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-4xl font-bold gradient-text">{profile.display_name || "Your profile"}</h1>
                  <p className="mt-2 text-muted-foreground">{profile.bio || "Tell the network what you build and why it matters."}</p>
                  <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
                    {profile.location && <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" />{profile.location}</span>}
                    {profile.website && <span className="inline-flex items-center gap-1"><Globe className="h-4 w-4" />{profile.website}</span>}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <Card className="p-4"><p className="text-2xl font-bold">{inventions.length}</p><p className="text-xs text-muted-foreground">Ideas</p></Card>
                <Card className="p-4"><p className="text-2xl font-bold">{posts.length}</p><p className="text-xs text-muted-foreground">Posts</p></Card>
                <Card className="p-4"><p className="text-2xl font-bold">{reels.length}</p><p className="text-xs text-muted-foreground">Reels</p></Card>
              </div>
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <Card className="p-6">
              <h2 className="text-xl font-bold">Edit profile</h2>
              <div className="mt-6 space-y-4">
                <div>
                  <Label htmlFor="display-name">Display name</Label>
                  <Input id="display-name" value={profile.display_name ?? ""} onChange={(e) => setProfile((prev) => ({ ...prev, display_name: e.target.value }))} />
                </div>
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input id="username" value={profile.username ?? ""} onChange={(e) => setProfile((prev) => ({ ...prev, username: e.target.value }))} />
                </div>
                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea id="bio" value={profile.bio ?? ""} onChange={(e) => setProfile((prev) => ({ ...prev, bio: e.target.value }))} className="min-h-28" />
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input id="location" value={profile.location ?? ""} onChange={(e) => setProfile((prev) => ({ ...prev, location: e.target.value }))} />
                </div>
                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input id="website" value={profile.website ?? ""} onChange={(e) => setProfile((prev) => ({ ...prev, website: e.target.value }))} />
                </div>
                <div>
                  <Label htmlFor="twitter">X / Twitter</Label>
                  <Input id="twitter" value={profile.twitter ?? ""} onChange={(e) => setProfile((prev) => ({ ...prev, twitter: e.target.value }))} />
                </div>
                <div>
                  <Label htmlFor="whatsapp">WhatsApp</Label>
                  <Input id="whatsapp" value={profile.whatsapp ?? ""} onChange={(e) => setProfile((prev) => ({ ...prev, whatsapp: e.target.value }))} />
                </div>
                <div>
                  <Label htmlFor="avatar">Avatar</Label>
                  <Input id="avatar" type="file" accept="image/*" onChange={(e) => setAvatarFile(e.target.files?.[0] || null)} />
                </div>
                <Button onClick={saveProfile} disabled={saving || loading} className="w-full rounded-full">
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save profile
                </Button>
              </div>
            </Card>

            <div className="space-y-6">
              <Card className="p-6">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-xl font-bold">Your inventions</h2>
                  <Button asChild variant="outline" className="rounded-full">
                    <Link to="/post">Post another idea</Link>
                  </Button>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {loading ? (
                    <p className="text-sm text-muted-foreground">Loading your work…</p>
                  ) : inventions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No inventions posted yet.</p>
                  ) : (
                    inventions.map((item) => (
                      <Link key={item.id} to={`/inventions/${item.id}`} className="rounded-[1.5rem] border border-border/60 p-4 transition-smooth hover:border-primary/40 hover:bg-secondary/30">
                        <p className="text-xs font-medium text-primary">{item.category.replace(/_/g, " ")}</p>
                        <h3 className="mt-1 font-semibold">{item.title}</h3>
                        <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{item.description}</p>
                      </Link>
                    ))
                  )}
                </div>
              </Card>

              <div className="grid gap-6 md:grid-cols-2">
                <Card className="p-6">
                  <h2 className="text-lg font-bold">Recent posts</h2>
                  <div className="mt-4 space-y-3">
                    {posts.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Start posting in The Network.</p>
                    ) : (
                      posts.map((post) => (
                        <div key={post.id} className="rounded-2xl border border-border/60 p-4">
                          <p className="text-sm line-clamp-4">{post.content}</p>
                        </div>
                      ))
                    )}
                  </div>
                </Card>
                <Card className="p-6">
                  <h2 className="text-lg font-bold">Recent reels</h2>
                  <div className="mt-4 space-y-3">
                    {reels.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Upload a demo reel from The Network.</p>
                    ) : (
                      reels.map((reel) => (
                        <div key={reel.id} className="rounded-2xl border border-border/60 p-4">
                          <p className="text-sm font-medium">{reel.caption || "Prototype update"}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{new Date(reel.created_at).toLocaleDateString()}</p>
                        </div>
                      ))
                    )}
                  </div>
                </Card>
              </div>

              <Card className="p-6">
                <div className="flex items-start gap-3">
                  <Sparkles className="mt-1 h-5 w-5 text-primary" />
                  <div>
                    <h2 className="text-lg font-bold">Profile tip</h2>
                    <p className="mt-1 text-sm text-muted-foreground">Creators with a strong bio, clear location, and at least one invention tend to get more profile visits.</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}