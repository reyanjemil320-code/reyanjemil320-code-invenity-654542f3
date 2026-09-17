import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, MapPin, Eye, ShieldCheck, Lightbulb } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
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
  const [inventions, setInventions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  useEffect(() => {
    (async () => {
      setLoading(true);
      let q = supabase.from("inventions").select("*").order("created_at", { ascending: false });
      if (activeCategory !== "all") q = q.eq("category", activeCategory as any);
      const { data, error } = await q;
      if (!error && data) setInventions(data);
      setLoading(false);
    })();
  }, [activeCategory]);

  const filtered = inventions.filter((i) =>
    !search ||
    i.title.toLowerCase().includes(search.toLowerCase()) ||
    i.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1 px-4 py-10 md:px-6 md:py-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 animate-fade-in">
            <h1 className="text-3xl font-bold md:text-5xl gradient-text">Browse Inventions</h1>
            <p className="mt-2 text-muted-foreground text-lg max-w-2xl">
              Explore groundbreaking ideas and connect directly with their creators.
            </p>
          </div>

          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search inventions…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 h-14 rounded-2xl text-base"
            />
          </div>

          <div className="flex flex-wrap gap-2 mb-8">
            {categories.map((c) => (
              <Button
                key={c.value}
                variant={activeCategory === c.value ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveCategory(c.value)}
                className="rounded-full"
              >
                {c.label}
              </Button>
            ))}
          </div>

          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-80 rounded-2xl" />)}
            </div>
          ) : filtered.length === 0 ? (
            <Card className="p-16 text-center">
              <Lightbulb className="mx-auto h-14 w-14 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No inventions yet</h3>
              <p className="text-muted-foreground mb-6">Be the first to share an idea with the community.</p>
              <Button asChild>
                <Link to="/post">Post an idea</Link>
              </Button>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((inv, idx) => (
                <Link to={`/inventions/${inv.id}`} key={inv.id} className="animate-fade-in" style={{ animationDelay: `${Math.min(idx * 60, 600)}ms`, animationFillMode: "backwards" }}>
                  <Card className="overflow-hidden h-full hover:border-primary/50 hover-lift transition-smooth group cursor-pointer">
                    <div className="aspect-video bg-gradient-to-br from-primary/5 to-primary/10 relative overflow-hidden">
                      {inv.cover_image_url ? (
                        <img src={inv.cover_image_url} alt={inv.title} className="w-full h-full object-cover group-hover:scale-105 transition-smooth" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Lightbulb className="h-16 w-16 text-primary/40" />
                        </div>
                      )}
                      <Badge className={`absolute top-3 left-3 border ${statusLabel[inv.status]?.cls || ""}`}>
                        {statusLabel[inv.status]?.label || inv.status}
                      </Badge>
                      <div className="absolute top-3 right-3">
                        <ShieldCheck className="h-5 w-5 text-primary/80" />
                      </div>
                    </div>
                    <div className="p-5">
                      <div className="text-xs font-medium text-primary mb-1">{categoryLabel[inv.category]}</div>
                      <h3 className="font-bold text-lg mb-2 line-clamp-1 group-hover:text-primary transition-smooth">{inv.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{inv.description}</p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        {inv.location && (
                          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{inv.location}</span>
                        )}
                        <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{inv.views || 0}</span>
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
