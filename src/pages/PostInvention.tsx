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
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Link as LinkIcon,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { fetchAuth } from "@/lib/api";
import { compressImage } from "@/lib/media";
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
  video_url: z.string().trim().url("Must be a valid link (https://…)").optional().or(z.literal("")),
});

type FieldErrors = Record<string, string>;

const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8MB source file (compressed before upload)

export default function PostInvention() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
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
    video_url: "",
  });

  const update = (k: keyof typeof form, v: string) => {
    setForm({ ...form, [k]: v });
    if (errors[k]) setErrors({ ...errors, [k]: "" });
  };

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <main className="bg-gradient-mesh flex flex-1 items-center justify-center p-4">
          <Card className="glass-strong elegant-shadow animate-scale-in max-w-md p-10 text-center">
            <Sparkles className="text-accent animate-invenity-pulse mx-auto mb-3 h-10 w-10" />
            <h2 className="mb-2 text-2xl font-bold">Sign in to post</h2>
            <p className="mb-6 text-muted-foreground">Create an account to share your invention.</p>
            <Button onClick={() => navigate("/auth")} className="btn-shine rounded-full bg-gradient-primary">
              Sign In
            </Button>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  const validateImage = (file: File | null, label: string) => {
    if (!file) return null;
    if (!file.type.startsWith("image/")) return `${label} must be an image file`;
    if (file.size > MAX_IMAGE_BYTES) return `${label} must be under 8MB`;
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

    if (fileErrors.length) {
      setFormError(fileErrors[0]);
      return;
    }

    setErrors({});
    setSubmitting(true);

    try {
      // Compress images to small data URLs (stored with the invention row)
      const cover = coverFile ? await compressImage(coverFile) : null;
      const gallery: string[] = [];
      for (const f of galleryFiles.slice(0, 6)) {
        const compressed = await compressImage(f, { maxDimension: 900, maxBytes: 120_000 });
        gallery.push(compressed.dataUrl);
      }

      await fetchAuth("/api/inventions-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: parsed.data.title,
          description: parsed.data.description,
          category: parsed.data.category,
          status: parsed.data.status,
          location: parsed.data.location || "",
          technical_details: parsed.data.technical_details || "",
          use_case: parsed.data.use_case || "",
          industrial_application: parsed.data.industrial_application || "",
          patent_status: parsed.data.patent_status || "",
          current_milestone: parsed.data.current_milestone || "",
          video_url: parsed.data.video_url || "",
          cover_image_url: cover?.dataUrl ?? null,
          gallery_urls: gallery,
        }),
      });

      toast.success("Invention posted!");
      navigate("/browse");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not publish your invention. Please try again.";
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const errClass = "border-destructive focus-visible:ring-destructive/40";
  const FieldError = ({ name }: { name: string }) =>
    errors[name] ? (
      <p className="animate-fade-in mt-1.5 flex items-center gap-1 text-xs font-medium text-destructive">
        <AlertCircle className="h-3.5 w-3.5" /> {errors[name]}
      </p>
    ) : null;

  const titleValid = form.title.length >= 5 && TITLE_REGEX.test(form.title);
  const descValid = form.description.trim().length >= 30;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="relative flex-1 px-4 py-10 md:px-6 md:py-16">
        <div className="bg-gradient-mesh pointer-events-none absolute inset-0 opacity-60" />
        <div className="relative mx-auto max-w-3xl">
          <div className="animate-rise mb-8">
            <h1 className="gradient-text mb-2 text-3xl font-bold md:text-4xl">Post an Invention</h1>
            <p className="text-muted-foreground">Share your idea with the Invenity community.</p>
          </div>

          {formError && (
            <Alert variant="destructive" className="animate-shake mb-6 border-destructive/40 bg-destructive/10">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="font-medium text-destructive">{formError}</AlertDescription>
            </Alert>
          )}

          <Card className="glass-strong animate-slide-up elegant-shadow p-6 md:p-8">
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
                  <p className="mt-1 text-xs text-muted-foreground">
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
                  <p className="mt-1 text-xs text-muted-foreground">
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
                <label className="mt-1 flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-accent/40 bg-secondary/30 px-4 py-3 transition-smooth hover:border-accent hover:bg-accent/5">
                  <Upload className="h-4 w-4 text-accent" />
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
                    <div key={i} className="animate-scale-in relative flex h-20 w-20 items-center justify-center rounded-lg border border-border/60 bg-secondary">
                      <ImageIcon className="h-6 w-6 text-muted-foreground" />
                      <button
                        type="button"
                        onClick={() => setGalleryFiles(galleryFiles.filter((_, j) => j !== i))}
                        className="transition-smooth absolute -right-1 -top-1 rounded-full bg-destructive p-0.5 text-destructive-foreground hover:scale-110"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  <label className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-lg border border-dashed border-accent/40 bg-secondary/30 transition-smooth hover:border-accent hover:bg-accent/5">
                    <Upload className="h-5 w-5 text-accent" />
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
                        setGalleryFiles([...galleryFiles, ...valid].slice(0, 6));
                      }}
                    />
                  </label>
                </div>
              </div>

              <div>
                <Label htmlFor="video">Demo Video Link</Label>
                <div className="relative">
                  <LinkIcon className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="video"
                    value={form.video_url}
                    onChange={(e) => update("video_url", e.target.value)}
                    placeholder="https://youtube.com/watch?v=… or a direct video link"
                    className={cn("pl-10", errors.video_url && errClass)}
                  />
                </div>
                <FieldError name="video_url" />
                <p className="mt-1 text-xs text-muted-foreground">Paste a link to your demo video (YouTube, Drive, etc.).</p>
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

              <Button
                type="submit"
                size="lg"
                disabled={submitting}
                className="btn-shine glow-shadow w-full rounded-full bg-gradient-primary py-6 text-base font-bold hover:opacity-90"
              >
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
