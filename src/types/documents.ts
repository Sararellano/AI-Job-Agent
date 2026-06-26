export interface UserProfile {
  fullName: string;
  targetRole: string;
  email: string;
  phone: string;
  mobile: string;
  languages: string;
  location: string;
  linkedinUrl: string;
  website: string;
  githubUrl: string;
  extraLink: string;
  salaryRange: string;
  additionalInfo: string;
}

export type DocumentLanguage = "en" | "es";

export interface CvEducation {
  degree: string;
  institution: string;
  period: string;
  location: string;
}

export interface CvExperience {
  role: string;
  company: string;
  period: string;
  location: string;
  highlights: string[];
}

export interface CvDocument {
  version: 1;
  templateId: string;
  summary: string;
  experience: CvExperience[];
  skills: string[];
  education: CvEducation[];
  jobHighlights: string[];
}

export interface CoverLetterDocument {
  version: 1;
  templateId: string;
  date: string;
  greeting: string;
  paragraphs: string[];
  closing: string;
}

export type DocumentFormat = "pdf" | "docx" | "txt";

export interface TemplateMeta {
  id: string;
  name: string;
  description: string;
}

export const CV_TEMPLATES: TemplateMeta[] = [
  {
    id: "cv-ats",
    name: "ATS Friendly",
    description: "Single-column black and white layout optimized for ATS parsers",
  },
];

export const COVER_LETTER_TEMPLATES: TemplateMeta[] = [
  { id: "cl-1", name: "Formal Business", description: "Classic formal letter — default" },
  { id: "cl-2", name: "Modern Clean", description: "Minimal with accent line" },
  { id: "cl-3", name: "Informal Friendly", description: "Warm conversational tone" },
];

export const DEFAULT_CV_TEMPLATE = "cv-ats";
export const DEFAULT_COVER_TEMPLATE = "cl-1";

export const EMPTY_PROFILE: UserProfile = {
  fullName: "",
  targetRole: "",
  email: "",
  phone: "",
  mobile: "",
  languages: "",
  location: "",
  linkedinUrl: "",
  website: "",
  githubUrl: "",
  extraLink: "",
  salaryRange: "",
  additionalInfo: "",
};

export const EMPTY_CV_EDUCATION: CvEducation = {
  degree: "",
  institution: "",
  period: "",
  location: "",
};

export const EMPTY_CV_EXPERIENCE: CvExperience = {
  role: "",
  company: "",
  period: "",
  location: "",
  highlights: [],
};
