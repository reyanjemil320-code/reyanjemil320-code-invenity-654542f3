import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MessageSquare, Send } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

/** Direct messages arrive with the Network update; inbox shows a pre-launch state. */
export default function Inbox() {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <MessageSquare className="text-accent h-12 w-12" />
        <h2 className="text-xl font-bold">Sign in to see your inbox</h2>
        <Button onClick={() => navigate("/auth")} className="rounded-full bg-gradient-primary">
          Sign in
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6">
      <div className="animate-rise mb-5">
        <h1 className="text-2xl font-bold">Inbox</h1>
        <p className="text-sm text-muted-foreground">Direct messages with the network.</p>
      </div>

      <Card className="glass-strong card-lift p-10 text-center">
        <div className="animate-antigravity mx-auto mb-4 w-fit">
          <div className="glow-gold mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border border-accent/40 bg-accent/10">
            <Send className="text-accent h-8 w-8" />
          </div>
        </div>
        <h2 className="mb-2 text-xl font-bold">
          Messages unlock with the <span className="gold-text">Network update</span>
        </h2>
        <p className="mx-auto max-w-sm text-sm text-muted-foreground">
          Conversations between inventors are being re-built on the new database.
          Your inbox will be waiting right here.
        </p>
      </Card>
    </div>
  );
}
