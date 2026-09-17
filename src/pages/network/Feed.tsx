import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, MessageCircle, Image as ImageIcon, Loader2, Send, Share2, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type Post = Tables<"posts">;
type Profile = Tables<"profiles">;
type Comment = { id: string; post_id: string; user_id: string; content: string; created_at: string };

export default function Feed() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [body, setBody] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [openComments, setOpenComments] = useState<Set<string>>(new Set());
  const [commentDraft, setCommentDraft] = useState<Record<string, string>>({});

  const load = async () => {
    setLoading(true);
    const { data: postRows } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(40);
    const rows = postRows ?? [];
    const ids = Array.from(new Set(rows.map((p) => p.user_id)));
    const postIds = rows.map((p) => p.id);
    const [profilesRes, likesRes, allLikesRes, commentsRes] = await Promise.all([
      ids.length
        ? supabase.from("profiles").select("*").in("user_id", ids)
        : Promise.resolve({ data: [] as Profile[] }),
      user
        ? supabase.from("post_likes").select("post_id").eq("user_id", user.id)
        : Promise.resolve({ data: [] as { post_id: string }[] }),
      postIds.length
        ? supabase.from("post_likes").select("post_id").in("post_id", postIds)
        : Promise.resolve({ data: [] as { post_id: string }[] }),
      postIds.length
        ? supabase.from("post_comments" as any).select("*").in("post_id", postIds).order("created_at", { ascending: true })
        : Promise.resolve({ data: [] as Comment[] }),
    ]);
    setPosts(rows);
    setProfiles(Object.fromEntries((profilesRes.data ?? []).map((p) => [p.user_id, p])));
    setLikedIds(new Set((likesRes.data ?? []).map((l) => l.post_id)));
    const lc: Record<string, number> = {};
    (allLikesRes.data ?? []).forEach((l: any) => { lc[l.post_id] = (lc[l.post_id] ?? 0) + 1; });
    setLikeCounts(lc);
    const cm: Record<string, Comment[]> = {};
    ((commentsRes.data ?? []) as Comment[]).forEach((c) => {
      (cm[c.post_id] ??= []).push(c);
    });
    setComments(cm);
    // load any comment author profiles missing
    const commentAuthorIds = Array.from(new Set(((commentsRes.data ?? []) as Comment[]).map((c) => c.user_id)));
    const missing = commentAuthorIds.filter((id) => !ids.includes(id));
    if (missing.length) {
      const { data: more } = await supabase.from("profiles").select("*").in("user_id", missing);
      setProfiles((prev) => ({ ...prev, ...Object.fromEntries((more ?? []).map((p) => [p.user_id, p])) }));
    }
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, [user?.id]);

  const upload = async (file: File) => {
    if (!user) return null;
    const ext = file.name.split(".").pop();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("post-media").upload(path, file);
    if (error) {
      toast.error(error.message);
      return null;
    }
    return supabase.storage.from("post-media").getPublicUrl(path).data.publicUrl;
  };

  const publish = async () => {
    if (!user) return navigate("/auth");
    if (!body.trim()) return toast.error("Write something first.");
    setPublishing(true);
    const image_url = image ? await upload(image) : null;
    const { error } = await supabase.from("posts").insert({
      user_id: user.id,
      content: body.trim(),
      image_url,
    });
    setPublishing(false);
    if (error) return toast.error(error.message);
    setBody("");
    setImage(null);
    toast.success("Posted.");
    void load();
  };

  const toggleLike = async (postId: string) => {
    if (!user) return navigate("/auth");
    const liked = likedIds.has(postId);
    const next = new Set(likedIds);
    liked ? next.delete(postId) : next.add(postId);
    setLikedIds(next);
    setLikeCounts((prev) => ({ ...prev, [postId]: (prev[postId] ?? 0) + (liked ? -1 : 1) }));
    if (liked) {
      await supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", user.id);
    } else {
      await supabase.from("post_likes").insert({ post_id: postId, user_id: user.id });
    }
  };

  const toggleCommentsPanel = (postId: string) => {
    const next = new Set(openComments);
    next.has(postId) ? next.delete(postId) : next.add(postId);
    setOpenComments(next);
  };

  const sendComment = async (postId: string) => {
    if (!user) return navigate("/auth");
    const text = (commentDraft[postId] ?? "").trim();
    if (!text) return;
    const { data, error } = await supabase
      .from("post_comments" as any)
      .insert({ post_id: postId, user_id: user.id, content: text })
      .select()
      .single();
    if (error) return toast.error(error.message);
    setComments((prev) => ({ ...prev, [postId]: [...(prev[postId] ?? []), data as unknown as Comment] }));
    setCommentDraft((prev) => ({ ...prev, [postId]: "" }));
  };

  const deleteComment = async (c: Comment) => {
    const { error } = await supabase.from("post_comments" as any).delete().eq("id", c.id);
    if (error) return toast.error(error.message);
    setComments((prev) => ({ ...prev, [c.post_id]: (prev[c.post_id] ?? []).filter((x) => x.id !== c.id) }));
  };

  const sharePost = async (post: Post) => {
    const url = `${window.location.origin}/network?post=${post.id}`;
    const shareData = { title: "Invenity post", text: post.content.slice(0, 120), url };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }
    } catch { /* user cancelled */ }
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard.");
    } catch {
      toast.error("Could not share.");
    }
  };

  const deletePost = async (postId: string) => {
    if (!user) return;
    if (!window.confirm("Delete this post? This cannot be undone.")) return;
    const { error } = await supabase.from("posts").delete().eq("id", postId).eq("user_id", user.id);
    if (error) return toast.error(error.message);
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    toast.success("Post deleted.");
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6">
      <Card className="mb-6 p-5">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10 border border-border/60">
            <AvatarImage src={user?.user_metadata?.avatar_url} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {(user?.email || "U").slice(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={user ? "Share an update with the network…" : "Sign in to post"}
              disabled={!user}
              className="min-h-20 resize-none rounded-2xl border-border/60"
            />
            <div className="mt-3 flex items-center justify-between gap-3">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition-smooth hover:border-primary hover:text-foreground">
                <ImageIcon className="h-3.5 w-3.5" />
                {image ? image.name.slice(0, 18) : "Photo"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setImage(e.target.files?.[0] || null)}
                />
              </label>
              <Button onClick={publish} disabled={publishing || !user} size="sm" className="rounded-full">
                {publishing ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Send className="mr-2 h-3.5 w-3.5" />}
                Post
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <div className="space-y-5">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-72 rounded-2xl" />)
        ) : posts.length === 0 ? (
          <Card className="p-10 text-center text-muted-foreground">No posts yet. Be the first.</Card>
        ) : (
          posts.map((post) => {
            const profile = profiles[post.user_id];
            const liked = likedIds.has(post.id);
            const postComments = comments[post.id] ?? [];
            const isOpen = openComments.has(post.id);
            return (
              <Card key={post.id} className="overflow-hidden">
                <div className="flex items-center justify-between gap-3 p-4">
                  <Link to="/network/profile" className="flex items-center gap-3 min-w-0">
                    <Avatar className="h-10 w-10 border border-border/60">
                      <AvatarImage src={profile?.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {(profile?.display_name || profile?.username || "S").slice(0, 1).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {profile?.display_name || profile?.username || "Invenity member"}
                      </p>
                      {profile?.username && (
                        <p className="truncate text-xs text-primary">@{profile.username}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {new Date(post.created_at).toLocaleString()}
                      </p>
                    </div>
                  </Link>
                  {user?.id === post.user_id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deletePost(post.id)}
                      className="text-muted-foreground hover:text-destructive"
                      aria-label="Delete post"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {post.image_url && (
                  <img
                    src={post.image_url}
                    alt="Post"
                    className="max-h-[520px] w-full bg-secondary object-cover"
                    loading="lazy"
                  />
                )}
                <div className="space-y-3 p-4">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{post.content}</p>
                  <div className="flex items-center gap-4 border-t border-border/60 pt-3">
                    <button
                      onClick={() => toggleLike(post.id)}
                      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-smooth hover:text-foreground"
                    >
                      <Heart className={`h-4 w-4 ${liked ? "fill-primary text-primary" : ""}`} />
                      {likeCounts[post.id] ?? 0}
                    </button>
                    <button
                      onClick={() => toggleCommentsPanel(post.id)}
                      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
                    >
                      <MessageCircle className="h-4 w-4" />
                      {postComments.length}
                    </button>
                    <button
                      onClick={() => sharePost(post)}
                      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
                    >
                      <Share2 className="h-4 w-4" />
                      Share
                    </button>
                  </div>

                  {isOpen && (
                    <div className="space-y-3 border-t border-border/60 pt-3">
                      {postComments.length === 0 && (
                        <p className="text-xs text-muted-foreground">No comments yet.</p>
                      )}
                      {postComments.map((c) => {
                        const cp = profiles[c.user_id];
                        return (
                          <div key={c.id} className="flex items-start gap-2">
                            <Avatar className="h-7 w-7">
                              <AvatarImage src={cp?.avatar_url || undefined} />
                              <AvatarFallback className="bg-primary/10 text-[10px] text-primary">
                                {(cp?.display_name || cp?.username || "U").slice(0, 1).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 rounded-2xl bg-secondary/50 px-3 py-2">
                              <p className="text-xs font-semibold">{cp?.display_name || cp?.username || "Member"}</p>
                              <p className="text-sm">{c.content}</p>
                            </div>
                            {user?.id === c.user_id && (
                              <Button variant="ghost" size="sm" onClick={() => deleteComment(c)} className="text-muted-foreground hover:text-destructive">
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        );
                      })}
                      {user && (
                        <div className="flex items-center gap-2">
                          <Input
                            value={commentDraft[post.id] ?? ""}
                            onChange={(e) => setCommentDraft((prev) => ({ ...prev, [post.id]: e.target.value }))}
                            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void sendComment(post.id); } }}
                            placeholder="Write a comment…"
                            className="rounded-full"
                          />
                          <Button size="sm" className="rounded-full" onClick={() => sendComment(post.id)}>
                            <Send className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
