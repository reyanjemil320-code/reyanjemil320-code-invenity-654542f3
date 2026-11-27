import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Flame, Loader2, Trophy, Vote, Crown } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchAuth, fetchInventions, fetchVotesTally, type Invention } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type Matchup = {
  left: Invention;
  right: Invention;
};

export default function SparkArena() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [inventions, setInventions] = useState<Invention[]>([]);
  const [tally, setTally] = useState<Record<string, number>>({});
  const [matchIndex, setMatchIndex] = useState(0);

  const load = async () => {
    setLoading(true);
    try {
      const [rows, votes] = await Promise.all([
        fetchInventions({ limit: 20, sort: "views" }),
        fetchVotesTally(),
      ]);
      setInventions(rows);
      setTally(votes);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load the arena.");
      setInventions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const matchups = useMemo<Matchup[]>(() => {
    const items: Matchup[] = [];
    for (let i = 0; i < inventions.length - 1; i += 2) {
      items.push({ left: inventions[i], right: inventions[i + 1] });
    }
    return items;
  }, [inventions]);

  const leaderboard = useMemo(() => {
    return [...inventions]
      .map((item) => ({ item, score: tally[item.id] ?? 0 }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);
  }, [inventions, tally]);

  const activeMatch = matchups[matchIndex] ?? null;

  const castVote = async (winner: Invention, loser: Invention) => {
    if (!user) {
      toast.error("Sign in to vote.");
      return;
    }

    setSubmitting(winner.id);
    try {
      await fetchAuth("/api/votes-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invention_id: winner.id, opponent_id: loser.id }),
      });
      setTally((prev) => ({ ...prev, [winner.id]: (prev[winner.id] ?? 0) + 1 }));
      setMatchIndex((prev) => (matchups.length > 1 ? (prev + 1) % matchups.length : 0));
      toast.success("Vote counted.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not record the vote.");
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="relative flex-1 px-4 py-8 md:px-6 md:py-12">
        <div className="bg-gradient-mesh pointer-events-none absolute inset-0 opacity-50" />
        <div className="relative mx-auto max-w-7xl">
          <section className="animate-rise relative mb-8 overflow-hidden rounded-[2rem] border border-accent/20 bg-gradient-hero p-6 md:p-10">
            <div className="starfield pointer-events-none absolute inset-0 opacity-50" />
            <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-accent/15 blur-3xl animate-blob" />
            <Badge className="gold-text mb-4 rounded-full border border-accent/40 bg-accent/10 px-4 py-1">SPARK ARENA</Badge>
            <h1 className="gradient-text text-4xl font-bold md:text-6xl">Let the community decide what sparks hardest.</h1>
            <p className="mt-4 max-w-3xl text-lg text-muted-foreground">
              Vote on invention matchups and watch the leaderboard reshape in real time as the strongest ideas rise.
            </p>
          </section>

          <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
            <Card className="glass-strong card-lift p-6 md:p-8">
              <div className="mb-6 flex items-center gap-3">
                <Flame className="text-accent h-5 w-5" />
                <h2 className="text-2xl font-bold">Current matchup</h2>
              </div>

              {loading ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <Skeleton className="h-[360px] rounded-[1.5rem]" />
                  <Skeleton className="h-[360px] rounded-[1.5rem]" />
                </div>
              ) : !activeMatch ? (
                <div className="rounded-[1.5rem] border border-border/60 p-10 text-center">
                  <Vote className="text-accent mx-auto h-12 w-12" />
                  <h3 className="mt-4 text-xl font-bold">Need more inventions</h3>
                  <p className="mt-2 text-muted-foreground">Post at least two inventions to start voting battles.</p>
                  <Button asChild className="btn-shine mt-6 rounded-full bg-gradient-primary">
                    <Link to="/post">Post an invention</Link>
                  </Button>
                </div>
              ) : (
                <div className="relative grid gap-4 lg:grid-cols-2 lg:items-stretch">
                  <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 hidden -translate-x-1/2 -translate-y-1/2 lg:block">
                    <div className="gold-text rounded-full border border-accent/30 bg-background px-4 py-2 text-sm font-bold glow-gold">VS</div>
                  </div>
                  {[activeMatch.left, activeMatch.right].map((item, index) => {
                    const opponent = index === 0 ? activeMatch.right : activeMatch.left;
                    return (
                      <Card key={item.id} className="card-lift flex flex-col overflow-hidden rounded-[1.5rem] border border-border/60 p-0">
                        {item.cover_image_url ? (
                          <img src={item.cover_image_url} alt={item.title} className="aspect-[4/3] w-full object-cover" loading="lazy" />
                        ) : (
                          <div className="flex aspect-[4/3] items-center justify-center bg-secondary/50">
                            <Flame className="text-accent/60 h-12 w-12" />
                          </div>
                        )}
                        <div className="flex flex-1 flex-col p-5 md:p-6">
                          <p className="gold-text text-xs font-medium uppercase tracking-[0.18em]">{item.category.replace(/_/g, " ")}</p>
                          <h3 className="mt-2 line-clamp-2 text-xl font-bold md:text-2xl">{item.title}</h3>
                          <p className="mt-3 line-clamp-3 flex-1 text-sm text-muted-foreground">{item.description}</p>
                          <div className="mt-5 flex flex-wrap gap-2">
                            <Button
                              onClick={() => castVote(item, opponent)}
                              disabled={submitting === item.id}
                              size="sm"
                              className="btn-shine rounded-full bg-gradient-gold text-[hsl(228_60%_6%)] hover:opacity-90"
                            >
                              {submitting === item.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trophy className="mr-2 h-4 w-4" />}
                              Vote
                            </Button>
                            <Button asChild size="sm" variant="outline" className="rounded-full border-accent/40 hover:border-accent hover:text-accent">
                              <Link to={`/inventions/${item.id}`}>Details</Link>
                            </Button>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </Card>

            <Card className="glass-strong card-lift p-6">
              <div className="flex items-center gap-3">
                <Trophy className="text-accent h-5 w-5" />
                <h2 className="text-xl font-bold">Leaderboard</h2>
              </div>
              <div className="mt-5 space-y-3">
                {loading ? (
                  Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-20 rounded-2xl" />)
                ) : leaderboard.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Votes will appear here once the first matchup is decided.</p>
                ) : (
                  leaderboard.map(({ item, score }, index) => (
                    <Link key={item.id} to={`/inventions/${item.id}`} className="transition-smooth flex items-center gap-4 rounded-2xl border border-border/60 p-4 hover:border-accent/40 hover:bg-secondary/30">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-full font-bold ${
                        index === 0
                          ? "gold-text border border-accent/40 bg-accent/15 glow-gold"
                          : "bg-primary/10 text-primary"
                      }`}>
                        {index === 0 ? <Crown className="h-4 w-4" /> : index + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{item.title}</p>
                        <p className="text-sm text-muted-foreground">{score} vote{score === 1 ? "" : "s"}</p>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
