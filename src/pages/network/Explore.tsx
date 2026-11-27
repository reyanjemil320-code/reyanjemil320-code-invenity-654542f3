import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Compass, Lightbulb } from "lucide-react";

/** Visual explore grid goes live with the Network update (reels + post media). */
export default function Explore() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6">
      <div className="animate-rise mb-6 flex items-center gap-3">
        <Compass className="text-accent h-5 w-5" />
        <h1 className="text-2xl font-bold">Explore</h1>
      </div>

      <Card className="glass-strong card-lift animate-rise p-10 text-center">
        <div className="animate-antigravity mx-auto mb-4 w-fit">
          <div className="glow-gold mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border border-accent/40 bg-accent/10">
            <Compass className="text-accent h-8 w-8" />
          </div>
        </div>
        <h2 className="mb-2 text-xl font-bold">
          The visual wall is <span className="gold-text">coming soon</span>
        </h2>
        <p className="mx-auto max-w-sm text-sm text-muted-foreground">
          Photo posts and demo reels from across the network will fill this wall once the
          Network update lands.
        </p>
        <Button asChild className="btn-shine mt-6 rounded-full bg-gradient-primary">
          <Link to="/browse">
            <Lightbulb className="mr-2 h-4 w-4" /> Browse inventions meanwhile
          </Link>
        </Button>
      </Card>
    </div>
  );
}
