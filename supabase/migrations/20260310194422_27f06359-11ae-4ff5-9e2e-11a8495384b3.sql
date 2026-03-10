
-- Alter existing services table to add new columns
ALTER TABLE public.services 
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS service_time TEXT,
  ADD COLUMN IF NOT EXISTS qr_active BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS qr_opened_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS qr_closed_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS expected_attendance INTEGER,
  ADD COLUMN IF NOT EXISTS actual_attendance INTEGER DEFAULT 0;

-- Backfill title from service_name for existing rows
UPDATE public.services SET title = COALESCE(service_name, service_type) WHERE title IS NULL;

-- Create service_attendance table
CREATE TABLE IF NOT EXISTS public.service_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID REFERENCES public.services(id) ON DELETE CASCADE,
  member_id UUID REFERENCES public.members(id) ON DELETE CASCADE,
  scan_method TEXT CHECK (scan_method IN ('qr_self', 'qr_staff', 'manual')),
  scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  scanned_by UUID REFERENCES public.profiles(id),
  is_first_timer BOOLEAN DEFAULT FALSE,
  is_manual_override BOOLEAN DEFAULT FALSE,
  UNIQUE (service_id, member_id)
);

-- Enable RLS
ALTER TABLE public.service_attendance ENABLE ROW LEVEL SECURITY;

-- RLS policies for service_attendance
CREATE POLICY "Service attendance viewable" ON public.service_attendance FOR SELECT TO authenticated USING (true);
CREATE POLICY "Service attendance manageable" ON public.service_attendance FOR ALL TO authenticated USING (true);
