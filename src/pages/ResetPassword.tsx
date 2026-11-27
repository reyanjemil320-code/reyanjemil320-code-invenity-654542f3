import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/Logo";
import { Lock, Mail } from "lucide-react";
import { toast } from "sonner";

export default function ResetPassword() {
  const navigate = useNavigate();

  const copyNote = async () => {
    const text = "Password reset request for my Invenity account";
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Note copied — send it to the team and we'll reset it for you.");
    } catch {
      toast.error("Could not copy — just email us directly.");
    }
  };

  return (
    <div className="bg-gradient-hero relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      <div className="starfield absolute inset-0 opacity-60" />
      <div className="bg-gradient-mesh pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-accent/15 blur-3xl animate-blob" />

      <Card className="glass-strong elegant-shadow relative max-w-md w-full p-8 animate-scale-in">
        <div className="mb-6 text-center">
          <div className="mb-3 flex justify-center">
            <Logo showText={false} size="lg" />
          </div>
          <h1 className="text-2xl font-bold">
            Password <span className="gold-text">reset</span>
          </h1>
        </div>

        <div className="text-center">
          <div className="glow-gold mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-accent/40 bg-accent/10">
            <Lock className="text-accent h-5 w-5" />
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Self-service password reset is being rebuilt after our platform migration.
            Need access to your account right now? Contact the team and we'll reset it
            for you within a day.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Button onClick={copyNote} variant="outline" className="rounded-full border-accent/40 hover:border-accent hover:text-accent">
              <Mail className="mr-2 h-4 w-4" /> Copy a reset request note
            </Button>
            <Button onClick={() => navigate("/")} className="btn-shine rounded-full bg-gradient-primary">
              Back to home
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
