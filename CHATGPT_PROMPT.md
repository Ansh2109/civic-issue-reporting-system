I am building a crowdsourced Civic Issue Reporting System (a hackathon MVP). I need your help to continue building out the remaining features. Here is a complete overview of the project's current state, architecture, and what we have built so far.

### Tech Stack
- **Frontend/Framework:** Next.js (App Router), React, Tailwind CSS
- **Backend/Database:** Supabase (PostgreSQL, Supabase Auth, Supabase Storage)
- **Mapping:** Leaflet.js with OpenStreetMap (via `react-leaflet`)
- **AI Integration:** Groq (`llama3-8b-8192`) as primary, Gemini (`gemini-1.5-flash`) as fallback.
- **Deployment:** Vercel

### Database Architecture & Security
- `profiles` table: `id` (auth.uid), `full_name`, `phone_number`, `role` ('citizen', 'admin', 'worker'), `department`.
- `reports` table: `id`, `ticket_number` (auto-incrementing sequence `CR-0025`), `user_id`, `photo_url`, `description`, `lat`, `lng`, `category`, `urgency` (1-5), `assigned_department`, `status` ('SUBMITTED', 'IN_PROGRESS', 'RESOLVED').
- **Security (RLS):** Strict Row Level Security is implemented. Citizens can only update their own profile contact info. A PostgreSQL trigger prevents users from escalating their own roles. Users can only insert reports if authenticated, but anyone can read reports.

### Features Implemented So Far
1. **Authentication & Profile Gate:** Users sign in via Google OAuth. If they are a new user, they are forced through a `/complete-profile` route to provide their name and phone number before they can access the app.
2. **Citizen Report Form:** A mobile-first reporting flow where users can:
   - Capture a photo using their device camera (uploaded to Supabase Storage).
   - Automatically pull exact GPS coordinates.
   - Enter a description manually OR use a **Real-Time Voice Dictation** button that leverages the native browser Web Speech API to transcribe voice-to-text in real-time.
3. **Automated AI Routing Engine:** When a report is submitted, the description is sent to a custom Next.js `/api/classify` route. The LLM (Groq/Gemini) analyzes the text, assigns a standardized `category` (e.g., pothole, garbage), determines `urgency`, and outputs an `assigned_department` (e.g., Sanitation, Roads & Transport).
4. **Live Interactive Map:** A public-facing map (`/map`) plots all reports as color-coded pins based on status, with popups showing the issue photo and details.
5. **Role-Based Dashboards:** 
   - **Admins:** Have a powerful dashboard to view all reports across the city, see which department the AI routed them to, and change ticket statuses.
   - **Workers:** Have a filtered dashboard that only shows reports routed to their specific `department`.

### What is Remaining (My Current Goals)
We have successfully built the core MVP. To fully satisfy the hackathon problem statement, we need to build the following remaining features:
1. **PWA (Progressive Web App):** Generate a `manifest.json` and configure Next.js so citizens can "Add to Home Screen" and use it as a native phone widget.
2. **Analytics & Reporting Dashboard:** Build an `/admin/analytics` page with charts (e.g., Recharts or Chart.js) showing issue volume by category, department response times, and overall system effectiveness.
3. **Automated Notifications:** Implement a system (possibly using Supabase Realtime or simple email webhooks) to notify citizens when the status of their specific ticket changes from Submitted -> In Progress -> Resolved.

Based on this context, please acknowledge you understand the architecture, and then let me know how we should approach building the **PWA (Progressive Web App)** implementation first.
