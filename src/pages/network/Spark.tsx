import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, MessageCircle, Share2, Upload, Loader2, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type Reel = Tables<"reels">;
type Profile = Tables<"profiles">;

export default function Spark() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reels, setReels] = useState<Reel[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [muted, setMuted] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    const { data } = await supabase.from("reels").select("*").order("created_at", { ascending: false }).limit(20);
    const rows = data ?? [];
    const ids = Array.from(new Set(rows.map((r) => r.user_id)));
    const { data: prof } = ids.length
      ? await supabase.from("profiles").select("*").in("user_id", ids)
      : { data: [] as Profile[] };
    setReels(rows);
    setProfiles(Object.fromEntries((prof ?? []).map((p) => [p.user_id, p])));
  };

  useEffect(() => {
    void load();
  }, []);

  // Autoplay current visible video
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target as HTMLVideoElement;
          if (entry.isIntersecting) {
            void video.play().catch(() => {});
          } else {
            video.pause();
          }
        });
      },
      { root, threshold: 0.7 },
    );
    root.querySelectorAll("video").forEach((v) => observer.observe(v));
    return () => observer.disconnect();
  }, [reels]);

  const publish = async () => {
    if (!user) return navigate("/auth");
    if (!file) return toast.error("Choose a video first.");
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("reel-media").upload(path, file);
    if (upErr) {
      setUploading(false);
      return toast.error(upErr.message);
    }
    const url = supabase.storage.from("reel-media").getPublicUrl(path).data.publicUrl;
    const { error } = await supabase.from("reels").insert({
      user_id: user.id,
      video_url: url,
      caption: caption.trim() || null,
    });
    setUploading(false);
    if (error) return toast.error(error.message);
    setFile(null);
    setCaption("");
    setOpen(false);
    toast.success("Spark posted.");
    void load();
  };

  return (
    <div className="relative h-[calc(100vh-4rem-4rem)] md:h-[calc(100vh-4rem)]">
      <div className="absolute right-4 top-4 z-20 flex gap-2">
        <Button size="icon" variant="secondary" className="rounded-full" onClick={() => setMuted((m) => !m)}>
          {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="icon" className="rounded-full">
              <Upload className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Spark</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground hover:border-primary">
                <span>{file ? file.name : "Choose a video"}</span>
                <Upload className="h-4 w-4" />
                <input
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </label>
              <Input
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Add a caption…"
                className="rounded-xl"
              />
              <Button className="w-full rounded-full" onClick={publish} disabled={uploading}>
                {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Post Spark
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div
        ref={containerRef}
        className="h-full snap-y snap-mandatory overflow-y-scroll bg-black"
      >
        {reels.length === 0 ? (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            No Sparks yet — be the first to drop one.
          </div>
        ) : (
          reels.map((reel) => {
            const profile = profiles[reel.user_id];
            return (
              <section
                key={reel.id}
                className="relative flex h-full snap-start items-center justify-center"
              >
                <video
                  src={reel.video_url}
                  className="h-full w-full object-contain md:max-w-md md:rounded-2xl md:object-cover"
                  loop
                  muted={muted}
                  playsInline
                />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-5 text-white">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9 border border-white/40">
                      <AvatarImage src={profile?.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/30">
                        {(profile?.display_name || "S").slice(0, 1).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <p className="font-semibold">
                      {profile?.display_name || profile?.username || "Invenity"}
                    </p>
                  </div>
                  {reel.caption && <p className="mt-2 max-w-md text-sm">{reel.caption}</p>}
                </div>
                <div className="absolute right-3 bottom-24 flex flex-col gap-4 text-white">
                  <button className="flex flex-col items-center text-xs">
                    <span className="rounded-full bg-white/15 p-3 backdrop-blur">
                      <Heart className="h-5 w-5" />
                    </span>
                    Like
                  </button>
                  <button className="flex flex-col items-center text-xs">
                    <span className="rounded-full bg-white/15 p-3 backdrop-blur">
                      <MessageCircle className="h-5 w-5" />
                    </span>
                    Reply
                  </button>
                  <button className="flex flex-col items-center text-xs">
                    <span className="rounded-full bg-white/15 p-3 backdrop-blur">
                      <Share2 className="h-5 w-5" />
                    </span>
                    Share
                  </button>
                </div>
              </section>
            );
          })
        )}
      </div>
    </div>
  );
}
