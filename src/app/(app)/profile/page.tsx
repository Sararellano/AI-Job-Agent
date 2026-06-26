import { loadAppUserContext } from "@/lib/server/app-data";
import { ProfileClient } from "@/components/profile/ProfileClient";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const ctx = await loadAppUserContext();
  if (!ctx) return null;

  return (
    <ProfileClient
      profile={ctx.profile}
      cvProfileExtraction={ctx.cvProfileExtraction}
      onboarding={ctx.onboarding}
      defaultCvInstructions={ctx.defaultCvInstructions}
      defaultCoverLetterInstructions={ctx.defaultCoverLetterInstructions}
      defaultCvPhotoUrl={ctx.defaultCvPhotoUrl}
      defaultCoverLetterPhotoUrl={ctx.defaultCoverLetterPhotoUrl}
      defaultCoverTemplateId={ctx.defaultCoverTemplateId}
    />
  );
}
