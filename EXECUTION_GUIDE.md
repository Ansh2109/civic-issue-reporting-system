# Execution Guide — Civic Issue Reporting App

One primary tool (Antigravity, free), Cursor/Ollama as emergency fallback only.
Follow phases in order. **Do not start a phase until the previous one is verified.**
Commit to git after every verified phase — this is your safety net.

Suggested timing for a 48-hour hackathon: Phases 0-6 by end of Day 1. Phases 7-12
on Day 2, leaving the last few hours only for demo prep, not new features.

---

## Phase 0 — Setup (before opening any AI tool) — ~30 min

1. Create a GitHub repo: `civic-issue-reporting-system`
2. Clone it locally: `git clone YOUR_REPO_URL && cd civic-issue-reporting-system`
3. Create `PROJECT_SPEC.md` and `AGENTS.md` in the root (use the two files from
   this conversation — copy them in as-is).
4. Create a Supabase project at supabase.com (free tier). Note down the Project
   URL and anon key from Project Settings → API.
5. Get a free Groq API key at console.groq.com, and a free Gemini key at
   aistudio.google.com. Save both somewhere safe — you'll need them in Phase 5.
6. Commit: `git add . && git commit -m "add spec files" && git push`

**Verify:** repo exists on GitHub with your two spec files visible in it, and you
have three credentials saved (Supabase URL+key, Groq key, Gemini key).

---

## Phase 1 — Architecture plan (read-only, no code) — ~15 min

Open Antigravity in the cloned repo folder. Give this prompt:

```
Read PROJECT_SPEC.md and AGENTS.md before doing anything else.

Do NOT write any code yet.

Based on PROJECT_SPEC.md, propose:
1. The Next.js App Router folder structure
2. The exact database schema (tables, columns, types) for profiles and reports
3. The list of pages needed for citizen and admin
4. The list of API routes needed

Keep it as simple as possible for a hackathon MVP. Do not include anything listed
under "OUT OF SCOPE" in PROJECT_SPEC.md.
```

**Verify:** Read the plan yourself. Does it match the spec (no Mapbox, no
notifications, no department roles)? If it adds scope-creep, tell it explicitly:
"Remove X, that's out of scope per PROJECT_SPEC.md" before moving on. This step
costs almost no quota and prevents wasted work later — don't skip it.

---

## Phase 2 — Project foundation — ~20 min

```
Implement Phase 1 of the approved plan.

Create the Next.js application foundation:
- Next.js App Router, Tailwind CSS, ESLint
- Basic layout and navigation

Create placeholder routes only (empty pages with a heading is fine for now):
/report
/map
/my-reports
/admin/login
/admin/dashboard

Run npm install, npm run lint, npm run build, and fix any errors before finishing.

Do not implement Supabase, AI, or the map yet — just the page skeleton.
```

**Verify:**
```bash
npm run dev
```
Open http://localhost:3000 and manually click through to each of the 5 routes
above — every one should load without a crash (even if it's just a blank page
with a heading). If any route 404s or crashes, fix that before continuing.

Commit: `git add . && git commit -m "project foundation" && git push`

---

## Phase 3 — Supabase connection — ~15 min

```
Create lib/supabase.js — a Supabase client that reads NEXT_PUBLIC_SUPABASE_URL
and NEXT_PUBLIC_SUPABASE_ANON_KEY from environment variables and exports a
configured client.

Also create a .env.local.example file listing the required variable names
WITHOUT real values, and confirm .env.local is in .gitignore.
```

Then manually create `.env.local` (this file should NOT be committed) with your
real Supabase URL and anon key.

**Verify:** run `git status` — `.env.local` should NOT appear as a file to be
committed. If it does, stop and fix `.gitignore` before continuing (this is how
API keys leak).

---

## Phase 4 — Database schema — ~15 min

```
Based on PROJECT_SPEC.md, write the SQL to create these tables in Supabase:
- profiles (id uuid primary key, role text check (role in ('citizen','admin')),
  created_at timestamp default now())
- reports (id uuid primary key default gen_random_uuid(), user_id uuid,
  photo_url text, description text, category text, urgency int, lat float8,
  lng float8, status text default 'SUBMITTED', created_at timestamp default now())

Output the SQL only, formatted so I can paste it directly into the Supabase SQL
editor. Do not run it yourself.
```

**Verify:** Copy the SQL into Supabase → SQL Editor → Run. Go to Table Editor and
confirm both tables exist with the right columns. This manual step is
intentional — you want to see the schema succeed with your own eyes before any
code depends on it.

Also: Supabase Dashboard → Storage → New bucket → name it `report-photos` →
make it public.

---

## Phase 5 — Citizen: submit a report — ~30 min

```
Build the /report page for citizens to submit a civic issue:
- Photo upload (single image)
- Text description field
- Auto-capture GPS location via navigator.geolocation
- On submit: upload photo to the "report-photos" Supabase storage bucket, then
  insert a row into "reports" with the photo URL, description, lat, lng, and
  status "SUBMITTED"
- Show a success message with the new report's id after submission

Use the client from lib/supabase.js. Handle the case where geolocation permission
is denied with a clear error message, not a silent failure.
```

**Verify:** On your phone or laptop browser, actually submit a test report with
a real photo. Then check Supabase Table Editor → reports — confirm a new row
appeared with correct data, and Storage → report-photos — confirm the photo file
is there. This is the most important checkpoint in the whole project — if this
doesn't work, nothing downstream will either.

