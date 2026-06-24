import type {
  EmploymentSector,
  RoleFamilyOption,
  SectorDefinition,
  UserCareerContext,
} from "@/types/career";
import { DEFAULT_CAREER_CONTEXT, TECH_ROLE_FAMILIES } from "@/types/career";
import type { CareerTrack, DiscoveryQuestion, ParsedCvLocal } from "@/types/skills";
import {
  TECH_IMPOSTER_QUESTIONS,
  TECH_SKILL_TAXONOMY,
  TECH_TRACK_SKILL_KEYS,
  type SkillTaxonomyEntry,
} from "@/lib/skills/sectors/tech";

interface SectorBundle {
  taxonomy: Record<string, SkillTaxonomyEntry>;
  roleSkillKeys: Record<string, string[]>;
  meritQuestions: DiscoveryQuestion[];
}

const GENERAL_ROLE: RoleFamilyOption = {
  id: "general",
  labelKey: "career.roleFamily.general",
};

export const SECTOR_DEFINITIONS: SectorDefinition[] = [
  {
    id: "tech",
    labelKey: "career.sector.tech",
    roleFamilies: TECH_ROLE_FAMILIES.map((id) => ({
      id,
      labelKey: `career.roleFamily.${id}`,
    })),
  },
  {
    id: "healthcare",
    labelKey: "career.sector.healthcare",
    roleFamilies: [
      { id: "nursing", labelKey: "career.roleFamily.nursing" },
      { id: "medical_tech", labelKey: "career.roleFamily.medical_tech" },
      { id: "healthcare_admin", labelKey: "career.roleFamily.healthcare_admin" },
      GENERAL_ROLE,
    ],
  },
  {
    id: "marketing",
    labelKey: "career.sector.marketing",
    roleFamilies: [
      { id: "digital_marketing", labelKey: "career.roleFamily.digital_marketing" },
      { id: "content", labelKey: "career.roleFamily.content" },
      { id: "brand", labelKey: "career.roleFamily.brand" },
      GENERAL_ROLE,
    ],
  },
  {
    id: "sales",
    labelKey: "career.sector.sales",
    roleFamilies: [
      { id: "b2b", labelKey: "career.roleFamily.b2b" },
      { id: "b2c", labelKey: "career.roleFamily.b2c" },
      { id: "account_management", labelKey: "career.roleFamily.account_management" },
      GENERAL_ROLE,
    ],
  },
  {
    id: "finance",
    labelKey: "career.sector.finance",
    roleFamilies: [
      { id: "accounting", labelKey: "career.roleFamily.accounting" },
      { id: "banking", labelKey: "career.roleFamily.banking" },
      { id: "fintech", labelKey: "career.roleFamily.fintech" },
      GENERAL_ROLE,
    ],
  },
  {
    id: "education",
    labelKey: "career.sector.education",
    roleFamilies: [
      { id: "teaching", labelKey: "career.roleFamily.teaching" },
      { id: "training", labelKey: "career.roleFamily.training" },
      { id: "academic", labelKey: "career.roleFamily.academic" },
      GENERAL_ROLE,
    ],
  },
  {
    id: "hospitality",
    labelKey: "career.sector.hospitality",
    roleFamilies: [
      { id: "food_service", labelKey: "career.roleFamily.food_service" },
      { id: "hotel", labelKey: "career.roleFamily.hotel" },
      { id: "tourism", labelKey: "career.roleFamily.tourism" },
      GENERAL_ROLE,
    ],
  },
  {
    id: "other",
    labelKey: "career.sector.other",
    roleFamilies: [GENERAL_ROLE],
  },
];

const EMPTY_BUNDLE: SectorBundle = {
  taxonomy: {},
  roleSkillKeys: { general: [] },
  meritQuestions: [],
};

