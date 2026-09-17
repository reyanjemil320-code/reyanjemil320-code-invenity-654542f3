import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Brain, Send, Sparkles, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const examples = [
  "I want to invent a device that helps elderly people remember medications",
  "I have an idea for a sustainable packaging solution",
  "I'm thinking about a smart home gadget for energy efficiency",
  "I want to create a tool that helps kids learn to code physically",
];

type Msg = { role: "user" | "assistant"; content: string };

export default function AIBrainstorm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async (text: string) => {
    if (!text.trim() || streaming) return;
    if (!user) {
      toast.error("Sign in to use AI Brainstorm");
      navigate("/auth");
      return;
    }

    const userMsg: Msg = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setStreaming(true);

    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data, error } = await supabase.functions.invoke("brainstorm-chat", {
        body: { messages: newMessages },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const content = data?.content?.trim();
      if (!content) throw new Error("Empty response from AI");

      setMessages((prev) => [...prev, { role: "assistant", content }]);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "AI request failed. Try again.");
    } finally {
      setStreaming(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1 px-4 py-8 md:px-6">
        <div className="mx-auto max-w-3xl">
          <Card className="mb-6 p-4 flex items-center gap-3 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20 animate-fade-in">
            <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="font-semibold gradient-text">AI Brainstorm</h2>
              <p className="text-xs text-muted-foreground">Powered by Hugging Face · Refine your invention ideas</p>
            </div>
          </Card>

          <div ref={scrollRef} className="min-h-[50vh] max-h-[60vh] overflow-y-auto space-y-4 mb-6 pr-2">
            {messages.length === 0 ? (
              <div className="text-center py-10 animate-fade-in">
                <Brain className="mx-auto h-14 w-14 text-primary mb-4" />
                <h3 className="text-2xl font-bold mb-2 gradient-text">What do you want to invent?</h3>
                <p className="text-muted-foreground mb-8">Describe your idea and I'll help develop it into a full concept.</p>
                <div className="grid gap-3 md:grid-cols-2 max-w-2xl mx-auto">
                  {examples.map((ex, i) => (
                    <Card key={ex} onClick={() => send(ex)} className="p-4 text-left cursor-pointer hover:border-primary/50 transition-all">
                      <Sparkles className="h-4 w-4 text-primary mb-2" />
                      <p className="text-sm">{ex}</p>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground"
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{m.content || (streaming && i === messages.length - 1 ? "…" : "")}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex gap-2 sticky bottom-4">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe your invention idea…"
              disabled={streaming}
              className="h-12 rounded-2xl"
            />
            <Button type="submit" size="lg" className="rounded-2xl px-6" disabled={streaming || !input.trim()}>
              {streaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
