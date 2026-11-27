import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Flame, Lightbulb, Upload } from "lucide-react";

/** Vertical video sparks go live with the Network update (reels table + media storage). */
export default function Spark() {
  return (
    <div className="relative h-[calc(100vh-4rem-4rem)] md:h-[calc(100vh-4rem)]">
      <div className="absolute right-4 top-4 z-20">
        <Button size="icon" variant="secondary" className="cursor-not-allowed rounded-full opacity-60" disabled aria-label="Upload coming soon">
          <Upload className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex h-full snap-y snap-mandatory items-center justify-center overflow-y-scroll bg-black/90 px-4">
        <Card className="glass-strong card-lift max-w-md p-10 text-center">
          <div className="animate-antigravity mx-auto mb-4 w-fit">
            <div className="glow-gold mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border border-accent/40 bg-accent/10">
              <Flame className="text-accent h-8 w-8" />
            </div>
          </div>
          <h2 className="mb-2 text-xl font-bold text-white">
            Sparks drop with the <span className="gold-text">Network update</span>
          </h2>
          <p className="mx-auto max-w-sm text-sm text-muted-foreground">
            Short demo videos from inventors will stream here once video hosting lands.
            Until then, post your invention with photos.
          </p>
          <Button asChild className="btn-shine mt-6 rounded-full bg-gradient-primary">
            <Link to="/post">
              <Lightbulb className="mr-2 h-4 w-4" /> Post an invention
            </Link>
          </Button>
        </Card>
      </div>
    </div>
  );
}
