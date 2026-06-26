"use client";

import { useState } from "react";
import { inputClassName, textareaClassName } from "@/lib/ui/input-styles";
import { cn } from "@/lib/utils";
import { useT } from "@/contexts/LocaleProvider";
import { Button } from "@/components/ui/Button";
import { PhotoUploadField } from "@/components/dashboard/PhotoUploadField";
import { CvProfileEditor } from "@/components/dashboard/CvProfileEditor";
import type { UserProfile } from "@/types/documents";
import type { CvProfileExtraction } from "@/types/skills";
import {
  COVER_LETTER_TEMPLATES,
  DEFAULT_COVER_TEMPLATE,
} from "@/types/documents";

interface DefaultInstructionsSectionProps {
  initialProfile: UserProfile;
  initialCvExtraction: CvProfileExtraction;
  initialCvInstructions: string;
  initialCoverLetterInstructions: string;
  initialCvPhotoUrl?: string | null;
  initialCoverLetterPhotoUrl?: string | null;
  initialCoverTemplateId?: string;
  onSaved?: (data: {
    profile: UserProfile;
    cvExtraction: CvProfileExtraction;
    cv: string;
    cover: string;
    cvPhoto: string | null;
    coverPhoto: string | null;
    coverTemplateId: string;
  }) => void;
}

/**
 * Dashboard section for shared profile, CV data and cover letter defaults.
 */
export function DefaultInstructionsSection({
  initialProfile,
  initialCvExtraction,
  initialCvInstructions,
  initialCoverLetterInstructions,
  initialCvPhotoUrl = null,
  initialCoverLetterPhotoUrl = null,
  initialCoverTemplateId = DEFAULT_COVER_TEMPLATE,
  onSaved,
}: DefaultInstructionsSectionProps) {
  const t = useT();
  const [cvExtraction, setCvExtraction] = useState(initialCvExtraction);
  const [coverLetterInstructions, setCoverLetterInstructions] = useState(
    initialCoverLetterInstructions
  );
  const [cvPhotoUrl, setCvPhotoUrl] = useState<string | null>(initialCvPhotoUrl);
  const [coverPhotoUrl, setCoverPhotoUrl] = useState<string | null>(
    initialCoverLetterPhotoUrl
  );
  const [coverTemplateId, setCoverTemplateId] = useState(initialCoverTemplateId);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setMessage(null);

    const res = await fetch("/api/settings/instructions", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        profile: cvExtraction.profile,
        cv_profile_extraction: cvExtraction,
        default_cv_instructions: initialCvInstructions,
        default_cover_letter_instructions: coverLetterInstructions,
        default_cv_photo_url: cvPhotoUrl,
        default_cover_letter_photo_url: coverPhotoUrl,
        default_cover_letter_template_id: coverTemplateId,
      }),
    });

    setSaving(false);

    if (res.ok) {
      setMessage(t("defaults.saved"));
      onSaved?.({
        profile: cvExtraction.profile,
        cvExtraction,
        cv: initialCvInstructions,
        cover: coverLetterInstructions,
        cvPhoto: cvPhotoUrl,
        coverPhoto: coverPhotoUrl,
        coverTemplateId,
      });
    } else {
      const data = (await res.json()) as { error?: string };
      setMessage(data.error ?? t("defaults.saveFailed"));
    }
  }

  return (
    <section className="surface-card p-6">
      <h2 className="mb-1 text-lg font-semibold">{t("defaults.title")}</h2>
      <p className="mb-5 text-sm text-[var(--color-muted)]">
        {t("defaults.subtitle")}
      </p>

      <CvProfileEditor value={cvExtraction} onChange={setCvExtraction} disabled={saving} />

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <PhotoUploadField
          label={t("defaults.cvPhoto")}
          storagePath="default-cv"
          photoUrl={cvPhotoUrl}
          onPhotoChange={setCvPhotoUrl}
          disabled={saving}
        />
        <div>
          <label htmlFor="default-cover" className="mb-2 block text-sm font-medium">
            {t("defaults.coverInstructions")}
          </label>
          <select
            value={coverTemplateId}
            onChange={(e) => setCoverTemplateId(e.target.value)}
            className={cn("mb-2", inputClassName)}
          >
            {COVER_LETTER_TEMPLATES.map((tpl) => (
              <option key={tpl.id} value={tpl.id}>
                {tpl.name} — {tpl.description}
              </option>
            ))}
          </select>
          <textarea
            id="default-cover"
            rows={5}
            value={coverLetterInstructions}
            onChange={(e) => setCoverLetterInstructions(e.target.value)}
            placeholder="e.g. One page, formal tone..."
            className={textareaClassName}
          />
          <PhotoUploadField
            label={t("defaults.coverPhoto")}
            storagePath="default-cover"
            photoUrl={coverPhotoUrl}
            onPhotoChange={setCoverPhotoUrl}
            disabled={saving}
          />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <Button type="button" onClick={handleSave} disabled={saving}>
          {saving ? t("defaults.saving") : t("defaults.save")}
        </Button>
        {message && (
          <span className="text-sm text-[var(--color-muted)]">{message}</span>
        )}
      </div>
    </section>
  );
}
