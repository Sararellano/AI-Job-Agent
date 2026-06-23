# Testing

Guía de tests unitarios del AI Job Agent.

## Comandos

```bash
npm test          # ejecuta todos los tests una vez
npm run test:watch  # modo watch durante desarrollo
```

## Stack

- **Vitest** — runner y assertions
- **Node environment** — sin jsdom (solo lógica pura)
- Config: `vitest.config.ts` (alias `@/*` → `src/*`)

## Cobertura actual

| Módulo | Archivo de test | Qué valida |
|--------|-----------------|------------|
| CV heuristics | `src/lib/cv/parse-heuristics.test.ts` | Track, skills, emails, señales |
| CV text | `src/lib/cv/extract-text.test.ts` | Truncado y normalización |
| Question engine | `src/lib/skills/question-engine.test.ts` | Cola de preguntas, perfil, respuestas |
| Parse content | `src/lib/documents/parse-content.test.ts` | JSON + legacy markdown |
| Profile | `src/lib/documents/profile.test.ts` | Mapeo settings ↔ perfil |
| Onboarding state | `src/lib/onboarding/state.test.ts` | Estado desde DB |
| Security validation | `src/lib/security/validation.test.ts` | UUID, templates, uploads, answers |
| Rate limit | `src/lib/security/rate-limit.test.ts` | Límites por ventana |

**Total:** 8 archivos, ~40 tests.

## Qué no está cubierto (aún)

- API routes (`src/app/api/*`) — requieren mocks de Supabase
- Componentes React — requieren Testing Library + jsdom
- Integración IA (`lib/ai/*`) — dependen de APIs externas
- Export PDF/DOCX — dependen del DOM

## Añadir un test

1. Crear `*.test.ts` junto al módulo o en la misma carpeta.
2. Importar desde `@/lib/...` usando el alias.
3. Ejecutar `npm test` para verificar.

Ejemplo mínimo:

```ts
import { describe, expect, it } from "vitest";
import { myFunction } from "@/lib/my-module";

describe("myFunction", () => {
  it("returns expected value", () => {
    expect(myFunction("input")).toBe("output");
  });
});
```

## CI recomendado

```yaml
- run: npm test
- run: npm run lint
- run: npm run build
```

Ejecutar tests en cada PR evita regresiones en la lógica de CV, skills y validación de seguridad.
