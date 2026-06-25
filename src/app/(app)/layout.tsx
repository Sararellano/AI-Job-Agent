import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { loadAppUserContext } from "@/lib/server/app-data";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await loadAppUserContext();

  if (!ctx) {
    redirect("/login");
  }

  if (!ctx.onboarding.onboardingCompleted) {
    redirect("/onboarding");
  }

  return <AppShell userEmail={ctx.userEmail}>{children}</AppShell>;
}
