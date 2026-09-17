import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MessageSquare } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/useAuth";

type Conversation = Tables<"conversations">;
type Message = Tables<"messages">;
type Profile = Tables<"profiles">;

type Preview = Conversation & {
  other?: Profile;
  last?: Message;
  unread?: number;
};

export default function Inbox() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [convos, setConvos] = useState<Preview[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    const load = async () => {
      setLoading(true);
      const { data: convs } = await supabase
        .from("conversations")
        .select("*")
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order("last_message_at", { ascending: false })
        .limit(50);
      const rows = convs ?? [];
      const otherIds = rows.map((c) => (c.user1_id === user.id ? c.user2_id : c.user1_id));
      const [profilesRes, messagesRes] = await Promise.all([
        otherIds.length
          ? supabase.from("profiles").select("*").in("user_id", otherIds)
          : Promise.resolve({ data: [] as Profile[] }),
        rows.length
          ? supabase
              .from("messages")
              .select("*")
              .in("conversation_id", rows.map((c) => c.id))
              .order("created_at", { ascending: false })
          : Promise.resolve({ data: [] as Message[] }),
      ]);
      const profileMap = Object.fromEntries((profilesRes.data ?? []).map((p) => [p.user_id, p]));
      const lastByConv = new Map<string, Message>();
      const unreadByConv = new Map<string, number>();
      (messagesRes.data ?? []).forEach((m) => {
        if (!lastByConv.has(m.conversation_id)) lastByConv.set(m.conversation_id, m);
        if (!m.read && m.sender_id !== user.id) {
          unreadByConv.set(m.conversation_id, (unreadByConv.get(m.conversation_id) ?? 0) + 1);
        }
      });
      setConvos(
        rows.map((c) => {
          const otherId = c.user1_id === user.id ? c.user2_id : c.user1_id;
          return {
            ...c,
            other: profileMap[otherId],
            last: lastByConv.get(c.id),
            unread: unreadByConv.get(c.id) ?? 0,
          };
        }),
      );
      setLoading(false);
    };
    void load();
  }, [user?.id]);

  if (!user) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <MessageSquare className="h-12 w-12 text-primary" />
        <h2 className="text-xl font-bold">Sign in to see your inbox</h2>
        <Button onClick={() => navigate("/auth")} className="rounded-full">
          Sign in
        </Button>
      </div>
    );
  }

  const filtered = convos.filter((c) => {
    const name = c.other?.display_name || c.other?.username || "";
    return name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6">
      <div className="mb-5">
        <h1 className="text-2xl font-bold">Inbox</h1>
        <p className="text-sm text-muted-foreground">Direct messages with the network.</p>
      </div>
      <div className="relative mb-4">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search chats"
          className="rounded-full pl-10"
        />
      </div>

      <Card className="divide-y divide-border/60 overflow-hidden">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            No conversations yet. Start one from a profile.
          </div>
        ) : (
          filtered.map((c) => (
            <button
              key={c.id}
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition-smooth hover:bg-secondary/60"
            >
              <Avatar className="h-12 w-12 border border-border/60">
                <AvatarImage src={c.other?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {(c.other?.display_name || c.other?.username || "S").slice(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-semibold">
                    {c.other?.display_name || c.other?.username || "Conversation"}
                  </p>
                  <span className="text-[10px] text-muted-foreground">
                    {c.last ? new Date(c.last.created_at).toLocaleDateString() : ""}
                  </span>
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  {c.last?.content || "Say hi 👋"}
                </p>
              </div>
              {c.unread ? (
                <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                  {c.unread}
                </span>
              ) : null}
            </button>
          ))
        )}
      </Card>
    </div>
  );
}
