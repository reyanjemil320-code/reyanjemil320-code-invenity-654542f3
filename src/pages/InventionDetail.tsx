import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Lightbulb, Lock, MapPin, Play, ShieldCheck, Trash2 } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type Invention = Tables<"inventions">;
type Profile = Tables<"profiles">;

const statusLabel: Record<string, { label: string; cls: string }> = {
  patent_pending: { label: "Patent Pending", cls: "bg-warning/15 text-warning border-warning/30" },
  available: { label: "Available", cls: "bg-success/15 text-success border-success/30" },
  prototype_ready: { label: "Prototype Ready", cls: "bg-primary/15 text-primary border-primary/30" },
  licensed: { label: "Licensed", cls: "bg-secondary text-secondary-foreground" },
  concept: { label: "Concept", cls: "bg-muted text-muted-foreground" },
};

const categoryLabel: Record<string, string> = {
  clean_energy: "Clean Energy",
  biotech: "BioTech",
  infrastructure: "Infrastructure",
  consumer_goods: "Consumer Goods",
  agriculture: "Agriculture",
  health_tech: "Health Tech",
  ai_software: "AI / Software",
  transportation: "Transportation",
  other: "Other",
};

export default function InventionDetail() {
  const { id } = useParams();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [invention, setInvention] = useState<Invention | null>(null);
  const [owner, setOwner] = useState<Profile | null>(null);
  const [related, setRelated] = useState<Invention[]>([]);
  const isOwner = !!user && !!invention && user.id === invention.user_id;
  const canDelete = isOwner || isAdmin;

  const deleteInvention = async () => {
    if (!invention) return;
    const { error } = await supabase.from("inventions").delete().eq("id", invention.id);
    if (error) return toast.error(error.message);
    toast.success("Invention deleted.");
    navigate("/browse");
  };

  const requestAccess = () => {
    if (!user) { toast.error("Sign in to request access."); return; }
    if (owner?.email) {
      window.location.href = `mailto:${owner.email}?subject=${encodeURIComponent(`Access request: ${invention?.title}`)}&body=${encodeURIComponent(`Hi ${owner.display_name || owner.username || ""}, I'd love to learn more about your invention "${invention?.title}" on Invenity.`)}`;
      return;
    }
    if (owner?.whatsapp) {
      const num = owner.whatsapp.replace(/[^0-9]/g, "");
      window.open(`https://wa.me/${num}?text=${encodeURIComponent(`Hi! I'm interested in your invention "${invention?.title}" on Invenity.`)}`, "_blank");
      return;
    }
    toast.error("The inventor hasn't shared a contact yet.");
  };

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      setLoading(true);
      const { data: inv } = await supabase.from("inventions").select("*").eq("id", id).maybeSingle();

      if (!inv) {
        setInvention(null);
        setLoading(false);
        return;
      }

      setInvention(inv);

      const [{ data: profile }, { data: rel }] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", inv.user_id).maybeSingle(),
        supabase
          .from("inventions")
          .select("*")
          .eq("category", inv.category)
          .neq("id", inv.id)
          .order("created_at", { ascending: false })
          .limit(3),
      ]);

      setOwner(profile ?? null);
      setRelated(rel ?? []);
      setLoading(false);
    };

    void load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <main className="flex-1 px-4 py-10 md:px-6 md:py-16">
          <div className="mx-auto max-w-6xl space-y-6">
            <Skeleton className="h-10 w-56" />
            <Skeleton className="h-[340px] w-full rounded-3xl" />
            <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
              <Skeleton className="h-96 w-full rounded-3xl" />
              <Skeleton className="h-96 w-full rounded-3xl" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!invention) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <main className="flex-1 px-4 py-10 md:px-6 md:py-16">
          <div className="mx-auto max-w-3xl">
            <Card className="p-10 text-center">
              <Lightbulb className="mx-auto mb-4 h-14 w-14 text-primary" />
              <h1 className="text-3xl font-bold">Invention not found</h1>
              <p className="mt-3 text-muted-foreground">This invention may have been removed or the link is invalid.</p>
              <Button asChild className="mt-6 rounded-full">
                <Link to="/browse">Back to browse</Link>
              </Button>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1 px-4 py-10 md:px-6 md:py-16">
        <div className="mx-auto max-w-6xl">
          <Button asChild variant="ghost" className="mb-6 rounded-full px-0 text-muted-foreground hover:text-foreground">
            <Link to="/browse">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to browse
            </Link>
          </Button>

          <section className="overflow-hidden rounded-[2rem] border border-border/60 bg-gradient-hero p-6 md:p-10 relative animate-fade-in">
            <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl animate-blob" />
            <div className="grid items-center gap-8 lg:grid-cols-[1.15fr_0.85fr] relative">
              <div>
                <div className="mb-4 flex flex-wrap items-center gap-3">
                  <Badge className={`border ${statusLabel[invention.status]?.cls ?? ""}`}>
                    {statusLabel[invention.status]?.label ?? invention.status}
                  </Badge>
                  <span className="text-sm font-medium text-primary">{categoryLabel[invention.category]}</span>
                  {invention.location && (
                    <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" /> {invention.location}
                    </span>
                  )}
                </div>
                <h1 className="text-4xl font-bold leading-tight md:text-6xl gradient-text">{invention.title}</h1>
                <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">{invention.description}</p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Button asChild className="rounded-full glow-shadow">
                    <Link to="/network">Open The Network</Link>
                  </Button>
                  {canDelete && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="rounded-full">
                          <Trash2 className="mr-2 h-4 w-4" /> Delete invention
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete this invention?</AlertDialogTitle>
                          <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={deleteInvention}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>

              <div className="overflow-hidden rounded-[1.75rem] border border-border/60 bg-card">
                {invention.cover_image_url ? (
                  <img
                    src={invention.cover_image_url}
                    alt={invention.title}
                    className="aspect-[4/3] w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex aspect-[4/3] items-center justify-center bg-secondary/60">
                    <Lightbulb className="h-16 w-16 text-primary/60" />
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
            <div className="space-y-6">
              {invention.video_url && (
                <Card className="overflow-hidden p-0">
                  <div className="flex items-center gap-2 border-b border-border/60 px-6 py-4">
                    <Play className="h-4 w-4 text-primary" />
                    <h2 className="text-lg font-semibold">Demo video</h2>
                  </div>
                  <video src={invention.video_url} controls className="aspect-video w-full bg-secondary" />
                </Card>
              )}

              {invention.gallery_urls && invention.gallery_urls.length > 0 && (
                <Card className="p-6">
                  <h2 className="text-lg font-semibold">Gallery</h2>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    {invention.gallery_urls.map((url, index) => (
                      <img
                        key={`${url}-${index}`}
                        src={url}
                        alt={`${invention.title} gallery ${index + 1}`}
                        className="aspect-[4/3] w-full rounded-2xl object-cover"
                        loading="lazy"
                      />
                    ))}
                  </div>
                </Card>
              )}

              {isOwner ? (
                <Card className="p-6 md:p-8">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-2xl font-bold">Technical overview</h2>
                    <Badge variant="outline" className="border-success/40 bg-success/10 text-success">Owner view</Badge>
                  </div>
                  <div className="mt-6 grid gap-6 md:grid-cols-2">
                    <div>
                      <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">How it works</h3>
                      <p className="mt-2 leading-relaxed text-muted-foreground">{invention.technical_details || "Technical notes have not been added yet."}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Primary use case</h3>
                      <p className="mt-2 leading-relaxed text-muted-foreground">{invention.use_case || "No use case specified yet."}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Industrial application</h3>
                      <p className="mt-2 leading-relaxed text-muted-foreground">{invention.industrial_application || "No industrial application listed yet."}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Milestone</h3>
                      <p className="mt-2 leading-relaxed text-muted-foreground">{invention.current_milestone || "No current milestone shared yet."}</p>
                    </div>
                  </div>
                </Card>
              ) : (
                <Card className="relative overflow-hidden p-8 md:p-10 text-center border-primary/30">
                  <div className="absolute inset-0 bg-gradient-primary opacity-5 pointer-events-none" />
                  <div className="relative">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Lock className="h-6 w-6" />
                    </div>
                    <h2 className="text-2xl font-bold">Technical details are private</h2>
                    <p className="mt-3 mx-auto max-w-md text-muted-foreground">
                      Only the inventor can share how it works, use cases, and industrial applications. Request access from the owner to view full technical info.
                    </p>
                    <Button className="mt-6 rounded-full" onClick={requestAccess}>
                      <Lock className="mr-2 h-4 w-4" /> Request access
                    </Button>
                  </div>
                </Card>
              )}
            </div>

            <div className="space-y-6">
              <Card className="p-6">
                <div className="flex items-center gap-2 text-primary">
                  <ShieldCheck className="h-4 w-4" />
                  <span className="text-sm font-semibold uppercase tracking-[0.18em]">Inventor</span>
                </div>
                <h2 className="mt-3 text-2xl font-bold">{owner?.display_name || owner?.username || "Invenity creator"}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{owner?.bio || "This inventor is building in public on Invenity."}</p>
                <div className="mt-6 space-y-3 text-sm text-muted-foreground">
                  {owner?.location && <p>Location: {owner.location}</p>}
                  {invention.patent_status && <p>Patent: {invention.patent_status}</p>}
                  <p>Status: {statusLabel[invention.status]?.label ?? invention.status}</p>
                </div>
              </Card>

              <Card className="p-6">
                <h2 className="text-lg font-semibold">You might also like</h2>
                <div className="mt-4 space-y-4">
                  {related.length === 0 ? (
                    <p className="text-sm text-muted-foreground">More inventions in this category will appear here.</p>
                  ) : (
                    related.map((item) => (
                      <Link key={item.id} to={`/inventions/${item.id}`} className="block rounded-2xl border border-border/60 p-4 transition-smooth hover:border-primary/40 hover:bg-secondary/40">
                        <p className="text-xs font-medium text-primary">{categoryLabel[item.category]}</p>
                        <h3 className="mt-1 font-semibold">{item.title}</h3>
                        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                      </Link>
                    ))
                  )}
                </div>
              </Card>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}