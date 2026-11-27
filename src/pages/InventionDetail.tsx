import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Lightbulb, Lock, MapPin, Play, Eye, Trash2 } from "lucide-react";
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
import { fetchAuth, fetchInvention, type InventionDetail } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

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
  const [data, setData] = useState<InventionDetail | null>(null);
  const [deleting, setDeleting] = useState(false);

  const invention = data?.invention ?? null;
  const owner = data?.author ?? null;
  const related = data?.related ?? [];
  const isOwner = !!user && !!invention && user.id === invention.user_id;
  const canDelete = isOwner || isAdmin;

  const deleteInvention = async () => {
    if (!invention || deleting) return;
    setDeleting(true);
    try {
      await fetchAuth(`/api/inventions-delete?id=${encodeURIComponent(invention.id)}`, { method: "DELETE" });
      toast.success("Invention deleted.");
      navigate("/browse");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete the invention.");
      setDeleting(false);
    }
  };

  const requestAccess = () => {
    if (!user) {
      toast.error("Sign in to request access.");
      return;
    }
    if (owner?.whatsapp) {
      const num = owner.whatsapp.replace(/[^0-9]/g, "");
      window.open(`https://wa.me/${num}?text=${encodeURIComponent(`Hi! I'm interested in your invention "${invention?.title}" on Invenity.`)}`, "_blank");
      return;
    }
    const subject = encodeURIComponent(`Access request: ${invention?.title}`);
    window.location.href = `mailto:?subject=${subject}&body=${encodeURIComponent("I'd like to learn more about this invention on Invenity.")}`;
  };

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetchInvention(id);
        if (!cancelled) setData(res);
      } catch {
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
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
            <Card className="glass-strong p-10 text-center">
              <Lightbulb className="text-accent mx-auto mb-4 h-14 w-14" />
              <h1 className="text-3xl font-bold">Invention not found</h1>
              <p className="mt-3 text-muted-foreground">This invention may have been removed or the link is invalid.</p>
              <Button asChild className="mt-6 rounded-full bg-gradient-primary">
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
      <main className="relative flex-1 px-4 py-10 md:px-6 md:py-16">
        <div className="bg-gradient-mesh pointer-events-none absolute inset-0 opacity-40" />
        <div className="relative mx-auto max-w-6xl">
          <Button asChild variant="ghost" className="mb-6 rounded-full px-0 text-muted-foreground hover:text-accent">
            <Link to="/browse">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to browse
            </Link>
          </Button>

          <section className="animate-rise relative overflow-hidden rounded-[2rem] border border-accent/20 bg-gradient-hero p-6 md:p-10">
            <div className="starfield pointer-events-none absolute inset-0 opacity-40" />
            <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-accent/15 blur-3xl animate-blob" />
            <div className="relative grid items-center gap-8 lg:grid-cols-[1.15fr_0.85fr]">
              <div>
                <div className="mb-4 flex flex-wrap items-center gap-3">
                  <Badge className={`border ${statusLabel[invention.status]?.cls ?? ""}`}>
                    {statusLabel[invention.status]?.label ?? invention.status}
                  </Badge>
                  <span className="gold-text text-sm font-semibold uppercase tracking-wider">{categoryLabel[invention.category]}</span>
                  {invention.location && (
                    <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" /> {invention.location}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                    <Eye className="h-4 w-4" /> {invention.views} views
                  </span>
                </div>
                <h1 className="gradient-text text-4xl font-bold leading-tight md:text-6xl">{invention.title}</h1>
                <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">{invention.description}</p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Button asChild className="btn-shine rounded-full bg-gradient-primary glow-shadow">
                    <Link to="/network">Open The Network</Link>
                  </Button>
                  {canDelete && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="rounded-full" disabled={deleting}>
                          <Trash2 className="mr-2 h-4 w-4" /> Delete invention
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="glass-strong">
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

              <div className="card-lift overflow-hidden rounded-[1.75rem] border border-border/60 bg-card">
                {invention.cover_image_url ? (
                  <img
                    src={invention.cover_image_url}
                    alt={invention.title}
                    className="aspect-[4/3] w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex aspect-[4/3] items-center justify-center bg-secondary/60">
                    <Lightbulb className="text-accent/60 h-16 w-16" />
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
            <div className="space-y-6">
              {invention.video_url && (
                <Card className="card-lift overflow-hidden p-0">
                  <div className="flex items-center gap-2 border-b border-border/60 px-6 py-4">
                    <Play className="h-4 w-4 text-accent" />
                    <h2 className="text-lg font-semibold">Demo video</h2>
                  </div>
                  {invention.video_url.match(/\.(mp4|webm|ogg)(\?.*)?$/i) ? (
                    <video src={invention.video_url} controls className="aspect-video w-full bg-secondary" />
                  ) : (
                    <div className="px-6 py-8">
                      <a
                        href={invention.video_url}
                        target="_blank"
                        rel="noreferrer"
                        className="link-gold break-all text-accent"
                      >
                        {invention.video_url}
                      </a>
                    </div>
                  )}
                </Card>
              )}

              {invention.gallery_urls.length > 0 && (
                <Card className="card-lift p-6">
                  <h2 className="text-lg font-semibold">Gallery</h2>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    {invention.gallery_urls.map((url, index) => (
                      <img
                        key={`${url.slice(-16)}-${index}`}
                        src={url}
                        alt={`${invention.title} gallery ${index + 1}`}
                        className="aspect-[4/3] w-full rounded-2xl object-cover transition-smooth hover:scale-[1.02]"
                        loading="lazy"
                      />
                    ))}
                  </div>
                </Card>
              )}

              {isOwner ? (
                <Card className="card-lift p-6 md:p-8">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-2xl font-bold">Technical overview</h2>
                    <Badge variant="outline" className="border-success/40 bg-success/10 text-success">Owner view</Badge>
                  </div>
                  <div className="mt-6 grid gap-6 md:grid-cols-2">
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-accent/80">How it works</h3>
                      <p className="mt-2 leading-relaxed text-muted-foreground">{invention.technical_details || "Technical notes have not been added yet."}</p>
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-accent/80">Primary use case</h3>
                      <p className="mt-2 leading-relaxed text-muted-foreground">{invention.use_case || "No use case specified yet."}</p>
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-accent/80">Industrial application</h3>
                      <p className="mt-2 leading-relaxed text-muted-foreground">{invention.industrial_application || "No industrial application listed yet."}</p>
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-accent/80">Milestone</h3>
                      <p className="mt-2 leading-relaxed text-muted-foreground">{invention.current_milestone || "No current milestone shared yet."}</p>
                    </div>
                  </div>
                </Card>
              ) : (
                <Card className="relative overflow-hidden p-8 text-center md:p-10 border-accent/25">
                  <div className="pointer-events-none absolute inset-0 bg-gradient-gold opacity-[0.05]" />
                  <div className="relative">
                    <div className="glow-gold mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-accent/40 bg-accent/10 text-accent">
                      <Lock className="h-6 w-6" />
                    </div>
                    <h2 className="text-2xl font-bold">Technical details are private</h2>
                    <p className="mx-auto mt-3 max-w-md text-muted-foreground">
                      Only the inventor can share how it works, use cases, and industrial applications. Request access from the owner to view full technical info.
                    </p>
                    <Button className="btn-shine mt-6 rounded-full bg-gradient-gold text-[hsl(228_60%_6%)]" onClick={requestAccess}>
                      <Lock className="mr-2 h-4 w-4" /> Request access
                    </Button>
                  </div>
                </Card>
              )}
            </div>

            <div className="space-y-6">
              <Card className="card-lift p-6">
                <div className="gold-text flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em]">
                  Inventor
                </div>
                <h2 className="mt-3 text-2xl font-bold">{owner?.display_name || owner?.username || "Invenity creator"}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{owner?.bio || "This inventor is building in public on Invenity."}</p>
                <div className="mt-6 space-y-3 text-sm text-muted-foreground">
                  {owner?.location && <p>Location: {owner.location}</p>}
                  {invention.patent_status && <p>Patent: {invention.patent_status}</p>}
                  <p>Status: {statusLabel[invention.status]?.label ?? invention.status}</p>
                </div>
              </Card>

              <Card className="card-lift p-6">
                <h2 className="text-lg font-semibold">You might also like</h2>
                <div className="mt-4 space-y-4">
                  {related.length === 0 ? (
                    <p className="text-sm text-muted-foreground">More inventions in this category will appear here.</p>
                  ) : (
                    related.map((item) => (
                      <Link key={item.id} to={`/inventions/${item.id}`} className="transition-smooth block rounded-2xl border border-border/60 p-4 hover:border-accent/40 hover:bg-secondary/40">
                        <p className="gold-text text-xs font-medium">{categoryLabel[item.category] ?? item.category}</p>
                        <h3 className="mt-1 font-semibold">{item.title}</h3>
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.description}</p>
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
