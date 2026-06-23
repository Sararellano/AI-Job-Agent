# AI Job Agent

Personal AI recruiter dashboard — free, user-controlled job application tool.

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run migrations in order in the SQL Editor:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_photo_upload.sql`
   - `supabase/migrations/003_profile_and_templates.sql`
   - `supabase/migrations/004_github_extra_link.sql`
   - `supabase/migrations/005_cv_onboarding.sql`
   - `supabase/migrations/006_security_policies.sql`
3. Enable Email auth in Authentication → Providers
4. Copy project URL and anon key to `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
OPENAI_API_KEY=optional_for_real_ai_generation
```

### 3. Run dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) → register → `/onboarding` or dashboard.

### Optional AI (CV analysis only)

```env
GROQ_API_KEY=...   # https://console.groq.com — llama-3.1-8b-instant
# or
GEMINI_API_KEY=... # https://aistudio.google.com
```

One API call per "Enhance with AI" click. The rest runs locally with zero tokens.

## Testing

```bash
npm test           # run all unit tests
npm run test:watch # watch mode
```

**40+ tests** covering CV parsing, skill discovery, document parsing, security validation, and rate limiting. See [docs/12_TESTING.md](docs/12_TESTING.md).

## Security

- **Auth** — Supabase + middleware on `/dashboard` and `/onboarding`
- **RLS** — users only access their own settings and applications
- **Storage** — CV documents private per user; photos public by URL (see docs)
- **API** — session check on every route; input validation and rate limits on AI endpoints
- **Headers** — `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`

Full guide: [docs/11_SECURITY.md](docs/11_SECURITY.md)

## Onboarding (`/onboarding`)

1. **Upload CV** — PDF/DOCX, parsed locally (`pdf-parse` + `mammoth`)
2. **Review** — track, skills, confidence; optional Groq/Gemini enhance
3. **Skill discovery** — yes/no questions from taxonomy (e.g. `.yml` → YAML)
4. **Evidence profile** — saved to Supabase, shown on dashboard

## Features

- **Auth** — register / login with Supabase
- **Dashboard** — all job offers with company, role, salary, summary, full description
- **Default instructions** — global CV and cover letter generation rules
- **Per-offer generation** — override instructions per company (e.g. blue CV with photo vs B&W English)
- **Status tracking** — Pending, Applied, Interview, Rejected

## Stack

Next.js 15 · TypeScript · Tailwind CSS · Supabase · Vitest

## Documentation

See [docs/00_README_START_HERE.md](docs/00_README_START_HERE.md) for the full doc index.
