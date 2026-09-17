import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Post = Tables<"posts">;
type Reel = Tables<"reels">;

export default function Explore() {
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);
  const [reels, setReels] = useState<Reel[]>([]);

  useEffect(() => {
    const load = async () => {
      const [p, r] = await Promise.all([
        supabase
          .from("posts")
          .select("*")
          .not("image_url", "is", null)
          .order("created_at", { ascending: false })
          .limit(30),
        supabase.from("reels").select("*").order("created_at", { ascending: false }).limit(30),
      ]);
      setPosts(p.data ?? []);
      setReels(r.data ?? []);
      setLoading(false);
    };
    void load();
  }, []);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6">
      <div className="mb-6 flex items-center gap-3">
        <Sparkles className="h-5 w-5 text-primary" />
        <h1 className="text-2xl font-bold">Explore</h1>
      </div>

      {loading ? (
        <div className="grid grid-cols-3 gap-1 md:gap-2">
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-1 md:gap-2">
          {reels.map((reel) => (
            <Link
              key={`r-${reel.id}`}
              to="/network/spark"
              className="group relative block aspect-square overflow-hidden bg-secondary"
            >
              <video
                src={reel.video_url}
                className="h-full w-full object-cover transition-smooth group-hover:scale-105"
                muted
                playsInline
              />
              <span className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white">
                Spark
              </span>
            </Link>
          ))}
          {posts.map((post) =>
            post.image_url ? (
              <div
                key={`p-${post.id}`}
                className="group relative block aspect-square overflow-hidden bg-secondary"
              >
                <img
                  src={post.image_url}
                  alt="Post"
                  className="h-full w-full object-cover transition-smooth group-hover:scale-105"
                  loading="lazy"
                />
              </div>
            ) : null,
          )}
          {posts.length === 0 && reels.length === 0 && (
            <Card className="col-span-3 p-10 text-center text-muted-foreground">
              Nothing to explore yet — check back soon.
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
