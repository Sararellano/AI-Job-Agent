import type { CareerTrack } from "@/types/skills";

export type EmploymentSector =
  | "tech"
  | "healthcare"
  | "marketing"
  | "sales"
  | "finance"
  | "education"
  | "hospitality"
  | "other";

export interface UserCareerContext {
  sector: EmploymentSector;
  roleFamily: string;
  targetRole: string;
}

export interface RoleFamilyOption {
  id: string;
  /** i18n key under career.roleFamily.* */
  labelKey: string;
}

export interface SectorDefinition {
  id: EmploymentSector;
  /** i18n key under career.sector.* */
  labelKey: string;
  roleFamilies: RoleFamilyOption[];
}

export const TECH_ROLE_FAMILIES: CareerTrack[] = [
  "frontend",
  "backend",
  "fullstack",
  "devops",
  "mobile",
  "data",
  "general",
];

export const DEFAULT_CAREER_CONTEXT: UserCareerContext = {
  sector: "tech",
  roleFamily: "general",
  targetRole: "",
};
