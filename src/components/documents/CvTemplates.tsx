import type { ReactNode, FC } from "react";
import type { CvDocument, UserProfile } from "@/types/documents";
import { getContactPhone } from "@/lib/documents/profile";

export interface CvTemplateProps {
  data: CvDocument;
  profile: UserProfile;
  photoUrl?: string | null;
  jobTitle?: string;
  company?: string;
}

function ContactBlock({
  profile,
  className = "",
  light = false,
}: {
  profile: UserProfile;
  className?: string;
  light?: boolean;
}) {
  const text = light ? "text-white/90" : "text-slate-600";
  const contactPhone = getContactPhone(profile);
  return (
    <div className={`space-y-1 text-xs ${text} ${className}`}>
      {profile.email && <p>{profile.email}</p>}
      {contactPhone && <p>{contactPhone}</p>}
      {profile.location && <p>{profile.location}</p>}
      {profile.languages && <p>{profile.languages}</p>}
      {profile.linkedinUrl && <p className="truncate">{profile.linkedinUrl}</p>}
      {profile.website && <p className="truncate">{profile.website}</p>}
      {profile.githubUrl && <p className="truncate">{profile.githubUrl}</p>}
      {profile.extraLink && <p className="truncate">{profile.extraLink}</p>}
    </div>
  );
}

function Photo({ url, name, className = "" }: { url?: string | null; name: string; className?: string }) {
  if (!url) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={name}
      className={`rounded-lg object-cover ${className}`}
    />
  );
}

function SectionTitle({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <h3 className={`mb-2 text-xs font-bold uppercase tracking-widest ${className}`}>
      {children}
    </h3>
  );
}

/** cv-1 Classic Professional — default */
function CvClassic({ data, profile, photoUrl, jobTitle }: CvTemplateProps) {
  return (
    <div className="flex min-h-[600px] bg-white text-slate-800 shadow-sm">
      <aside className="w-[34%] bg-slate-100 p-6">
        <Photo url={photoUrl} name={profile.fullName} className="mx-auto mb-4 h-28 w-28" />
        <h1 className="text-xl font-bold text-slate-900">{profile.fullName || "Your Name"}</h1>
        <p className="mb-4 text-sm font-medium text-indigo-600">{profile.targetRole || jobTitle}</p>
        <SectionTitle className="text-slate-500">Contact</SectionTitle>
        <ContactBlock profile={profile} className="mb-5" />
        <SectionTitle className="text-slate-500">Skills</SectionTitle>
        <ul className="mb-5 flex flex-wrap gap-1">
          {data.skills.map((s) => (
            <li key={s} className="rounded bg-white px-2 py-0.5 text-xs">{s}</li>
          ))}
        </ul>
        {profile.additionalInfo && (
          <>
            <SectionTitle className="text-slate-500">Info</SectionTitle>
            <p className="text-xs leading-relaxed">{profile.additionalInfo}</p>
          </>
        )}
      </aside>
      <main className="flex-1 p-6">
        <SectionTitle className="text-indigo-600">Summary</SectionTitle>
        <p className="mb-5 text-sm leading-relaxed">{data.summary}</p>
        <SectionTitle className="text-indigo-600">Experience</SectionTitle>
        {data.experience.map((exp, i) => (
          <div key={i} className="mb-4">
            <p className="font-semibold">{exp.role}</p>
            <p className="text-xs text-slate-500">{exp.company} · {exp.period}</p>
            <ul className="mt-1 list-disc pl-4 text-sm">
              {exp.highlights.map((h, j) => <li key={j}>{h}</li>)}
            </ul>
          </div>
        ))}
        {data.jobHighlights.length > 0 && (
          <>
            <SectionTitle className="text-indigo-600">Role fit</SectionTitle>
            <ul className="list-disc pl-4 text-sm">
              {data.jobHighlights.map((h, i) => <li key={i}>{h}</li>)}
            </ul>
          </>
        )}
        {data.education && (
          <>
            <SectionTitle className="mt-4 text-indigo-600">Education</SectionTitle>
            <p className="text-sm">{data.education}</p>
          </>
        )}
      </main>
    </div>
  );
}

