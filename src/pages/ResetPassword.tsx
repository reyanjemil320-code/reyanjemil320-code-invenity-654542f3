import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Logo } from "@/components/Logo";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { z } from "zod";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);
  const [validSession, setValidSession] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    // 1. Initial manual check that also inspects URL hash strings to prevent race conditions
    const handleAuthCheck = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session || window.location.hash.includes("access_token")) {
        setValidSession(true);
      } else {
        setValidSession(false);
      }
      setCheckingAuth(false);
    };

    handleAuthCheck();

    // 2. Active listener catches the precise PASSWORD_RECOVERY event from Supabase core
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) {
        setValidSession(true);
      }
      setCheckingAuth(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const parsed = z.string().min(8, "At least 8 characters").max(72).safeParse(password);
    if (!parsed.success) return toast.error(parsed.error.errors[0].message);
    if (password !== confirm) return toast.error("Passwords don't match");
    
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    
    if (error) return toast.error(error.message);
    
    toast.success("Password updated successfully! Signing you in...");
    
    // Clear out the sensitive hash parameters from the browser address bar cleanly
    window.location.hash = "";
    
    // Smooth navigation redirect to home dashboard
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 elegant-shadow">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <Logo showText={false} size="lg" />
          </div>
          <h1 className="text-2xl font-bold">Set a new password</h1>
        </div>

        {checkingAuth ? (
          <div className="flex flex-col items-center justify-center py-6 space-y-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Verifying security token...</p>
          </div>
        ) : validSession ? (
          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <Label htmlFor="pwd">New password</Label>
              <div className="relative">
                <Input 
                  id="pwd" 
                  type={show ? "text" : "password"} 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  className="pr-10" 
                  required 
                />
                <button 
                  type="button" 
                  onClick={() => setShow(!show)} 
                  aria-label={show ? "Hide password" : "Show password"} 
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground transition-smooth"
                >
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <Label htmlFor="cpwd">Confirm password</Label>
              <div className="relative">
                <Input 
                  id="cpwd" 
                  type={show ? "text" : "password"} 
                  value={confirm} 
                  onChange={(e) => setConfirm(e.target.value)} 
                  className="pr-10" 
                  required 
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update password
            </Button>
          </form>
        ) : (
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">
              Reset link is invalid, expired, or has already been utilized.
            </p>
            <Button onClick={() => navigate("/")} variant="outline" className="w-full">
              Return to Login
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
