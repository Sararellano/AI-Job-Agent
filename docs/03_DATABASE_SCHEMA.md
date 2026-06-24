# Supabase Database Schema

## jobs

```
id
title
company
description
summary              -- short offer summary for dashboard
salary               -- nullable, e.g. "45.000 – 55.000 €"
url
source
requirements
created_at
```

## user_document_settings

Default generation instructions and onboarding state per user.

```
id
user_id              -- unique, references auth.users
default_cv_instructions
default_cover_letter_instructions
updated_at
-- CV & onboarding (migration 005)
cv_file_url
cv_file_name
cv_parsed_raw
cv_parsed_structured  -- jsonb: ParsedCvLocal
primary_track         -- detected career track
skill_profile         -- jsonb: SkillEvidence[]
question_answers      -- jsonb: Record<string, QuestionAnswer>
ai_cv_analysis        -- jsonb: AiCvAnalysis (optional)
onboarding_completed  -- boolean
onboarding_step       -- int (0–4)
-- Job search personalization (migration 008)
job_preferences       -- jsonb: JobPreferences (targetRoles, workMode, seniority, tracks…)
```

## applications

Per-job tracking, instruction overrides, and generated content.

```
id
job_id
user_id
status                -- pending | applied | interview | rejected
cv_instructions       -- override for this offer (nullable → use defaults)
cover_letter_instructions
custom_cv_content     -- generated CV text
cover_letter_content  -- generated cover letter text
document_language
created_at
updated_at
```

Unique constraint: `(job_id, user_id)`

## Migration

Run `supabase/migrations/001_initial_schema.sql` in Supabase SQL Editor.

## Notas

- Producto gratuito — sin tablas de suscripciones
- CV y carta solo se generan cuando el usuario pulsa el botón
- Instrucciones por oferta sobrescriben las defaults solo para esa empresa
