# Development Roadmap

## Sprint 1 — Base

- Next.js + TypeScript + Tailwind
- Supabase (Auth, DB)
- Registro y login
- Perfil usuario + idioma preferido para documentos

## Sprint 2 — CV

- Upload PDF
- CV Parser Agent
- Perfil estructurado guardado en BD

## Sprint 3 — Ofertas

- Conectores: Greenhouse, Lever, RemoteOK
- Guardado de ofertas entrantes
- Job deduplication básica

## Sprint 4 — Matching ✅ (parcialmente implementado)

- ~~Matching Agent~~ → scoring basado en reglas (sin IA, 0 tokens)
- Score 0–100 por oferta visible en dashboard
- Pestaña "Para ti" filtrada por score + pestaña "Todas"
- Preferencias de búsqueda: roles, modalidad, seniority, tracks, exclusiones
- Motor de keywords strict/broad (manual sync vs cron)
- Onboarding paso 4: JobPreferencesStep

Pendiente de Sprint 4:
- Campo "por qué me interesa" (explicación IA)
- Company Research Agent

## Sprint 5 — Empresa

- Company Research Agent
- Informe: summary, culture, benefits, flexibility, recommendation
- Vincular informe a cada oferta

## Sprint 6 — Documentos bajo demanda

- CV Generator Agent (solo cuando el usuario lo pide)
- Carta de presentación
- Selector de idioma por generación
- Export PDF

## Sprint 7 — Dashboard

- Tarjetas: score, empresa, por qué me interesa, CV, carta, estado
- Estados: Pendiente · Aplicada · Entrevista · Rechazada
- Historial y favoritos

## Sprint 8 — MVP

- Landing
- Registro público
- Email diario (resumen sin adjuntos)
- Métricas básicas de uso

## Post-MVP (opcional)

- Más conectores (Wellfound, LinkedIn, InfoJobs)
- Preparación de entrevistas
- Evaluación de conversión a SaaS
