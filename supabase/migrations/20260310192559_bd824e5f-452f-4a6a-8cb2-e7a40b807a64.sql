
CREATE TABLE IF NOT EXISTS public.fs_qr_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES public.foundation_school_classes(id) ON DELETE CASCADE,
  generated_by UUID REFERENCES public.profiles(id),
  qr_code TEXT UNIQUE NOT NULL,
  organization_id UUID REFERENCES public.organizations(id),
  is_active BOOLEAN DEFAULT TRUE,
  opened_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  closed_at TIMESTAMP WITH TIME ZONE,
  scan_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.fs_qr_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.fs_qr_sessions(id) ON DELETE CASCADE,
  member_id UUID REFERENCES public.members(id) ON DELETE CASCADE,
  scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  UNIQUE (session_id, member_id)
);

CREATE TABLE IF NOT EXISTS public.task_proof (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES public.follow_up_tasks(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES public.profiles(id),
  proof_type TEXT CHECK (proof_type IN ('photo', 'gps', 'manual')),
  photo_url TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  gps_accuracy DECIMAL,
  timestamp_taken TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_manual_override BOOLEAN DEFAULT FALSE,
  override_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id),
  action_type TEXT NOT NULL,
  reference_id UUID,
  reference_table TEXT,
  metadata JSONB,
  is_flagged BOOLEAN DEFAULT FALSE,
  flag_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.activity_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flagged_user_id UUID REFERENCES public.profiles(id),
  flag_type TEXT NOT NULL CHECK (flag_type IN (
    'too_fast', 'outside_hours', 'bulk_marking', 'expired_qr', 'no_proof', 'manual_override'
  )),
  description TEXT,
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high')),
  resolved BOOLEAN DEFAULT FALSE,
  resolved_by UUID REFERENCES public.profiles(id),
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.follow_up_tasks
  ADD COLUMN IF NOT EXISTS proof_required BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS proof_id UUID REFERENCES public.task_proof(id),
  ADD COLUMN IF NOT EXISTS is_manual_override BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS override_reason TEXT;

ALTER TABLE public.foundation_school_attendance
  ADD COLUMN IF NOT EXISTS is_manual_override BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS qr_session_id UUID REFERENCES public.fs_qr_sessions(id),
  ADD COLUMN IF NOT EXISTS scan_verified BOOLEAN DEFAULT FALSE;

ALTER TABLE public.fs_qr_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fs_qr_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_proof ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "QR sessions viewable by authenticated" ON public.fs_qr_sessions FOR SELECT TO authenticated USING (true);
CREATE POLICY "QR sessions manageable by authenticated" ON public.fs_qr_sessions FOR ALL TO authenticated USING (true);
CREATE POLICY "QR scans viewable by authenticated" ON public.fs_qr_scans FOR SELECT TO authenticated USING (true);
CREATE POLICY "QR scans manageable by authenticated" ON public.fs_qr_scans FOR ALL TO authenticated USING (true);
CREATE POLICY "Task proof viewable by authenticated" ON public.task_proof FOR SELECT TO authenticated USING (true);
CREATE POLICY "Task proof manageable by authenticated" ON public.task_proof FOR ALL TO authenticated USING (true);
CREATE POLICY "Activity log viewable by authenticated" ON public.activity_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "Activity log manageable by authenticated" ON public.activity_log FOR ALL TO authenticated USING (true);
CREATE POLICY "Activity flags viewable by authenticated" ON public.activity_flags FOR SELECT TO authenticated USING (true);
CREATE POLICY "Activity flags manageable by authenticated" ON public.activity_flags FOR ALL TO authenticated USING (true);