/** cv-2 Modern Indigo */
function CvModernIndigo({ data, profile, photoUrl, jobTitle }: CvTemplateProps) {
  return (
    <div className="flex min-h-[600px] bg-white text-slate-800">
      <aside className="w-[32%] bg-indigo-700 p-6 text-white">
        <Photo url={photoUrl} name={profile.fullName} className="mb-4 h-24 w-24 border-2 border-white/30" />
        <h1 className="text-lg font-bold">{profile.fullName || "Your Name"}</h1>
        <p className="mb-4 text-sm text-indigo-200">{profile.targetRole || jobTitle}</p>
        <SectionTitle className="text-indigo-200">Contact</SectionTitle>
        <ContactBlock profile={profile} light className="mb-4" />
        <SectionTitle className="text-indigo-200">Skills</SectionTitle>
        <div className="flex flex-wrap gap-1">
          {data.skills.map((s) => (
            <span key={s} className="rounded bg-indigo-600 px-2 py-0.5 text-xs">{s}</span>
          ))}
        </div>
      </aside>
      <main className="flex-1 p-8">
        <p className="mb-6 border-l-4 border-indigo-600 pl-4 text-sm italic leading-relaxed">{data.summary}</p>
        {data.experience.map((exp, i) => (
          <div key={i} className="mb-5">
            <h3 className="font-bold text-indigo-700">{exp.role}</h3>
            <p className="text-xs text-slate-500">{exp.company} | {exp.period}</p>
            <ul className="mt-2 space-y-1 text-sm">
              {exp.highlights.map((h, j) => <li key={j}>• {h}</li>)}
            </ul>
          </div>
        ))}
      </main>
    </div>
  );
}

/** cv-3 Minimal B&W */
function CvMinimal({ data, profile, photoUrl, jobTitle }: CvTemplateProps) {
  return (
    <div className="min-h-[600px] bg-white p-10 text-black">
      <div className="mb-6 flex items-center gap-6 border-b-2 border-black pb-6">
        <Photo url={photoUrl} name={profile.fullName} className="h-20 w-20 grayscale" />
        <div>
          <h1 className="text-3xl font-light tracking-tight">{profile.fullName || "Your Name"}</h1>
          <p className="text-sm uppercase tracking-[0.2em]">{profile.targetRole || jobTitle}</p>
          <p className="mt-2 text-xs">{[profile.email, getContactPhone(profile), profile.location].filter(Boolean).join(" · ")}</p>
        </div>
      </div>
      <p className="mb-6 text-sm leading-relaxed">{data.summary}</p>
      {data.experience.map((exp, i) => (
        <div key={i} className="mb-4">
          <p className="font-bold">{exp.role} — {exp.company}</p>
          <p className="text-xs text-gray-500">{exp.period}</p>
          <p className="mt-1 text-sm">{exp.highlights.join(" · ")}</p>
        </div>
      ))}
    </div>
  );
}

