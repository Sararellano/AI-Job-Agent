import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <AuthPageShell titleKey="auth.signIn" subtitleKey="auth.signInSubtitle">
      <LoginForm />
    </AuthPageShell>
  );
}
