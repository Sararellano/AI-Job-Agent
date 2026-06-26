import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingClient } from "@/components/onboarding/OnboardingClient";
import { settingsToOnboarding } from "@/lib/onboarding/state";
import { resolveCvExtraction } from "@/lib/cv/resolve-cv-extraction";
import { normalizeCvProfileExtraction } from "@/lib/cv/normalize-extraction";
import { ensureUserSettings } from "@/lib/server/app-data";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const settings = await ensureUserSettings(supabase, user.id);
  const initial = settingsToOnboarding(settings);
  const cvProfileExtraction =
    resolveCvExtraction(settings) ?? normalizeCvProfileExtraction(null);

  return (
    <main className="min-h-screen">
      <OnboardingClient
        initial={initial}
        initialCvExtraction={cvProfileExtraction}
      />
    </main>
  );
}
