import type { FC } from "react";
import type { CoverLetterDocument, UserProfile } from "@/types/documents";
import { getContactPhone } from "@/lib/documents/profile";

export interface CoverTemplateProps {
  data: CoverLetterDocument;
  profile: UserProfile;
  photoUrl?: string | null;
  company?: string;
  jobTitle?: string;
}

/** cl-1 Formal Business — default */
function CoverFormal({ data, profile, company, jobTitle }: CoverTemplateProps) {
  return (
    <div className="min-h-[500px] bg-white p-10 text-slate-800 shadow-sm">
      <div className="mb-8 text-sm text-slate-500">
        <p className="font-semibold text-slate-900">{profile.fullName}</p>
        <p>{profile.targetRole}</p>
        <p>{[profile.email, getContactPhone(profile)].filter(Boolean).join(" · ")}</p>
        <p>{profile.location}</p>
        <p className="mt-4">{data.date}</p>
      </div>
      <p className="mb-4 font-semibold">{company}{jobTitle && ` — ${jobTitle}`}</p>
      <p className="mb-4">{data.greeting}</p>
      {data.paragraphs.map((p, i) => (
        <p key={i} className="mb-4 text-sm leading-relaxed">{p}</p>
      ))}
      <p className="mt-6 whitespace-pre-line text-sm">{data.closing}</p>
    </div>
  );
}

/** cl-2 Modern Clean */
function CoverModern({ data, profile, photoUrl, company }: CoverTemplateProps) {
  return (
    <div className="min-h-[500px] bg-white p-10">
      <div className="mb-6 h-1 w-20 bg-indigo-600" />
      <div className="mb-6 flex items-center gap-4">
        {photoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt="" className="h-14 w-14 rounded-full object-cover" />
        )}
        <div>
          <h2 className="text-xl font-bold text-slate-900">{profile.fullName}</h2>
          <p className="text-sm text-indigo-600">{company}</p>
        </div>
      </div>
      <p className="mb-4 text-xs text-slate-400">{data.date}</p>
      <p className="mb-4 font-medium">{data.greeting}</p>
      {data.paragraphs.map((p, i) => (
        <p key={i} className="mb-4 text-sm leading-7 text-slate-700">{p}</p>
      ))}
      <p className="mt-8 whitespace-pre-line border-t pt-4 text-sm">{data.closing}</p>
    </div>
  );
}

/** cl-3 Informal Friendly */
function CoverInformal({ data, profile, company }: CoverTemplateProps) {
  return (
    <div className="min-h-[500px] rounded-2xl bg-amber-50 p-10 text-stone-800">
      <p className="mb-2 text-sm text-amber-700">{data.date}</p>
      <p className="mb-6 text-lg font-medium">Hi there 👋</p>
      <p className="mb-2 text-sm text-stone-500">Re: {company}</p>
      {data.paragraphs.map((p, i) => (
        <p key={i} className="mb-4 text-sm leading-relaxed">{p}</p>
      ))}
      <p className="mt-6 text-sm">
        Cheers,<br />
        <span className="font-semibold">{profile.fullName || "Your Name"}</span>
      </p>
      <p className="mt-2 text-xs text-stone-500">{[profile.email, getContactPhone(profile)].filter(Boolean).join(" · ")}</p>
    </div>
  );
}

const COVER_RENDERERS: Record<string, FC<CoverTemplateProps>> = {
  "cl-1": CoverFormal,
  "cl-2": CoverModern,
  "cl-3": CoverInformal,
};

export function CoverLetterTemplateRenderer(props: CoverTemplateProps) {
  const Renderer = COVER_RENDERERS[props.data.templateId] ?? CoverFormal;
  return <Renderer {...props} />;
}