/** cv-4 Creative Accent */
function CvCreative({ data, profile, photoUrl, jobTitle }: CvTemplateProps) {
  return (
    <div className="min-h-[600px] bg-white">
      <div className="h-3 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-orange-400" />
      <div className="p-8">
        <div className="mb-6 flex gap-5">
          <Photo url={photoUrl} name={profile.fullName} className="h-24 w-24 rounded-full ring-4 ring-violet-100" />
          <div>
            <h1 className="bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-2xl font-bold text-transparent">
              {profile.fullName || "Your Name"}
            </h1>
            <p className="text-violet-600">{profile.targetRole || jobTitle}</p>
          </div>
        </div>
        <p className="mb-5 rounded-xl bg-violet-50 p-4 text-sm">{data.summary}</p>
        <div className="grid gap-4 md:grid-cols-2">
          {data.experience.map((exp, i) => (
            <div key={i} className="rounded-lg border border-violet-100 p-4">
              <p className="font-semibold text-violet-800">{exp.role}</p>
              <p className="text-xs text-slate-500">{exp.company}</p>
              <ul className="mt-2 text-sm">
                {exp.highlights.slice(0, 2).map((h, j) => <li key={j}>{h}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** cv-5 Executive */
function CvExecutive({ data, profile, photoUrl, jobTitle }: CvTemplateProps) {
  return (
    <div className="min-h-[600px] bg-white">
      <header className="bg-slate-900 px-8 py-6 text-white">
        <div className="flex items-center gap-5">
          <Photo url={photoUrl} name={profile.fullName} className="h-20 w-20 border border-slate-600" />
          <div>
            <h1 className="text-2xl font-semibold">{profile.fullName || "Your Name"}</h1>
            <p className="text-amber-400">{profile.targetRole || jobTitle}</p>
            <p className="mt-1 text-xs text-slate-400">{[profile.email, getContactPhone(profile)].filter(Boolean).join(" · ")}</p>
          </div>
        </div>
      </header>
      <div className="p-8">
        <p className="mb-6 text-sm leading-relaxed text-slate-700">{data.summary}</p>
        {data.experience.map((exp, i) => (
          <div key={i} className="mb-4 border-l-2 border-amber-500 pl-4">
            <p className="font-bold">{exp.role}</p>
            <p className="text-xs text-slate-500">{exp.company} · {exp.period}</p>
            <ul className="mt-1 list-disc pl-4 text-sm">
              {exp.highlights.map((h, j) => <li key={j}>{h}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

/** cv-6 Tech */
function CvTech({ data, profile, photoUrl, jobTitle }: CvTemplateProps) {
  return (
    <div className="min-h-[600px] bg-slate-950 p-8 font-mono text-green-400">
      <div className="mb-6 flex gap-4">
        <Photo url={photoUrl} name={profile.fullName} className="h-16 w-16 border border-green-500/50" />
        <div>
          <h1 className="text-xl text-green-300">{profile.fullName || "user.name"}</h1>
          <p className="text-sm text-green-500/80">{`// ${profile.targetRole || jobTitle}`}</p>
        </div>
      </div>
      <p className="mb-4 text-sm text-slate-300">{`> ${data.summary}`}</p>
      <p className="mb-2 text-xs text-green-600">const skills = [{data.skills.map((s) => `"${s}"`).join(", ")}];</p>
      {data.experience.map((exp, i) => (
        <div key={i} className="mb-3 border border-green-900 bg-slate-900 p-3 text-sm">
          <p className="text-green-300">{exp.role} @ {exp.company}</p>
          <p className="text-xs text-slate-500">{exp.period}</p>
          {exp.highlights.map((h, j) => <p key={j} className="text-slate-400">- {h}</p>)}
        </div>
      ))}
    </div>
  );
}

/** cv-7 Elegant Serif */
function CvElegant({ data, profile, photoUrl, jobTitle }: CvTemplateProps) {
  return (
    <div className="min-h-[600px] bg-[#faf8f5] p-10 font-serif text-stone-800">
      <div className="mb-8 text-center">
        <Photo url={photoUrl} name={profile.fullName} className="mx-auto mb-3 h-24 w-24 rounded-full" />
        <h1 className="text-3xl font-normal">{profile.fullName || "Your Name"}</h1>
        <p className="italic text-stone-500">{profile.targetRole || jobTitle}</p>
        <p className="mt-2 text-xs">{profile.email} · {profile.location}</p>
      </div>
      <hr className="mb-6 border-stone-300" />
      <p className="mb-6 text-center text-sm leading-relaxed">{data.summary}</p>
      {data.experience.map((exp, i) => (
        <div key={i} className="mb-4 text-center">
          <p className="font-semibold">{exp.role}</p>
          <p className="text-sm italic text-stone-500">{exp.company}, {exp.period}</p>
          <p className="mt-1 text-sm">{exp.highlights.join(" ")}</p>
        </div>
      ))}
    </div>
  );
}

/** cv-8 Compact */
function CvCompact({ data, profile, photoUrl, jobTitle }: CvTemplateProps) {
  return (
    <div className="min-h-[500px] bg-white p-6 text-xs text-slate-800">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold">{profile.fullName || "Your Name"}</h1>
          <p>{profile.targetRole || jobTitle} · {profile.location}</p>
          <p className="text-slate-500">{[profile.email, getContactPhone(profile)].filter(Boolean).join(" · ")}</p>
        </div>
        <Photo url={photoUrl} name={profile.fullName} className="h-14 w-14" />
      </div>
      <p className="mb-3 leading-relaxed">{data.summary}</p>
      <p className="mb-3 font-semibold">Skills: {data.skills.join(", ")}</p>
      {data.experience.map((exp, i) => (
        <p key={i} className="mb-1"><strong>{exp.role}</strong> ({exp.company}, {exp.period}) — {exp.highlights.join("; ")}</p>
      ))}
    </div>
  );
}

const CV_RENDERERS: Record<string, FC<CvTemplateProps>> = {
  "cv-1": CvClassic,
  "cv-2": CvModernIndigo,
  "cv-3": CvMinimal,
  "cv-4": CvCreative,
  "cv-5": CvExecutive,
  "cv-6": CvTech,
  "cv-7": CvElegant,
  "cv-8": CvCompact,
};

export function CvTemplateRenderer(props: CvTemplateProps) {
  const Renderer = CV_RENDERERS[props.data.templateId] ?? CvClassic;
  return <Renderer {...props} />;
}
