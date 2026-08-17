-- ==============================================================================
-- PHASE 2: REPORT UPDATES RLS HARDENING
-- ==============================================================================

-- Enable RLS on report_updates to prevent unauthorized modifications
ALTER TABLE public.report_updates ENABLE ROW LEVEL SECURITY;

-- Idempotency: Drop policies before creating them
DROP POLICY IF EXISTS "Citizens can read own report updates" ON public.report_updates;
DROP POLICY IF EXISTS "Staff can read all report updates" ON public.report_updates;
DROP POLICY IF EXISTS "Staff can insert report updates" ON public.report_updates;
DROP POLICY IF EXISTS "Authenticated users can read report updates" ON public.report_updates;

-- 1. Citizens can read updates only for their own reports
CREATE POLICY "Citizens can read own report updates" 
ON public.report_updates FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.reports 
    WHERE public.reports.id = report_id 
    AND public.reports.user_id = auth.uid()
  )
);

-- 2. Staff (Admins and Workers) can read all report updates
CREATE POLICY "Staff can read all report updates" 
ON public.report_updates FOR SELECT 
USING (public.get_auth_role() IN ('admin', 'worker'));

-- 3. Only Staff (Admins and Workers) can insert report updates
CREATE POLICY "Staff can insert report updates" 
ON public.report_updates FOR INSERT 
WITH CHECK (public.get_auth_role() IN ('admin', 'worker'));

-- 4. No one should UPDATE or DELETE history records
-- (Defaults to DENY, so no policies needed for UPDATE/DELETE)
