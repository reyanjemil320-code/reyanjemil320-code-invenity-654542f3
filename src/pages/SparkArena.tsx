import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Flame, Loader2, Trophy, Vote } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type Invention = Tables<"inventions">;
type VoteRow = Tables<"votes">;

type Matchup = {
  left: Invention;
  right: Invention;
};

export default function SparkArena() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [inventions, setInventions] = useState<Invention[]>([]);
  const [votes, setVotes] = useState<VoteRow[]>([]);
  const [matchIndex, setMatchIndex] = useState(0);

  const load = async () => {
    setLoading(true);
    const [invRes, voteRes] = await Promise.all([
      supabase.from("inventions").select("*").order("created_at", { ascending: false }).limit(20),
      supabase.from("votes").select("*"),
    ]);
    setInventions(invRes.data ?? []);
    setVotes(voteRes.data ?? []);
    setLoading(false);
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
    const scoreMap = new Map<string, number>();
    inventions.forEach((item) => scoreMap.set(item.id, 0));
    votes.forEach((vote) => {
      scoreMap.set(vote.invention_id, (scoreMap.get(vote.invention_id) ?? 0) + 1);
    });

    return [...inventions]
      .map((item) => ({ item, score: scoreMap.get(item.id) ?? 0 }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);
  }, [inventions, votes]);

  const activeMatch = matchups[matchIndex] ?? null;

  const castVote = async (winner: Invention, loser: Invention) => {
    if (!user) {
      toast.error("Sign in to vote.");
      return;
    }

    const duplicate = votes.some(
      (vote) =>
        vote.user_id === user.id &&
        ((vote.invention_id === winner.id && vote.opponent_id === loser.id) ||
          (vote.invention_id === loser.id && vote.opponent_id === winner.id)),
    );

    if (duplicate) {
      toast.error("You already voted on this matchup.");
      return;
    }

    setSubmitting(winner.id);
    const { error, data } = await supabase
      .from("votes")
      .insert({ user_id: user.id, invention_id: winner.id, opponent_id: loser.id })
      .select()
      .maybeSingle();
    setSubmitting(null);

    if (error) {
      toast.error(error.message);
      return;
    }

    if (data) setVotes((prev) => [data, ...prev]);
    setMatchIndex((prev) => (matchups.length > 1 ? (prev + 1) % matchups.length : 0));
    toast.success("Vote counted.");
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1 px-4 py-8 md:px-6 md:py-12">
        <div className="mx-auto max-w-7xl">
          <section className="mb-8 rounded-[2rem] border border-border/60 bg-gradient-hero p-6 md:p-10 relative overflow-hidden animate-fade-in">
            <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-primary/20 blur-3xl animate-blob" />
            <Badge className="mb-4 rounded-full border-primary/20 bg-primary/10 px-4 py-1 text-primary">Spark Arena</Badge>
            <h1 className="text-4xl font-bold md:text-6xl gradient-text">Let the community decide what sparks hardest.</h1>
            <p className="mt-4 max-w-3xl text-lg text-muted-foreground">
              Vote on invention matchups and watch the leaderboard reshape in real time as the strongest ideas rise.
            </p>
          </section>

          <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
            <Card className="p-6 md:p-8">
              <div className="mb-6 flex items-center gap-3">
                <Flame className="h-5 w-5 text-primary" />
                <h2 className="text-2xl font-bold">Current matchup</h2>
              </div>

              {loading ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <Skeleton className="h-[360px] rounded-[1.5rem]" />
                  <Skeleton className="h-[360px] rounded-[1.5rem]" />
                </div>
              ) : !activeMatch ? (
                <div className="rounded-[1.5rem] border border-border/60 p-10 text-center">
                  <Vote className="mx-auto h-12 w-12 text-primary" />
                  <h3 className="mt-4 text-xl font-bold">Need more inventions</h3>
                  <p className="mt-2 text-muted-foreground">Post at least two inventions to start voting battles.</p>
                  <Button asChild className="mt-6 rounded-full">
                    <Link to="/post">Post an invention</Link>
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4 lg:grid-cols-2 lg:items-stretch relative">
                  <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 hidden -translate-x-1/2 -translate-y-1/2 lg:block">
                    <div className="rounded-full border border-primary/20 bg-background px-4 py-2 text-sm font-bold text-primary shadow-lg">VS</div>
                  </div>
                  {[activeMatch.left, activeMatch.right].map((item, index) => {
                    const opponent = index === 0 ? activeMatch.right : activeMatch.left;
                    return (
                      <Card key={item.id} className="overflow-hidden rounded-[1.5rem] border border-border/60 p-0 flex flex-col">
                        {item.cover_image_url ? (
                          <img src={item.cover_image_url} alt={item.title} className="aspect-[4/3] w-full object-cover" loading="lazy" />
                        ) : (
                          <div className="flex aspect-[4/3] items-center justify-center bg-secondary/50">
                            <Flame className="h-12 w-12 text-primary/60" />
                          </div>
                        )}
                        <div className="p-5 md:p-6 flex flex-col flex-1">
                          <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">{item.category.replace(/_/g, " ")}</p>
                          <h3 className="mt-2 text-xl md:text-2xl font-bold line-clamp-2">{item.title}</h3>
                          <p className="mt-3 text-sm text-muted-foreground line-clamp-3 flex-1">{item.description}</p>
                          <div className="mt-5 flex flex-wrap gap-2">
                            <Button onClick={() => castVote(item, opponent)} disabled={submitting === item.id} size="sm" className="rounded-full">
                              {submitting === item.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trophy className="mr-2 h-4 w-4" />}
                              Vote
                            </Button>
                            <Button asChild size="sm" variant="outline" className="rounded-full">
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

            <Card className="p-6">
              <div className="flex items-center gap-3">
                <Trophy className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-bold">Leaderboard</h2>
              </div>
              <div className="mt-5 space-y-3">
                {loading ? (
                  Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-20 rounded-2xl" />)
                ) : leaderboard.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Votes will appear here once the first matchup is decided.</p>
                ) : (
                  leaderboard.map(({ item, score }, index) => (
                    <Link key={item.id} to={`/inventions/${item.id}`} className="flex items-center gap-4 rounded-2xl border border-border/60 p-4 transition-smooth hover:border-primary/40 hover:bg-secondary/30">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">{index + 1}</div>
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