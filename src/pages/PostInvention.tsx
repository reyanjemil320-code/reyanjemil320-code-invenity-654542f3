import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Upload,
  Loader2,
  X,
  Image as ImageIcon,
  Video,
  Sparkles,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { cn } from "@/lib/utils";

// Title: must contain at least one letter, allow letters/numbers/space/basic punctuation
const TITLE_REGEX = /^(?=.*[A-Za-z])[A-Za-z0-9\s\-_,.&'()/]+$/;
// Location: letters, spaces, commas, hyphens
const LOCATION_REGEX = /^[A-Za-z\u00C0-\u024F\s,\-\.]+$/;

const schema = z.object({
  title: z
    .string()
    .trim()
    .min(5, "Title must be at least 5 characters")
    .max(120, "Title is too long (max 120)")
    .regex(TITLE_REGEX, "Title must contain letters and cannot be only numbers"),
  description: z
    .string()
    .trim()
    .min(30, "Description must be at least 30 characters")
    .max(3000, "Description is too long (max 3000)"),
  category: z.enum([
    "clean_energy",
    "biotech",
    "infrastructure",
    "consumer_goods",
    "agriculture",
    "health_tech",
    "ai_software",
    "transportation",
    "other",
  ]),
  status: z.enum(["patent_pending", "available", "prototype_ready", "licensed", "concept"]),
  location: z
    .string()
    .trim()
    .max(120)
    .regex(LOCATION_REGEX, "Location can only contain letters, spaces and commas")
    .optional()
    .or(z.literal("")),
  technical_details: z.string().trim().max(3000, "Too long (max 3000)").optional().or(z.literal("")),
  use_case: z.string().trim().max(200, "Too long").optional().or(z.literal("")),
  industrial_application: z.string().trim().max(200, "Too long").optional().or(z.literal("")),
  patent_status: z.string().trim().max(120).optional().or(z.literal("")),
  current_milestone: z.string().trim().max(200).optional().or(z.literal("")),
});

type FieldErrors = Record<string, string>;

const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8MB
const MAX_VIDEO_BYTES = 50 * 1024 * 1024; // 50MB

export default function PostInvention() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "other",
    status: "concept",
    location: "",
    technical_details: "",
    use_case: "",
    industrial_application: "",
    patent_status: "",
    current_milestone: "",
  });

  const update = (k: keyof typeof form, v: string) => {
    setForm({ ...form, [k]: v });
    if (errors[k]) setErrors({ ...errors, [k]: "" });
  };

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-4 bg-gradient-mesh">
          <Card className="p-10 text-center max-w-md elegant-shadow animate-scale-in">
            <Sparkles className="mx-auto mb-3 h-10 w-10 text-primary animate-invenity-pulse" />
            <h2 className="text-2xl font-bold mb-2">Sign in to post</h2>
            <p className="text-muted-foreground mb-6">Create an account to share your invention.</p>
            <Button onClick={() => navigate("/auth")} className="bg-gradient-primary">
              Sign In
            </Button>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  const uploadFile = async (file: File, bucket: string): Promise<string | null> => {
    const ext = file.name.split(".").pop();
    const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file);
    if (error) {
      toast.error(`Upload failed: ${error.message}`);
      return null;
    }
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  };

  const validateImage = (file: File | null, label: string) => {
    if (!file) return null;
    if (!file.type.startsWith("image/")) return `${label} must be an image file`;
    if (file.size > MAX_IMAGE_BYTES) return `${label} must be under 8MB`;
    return null;
  };

  const validateVideo = (file: File | null) => {
    if (!file) return null;
    if (!file.type.startsWith("video/")) return "Demo video must be a video file";
    if (file.size > MAX_VIDEO_BYTES) return "Demo video must be under 50MB";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const out: FieldErrors = {};
      parsed.error.errors.forEach((err) => {
        const key = String(err.path[0] ?? "form");
        if (!out[key]) out[key] = err.message;
      });
      setErrors(out);
      setFormError("Please fix the highlighted fields before submitting.");
      return;
    }

    // File validation
    const fileErrors: string[] = [];
    const cov = validateImage(coverFile, "Cover image");
    if (cov) fileErrors.push(cov);
    galleryFiles.forEach((f) => {
      const e = validateImage(f, `Gallery photo "${f.name}"`);
      if (e) fileErrors.push(e);
    });
    const vid = validateVideo(videoFile);
    if (vid) fileErrors.push(vid);

    if (fileErrors.length) {
      setFormError(fileErrors[0]);
      return;
    }

    setErrors({});
    setSubmitting(true);
    let cover_image_url: string | null = null;
    let video_url: string | null = null;
    const gallery_urls: string[] = [];

    if (coverFile) cover_image_url = await uploadFile(coverFile, "invention-media");
    if (videoFile) video_url = await uploadFile(videoFile, "invention-media");
    for (const f of galleryFiles) {
      const url = await uploadFile(f, "invention-media");
      if (url) gallery_urls.push(url);
    }

    const { error } = await supabase.from("inventions").insert({
      user_id: user.id,
      title: parsed.data.title,
      description: parsed.data.description,
      category: parsed.data.category as any,
      status: parsed.data.status as any,
      location: parsed.data.location || null,
      technical_details: parsed.data.technical_details || null,
      use_case: parsed.data.use_case || null,
      industrial_application: parsed.data.industrial_application || null,
      patent_status: parsed.data.patent_status || null,
      current_milestone: parsed.data.current_milestone || null,
      cover_image_url,
      video_url,
      gallery_urls,
    } as any);
    setSubmitting(false);
    if (error) {
      setFormError(error.message);
      return;
    }
    toast.success("Invention posted!");
    navigate("/browse");
  };

  const errClass = "border-destructive focus-visible:ring-destructive/40";
  const FieldError = ({ name }: { name: string }) =>
    errors[name] ? (
      <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-destructive animate-fade-in">
        <AlertCircle className="h-3.5 w-3.5" /> {errors[name]}
      </p>
    ) : null;

  const titleValid = form.title.length >= 5 && TITLE_REGEX.test(form.title);
  const descValid = form.description.trim().length >= 30;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1 px-4 py-10 md:px-6 md:py-16 relative">
        <div className="pointer-events-none absolute inset-0 bg-gradient-mesh opacity-60" />
        <div className="mx-auto max-w-3xl relative">
          <div className="mb-8 animate-fade-in">
            <h1 className="text-3xl font-bold md:text-4xl mb-2 gradient-text">Post an Invention</h1>
            <p className="text-muted-foreground">Share your idea with the Invenity community.</p>
          </div>

          {formError && (
            <Alert variant="destructive" className="mb-6 animate-shake border-destructive/40 bg-destructive/10">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-destructive font-medium">{formError}</AlertDescription>
            </Alert>
          )}

          <Card className="p-6 md:p-8 elegant-shadow animate-slide-up glass">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="title">Title *</Label>
                  {titleValid && <CheckCircle2 className="h-4 w-4 text-success" />}
                </div>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => update("title", e.target.value)}
                  placeholder="e.g. Solar-Powered Water Purifier"
                  className={cn(errors.title && errClass)}
                  maxLength={120}
                  required
                />
                <FieldError name="title" />
                {!errors.title && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {form.title.length}/120 — must contain letters
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="description">Description *</Label>
                  {descValid && <CheckCircle2 className="h-4 w-4 text-success" />}
                </div>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => update("description", e.target.value)}
                  placeholder="Describe your invention…"
                  rows={4}
                  className={cn(errors.description && errClass)}
                  maxLength={3000}
                  required
                />
                <FieldError name="description" />
                {!errors.description && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {form.description.length}/3000 — minimum 30 characters
                  </p>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Category *</Label>
                  <Select value={form.category} onValueChange={(v) => update("category", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="clean_energy">Clean Energy</SelectItem>
                      <SelectItem value="biotech">BioTech</SelectItem>
                      <SelectItem value="infrastructure">Infrastructure</SelectItem>
                      <SelectItem value="consumer_goods">Consumer Goods</SelectItem>
                      <SelectItem value="agriculture">Agriculture</SelectItem>
                      <SelectItem value="health_tech">Health Tech</SelectItem>
                      <SelectItem value="ai_software">AI / Software</SelectItem>
                      <SelectItem value="transportation">Transportation</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status *</Label>
                  <Select value={form.status} onValueChange={(v) => update("status", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="concept">Concept</SelectItem>
                      <SelectItem value="prototype_ready">Prototype Ready</SelectItem>
                      <SelectItem value="patent_pending">Patent Pending</SelectItem>
                      <SelectItem value="available">Available for License</SelectItem>
                      <SelectItem value="licensed">Licensed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={form.location}
                  onChange={(e) => update("location", e.target.value)}
                  placeholder="Berlin, Germany"
                  className={cn(errors.location && errClass)}
                  maxLength={120}
                />
                <FieldError name="location" />
              </div>

              {/* Cover image */}
              <div>
                <Label>Cover Image</Label>
                <label className="mt-1 flex items-center gap-3 rounded-xl border border-dashed border-border bg-secondary/30 px-4 py-3 cursor-pointer hover:border-primary hover:bg-primary/5 transition-smooth">
                  <Upload className="h-4 w-4 text-primary" />
                  <span className="text-sm text-muted-foreground">{coverFile ? coverFile.name : "Upload cover image (max 8MB)"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0] || null;
                      const err = validateImage(f, "Cover image");
                      if (err) {
                        toast.error(err);
                        return;
                      }
                      setCoverFile(f);
                    }}
                  />
                </label>
              </div>

              {/* Gallery */}
              <div>
                <Label>Gallery Photos</Label>
                <div className="mt-1 flex flex-wrap gap-2">
                  {galleryFiles.map((f, i) => (
                    <div key={i} className="relative h-20 w-20 rounded-lg bg-secondary flex items-center justify-center animate-scale-in">
                      <ImageIcon className="h-6 w-6 text-muted-foreground" />
                      <button
                        type="button"
                        onClick={() => setGalleryFiles(galleryFiles.filter((_, j) => j !== i))}
                        className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 hover:scale-110 transition-smooth"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  <label className="h-20 w-20 rounded-lg border border-dashed border-border bg-secondary/30 flex items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-smooth">
                    <Upload className="h-5 w-5 text-primary" />
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        const valid: File[] = [];
                        for (const f of files) {
                          const err = validateImage(f, `"${f.name}"`);
                          if (err) toast.error(err);
                          else valid.push(f);
                        }
                        setGalleryFiles([...galleryFiles, ...valid]);
                      }}
                    />
                  </label>
                </div>
              </div>

              {/* Video */}
              <div>
                <Label>Demo Video</Label>
                <label className="mt-1 flex items-center gap-3 rounded-xl border border-dashed border-border bg-secondary/30 px-4 py-3 cursor-pointer hover:border-primary hover:bg-primary/5 transition-smooth">
                  <Video className="h-4 w-4 text-primary" />
                  <span className="text-sm text-muted-foreground">{videoFile ? videoFile.name : "Upload demo video (max 50MB)"}</span>
                  <input
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0] || null;
                      const err = validateVideo(f);
                      if (err) {
                        toast.error(err);
                        return;
                      }
                      setVideoFile(f);
                    }}
                  />
                </label>
              </div>

              <div>
                <Label htmlFor="technical">Technical Explanation</Label>
                <Textarea
                  id="technical"
                  value={form.technical_details}
                  onChange={(e) => update("technical_details", e.target.value)}
                  placeholder="How it works…"
                  rows={4}
                  className={cn(errors.technical_details && errClass)}
                  maxLength={3000}
                />
                <FieldError name="technical_details" />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="usecase">Use Case</Label>
                  <Input
                    id="usecase"
                    value={form.use_case}
                    onChange={(e) => update("use_case", e.target.value)}
                    placeholder="Primary use case"
                    maxLength={200}
                    className={cn(errors.use_case && errClass)}
                  />
                  <FieldError name="use_case" />
                </div>
                <div>
                  <Label htmlFor="industrial">Industrial Application</Label>
                  <Input
                    id="industrial"
                    value={form.industrial_application}
                    onChange={(e) => update("industrial_application", e.target.value)}
                    placeholder="Industries that benefit"
                    maxLength={200}
                    className={cn(errors.industrial_application && errClass)}
                  />
                  <FieldError name="industrial_application" />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="patent">Patent Status</Label>
                  <Input
                    id="patent"
                    value={form.patent_status}
                    onChange={(e) => update("patent_status", e.target.value)}
                    placeholder="e.g. Filed Q3 2025"
                    maxLength={120}
                  />
                </div>
                <div>
                  <Label htmlFor="milestone">Current Milestone</Label>
                  <Input
                    id="milestone"
                    value={form.current_milestone}
                    onChange={(e) => update("current_milestone", e.target.value)}
                    placeholder="Looking for funding"
                    maxLength={200}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full bg-gradient-primary hover:opacity-90" size="lg" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Publish invention
              </Button>
            </form>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
