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
  additionalInfo: string;
}

export interface CvExperience {
  role: string;
  company: string;
  period: string;
  highlights: string[];
}

export interface CvDocument {
  version: 1;
  templateId: string;
  summary: string;
  experience: CvExperience[];
  skills: string[];
  education: string;
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
  { id: "cv-1", name: "Classic Professional", description: "Two-column with sidebar — default" },
  { id: "cv-2", name: "Modern Indigo", description: "Bold sidebar accent" },
  { id: "cv-3", name: "Minimal B&W", description: "Clean monochrome layout" },
  { id: "cv-4", name: "Creative Accent", description: "Color bar and modern type" },
  { id: "cv-5", name: "Executive", description: "Dark header, premium feel" },
  { id: "cv-6", name: "Tech Stack", description: "Developer-focused grid" },
  { id: "cv-7", name: "Elegant Serif", description: "Refined traditional style" },
  { id: "cv-8", name: "Compact", description: "Dense single-column" },
];

export const COVER_LETTER_TEMPLATES: TemplateMeta[] = [
  { id: "cl-1", name: "Formal Business", description: "Classic formal letter — default" },
  { id: "cl-2", name: "Modern Clean", description: "Minimal with accent line" },
  { id: "cl-3", name: "Informal Friendly", description: "Warm conversational tone" },
];

export const DEFAULT_CV_TEMPLATE = "cv-1";
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
  additionalInfo: "",
};
