# Project Progress — Civic Issue Reporting System

## Stack
Next.js (App Router) + Supabase (DB/Auth/Storage) + Leaflet/OSM (map) +
Groq primary / Gemini fallback (AI classification) + Vercel (deploy)

## Status by phase

- [x] Phase 1 to 10 — Core MVP (Auth, Map, Report Form, AI, Tracking, Admin/Worker Dashboards, Vercel Deploy) — DONE
- [x] RLS Hardening — Database locked down and secure — DONE

## Remaining Features (from Hackathon Problem Statement)

1. **"Widget for Phone" (PWA)**
   - Need to implement Progressive Web App (PWA) manifest and service worker so the web app can be "installed" on a phone home screen as a native-feeling app/widget.
2. **Voice Explanation**
   - "short text or voice explanation"
   - Add a microphone button to the report form to capture audio, upload it to Supabase Storage, and perhaps transcribe it using Groq/Whisper for the AI to classify.
3. **Automated Routing to Departments**
   - "Automated routing directs each report to the relevant department... allocate tasks to departments."
   - Need to add logic that takes the AI `category` and automatically assigns the report to a specific department (e.g., Sanitation, Roads). 
4. **Analytics Dashboard**
   - "deliver analytics and reporting features that offer insights into reporting trends..."
   - Add a `/admin/analytics` page with charts showing issue volume, average resolution time, and heatmaps.
5. **Notifications**
   - "receive notifications through each stage"
   - Add email/SMS notifications or in-app push notifications using Supabase Realtime when status changes.

## Immediate Next Step
Implement the "Widget for Phone" (PWA) functionality to give the app a native mobile feel.
