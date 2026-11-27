import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, MapPin, Eye, Lightbulb, Users } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetchInventions, type Invention } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

const categories = [
  { value: "all", label: "All" },
  { value: "clean_energy", label: "Clean Energy" },
  { value: "biotech", label: "BioTech" },
  { value: "infrastructure", label: "Infrastructure" },
  { value: "consumer_goods", label: "Consumer Goods" },
  { value: "agriculture", label: "Agriculture" },
  { value: "health_tech", label: "Health Tech" },
  { value: "ai_software", label: "AI / Software" },
  { value: "transportation", label: "Transportation" },
];

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

export default function Browse() {
  const [inventions, setInventions] = useState<Invention[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const rows = await fetchInventions({ category: activeCategory });
        if (!cancelled) setInventions(rows);
      } catch {
        if (!cancelled) setInventions([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeCategory]);

  const filtered = inventions.filter(
    (i) =>
      !search ||
      i.title.toLowerCase().includes(search.toLowerCase()) ||
      i.description.toLowerCase().includes(search.toLowerCase()) ||
      (i.author?.display_name ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="relative flex-1 px-4 py-10 md:px-6 md:py-16">
        <div className="absolute inset-0 bg-gradient-mesh opacity-40 pointer-events-none" />
        <div className="relative mx-auto max-w-7xl">
          <div className="animate-rise mb-8">
            <h1 className="text-3xl font-bold md:text-5xl gradient-text">Browse Inventions</h1>
            <p className="mt-2 max-w-2xl text-lg text-muted-foreground">
              Explore groundbreaking ideas and connect directly with their creators.
            </p>
          </div>

          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search inventions or inventors…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-14 rounded-2xl border-accent/25 bg-card/70 pl-12 text-base backdrop-blur-md transition-smooth focus-visible:border-accent"
            />
          </div>

          <div className="mb-8 flex flex-wrap gap-2">
            {categories.map((c) => (
              <Button
                key={c.value}
                variant={activeCategory === c.value ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveCategory(c.value)}
                className={`rounded-full ${
                  activeCategory === c.value
                    ? "bg-gradient-primary glow-shadow"
                    : "border-border/60 hover:border-accent/50 hover:text-accent"
                }`}
              >
                {c.label}
              </Button>
            ))}
          </div>

          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-80 rounded-2xl" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <Card className="glass-strong p-16 text-center">
              <Lightbulb className="mx-auto mb-4 h-14 w-14 text-accent/70" />
              <h3 className="mb-2 text-xl font-semibold">No inventions yet</h3>
              <p className="mb-6 text-muted-foreground">
                Be the first to share an idea with the community.
              </p>
              <Button asChild className="btn-shine rounded-full bg-gradient-primary">
                <Link to="/post">Post an idea</Link>
              </Button>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((inv, idx) => (
                <Link
                  to={`/inventions/${inv.id}`}
                  key={inv.id}
                  className="animate-rise"
                  style={{ animationDelay: `${Math.min(idx * 70, 700)}ms` }}
                >
                  <Card className="card-lift group h-full cursor-pointer overflow-hidden bg-card/70 backdrop-blur-sm">
                    <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-primary/10 via-secondary to-accent/10">
                      {inv.cover_image_url ? (
                        <img
                          src={inv.cover_image_url}
                          alt={inv.title}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Lightbulb className="h-16 w-16 text-accent/30" />
                        </div>
                      )}
                      <Badge
                        className={`absolute left-3 top-3 border backdrop-blur-sm ${statusLabel[inv.status]?.cls ?? ""}`}
                      >
                        {statusLabel[inv.status]?.label ?? inv.status}
                      </Badge>
                    </div>
                    <div className="p-5">
                      <div className="mb-1 text-xs font-semibold uppercase tracking-wider gold-text">
                        {categoryLabel[inv.category] ?? inv.category}
                      </div>
                      <h3 className="mb-2 line-clamp-1 text-lg font-bold transition-smooth group-hover:text-accent">
                        {inv.title}
                      </h3>
                      <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">{inv.description}</p>
                      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                        <span className="inline-flex min-w-0 items-center gap-1">
                          <Users className="h-3 w-3 shrink-0" />
                          <span className="truncate">{inv.author?.display_name || inv.author?.username || "Invenity creator"}</span>
                        </span>
                        <span className="flex items-center gap-3">
                          {inv.location && (
                            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{inv.location}</span>
                          )}
                          <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{inv.views}</span>
                        </span>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
