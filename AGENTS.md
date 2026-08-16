# Agent Instructions

You are working on the Crowdsourced Civic Issue Reporting System (hackathon MVP).

Before writing or changing any code:
1. Read PROJECT_SPEC.md in full.
2. Inspect the existing repository/files before assuming anything is missing.
3. Do not rewrite or restructure working code unless explicitly asked.
4. Do not add features listed under "OUT OF SCOPE" in PROJECT_SPEC.md, even if they
   seem easy or like a nice addition. Ask first.
5. Do not introduce new dependencies, libraries, or paid APIs not already listed in
   PROJECT_SPEC.md without explaining why and asking first.
6. Keep components simple and modular — one clear responsibility per file.
7. Never hardcode secrets (API keys, Supabase keys). Always read from environment
   variables. Never commit .env or .env.local files.
8. Validate all user input on report submission (non-empty description, valid
   coordinates, reasonable image file size/type).
9. Handle loading, error, and empty states in every page — don't leave a blank
   screen if data hasn't loaded or a request failed.
10. After finishing a task, briefly summarize: what files you changed, what you
    tested, and anything still incomplete or risky.
11. Prefer small, testable changes over large multi-file rewrites. If a task feels
    like it needs 10+ file changes at once, stop and propose breaking it into
    smaller steps first.

Technology (do not substitute without asking):
- Next.js App Router, Tailwind CSS
- Supabase (Postgres, Auth, Storage)
- Leaflet.js + OpenStreetMap (NOT Mapbox)
- Groq API primary, Gemini API fallback for text classification only

Never expose these to the browser/client:
- GROQ_API_KEY
- GEMINI_API_KEY
- SUPABASE_SERVICE_ROLE_KEY (if used — prefer anon key + RLS policies for MVP)

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
