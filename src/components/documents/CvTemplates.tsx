import type { ReactNode } from "react";
import type { CvDocument, UserProfile } from "@/types/documents";
import { getContactPhone } from "@/lib/documents/profile";

export interface CvTemplateProps {
  data: CvDocument;
  profile: UserProfile;
  photoUrl?: string | null;
  jobTitle?: string;
  company?: string;
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h3 className="mb-2 border-b border-black pb-1 text-xs font-bold uppercase tracking-widest text-black">
      {children}
    </h3>
  );
}

function formatMetaLine(parts: (string | undefined | null)[]): string {
  return parts.filter(Boolean).join(" · ");
}

/** cv-ats — single-column ATS-friendly layout */
function CvAts({ data, profile, photoUrl, jobTitle }: CvTemplateProps) {
  const role = profile.targetRole || jobTitle || "";
  const contact = [
    profile.email,
    getContactPhone(profile),
    profile.location,
    profile.languages,
    profile.linkedinUrl,
    profile.website,
    profile.githubUrl,
  ].filter(Boolean);

  const skillsLine = data.skills.join(", ");

  return (
    <div className="min-h-[600px] bg-white p-10 font-sans text-sm text-black">
      <header className="mb-6 flex items-start justify-between gap-6 border-b border-black pb-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight text-black">
            {profile.fullName || "Your Name"}
          </h1>
          {role && (
            <p className="mt-1 text-sm font-semibold uppercase tracking-wide text-black">
              {role}
            </p>
          )}
          {contact.length > 0 && (
            <p className="mt-2 text-xs leading-relaxed text-black">
              {contact.join(" · ")}
            </p>
          )}
        </div>
        {photoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoUrl}
            alt={profile.fullName || "Profile photo"}
            className="h-24 w-24 shrink-0 rounded-full border border-black object-cover"
          />
        )}
      </header>

      {data.summary && (
        <section className="mb-5">
          <SectionTitle>Professional Summary</SectionTitle>
          <p className="leading-relaxed text-black">{data.summary}</p>
        </section>
      )}

      {skillsLine && (
        <section className="mb-5">
          <SectionTitle>Skills</SectionTitle>
          <p className="leading-relaxed text-black">{skillsLine}</p>
        </section>
      )}

      {data.experience.some((e) => e.role || e.company) && (
        <section className="mb-5">
          <SectionTitle>Experience</SectionTitle>
          {data.experience.map((exp, i) => {
            if (!exp.role && !exp.company) return null;
            return (
              <div key={i} className="mb-4">
                <p className="font-semibold text-black">{exp.role}</p>
                <p className="text-xs text-black">
                  {formatMetaLine([exp.company, exp.period, exp.location])}
                </p>
                {exp.highlights.length > 0 && (
                  <ul className="mt-1 list-disc pl-4 text-black">
                    {exp.highlights.map((h, j) => (
                      <li key={j}>{h}</li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </section>
      )}

      {data.education.some((e) => e.degree || e.institution) && (
        <section className="mb-5">
          <SectionTitle>Education</SectionTitle>
          {data.education.map((edu, i) => {
            if (!edu.degree && !edu.institution) return null;
            return (
              <div key={i} className="mb-2">
                <p className="font-semibold text-black">{edu.degree}</p>
                <p className="text-xs text-black">
                  {formatMetaLine([edu.institution, edu.period, edu.location])}
                </p>
              </div>
            );
          })}
        </section>
      )}

      {data.jobHighlights.length > 0 && (
        <section>
          <SectionTitle>Role Fit</SectionTitle>
          <ul className="list-disc pl-4 text-black">
            {data.jobHighlights.map((h, i) => (
              <li key={i}>{h}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

const CV_RENDERERS: Record<string, typeof CvAts> = {
  "cv-ats": CvAts,
};

export function CvTemplateRenderer(props: CvTemplateProps) {
  const Renderer = CV_RENDERERS[props.data.templateId] ?? CvAts;
  return <Renderer {...props} />;
}
