-- Add assigned_department to reports for automated routing

ALTER TABLE public.reports
ADD COLUMN IF NOT EXISTS assigned_department text;
