-- Add missing profile fields required by the complete-profile flow
-- This ensures existing profiles are not overwritten and preserves existing relationships.

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS full_name text,
ADD COLUMN IF NOT EXISTS phone_number text,
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone;
