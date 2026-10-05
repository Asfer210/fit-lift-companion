import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { supabase } from "@/lib/external-supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { normalizePhone, phoneToEmail } from "@/lib/format";
import { BRAND_LOGO, BRAND_NAME } from "@/lib/brand";

export const Route = createFileRoute("/login")({
  ssr: false,
  validateSearch: z.object({ inactive: z.boolean().optional() }),
  head: () => ({
    meta: [
      { title: "Login — Lift & Fit Gym Management" },
      { name: "description", content: "Staff login for Lift & Fit Gym Management." },
      { property: "og:title", content: "Login — Lift & Fit Gym Management" },
      { property: "og:description", content: "Staff login for Lift & Fit Gym Management." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { inactive } = Route.useSearch();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(inactive ? "Your account is inactive. Please contact the Admin." : null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const phone = normalizePhone(username);
    if (!phone || !password) {
      setError("Enter a valid User ID and password.");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email: phoneToEmail(phone), password });
    if (error || !data.user) {
      setLoading(false);
      setError("Invalid User ID or password.");
      return;
    }
    const { data: profile } = await supabase.from("users").select("is_active").eq("id", data.user.id).maybeSingle();
    if (!profile || !profile.is_active) {
      await supabase.auth.signOut();
      setLoading(false);
      setError("Your account is inactive. Please contact the Admin.");
      return;
    }
    navigate({ to: "/dashboard", replace: true });
  }

  return (
    <div className="grid min-h-screen bg-background md:grid-cols-2">
      <div className="hidden flex-col items-center justify-center gap-4 bg-sidebar p-10 md:flex">
        <img src={BRAND_LOGO} alt={BRAND_NAME} className="w-full max-w-sm rounded-lg" />
        <p className="text-sm tracking-wide text-sidebar-foreground">Stronger · Healthier · Together</p>
      </div>
      <div className="flex items-center justify-center p-6">
        <form onSubmit={submit} className="w-full max-w-sm space-y-5 rounded-lg bg-card p-8 shadow-card">
          <img src={BRAND_LOGO} alt={BRAND_NAME} className="mx-auto w-48 rounded md:hidden" />
          <div>
            <h1 className="text-2xl font-bold">{BRAND_NAME}</h1>
            <p className="text-sm text-muted-foreground">Gym Management — sign in to continue</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="u">Username / User ID</Label>
            <Input id="u" placeholder="+919645804640" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="p">Password</Label>
            <div className="relative">
              <Input id="p" type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
              <button type="button" onClick={() => setShow(!show)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground" aria-label="Toggle password">
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          {error && <p className="rounded-md bg-danger-soft p-2 text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="animate-spin" />} {loading ? "Signing in..." : "LOGIN"}
          </Button>
          <p className="text-center text-xs text-muted-foreground">Contact your Admin if you forgot your password.</p>
        </form>
      </div>
    </div>
  );
}
