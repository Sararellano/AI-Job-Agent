import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-[var(--color-card-border)] bg-[var(--color-card)] p-8">
        <h1 className="mb-1 text-2xl font-semibold">AI Job Agent</h1>
        <p className="mb-6 text-sm text-[var(--color-muted)]">
          Sign in to your personal recruiter dashboard
        </p>
        <LoginForm />
      </div>
    </main>
  );
}
