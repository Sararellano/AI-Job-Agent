"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export function RegisterForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    window.location.href = "/dashboard";
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="mb-1 block text-sm text-[var(--color-muted)]">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-[var(--color-card-border)] bg-[var(--color-card)] px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)]"
        />
      </div>
      <div>
        <label htmlFor="password" className="mb-1 block text-sm text-[var(--color-muted)]">
          Password
        </label>
        <input
          id="password"
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-[var(--color-card-border)] bg-[var(--color-card)] px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)]"
        />
      </div>
      {error && (
        <p className="text-sm text-[var(--color-danger)]" role="alert">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={loading}
        className={cn(
          "w-full rounded-lg bg-[var(--color-accent)] py-2.5 text-sm font-medium transition-colors hover:bg-[var(--color-accent-hover)]",
          loading && "opacity-60"
        )}
      >
        {loading ? "Creating account…" : "Create account"}
      </button>
      <p className="text-center text-sm text-[var(--color-muted)]">
        Already have an account?{" "}
        <Link href="/login" className="text-[var(--color-accent)] hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
