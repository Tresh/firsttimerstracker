CREATE TABLE public.call_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  campaign_type TEXT NOT NULL,
  objective TEXT NOT NULL,
  message_script TEXT,
  target_type TEXT NOT NULL,
  organization_id UUID REFERENCES public.organizations(id),
  status TEXT DEFAULT 'draft',
  priority TEXT DEFAULT 'normal',
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.campaign_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES public.call_campaigns(id) ON DELETE CASCADE,
  rep_id UUID REFERENCES public.profiles(id),
  member_id UUID REFERENCES public.members(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  priority_order INTEGER DEFAULT 0,
  notes TEXT,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (campaign_id, member_id)
);

CREATE TABLE public.campaign_call_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES public.call_campaigns(id) ON DELETE CASCADE,
  assignment_id UUID REFERENCES public.campaign_assignments(id) ON DELETE CASCADE,
  rep_id UUID REFERENCES public.profiles(id),
  member_id UUID REFERENCES public.members(id) ON DELETE CASCADE,
  phone_number TEXT,
  contact_method TEXT,
  call_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  call_end TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER DEFAULT 0,
  outcome TEXT,
  auto_detected_outcome TEXT,
  rep_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.call_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_call_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Campaigns viewable by authenticated" ON public.call_campaigns FOR SELECT TO authenticated USING (true);
CREATE POLICY "Campaigns manageable by authenticated" ON public.call_campaigns FOR ALL TO authenticated USING (true);
CREATE POLICY "Assignments viewable by authenticated" ON public.campaign_assignments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Assignments manageable by authenticated" ON public.campaign_assignments FOR ALL TO authenticated USING (true);
CREATE POLICY "Campaign logs viewable by authenticated" ON public.campaign_call_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Campaign logs manageable by authenticated" ON public.campaign_call_logs FOR ALL TO authenticated USING (true);