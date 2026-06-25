"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { useT } from "@/contexts/LocaleProvider";
import { inputClassName } from "@/lib/ui/input-styles";

export function RegisterForm() {
  const t = useT();
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

    window.location.href = "/onboarding";
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="mb-1 block text-sm text-[var(--color-muted)]">
          {t("auth.email")}
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClassName}
        />
      </div>
      <div>
        <label htmlFor="password" className="mb-1 block text-sm text-[var(--color-muted)]">
          {t("auth.password")}
        </label>
        <input
          id="password"
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClassName}
        />
      </div>
      {error && (
        <p className="text-sm text-[var(--color-danger)]" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? t("auth.creatingAccount") : t("auth.createAccount")}
      </Button>
      <p className="text-center text-sm text-[var(--color-muted)]">
        {t("auth.hasAccount")}{" "}
        <Link href="/login" className="text-[var(--color-accent)] hover:underline">
          {t("auth.signIn")}
        </Link>
      </p>
    </form>
  );
}
