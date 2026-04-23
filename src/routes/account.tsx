import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export const Route = createFileRoute("/account")({
  head: () => ({ meta: [{ title: "Account — Maison" }] }),
  component: AccountPage,
});

function AccountPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: typeof window !== "undefined" ? window.location.origin + "/account" : undefined,
          },
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Authentication failed");
    } finally {
      setBusy(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  if (loading) {
    return <div className="min-h-[60vh]" />;
  }

  if (user) {
    return (
      <div className="px-5 md:px-10 py-16 md:py-24 max-w-3xl mx-auto">
        <p className="eyebrow text-muted-foreground mb-3">Account</p>
        <h1 className="font-display text-5xl md:text-6xl mb-12">{user.user_metadata?.full_name || "Welcome"}</h1>
        <div className="border-t hairline">
          <Row label="Email" value={user.email ?? ""} />
          <Row label="Member since" value={new Date(user.created_at).toLocaleDateString()} />
        </div>
        <div className="mt-12 flex flex-wrap gap-6">
          <Link to="/orders" className="eyebrow link-underline">My orders</Link>
          <button onClick={signOut} className="eyebrow link-underline text-muted-foreground">Sign out</button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-px bg-border min-h-[80vh]">
      <div className="hidden md:block bg-secondary" />
      <div className="bg-background p-8 md:p-16 flex items-center">
        <form onSubmit={submit} className="w-full max-w-sm">
          <p className="eyebrow text-muted-foreground mb-3">{mode === "signin" ? "Welcome back" : "New here"}</p>
          <h1 className="font-display text-4xl md:text-5xl mb-10">
            {mode === "signin" ? "Sign in" : "Create account"}
          </h1>

          {mode === "signup" && (
            <Field label="Full name" value={fullName} onChange={setFullName} />
          )}
          <Field label="Email" type="email" value={email} onChange={setEmail} />
          <Field label="Password" type="password" value={password} onChange={setPassword} />

          {err && <p className="text-xs text-destructive mt-3">{err}</p>}

          <button
            type="submit"
            disabled={busy}
            className="w-full bg-foreground text-background py-4 eyebrow mt-8 disabled:opacity-50"
          >
            {busy ? "..." : mode === "signin" ? "Sign in" : "Create account"}
          </button>

          <button
            type="button"
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setErr(null);
            }}
            className="eyebrow link-underline text-muted-foreground mt-6 inline-block"
          >
            {mode === "signin" ? "Create an account →" : "Already have an account?"}
          </button>
        </form>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-5 border-b hairline">
      <span className="eyebrow text-muted-foreground">{label}</span>
      <span className="text-sm">{value}</span>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="block mb-6">
      <span className="eyebrow text-muted-foreground block mb-2">{label}</span>
      <input
        type={type}
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border-b border-foreground bg-transparent py-2 text-sm outline-none"
      />
    </label>
  );
}
