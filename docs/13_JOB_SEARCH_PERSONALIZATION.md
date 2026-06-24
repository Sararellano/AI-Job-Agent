# Job Search Personalization

Documentación del sistema de personalización de búsqueda de empleo.

---

## Resumen

El sistema adapta qué ofertas se muestran a cada usuario según su perfil de CV, habilidades confirmadas y preferencias explícitas configuradas en el onboarding.

**Flujo:**
```
Onboarding (CV + Skills + Preferencias)
        ↓
JobPreferences guardadas en user_document_settings.job_preferences
        ↓
buildSearchKeywords(profile, "strict") → sync manual personalizado
buildSearchKeywords(profile, "broad")  → cron global
        ↓
scoreJobRelevance() → score 0–100 por oferta
        ↓
Dashboard: pestaña "Para ti" (filtrado) + "Todas" (sin filtro)
```

---

## Pasos del onboarding

| Paso | Componente | Qué guarda |
|------|-----------|------------|
| 1. Subir CV | `CvUploadStep` | `primary_track`, `skill_profile` inicial |
| 2. Revisar extracción | `ParseReviewStep` | Skills mejoradas (opcional IA) |
| 3. Preguntas sí/no | `SkillDiscoveryWizard` | `skill_profile` refinado |
| 4. Preferencias | `JobPreferencesStep` | `job_preferences`, `target_role` |

---

## Estructura `job_preferences`

Campo JSONB en `user_document_settings`.

```ts
interface JobPreferences {
  targetRoles: string[];       // ["Frontend Developer", "UI Engineer"]
  workMode: "remote" | "hybrid" | "onsite" | "any";
  seniority: "junior" | "mid" | "senior" | "lead" | "any";
  tracks: CareerTrack[];       // ["frontend", "fullstack"]
  includeProductRoles: boolean;
  includeDesignRoles: boolean;
  preferredLocations: string[]; // ["Madrid", "Remote EU"]
  excludedKeywords: string[];   // ["sales", "unpaid"]
  minMatchScore: number;        // 0–100, default 40
}
```

Migración: `supabase/migrations/008_job_preferences.sql`

---

## Motor de keywords

### Modo `broad` (cron diario)
- Incluye `DEFAULT_TECH_KEYWORDS` (~100 términos).
- Garantiza que la tabla global tenga variedad de ofertas.
- Controlado por `CRON_SECRET` en `.env`.

### Modo `strict` (sync manual de usuario)
- Solo términos derivados del perfil:
  - `targetRoles` de preferencias
  - `TRACK_ROLE_KEYWORDS[track]` para cada track seleccionado
  - Skills con confidence medium/high
  - `PRODUCT_KEYWORDS` si `includeProductRoles = true`
  - `DESIGN_KEYWORDS` si `includeDesignRoles = true`
- Excluye `excludedKeywords` del set final.
- Resultado: menos ruido, más relevancia.

```ts
buildSearchKeywords(profile, "strict") // sync manual
buildSearchKeywords(profile, "broad")  // cron
```

---

## Algoritmo de scoring

Implementado en `src/services/job-search/relevance.ts`.

| Señal | Puntos |
|-------|--------|
| Título coincide con `targetRoles` | +35 |
| Título contiene keyword del track | +25 |
| Cada skill confirmada en descripción | +8 (máx. 32) |
| Posting remoto con `workMode=remote` | +15 |
| Posting presencial con `workMode=remote` | −25 |
| Seniority coincide | +10 |
| Seniority no coincide (opuesto) | −10 |
| `excludedKeywords` en título o descripción | → `excluded: true`, score 0 |

**Rango final:** 0–100 (capped y redondeado).

---

## API endpoints

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/onboarding/preferences` | GET | Preferencias actuales + roles sugeridos del CV |
| `/api/onboarding/preferences` | POST | Guarda preferencias + `target_role` |
| `/api/jobs/matched` | GET | Ofertas rankeadas por relevancia para el usuario |
| `/api/jobs/matched?all=true` | GET | Todas las ofertas con score calculado |
| `/api/jobs/sync` | POST | Sync manual (modo strict) |

---

## Dashboard

### Pestaña "Para ti"
- Llama a `/api/jobs/matched`.
- Muestra solo ofertas con score ≥ `minMatchScore`.
- Ordenadas por score descendente.
- Badge de color por rango: verde ≥70, ámbar ≥45, gris <45.

### Pestaña "Todas"
- Llama a `/api/jobs/matched?all=true`.
- Muestra todas las ofertas de la tabla global.
- El badge de score sigue visible.

### Panel de preferencias
- Colapsable en el dashboard (`⚙ Preferencias de búsqueda`).
- Editable sin volver al onboarding.
- Al guardar, refresca automáticamente la pestaña activa.

---

## Variables `.env` relacionadas

```bash
# Cron (usa broad mode — sin perfil de usuario)
CRON_SECRET=random_secret
JOB_SYNC_KEYWORDS=devops,backend,product manager   # extras para cron

# Usuarios con sync manual (strict mode, usa sus preferencias)
# No necesitan vars adicionales si los portales no requieren API key
```

---

## Troubleshooting

| Síntoma | Causa probable | Solución |
|---------|---------------|----------|
| "Para ti" vacío | `minMatchScore` demasiado alto | Reducirlo a 20–30 en preferencias |
| Pocas ofertas en "Para ti" | Tracks o roles no configurados | Completar paso 4 del onboarding |
| Ruido en "Para ti" | Tracks demasiado amplios | Quitar `general` de los tracks seleccionados |
| Ofertas de ventas aparecen | `excludedKeywords` vacío | Añadir "sales", "account executive" etc. |
| Score siempre 0 | Perfil vacío | Completar onboarding (CV + preguntas + preferencias) |

---

## English summary

The personalization system has 5 layers:

1. **Onboarding step 4** captures `JobPreferences` (target roles, work mode, seniority, tracks, excluded terms, min score).
2. **`buildSearchKeywords`** has `"strict"` (profile-only) and `"broad"` (global defaults) modes.
3. **`scoreJobRelevance`** scores each job 0–100 against the profile.
4. **`GET /api/jobs/matched`** returns scored, filtered, ranked jobs for the current user.
5. **Dashboard** shows "For you" (filtered) and "All offers" (unfiltered) tabs with colour-coded badges.

Key files:
- `src/types/job-preferences.ts` — types + parsing + inference
- `src/services/job-search/keywords.ts` — keyword building (strict/broad)
- `src/services/job-search/relevance.ts` — scoring engine
- `src/app/api/jobs/matched/route.ts` — matched jobs API
- `src/components/onboarding/JobPreferencesStep.tsx` — onboarding step 4
- `src/components/dashboard/JobPreferencesEditor.tsx` — dashboard inline editor
- `src/components/dashboard/MatchScoreBadge.tsx` — score badge UI
- `supabase/migrations/008_job_preferences.sql` — DB migration
