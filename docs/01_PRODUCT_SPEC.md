# Product Spec

## Objetivo

Crear un recruiter personal con IA que trabaje para el candidato.

No es solo una herramienta para buscar trabajo. Filtra dónde merece la
pena gastar energía: encuentra ofertas, evalúa compatibilidad, investiga
la empresa y prepara candidaturas solo cuando el usuario decide aplicar.

## Propuesta de valor

| Problema | Solución |
|----------|----------|
| Demasiadas ofertas irrelevantes | Score + ranking por compatibilidad |
| Aplicar sin conocer la empresa | Informe de empresa antes de decidir |
| CV genérico para todas las candidaturas | CV y carta adaptados bajo demanda |
| Perder el control del proceso | El usuario elige en qué empresas solicitar |

## Usuario

Necesita:

- Encontrar ofertas compatibles con su perfil
- Saber si una empresa merece la pena antes de aplicar
- Entender por qué una oferta le interesa (o no)
- Generar CV y carta en el idioma que elija
- Decidir manualmente dónde aplicar, sin envíos automáticos

## Principios del producto

- **Gratuito:** sin planes de pago, créditos ni paywalls
- **Control del usuario:** nunca se envía un CV ni se rellena un formulario
  automáticamente
- **Calidad sobre cantidad:** filtrar empresas, no spamear candidaturas
- **Idioma a elección:** el usuario elige en qué idioma generar CV y carta

## MVP

Incluye:

- Registro y perfil profesional
- Upload CV (PDF)
- Búsqueda diaria de ofertas
- Guardado de ofertas entrantes
- Agente de investigación de empresa
- Match score con explicación ("por qué me interesa")
- CV adaptado (generado bajo demanda, idioma elegido por el usuario)
- Carta de presentación (generada bajo demanda, idioma elegido por el usuario)
- Dashboard con estados de seguimiento
- Email diario con resumen de nuevas oportunidades (sin adjuntar CV)

## Dashboard MVP

Pantalla principal — **Ofertas nuevas**

Cada tarjeta muestra:

- Score de compatibilidad
- Empresa
- Rol
- "Por qué me interesa" (match + informe empresa)
- CV generado (si el usuario lo solicitó)
- Carta generada (si el usuario la solicitó)
- Estado: Pendiente · Aplicada · Entrevista · Rechazada

## Flujo cuando entra una oferta

1. **Guardar oferta**

```json
{
  "company": "X",
  "role": "Frontend Developer",
  "description": "...",
  "url": "..."
}
```

2. **Agente de empresa** analiza:

- Web corporativa
- Página careers
- Reviews públicas
- LinkedIn de la empresa
- Beneficios detectados

3. **Devuelve informe**

```json
{
  "summary": "",
  "culture": "",
  "benefits": [],
  "flexibility": "",
  "recommendation": "apply"
}
```

4. **Agente de matching** compara oferta vs perfil → score + "por qué me interesa"

5. **Usuario decide** si merece la pena → opcionalmente genera CV/carta en su idioma

## No incluye

- Monetización ni planes de pago
- Envío automático de CV
- Auto-fill en formularios de portales
- Bots agresivos en LinkedIn
- Aplicación automática en ningún portal
