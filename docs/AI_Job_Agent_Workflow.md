# AI Job Agent - Workflow

## Idea principal

No es un generador de CV.

Es un **recruiter personal con IA que trabaja para ti**: encuentra vacantes,
filtra dónde merece la pena gastar energía y prepara candidaturas solo cuando
tú decides aplicar.

---

## Principios

- Producto **100 % gratuito**
- El usuario **elige** en qué empresas solicitar
- **Nunca** se envía CV ni se rellenan formularios automáticamente
- CV y carta se generan **bajo demanda**, en el **idioma que el usuario elija**

---

# Workflow general

## 1. Onboarding del usuario

El usuario introduce:

- Nombre y datos profesionales
- Puesto objetivo
- Experiencia y tecnologías
- Idiomas
- Preferencias salariales
- Ubicación
- Remoto / híbrido / presencial
- Tipo de empresa deseada
- **Idioma preferido para documentos** (ej. español, inglés)

Sube su CV actual en PDF.

La IA transforma la información en un perfil estructurado:

```
User Profile
- Skills
- Experience
- Seniority
- Preferences
- Keywords
- Preferred document language
```

---

## 2. Motor de búsqueda de ofertas

El sistema busca diariamente en:

**Primera fase:**

- RemoteOK
- We Work Remotely
- Wellfound
- Greenhouse
- Lever
- Workable

**Segunda fase:**

- LinkedIn
- InfoJobs
- Otros portales

---

## 3. Cuando entra una oferta

### Paso A — Guardar

```json
{
  "company": "X",
  "role": "Frontend Developer",
  "description": "...",
  "url": "...",
  "source": "greenhouse"
}
```

### Paso B — Agente de investigación de empresa

Analiza:

- Web corporativa
- Página careers
- Reviews públicas
- LinkedIn de la empresa
- Beneficios

Devuelve:

```json
{
  "summary": "",
  "culture": "",
  "benefits": [],
  "flexibility": "",
  "recommendation": "apply"
}
```

`recommendation` puede ser: `apply` · `reconsider` · `skip`

### Paso C — Agente de compatibilidad

Compara oferta vs perfil del usuario.

Genera:

- Match score (0–100)
- Skills coincidentes
- Skills faltantes
- **"Por qué me interesa"** — texto que combina encaje técnico + valor de la empresa

Ejemplo:

```
Score: 91/100

Por qué me interesa:
- Stack React + TypeScript encaja con tu perfil
- Empresa remota-first con flexibilidad alta
- Cultura orientada a producto, beneficios de formación
- Recomendación empresa: apply
```

---

## 4. Usuario decide (control total)

El dashboard muestra la oferta con score, empresa e informe.

El usuario:

1. Revisa si merece la pena gastar energía
2. Si quiere aplicar → solicita CV y/o carta
3. Elige idioma de generación (puede diferir del idioma de la oferta)
4. Descarga documentos y **aplica manualmente** en el portal
5. Actualiza el estado en el dashboard

**No hay envío automático ni auto-fill.**

---

## 5. Generación de candidatura (bajo demanda)

Solo cuando el usuario lo pide, la IA crea:

- CV adaptado a la oferta (reorganiza y enfatiza; no inventa experiencia)
- Carta de presentación
- En el idioma seleccionado por el usuario

---

## 6. Dashboard

### Ofertas nuevas

Cada tarjeta muestra:

| Campo | Descripción |
|-------|-------------|
| Score | Compatibilidad 0–100 |
| Empresa | Nombre + resumen del informe |
| Rol | Puesto |
| Por qué me interesa | Match + contexto empresa |
| CV generado | Link si el usuario lo solicitó |
| Carta generada | Link si el usuario la solicitó |
| Estado | Pendiente · Aplicada · Entrevista · Rechazada |

### Estados

- **Pendiente** — oferta revisada, sin acción aún
- **Aplicada** — usuario aplicó manualmente
- **Entrevista** — proceso en curso
- **Rechazada** — descartada por empresa o por el usuario

---

## 7. Notificaciones

Email diario (resumen, sin adjuntar CV):

```
Encontradas 5 oportunidades nuevas

1. Frontend Developer @ Empresa X — Score 94%
   Por qué: stack encaja + empresa remota recomendada

2. React Engineer @ Empresa Y — Score 88%
   Por qué: seniority match + buena cultura detectada
```

Incluye links a la oferta y al dashboard. Los documentos se generan solo
cuando el usuario entra y los solicita.

---

# Arquitectura técnica MVP

| Capa | Tecnología |
|------|------------|
| Frontend | Next.js |
| Backend | Supabase (Auth, DB, Storage, Edge Functions) |
| IA | Claude / OpenAI API |
| Automatización | n8n (jobs diarios, emails) |
| Deploy | Vercel |

---

# Hoja de ruta de desarrollo

| Semana | Objetivo |
|--------|----------|
| 1 | Next.js, Supabase, login, perfil, subida CV |
| 2 | Parsing PDF, perfil estructurado |
| 3 | Conectores ofertas (Greenhouse, Lever, RemoteOK) |
| 4 | Matching, score, "por qué me interesa" |
| 5 | Agente empresa (informe completo) |
| 6 | Generador CV + carta bajo demanda, selector de idioma |
| 7 | Dashboard con estados |
| 8 | Landing, registro, email diario |

---

# Evolución futura (post-MVP)

- Preparación de entrevistas
- Simulación de entrevistas con IA
- Recomendaciones de formación según skills faltantes
- Predicción de rango salarial
- Posible conversión a SaaS si valida valor personalmente
