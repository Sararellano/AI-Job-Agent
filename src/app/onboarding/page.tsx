import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingClient } from "@/components/onboarding/OnboardingClient";
import { settingsToOnboarding } from "@/lib/onboarding/state";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: settings } = await supabase
    .from("user_document_settings")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  const initial = settingsToOnboarding(settings);

  return (
    <main className="min-h-screen">
      <OnboardingClient initial={initial} />
    </main>
  );
}
