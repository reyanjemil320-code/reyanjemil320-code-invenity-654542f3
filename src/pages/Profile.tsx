import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Globe, Loader2, MapPin, Save, Sparkles, Trophy } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { fetchAuth, fetchInventions, fetchProfile, type Invention, type ProfileData } from "@/lib/api";
import { compressImage } from "@/lib/media";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [profile, setProfile] = useState<Partial<ProfileData>>({});
  const [inventions, setInventions] = useState<Invention[]>([]);
  const [voteCount, setVoteCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const [me, myInventions] = await Promise.all([
          fetchProfile(),
          fetchInventions({ author: user.id }),
        ]);
        if (cancelled) return;
        setProfile(
          me.profile ?? {
            display_name: user.displayName || user.email?.split("@")[0] || "",
            username: user.email?.split("@")[0] || "",
          },
        );
        setInventions(myInventions);
        setVoteCount(me.counts?.votesCast ?? 0);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not load your profile.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const saveProfile = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }

    setSaving(true);
    try {
      // Avatar: compress to a small data URL, stored with the profile row
      let avatarUrl: string | null = null;
      if (avatarFile) {
        const compressed = await compressImage(avatarFile, { maxDimension: 400, maxBytes: 60_000 });
        avatarUrl = compressed.dataUrl;
      }

      await fetchAuth("/api/profiles-update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: profile.display_name ?? "",
          bio: profile.bio ?? "",
          location: profile.location ?? "",
          website: profile.website ?? "",
          twitter: profile.twitter ?? "",
          whatsapp: profile.whatsapp ?? "",
          avatar_url: avatarUrl,
        }),
      });

      if (avatarUrl) setProfile((prev) => ({ ...prev, avatar_url: avatarUrl }));
      setAvatarFile(null);
      toast.success("Profile updated.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save your profile.");
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <main className="flex flex-1 items-center justify-center p-6">
          <Card className="glass-strong max-w-md p-10 text-center">
            <h1 className="text-2xl font-bold">Sign in to edit your profile</h1>
            <p className="mt-3 text-muted-foreground">Your inventor profile lives here.</p>
            <Button asChild className="mt-6 rounded-full bg-gradient-primary">
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
      <main className="relative flex-1 px-4 py-8 md:px-6 md:py-12">
        <div className="bg-gradient-mesh pointer-events-none absolute inset-0 opacity-40" />
        <div className="relative mx-auto max-w-6xl space-y-6">
          <section className="animate-rise relative overflow-hidden rounded-[2rem] border border-accent/20 bg-gradient-hero p-6 md:p-10">
            <div className="starfield pointer-events-none absolute inset-0 opacity-40" />
            <div className="pointer-events-none absolute -top-20 -left-20 h-64 w-64 rounded-full bg-accent/15 blur-3xl animate-blob" />
            <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-24 w-24 border-2 border-accent/50 ring-4 ring-accent/10">
                  <AvatarImage src={profile.avatar_url || undefined} />
                  <AvatarFallback className="text-primary bg-primary/10 text-2xl font-bold">
                    {(profile.display_name || profile.username || user.email || "S").slice(0, 1).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="gradient-text text-4xl font-bold">{profile.display_name || "Your profile"}</h1>
                  {profile.username && <p className="gold-text mt-1 text-sm">@{profile.username}</p>}
                  <p className="mt-2 text-muted-foreground">{profile.bio || "Tell the network what you build and why it matters."}</p>
                  <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
                    {profile.location && <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" />{profile.location}</span>}
                    {profile.website && <span className="inline-flex items-center gap-1"><Globe className="h-4 w-4" />{profile.website}</span>}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <Card className="card-lift p-4"><p className="text-shine text-2xl font-bold">{inventions.length}</p><p className="text-xs text-muted-foreground">Ideas</p></Card>
                <Card className="card-lift p-4"><p className="text-shine text-2xl font-bold">{voteCount}</p><p className="text-xs text-muted-foreground">Arena votes</p></Card>
                <Card className="card-lift p-4"><Trophy className="mx-auto h-6 w-6 text-accent" /><p className="mt-1 text-xs text-muted-foreground">Inventor</p></Card>
              </div>
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <Card className="glass-strong card-lift p-6">
              <h2 className="text-xl font-bold">Edit profile</h2>
              <div className="mt-6 space-y-4">
                <div>
                  <Label htmlFor="display-name">Display name</Label>
                  <Input id="display-name" value={profile.display_name ?? ""} onChange={(e) => setProfile((prev) => ({ ...prev, display_name: e.target.value }))} />
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
                <Button onClick={saveProfile} disabled={saving || loading} className="btn-shine glow-shadow w-full rounded-full bg-gradient-primary">
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save profile
                </Button>
              </div>
            </Card>

            <div className="space-y-6">
              <Card className="glass-strong card-lift p-6">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-xl font-bold">Your inventions</h2>
                  <Button asChild variant="outline" className="rounded-full border-accent/40 hover:border-accent hover:text-accent">
                    <Link to="/post">Post another idea</Link>
                  </Button>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {loading ? (
                    <p className="text-sm text-muted-foreground">Loading your work…</p>
                  ) : inventions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No inventions posted yet — share your first idea.</p>
                  ) : (
                    inventions.map((item) => (
                      <Link key={item.id} to={`/inventions/${item.id}`} className="transition-smooth rounded-[1.5rem] border border-border/60 p-4 hover:border-accent/40 hover:bg-secondary/30">
                        <p className="gold-text text-xs font-medium uppercase tracking-wider">{(item.category ?? "").replace(/_/g, " ")}</p>
                        <h3 className="mt-1 font-semibold">{item.title}</h3>
                        <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{item.description}</p>
                      </Link>
                    ))
                  )}
                </div>
              </Card>

              <Card className="glass-strong p-6">
                <div className="flex items-start gap-3">
                  <Sparkles className="text-accent mt-1 h-5 w-5" />
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
