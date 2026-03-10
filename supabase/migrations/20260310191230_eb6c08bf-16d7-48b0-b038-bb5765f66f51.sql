
CREATE TABLE IF NOT EXISTS public.foundation_school_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_number INTEGER NOT NULL,
  class_code TEXT NOT NULL,
  class_title TEXT NOT NULL,
  class_description TEXT,
  is_exam BOOLEAN DEFAULT FALSE,
  scheduled_day TEXT CHECK (scheduled_day IN ('sunday', 'monday')),
  scheduled_time TEXT,
  facilitator_id UUID REFERENCES public.profiles(id),
  organization_id UUID REFERENCES public.organizations(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (class_code)
);

CREATE TABLE IF NOT EXISTS public.foundation_school_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES public.foundation_school_classes(id) ON DELETE CASCADE,
  member_id UUID REFERENCES public.members(id) ON DELETE CASCADE,
  attended BOOLEAN DEFAULT FALSE,
  marked_by UUID REFERENCES public.profiles(id),
  marked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  UNIQUE (class_id, member_id)
);

ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS fs_enrolled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS fs_enrolled_date DATE,
  ADD COLUMN IF NOT EXISTS fs_classes_completed INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fs_exam_score INTEGER,
  ADD COLUMN IF NOT EXISTS fs_exam_passed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS fs_graduation_date DATE,
  ADD COLUMN IF NOT EXISTS fs_graduated BOOLEAN DEFAULT FALSE;

ALTER TABLE public.foundation_school_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.foundation_school_attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "FS classes viewable by authenticated"
  ON public.foundation_school_classes FOR SELECT TO authenticated USING (true);

CREATE POLICY "FS classes manageable by authenticated"
  ON public.foundation_school_classes FOR ALL TO authenticated USING (true);

CREATE POLICY "FS attendance viewable by authenticated"
  ON public.foundation_school_attendance FOR SELECT TO authenticated USING (true);

CREATE POLICY "FS attendance manageable by authenticated"
  ON public.foundation_school_attendance FOR ALL TO authenticated USING (true);
