# Arquitectura técnica

## Stack

Frontend: - Next.js - TypeScript - Tailwind

Backend: - Supabase - PostgreSQL - Storage - Edge Functions

IA: - Claude API / OpenAI API

Automatización: - n8n

Deploy: - Vercel

Testing: - Vitest (unit tests en `src/**/*.test.ts`)

## Flujo

Usuario -\> Next.js -\> Supabase -\> AI Agents -\> Database -\> Email

## Servicios

Auth: Supabase Auth

CV: Supabase Storage

Jobs: Tabla jobs

IA: Servicios separados (orden por oferta):

1.  Company research agent — informe empresa
2.  Matching agent — score + "por qué me interesa"
3.  CV parser — onboarding
4.  Document generator — bajo demanda, idioma del usuario

Producto gratuito. Sin envío automático de CV ni auto-fill.

## Seguridad

Ver `11_SECURITY.md` para el detalle completo.

- **Middleware** — sesión Supabase + redirect en rutas protegidas
- **RLS** — `user_document_settings` y `applications` scoped por `auth.uid()`
- **API** — `getUser()` en cada route; validación en `src/lib/security/`
- **Rate limits** — `/api/cv/analyze` (5/min), `/api/documents/generate` (10/min)
- **Headers** — `X-Frame-Options`, `X-Content-Type-Options`, etc. en `next.config.ts`

## Testing

Ver `12_TESTING.md`.

```bash
npm test
```

Cobertura: CV heuristics, question engine, document parsing, security validation.
