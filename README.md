# AI Job Agent

Generate tailored CVs and cover letters for each job application — paste a link or description, customize, download, and apply manually.

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run migrations in order in the SQL Editor (`supabase/migrations/001` through `011`)
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

Open [http://localhost:3000](http://localhost:3000) → register → `/onboarding` → `/profile`.

### Optional AI

```env
GROQ_API_KEY=...   # https://console.groq.com
GEMINI_API_KEY=... # https://aistudio.google.com
```

Used for optional CV enhance, job URL scraping, and document generation.

## Workflow

1. **Onboarding** — upload CV, answer skill questions, complete profile
2. **Profile** (`/profile`) — contact details, default CV/cover instructions, photo
3. **New application** (`/jobs/new`) — paste job URL (scraped with AI) or description manually
4. **Workspace** (`/applications/[id]`) — generate, edit, and download CV + cover letter
5. **Applications** (`/applications`) — list all your applications and document status

## Testing

```bash
npm test
npm run test:watch
```

## Stack

Next.js 15 · TypeScript · Tailwind CSS · Supabase · Vitest

## Documentation

See [docs/00_README_START_HERE.md](docs/00_README_START_HERE.md) for the full doc index.
