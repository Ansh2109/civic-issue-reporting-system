-- ==============================================================================
-- PHASE 1.5: SUPABASE SECURITY & RLS HARDENING
-- ==============================================================================

-- 1. Create a secure function to fetch user roles (bypasses RLS recursion)
CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

-- 2. Explicitly remove old permissive policies observed in the dashboard
DROP POLICY IF EXISTS "Allow public read on reports" ON public.reports;
DROP POLICY IF EXISTS "reports: allow authenticated update" ON public.reports;
DROP POLICY IF EXISTS "reports: citizen insert" ON public.reports;
DROP POLICY IF EXISTS "reports: public read" ON public.reports;

-- Idempotency cleanup for the new policies
DROP POLICY IF EXISTS "Citizens can view own reports" ON public.reports;
DROP POLICY IF EXISTS "Staff can view all reports" ON public.reports;
DROP POLICY IF EXISTS "Citizens can insert reports" ON public.reports;
DROP POLICY IF EXISTS "Users can insert reports" ON public.reports;
DROP POLICY IF EXISTS "Staff can update reports" ON public.reports;
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public can view report photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload report photos" ON storage.objects;

-- 3. PROFILES Table RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

-- Admins need to read profiles for the dashboard
CREATE POLICY "Admins can read all profiles" 
ON public.profiles FOR SELECT 
USING (public.get_auth_role() = 'admin');

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (
  auth.uid() = id 
  AND (role IS NULL OR role = 'citizen')
);

-- 3b. PREVENT PROFILE ROLE ESCALATION
-- Trigger to ensure normal users cannot update their own 'role' or 'department'.
-- This protects the system from privilege escalation while preserving the normal complete-profile flow.
CREATE OR REPLACE FUNCTION public.prevent_profile_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role OR NEW.department IS DISTINCT FROM OLD.department THEN
    -- Only restrict users who are not explicitly using the service_role key AND are not admins.
    -- (The service_role key used by the Admin API bypasses this check)
    IF auth.role() != 'service_role' AND public.get_auth_role() IS DISTINCT FROM 'admin' THEN
      RAISE EXCEPTION 'Unauthorized: Only admins can modify role or department';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ensure_profile_security ON public.profiles;
CREATE TRIGGER ensure_profile_security
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_profile_escalation();

-- 4. REPORTS Table RLS
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Citizens can only view their own reports directly.
CREATE POLICY "Citizens can view own reports" 
ON public.reports FOR SELECT 
USING (user_id = auth.uid());

-- Staff (Admins and Workers) can view all reports.
CREATE POLICY "Staff can view all reports" 
ON public.reports FOR SELECT 
USING (public.get_auth_role() IN ('admin', 'worker'));

-- Any authenticated user can insert, but they must insert under their own ID
CREATE POLICY "Users can insert reports" 
ON public.reports FOR INSERT 
WITH CHECK (
  auth.role() = 'authenticated' 
  AND user_id = auth.uid()
);

-- Only Staff (Admins & Workers) can update reports (status, resolution photos, etc.)
-- NOTE: Worker currently has temporary staff-level update access because individual 
-- assignment authorization does not yet exist in this MVP phase. This will be strictly 
-- restricted to assigned reports in a future worker-assignment phase.
CREATE POLICY "Staff can update reports" 
ON public.reports FOR UPDATE 
USING (public.get_auth_role() IN ('admin', 'worker'));

-- 5. STORAGE RLS (report-photos)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Public can view images (required for the map popup and admin dashboard rendering)
CREATE POLICY "Public can view report photos" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'report-photos');

-- Only authenticated users can upload photos (blocks anonymous spam uploads)
CREATE POLICY "Authenticated users can upload report photos" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'report-photos' AND auth.role() = 'authenticated');