Commit: `git commit -m "citizen report submission working" && git push`

---

## Phase 6 — AI classification — ~20 min

```
Create app/api/classify/route.js — a POST endpoint that accepts { description }
and calls the Groq API (chat completions, model "llama-3.3-70b-versatile", key
from GROQ_API_KEY env var) asking it to classify the text into one of:
Sanitation, Roads, Electricity, Water, Other, and rate urgency 1-5. Require the
model to respond with ONLY valid JSON: { "category": string, "urgency": number }.
Parse and return that JSON. If the Groq call fails or the response isn't valid
JSON, retry once with the Gemini API (key from GEMINI_API_KEY env var) using the
same prompt and format, as a fallback.

Then update the /report page so that before inserting the report, it calls this
endpoint with the description and saves the returned category and urgency into
the reports table row.
```

Add `GROQ_API_KEY` and `GEMINI_API_KEY` to `.env.local`.

**Verify:** Submit another test report with an obvious description like "large
pothole on main road, cars swerving dangerously." Check the new row in Supabase —
category should be "Roads" and urgency should be high (4 or 5). If it's wrong or
empty, check your terminal/browser console for the actual API error before
re-prompting.

---

## Phase 7 — Live map — ~25 min

```
Build /map showing all reports from the "reports" table as pins on a Leaflet map
using react-leaflet with OpenStreetMap tiles (no API key). Add 'use client' at the
top and use a dynamic import for the map component to avoid server-rendering
errors. Each pin's popup should show the photo, description, category, and
status. Center the map on India by default if there are no reports yet.
```

**Verify:** Open /map in the browser — you should see a real map (not a blank
box) with at least one pin from your Phase 5/6 test reports. Click the pin —
the popup should show the correct data. If the map is blank, check the browser
console for a Leaflet CSS or hydration error and give that exact error back to
the AI tool.

Commit: `git commit -m "live map working" && git push`

---

## Phase 8 — Admin login + dashboard — ~30 min

```
Build:
1. /admin/login — email+password login using Supabase Auth, redirect to
   /admin/dashboard on success
2. /admin/dashboard — protected page (redirect to login if not authenticated)
   showing all reports in a table (photo thumbnail, description, category,
   urgency, status, created date) with a status dropdown per row that updates
   the reports table immediately on change. Add simple filters for category
   and status above the table.
```

Manually create one admin user: Supabase Dashboard → Authentication → Users →
Add User, with an email/password your team will use in the demo.

**Verify:** Log in with that admin account. Confirm the dashboard shows your test
reports. Change a status in the dropdown, then check Supabase Table Editor —
confirm the status column actually updated in the database, not just visually
on screen.

Commit: `git commit -m "admin dashboard working" && git push`

---

## Phase 9 — Citizen report tracking — ~20 min

```
Build /my-reports showing the logged-in citizen's own submitted reports with
their current status. Build /track/[id] showing a single report's status as a
simple visual progress indicator: SUBMITTED → ACKNOWLEDGED → IN_PROGRESS →
RESOLVED. Link to this from the success message on /report after submission.
```

**Verify:** Submit a new report, follow the tracking link, confirm it shows
"SUBMITTED." Then go to /admin/dashboard and change that report's status.
Refresh the tracking page — it should now show the updated status.

Commit: `git commit -m "citizen tracking working" && git push`

---

## Phase 10 — Deploy — ~15 min

```bash
git add . && git commit -m "MVP feature-complete" && git push
```
Go to vercel.com → New Project → import your GitHub repo. In Environment
Variables, add all four: `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `GROQ_API_KEY`, `GEMINI_API_KEY`. Deploy.

**Verify:** Open the live Vercel URL and redo the FULL journey there — submit a
report, check the map, log into admin, update status, check tracking page.
Do not assume "it worked locally" means it works deployed — missing env vars on
Vercel is the #1 cause of live-demo failures.

---

## Phase 11 — Polish pass (only if time remains) — ~30-60 min

```
Do a UI polish pass on all pages for mobile screens (360px-414px width):
thumb-friendly buttons, clear loading states, clear empty states (e.g. "no
reports yet"), and consistent spacing. Do not change any backend logic or
database calls — UI/styling only.
```

**Verify:** Resize your browser to a phone width (or use actual phone) and click
through every page again. Nothing should overflow or become unreadable.

---

## Phase 12 — Demo prep — ~20 min

Write and rehearse this exact 90-second flow:
1. Submit a report live (with a real photo, on stage/camera)
2. Show it appear on the map within seconds
3. Switch to admin dashboard, find that report
4. Update its status
5. Switch to the tracking page — show the citizen sees the update

Prepare 2 slides listing what's "roadmap" (voice input, notifications, analytics,
duplicate detection) — framing scope cuts as deliberate design decisions, not
missing work.

---

## If you hit an Antigravity quota lockout mid-project

1. Switch to Cursor (free tier) or GitHub Copilot (free via Student Pack) and
   give it the **exact same next prompt** you were about to give Antigravity —
   both tools can read PROJECT_SPEC.md and AGENTS.md the same way.
2. If both are unavailable, install Ollama locally and pull a coding model
   (e.g. `ollama pull qwen2.5-coder`) — slower and weaker, but free and offline,
   good enough for the smaller, well-scoped prompts in this guide.
3. Never switch tools mid-phase without committing first — always finish and
   verify the current phase, commit, then switch tools for the next one.
