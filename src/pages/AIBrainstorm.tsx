import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Brain, Sparkles, Construction } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const examples = [
  "I want to invent a device that helps elderly people remember medications",
  "I have an idea for a sustainable packaging solution",
  "I'm thinking about a smart home gadget for energy efficiency",
  "I want to create a tool that helps kids learn to code physically",
];

export default function AIBrainstorm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [input, setInput] = useState("");

  const trySend = () => {
    toast.info("AI Brainstorm is being re-connected to the new Turso backend — it will be back very soon.");
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="relative flex-1 px-4 py-8 md:px-6">
        <div className="bg-gradient-mesh pointer-events-none absolute inset-0 opacity-40" />
        <div className="relative mx-auto max-w-3xl">
          <Card className="glass-strong animate-rise mb-6 flex items-center gap-3 border-accent/30 p-4">
            <div className="glow-gold flex h-10 w-10 items-center justify-center rounded-xl border border-accent/40 bg-accent/10">
              <Sparkles className="text-accent h-5 w-5" />
            </div>
            <div className="flex-1">
              <h2 className="gold-text font-semibold">AI Brainstorm</h2>
              <p className="text-xs text-muted-foreground">Your AI co-creator for invention ideas</p>
            </div>
          </Card>

          <div className="animate-rise text-center">
            <div className="animate-antigravity mx-auto mb-6 w-fit">
              <div className="glow-gold mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-accent/40 bg-accent/10">
                <Brain className="text-accent h-10 w-10" />
              </div>
            </div>
            <h3 className="gradient-text mb-2 text-2xl font-bold md:text-3xl">What do you want to invent?</h3>
            <p className="mx-auto mb-8 max-w-md text-muted-foreground">
              Describe your idea and the AI will help develop it into a full concept — the assistant is
              being re-wired after our migration and returns very soon.
            </p>

            <div className="mx-auto grid max-w-2xl gap-3 md:grid-cols-2">
              {examples.map((ex) => (
                <Card key={ex} className="card-lift cursor-pointer p-4 text-left" onClick={() => { setInput(ex); trySend(); }}>
                  <Sparkles className="text-accent mb-2 h-4 w-4" />
                  <p className="text-sm">{ex}</p>
                </Card>
              ))}
            </div>

            <div className="mt-8 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Construction className="h-4 w-4" />
              <span>Coming back after the Turso migration</span>
            </div>

            {!user && (
              <Button onClick={() => navigate("/auth")} className="btn-shine mt-8 rounded-full bg-gradient-primary">
                Sign in to be first in line
              </Button>
            )}
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); trySend(); }}
            className="animate-rise mt-10 flex gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe your invention idea…"
              className="h-12 rounded-2xl border-accent/25 bg-card/70 backdrop-blur-md"
            />
            <Button type="submit" size="lg" className="rounded-2xl bg-gradient-primary px-6">
              <Sparkles className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
