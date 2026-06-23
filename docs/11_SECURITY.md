# Seguridad

Guía de seguridad del AI Job Agent: controles implementados, riesgos conocidos y checklist de despliegue.

## Resumen

| Capa | Control |
|------|---------|
| Auth | Supabase Auth + middleware en rutas protegidas |
| Datos | Row Level Security (RLS) en todas las tablas |
| Storage | Buckets por usuario (`{user_id}/...`) |
| API | Verificación `getUser()` en cada route handler |
| Input | Validación centralizada en `src/lib/security/validation.ts` |
| IA | Rate limiting en endpoints costosos |
| HTTP | Security headers en `next.config.ts` |

## Autenticación y autorización

### Middleware (`src/middleware.ts`)

- Refresca la sesión Supabase en cada request.
- Redirige a `/login` si no hay usuario en `/dashboard` y `/onboarding`.
- Redirige a `/dashboard` si hay usuario en `/login` o `/register`.

### API routes

Todas las rutas bajo `src/app/api/` verifican sesión con `supabase.auth.getUser()` y devuelven `401 Unauthorized` si falla.

| Ruta | Método | Protección adicional |
|------|--------|----------------------|
| `/api/cv/upload` | POST | MIME + extensión, máx. 10 MB |
| `/api/cv/analyze` | POST | Rate limit: 5/min por usuario |
| `/api/cv/answers` | GET/POST | Respuestas validadas (`yes/somewhat/no/skip`) |
| `/api/documents/generate` | POST | UUID jobId, rate limit 10/min, instrucciones ≤ 8k |
| `/api/settings/instructions` | PUT | Perfil e instrucciones truncados |
| `/api/applications/status` | PATCH | UUID + status enum |
| `/api/applications/template` | PATCH | UUID + template allowlist |

## Row Level Security (Supabase)

### Tablas

- **jobs** — lectura para `authenticated` (catálogo compartido MVP).
- **user_document_settings** — CRUD solo filas con `auth.uid() = user_id`.
- **applications** — CRUD solo filas propias.

Migración `006_security_policies.sql` añade políticas `DELETE` que faltaban.

### Storage

| Bucket | Público | Política |
|--------|---------|----------|
| `cv-documents` | No | Solo el dueño lee/escribe en `{user_id}/` |
| `cv-photos` | Sí | Escritura solo en carpeta propia; lectura pública por URL |

> **Riesgo conocido:** las fotos de CV son accesibles por URL pública. No subas imágenes sensibles; considera bucket privado + signed URLs en producción.

## Variables de entorno

```env
# Cliente (públicas — protegidas por RLS)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Servidor (NUNCA exponer al cliente)
OPENAI_API_KEY=       # generación de documentos (opcional)
GROQ_API_KEY=         # análisis CV (opcional)
GEMINI_API_KEY=       # análisis CV fallback (opcional)
```

- `.env*.local` está en `.gitignore`.
- Las API keys de IA solo se leen en server-side (`route.ts`, `lib/ai/*`).
- No uses `NEXT_PUBLIC_` para secretos.

## Validación de inputs (`src/lib/security/validation.ts`)

- **UUID** en `jobId` antes de queries.
- **Templates** contra allowlist (`cv-1`…`cv-8`, `cl-1`…`cl-3`).
- **Uploads CV:** MIME y extensión deben coincidir (`.pdf`/`.docx`).
- **Fotos:** solo `image/jpeg|png|webp|gif`, máx. 5 MB.
- **Instrucciones:** truncadas a 8 000 caracteres (mitiga prompt injection y bloat).
- **Respuestas onboarding:** enum validado, máx. 50 claves.

## Rate limiting (`src/lib/security/rate-limit.ts`)

| Endpoint | Límite |
|----------|--------|
| `/api/cv/analyze` | 5 req/min por usuario |
| `/api/documents/generate` | 10 req/min por usuario |

Implementación in-memory (por instancia). En producción multi-instancia usar **Upstash Redis** o similar.

## HTTP security headers

Configurados en `next.config.ts`:

- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

## Principios de producto (seguridad)

- **Sin auto-apply** — el usuario controla cuándo aplicar.
- **Sin envío automático de CV** — reduce riesgo de spam y abuso.
- **CV parseado localmente** — el texto no sale del servidor salvo "Enhance with AI" (opt-in).

## Checklist de despliegue

- [ ] Ejecutar migraciones `001`–`006` en Supabase SQL Editor
- [ ] Confirmar RLS activo en las tres tablas
- [ ] Verificar buckets `cv-documents` (privado) y `cv-photos` (público)
- [ ] Rotar API keys si se filtraron en logs
- [ ] Habilitar **Leaked Password Protection** en Supabase Auth
- [ ] Configurar **email confirmation** en producción
- [ ] Revisar rate limits según tráfico esperado
- [ ] Considerar CSP estricta si se añaden scripts de terceros

## Mejoras futuras recomendadas

1. Rate limiting distribuido (Redis/Upstash).
2. Bucket privado para fotos + signed URLs.
3. Content-Security-Policy header.
4. Auditoría de logs en rutas de IA.
5. Tests de integración para API routes con sesión mock.
