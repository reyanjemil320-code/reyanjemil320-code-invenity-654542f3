import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { fetchJson, setToken, type AuthUser } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { z } from "zod";
import { Logo } from "@/components/Logo";
import { Loader2, Mail, ArrowLeft, User as UserIcon, Building2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

const NAME_REGEX = /^[a-zA-Z\u00C0-\u024F][a-zA-Z\u00C0-\u024F\s'\-\.]{0,59}$/;

const signUpSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address").max(255),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password is too long")
    .regex(/[A-Za-z]/, "Password must contain a letter")
    .regex(/[0-9]/, "Password must contain a number"),
  displayName: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(60, "Name is too long")
    .regex(NAME_REGEX, "Name can only contain letters, spaces, hyphens, or apostrophes"),
  accountType: z.enum(["individual", "company"]),
  companyName: z
    .string()
    .trim()
    .max(120)
    .optional()
    .or(z.literal("")),
});

const signInSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address").max(255),
  password: z.string().min(1, "Password is required").max(72),
});

type FieldErrors = Record<string, string>;

export default function Auth() {
  const navigate = useNavigate();
  const { user, signIn } = useAuth();
  const [tab, setTab] = useState<"signin" | "signup" | "forgot">("signin");
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [accountType, setAccountType] = useState<"individual" | "company">("individual");
  const [companyName, setCompanyName] = useState("");

  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (user) navigate("/");
  }, [user, navigate]);

  // Reset errors when switching tabs
  useEffect(() => {
    setErrors({});
    setFormError(null);
  }, [tab]);

  const collectErrors = (err: z.ZodError): FieldErrors => {
    const out: FieldErrors = {};
    err.errors.forEach((e) => {
      const key = String(e.path[0] ?? "form");
      if (!out[key]) out[key] = e.message;
    });
    return out;
  };

  const handleDisplayNameChange = (value: string) => {
    // Block digits in the name field on the fly
    const cleaned = value.replace(/[0-9]/g, "");
    setDisplayName(cleaned);
    if (errors.displayName) setErrors({ ...errors, displayName: "" });
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const parsed = signUpSchema.safeParse({ email, password, displayName, accountType, companyName });
    if (!parsed.success) {
      setErrors(collectErrors(parsed.error));
      return;
    }
    if (parsed.data.accountType === "company" && !parsed.data.companyName) {
      setErrors({ companyName: "Company name is required" });
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      const res = await fetchJson<{ token: string; user: AuthUser }>("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: parsed.data.email,
          password: parsed.data.password,
          displayName: parsed.data.displayName,
          accountType: parsed.data.accountType,
          companyName: parsed.data.companyName || "",
        }),
      });
      setToken(res.token);
      signIn(res.user);
      toast.success("Welcome to Invenity!");
      navigate("/");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const parsed = signInSchema.safeParse({ email, password });
    if (!parsed.success) {
      setErrors(collectErrors(parsed.error));
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      const res = await fetchJson<{ token: string; user: AuthUser }>("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: parsed.data.email, password: parsed.data.password }),
      });
      setToken(res.token);
      signIn(res.user);
      toast.success("Welcome back!");
      navigate("/");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    toast.info("Password reset by email is coming soon — accounts work without it for now.");
  };

  const errorClass = "border-destructive focus-visible:ring-destructive/40";
  const FieldError = ({ name }: { name: string }) =>
    errors[name] ? (
      <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-destructive animate-fade-in">
        <AlertCircle className="h-3.5 w-3.5" /> {errors[name]}
      </p>
    ) : null;

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-mesh pointer-events-none" />
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl animate-blob" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-primary-glow/20 blur-3xl animate-blob" style={{ animationDelay: "3s" }} />

      <Link to="/" className="absolute top-6 left-6 text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-smooth z-10">
        <ArrowLeft className="h-4 w-4" /> Back home
      </Link>

      <Card className="max-w-md w-full p-8 elegant-shadow relative animate-scale-in glass">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3"><Logo showText={false} size="lg" /></div>
          <h1 className="text-2xl font-bold gradient-text">Welcome to Invenity</h1>
          <p className="text-sm text-muted-foreground mt-1">Invent. Connect. Inspire.</p>
        </div>

        {formError && (
          <Alert variant="destructive" className="mb-4 animate-shake border-destructive/40 bg-destructive/10">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-destructive font-medium">{formError}</AlertDescription>
          </Alert>
        )}

        <Tabs value={tab === "forgot" ? "signin" : tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            {tab === "forgot" ? (
              <form onSubmit={handleForgot} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors({ ...errors, email: "" }); }} className={cn(errors.email && errorClass)} required />
                  <FieldError name="email" />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Send reset link
                </Button>
                <button type="button" onClick={() => setTab("signin")} className="w-full text-sm text-muted-foreground hover:text-foreground transition-smooth">
                  Back to sign in
                </button>
              </form>
            ) : (
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <Label htmlFor="signin-email">Email</Label>
                  <Input id="signin-email" type="email" value={email} onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors({ ...errors, email: "" }); }} className={cn(errors.email && errorClass)} required />
                  <FieldError name="email" />
                </div>
                <div>
                  <Label htmlFor="signin-password">Password</Label>
                  <div className="relative">
                    <Input id="signin-password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors({ ...errors, password: "" }); }} className={cn("pr-10", errors.password && errorClass)} required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground transition-smooth">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <FieldError name="password" />
                </div>
                <Button type="submit" className="w-full bg-gradient-primary hover:opacity-90" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign In
                </Button>
                <button type="button" onClick={() => setTab("forgot")} className="w-full text-sm text-muted-foreground hover:text-foreground transition-smooth">
                  Forgot password?
                </button>
              </form>
            )}
          </TabsContent>

          <TabsContent value="signup">
            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <Label className="mb-2 block">I'm signing up as</Label>
                <RadioGroup
                  value={accountType}
                  onValueChange={(v) => setAccountType(v as "individual" | "company")}
                  className="grid grid-cols-2 gap-2"
                >
                  <label
                    className={`flex cursor-pointer items-center gap-2 rounded-xl border p-3 text-sm transition-smooth ${
                      accountType === "individual" ? "border-primary bg-primary/5 shadow-[0_0_0_3px_hsl(var(--primary)/0.1)]" : "border-border hover:border-primary/50"
                    }`}
                  >
                    <RadioGroupItem value="individual" className="sr-only" />
                    <UserIcon className="h-4 w-4 text-primary" />
                    Individual
                  </label>
                  <label
                    className={`flex cursor-pointer items-center gap-2 rounded-xl border p-3 text-sm transition-smooth ${
                      accountType === "company" ? "border-primary bg-primary/5 shadow-[0_0_0_3px_hsl(var(--primary)/0.1)]" : "border-border hover:border-primary/50"
                    }`}
                  >
                    <RadioGroupItem value="company" className="sr-only" />
                    <Building2 className="h-4 w-4 text-primary" />
                    Company
                  </label>
                </RadioGroup>
              </div>

              <div>
                <Label htmlFor="signup-name">{accountType === "company" ? "Contact name" : "Display name"}</Label>
                <Input
                  id="signup-name"
                  value={displayName}
                  onChange={(e) => handleDisplayNameChange(e.target.value)}
                  className={cn(errors.displayName && errorClass)}
                  placeholder="e.g. Ada Lovelace"
                  required
                />
                <FieldError name="displayName" />
                {!errors.displayName && (
                  <p className="text-xs text-muted-foreground mt-1">Letters only — no numbers or special characters.</p>
                )}
              </div>

              {accountType === "company" && (
                <div className="animate-fade-in">
                  <Label htmlFor="signup-company">Company name</Label>
                  <Input
                    id="signup-company"
                    value={companyName}
                    onChange={(e) => { setCompanyName(e.target.value); if (errors.companyName) setErrors({ ...errors, companyName: "" }); }}
                    className={cn(errors.companyName && errorClass)}
                    required
                  />
                  <FieldError name="companyName" />
                </div>
              )}

              <div>
                <Label htmlFor="signup-email">Email</Label>
                <Input id="signup-email" type="email" value={email} onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors({ ...errors, email: "" }); }} className={cn(errors.email && errorClass)} required />
                <FieldError name="email" />
              </div>
              <div>
                <Label htmlFor="signup-password">Password</Label>
                <div className="relative">
                  <Input id="signup-password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors({ ...errors, password: "" }); }} className={cn("pr-10", errors.password && errorClass)} required minLength={8} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground transition-smooth">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <FieldError name="password" />
                {!errors.password && (
                  <p className="text-xs text-muted-foreground mt-1">At least 8 characters with letters and numbers.</p>
                )}
              </div>
              <Button type="submit" className="w-full bg-gradient-primary hover:opacity-90" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create account
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
