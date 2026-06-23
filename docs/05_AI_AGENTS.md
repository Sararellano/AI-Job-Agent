# Agentes IA

## Orden de ejecución por oferta entrante

```
Oferta guardada → Company Research Agent → Matching Agent → (usuario decide) → CV Generator Agent
```

---

## CV Parser Agent

**Cuándo:** onboarding, al subir CV

**Input:** PDF del CV

**Output:**

```json
{
  "experience": [],
  "skills": [],
  "education": [],
  "languages": [],
  "seniority": ""
}
```

---

## Company Research Agent

**Cuándo:** cada vez que entra una oferta nueva

**Input:**

```json
{
  "company": "X",
  "role": "Frontend Developer",
  "description": "...",
  "url": "..."
}
```

**Fuentes analizadas:**

- Web corporativa
- Página careers
- Reviews públicas
- LinkedIn de la empresa
- Beneficios detectados en fuentes públicas

**Output:**

```json
{
  "summary": "",
  "culture": "",
  "benefits": [],
  "flexibility": "",
  "recommendation": "apply"
}
```

`recommendation`: `apply` | `reconsider` | `skip`

Este agente es el diferenciador central: filtra dónde merece la pena
gastar energía.

---

## Matching Agent

**Cuándo:** después del informe de empresa

**Input:** perfil usuario + oferta + informe empresa

**Output:**

```json
{
  "score": 91,
  "strengths": ["React", "TypeScript"],
  "weaknesses": ["AWS no aparece en CV"],
  "why_interesting": "Stack encaja con tu perfil. Empresa remota-first con flexibilidad alta y recomendación apply."
}
```

`why_interesting` alimenta el campo **"Por qué me interesa"** del dashboard.

---

## CV Generator Agent

**Cuándo:** solo bajo demanda, cuando el usuario decide aplicar

**Input:**

- Perfil usuario
- Oferta
- Informe empresa
- **Idioma elegido por el usuario** (ej. `es`, `en`)

**Output:**

- CV adaptado (PDF)
- Carta de presentación (PDF)

**Reglas:**

- No inventar experiencia ni skills
- Reorganizar y enfatizar lo relevante para la oferta
- Respetar el idioma seleccionado por el usuario

**No hace:** enviar documentos, auto-fill ni aplicar en portales.