const SECTOR_BUNDLES: Record<EmploymentSector, SectorBundle> = {
  tech: {
    taxonomy: TECH_SKILL_TAXONOMY,
    roleSkillKeys: TECH_TRACK_SKILL_KEYS,
    meritQuestions: TECH_IMPOSTER_QUESTIONS,
  },
  healthcare: EMPTY_BUNDLE,
  marketing: EMPTY_BUNDLE,
  sales: EMPTY_BUNDLE,
  finance: EMPTY_BUNDLE,
  education: EMPTY_BUNDLE,
  hospitality: EMPTY_BUNDLE,
  other: EMPTY_BUNDLE,
};

const VALID_SECTORS = new Set(SECTOR_DEFINITIONS.map((s) => s.id));

const TECH_TRACKS = new Set<CareerTrack>(TECH_ROLE_FAMILIES);

/**
 * Returns sector metadata for onboarding selectors.
 */
export function getSectorDefinitions(): SectorDefinition[] {
  return SECTOR_DEFINITIONS;
}

/**
 * Returns role families available for a sector.
 */
export function getRoleFamilies(sector: EmploymentSector): RoleFamilyOption[] {
  return (
    SECTOR_DEFINITIONS.find((s) => s.id === sector)?.roleFamilies ?? [
      GENERAL_ROLE,
    ]
  );
}

/**
 * Loads competency taxonomy for a sector.
 */
export function getTaxonomy(
  sector: EmploymentSector
): Record<string, SkillTaxonomyEntry> {
  return SECTOR_BUNDLES[sector]?.taxonomy ?? {};
}

/**
 * Returns skill keys associated with a role family within a sector.
 */
export function getRoleSkillKeys(
  sector: EmploymentSector,
  roleFamily: string
): string[] {
  const bundle = SECTOR_BUNDLES[sector] ?? EMPTY_BUNDLE;
  return bundle.roleSkillKeys[roleFamily] ?? bundle.roleSkillKeys.general ?? [];
}

/**
 * Returns merit / imposter questions for a sector.
 */
export function getMeritQuestions(sector: EmploymentSector): DiscoveryQuestion[] {
  return SECTOR_BUNDLES[sector]?.meritQuestions ?? [];
}

export function isValidSector(value: string): value is EmploymentSector {
  return VALID_SECTORS.has(value as EmploymentSector);
}

export function isValidRoleFamily(
  sector: EmploymentSector,
  roleFamily: string
): boolean {
  return getRoleFamilies(sector).some((r) => r.id === roleFamily);
}

/**
 * Infers sector and role family from parsed CV heuristics.
 */
export function inferCareerContext(
  parsed: ParsedCvLocal,
  existing?: Partial<UserCareerContext>
): UserCareerContext {
  const hasTechSignals =
    parsed.detectedSkills.length > 0 ||
    (parsed.primaryTrack !== "general" && TECH_TRACKS.has(parsed.primaryTrack));

  const inferredSector: EmploymentSector = hasTechSignals ? "tech" : "other";
  const inferredRoleFamily = hasTechSignals
    ? parsed.primaryTrack
    : "general";
  const inferredTargetRole = parsed.roles[0]?.title ?? "";

  return {
    sector: existing?.sector ?? inferredSector,
    roleFamily: existing?.roleFamily ?? inferredRoleFamily,
    targetRole: existing?.targetRole ?? inferredTargetRole,
  };
}

export function careerContextFromSettings(
  settings: {
    sector?: string | null;
    role_family?: string | null;
    target_role?: string | null;
  } | null
): UserCareerContext {
  if (!settings) return { ...DEFAULT_CAREER_CONTEXT };

  const sector = isValidSector(settings.sector ?? "")
    ? (settings.sector as EmploymentSector)
    : DEFAULT_CAREER_CONTEXT.sector;

  const roleFamily =
    settings.role_family &&
    isValidRoleFamily(sector, settings.role_family)
      ? settings.role_family
      : getRoleFamilies(sector)[0]?.id ?? "general";

  return {
    sector,
    roleFamily,
    targetRole: settings.target_role ?? "",
  };
}
