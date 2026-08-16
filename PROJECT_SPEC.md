# Crowdsourced Civic Issue Reporting System — Project Spec (Hackathon MVP)

## Goal
Build a mobile-first platform where citizens report civic issues (potholes, garbage,
broken streetlights, water leaks) with a photo and location, see them on a live map,
and track status. Admins see all reports on a dashboard and update their status.

## Core Features (MUST HAVE — this is the whole MVP)
Citizen:
- Submit report: photo + auto-GPS location + text description
- AI auto-fills category and urgency (no manual dropdown needed)
- See own submitted reports and their current status
- View live map of all reports

Admin:
- Login (separate from citizen accounts)
- Dashboard: table of all reports with filters (category, status)
- Update report status
- Live map view

## Explicitly OUT OF SCOPE for MVP (do not build unless MVP is fully done and tested)
- Voice input for reports
- Push/email/SMS notifications
- Department-staff role (only "citizen" and "admin" roles exist)
- Duplicate-issue detection / geospatial clustering
- Analytics/charts dashboard
- Mapbox (use free Leaflet + OpenStreetMap instead — no API key, no billing risk)
- PostGIS (use plain lat/lng float columns + a simple Haversine distance function
  in JS/SQL if distance comparison is ever needed — no special DB extension)

## Technology
- Frontend: Next.js (App Router), Tailwind CSS
- Backend: Next.js Route Handlers (API routes)
- Database + Auth + Storage: Supabase (free tier)
- Map: Leaflet.js + OpenStreetMap tiles (free, no key)
- AI: Groq API (primary), Gemini API (fallback) — used only for classifying
  report text into category + urgency. No custom-trained model.
- Deployment: Vercel (free tier)

## User Roles
- citizen
- admin

## Report Lifecycle
SUBMITTED → ACKNOWLEDGED → IN_PROGRESS → RESOLVED

## Issue Categories
Sanitation, Roads, Electricity, Water, Other

## Database Tables (only these — do not add more without asking)
- profiles (id, role, created_at)
- reports (id, user_id, photo_url, description, category, urgency, lat, lng,
  status, created_at)
- report_updates (id, report_id, old_status, new_status, changed_at) — optional,
  only if time allows after core loop works

## Definition of Done for the MVP
A citizen can submit a report on a phone browser, it appears on the live map within
seconds, an admin can log in, see it in a table, change its status, and the citizen
can see the updated status — and all of this works on the deployed Vercel URL, not
just localhost.
