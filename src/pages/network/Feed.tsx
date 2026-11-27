import { Link } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Heart, Image as ImageIcon, Lightbulb, Rocket, Send } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

/**
 * The Network feed goes live with the Turso-backed social tables
 * (posts, comments, likes). Until then: a graceful pre-launch state
 * with zero dead Supabase calls.
 */
export default function Feed() {
  const { user } = useAuth();

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6">
      <Card className="glass-strong animate-rise mb-6 p-5">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10 border border-accent/30">
            <AvatarFallback className="bg-primary/10 font-bold text-primary">
              {(user?.email || "U").slice(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <Textarea
              disabled
              placeholder="The feed opens for posting with the Network update…"
              className="min-h-20 cursor-not-allowed resize-none rounded-2xl border-border/60 opacity-70"
            />
            <div className="mt-3 flex items-center justify-between gap-3">
              <label className="inline-flex cursor-not-allowed items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground opacity-60">
                <ImageIcon className="h-3.5 w-3.5" />
                Photo
              </label>
              <Button disabled size="sm" className="rounded-full">
                <Send className="mr-2 h-3.5 w-3.5" />
                Post
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <Card className="glass-strong card-lift animate-rise p-10 text-center">
        <div className="animate-antigravity mx-auto mb-4 w-fit">
          <div className="glow-gold mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border border-accent/40 bg-accent/10">
            <Rocket className="text-accent h-8 w-8" />
          </div>
        </div>
        <h2 className="mb-2 text-xl font-bold">
          The feed lights up <span className="gold-text">very soon</span>
        </h2>
        <p className="mx-auto max-w-sm text-sm text-muted-foreground">
          Posts, comments, and likes are being re-built on our new database after the migration.
          Meanwhile — showcase a real invention or explore what others are building.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button asChild className="btn-shine rounded-full bg-gradient-primary">
            <Link to="/post">
              <Lightbulb className="mr-2 h-4 w-4" /> Post an invention
            </Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full border-accent/40 hover:border-accent hover:text-accent">
            <Link to="/browse">Browse inventions</Link>
          </Button>
        </div>
        <div className="mt-8 flex items-center justify-center gap-6 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1"><Heart className="h-3 w-3" /> 0 posts</span>
          <span>·</span>
          <span>Be among the first when it opens</span>
        </div>
      </Card>
    </div>
  );
}
