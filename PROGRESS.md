# Project Progress — Civic Issue Reporting System

Paste this whole file into a new chat/tool if you switch accounts, so it can
pick up exactly where you left off.

## Stack
Next.js (App Router) + Supabase (DB/Auth/Storage) + Leaflet/OSM (map) +
Groq primary / Gemini fallback (AI classification) + Vercel (deploy)

## Repo
https://github.com/Ansh2109/civic-issue-reporting-system

## Status by phase

- [x] Phase 0 — GitHub repo, Supabase project, Groq + Gemini keys — DONE
- [x] Phase 1 — Architecture plan reviewed — DONE
- [x] Phase 2 — Next.js skeleton + placeholder pages — DONE
- [x] Phase 2b — Design/theme pass — DONE (minimalist theme applied)
- [x] Phase 3 — lib/supabase.js client + .env.local set up — DONE
- [x] Phase 4 — Database schema (profiles, reports, report_updates tables +
      report-photos storage bucket) — DONE
      Known fixes already applied:
      - RLS policies added for public insert/select on reports + storage
        (citizens aren't authenticated yet, so anon access is allowed for now)
      - reports.user_id made nullable (will be set once Phase 8 auth exists)
- [x] Phase 5 — Citizen report submission (components/ReportForm.js) — DONE
      and verified working end to end (photo upload, GPS, Supabase insert
      all confirmed working)
- [~] Phase 6 — AI classification (app/api/classify/route.js) — CODE COMPLETE
      but NOT YET VERIFIED WORKING. Route exists with Groq primary / Gemini
      fallback logic, and ReportForm.js has been updated to call it before
      insert. Currently returning fallback values ("Other"/3) instead of real
      classification on test submissions — debugging why the classify call is
      failing (check GROQ_API_KEY / GEMINI_API_KEY are set in .env.local and
      dev server was restarted after adding them; check Network tab for the
      actual /api/classify error response).
- [ ] Phase 7 — Live map (Leaflet + OpenStreetMap) — NOT STARTED
- [ ] Phase 8 — Admin login + dashboard — NOT STARTED
- [ ] Phase 9 — Citizen report tracking (/my-reports, /track/[id]) — NOT
      STARTED, OK TO SKIP if time is short
- [ ] Phase 10 — Deploy to Vercel — NOT STARTED
- [ ] Phase 11 — Mobile polish pass — NOT STARTED, OK TO SKIP if time is short
- [ ] Phase 12 — Demo rehearsal — NOT STARTED

## Known issues / things to remember
- Supabase RLS is currently wide open (public insert/select) — fine for
  hackathon demo, but if there's time, tighten update/delete policies once
  admin auth (Phase 8) exists so only admins can change report status.
- report_updates table exists in the DB but isn't being used by any code yet
  — optional, only wire it up if time allows after core MVP works.
- Windows line-ending warnings (LF→CRLF) appear on git commits — harmless,
  ignore them.

## Tools used so far
- Antigravity (hit quota limit during Phase 6)
- Cursor (hit quota limit shortly after, mid-Phase 6)
- Gemini 3.1 Pro in Antigravity (used to finish wiring ReportForm.js to the
  classify endpoint)

## Immediate next step
Debug why /api/classify is returning fallback values instead of real
Groq/Gemini classification — most likely an env var / server restart issue.
Once fixed and verified, move to Phase 7 (live map).
