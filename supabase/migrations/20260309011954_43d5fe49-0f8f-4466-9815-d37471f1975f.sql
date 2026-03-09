-- Enums
CREATE TYPE member_status AS ENUM ('First Timer', 'Second Timer', 'New Convert', 'Member', 'Worker');
CREATE TYPE service_type AS ENUM ('Sunday Service', 'Midweek Service', 'Cell Meeting', 'Special Program');
CREATE TYPE app_role AS ENUM ('admin', 'pastor', 'cell_leader', 'follow_up_team');

-- User Roles
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security Definer Function for Roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Profiles (for staff/leaders)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    phone_number TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Cell Groups
CREATE TABLE public.cell_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    leader_id UUID REFERENCES public.profiles(id),
    location TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.cell_groups ENABLE ROW LEVEL SECURITY;

-- Departments
CREATE TABLE public.departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    leader_id UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

-- Members (including First Timers)
CREATE TABLE public.members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    phone_number TEXT,
    email TEXT,
    gender TEXT,
    age_range TEXT,
    address TEXT,
    location TEXT,
    date_of_first_visit DATE NOT NULL,
    service_attended service_type NOT NULL,
    
    invited_by UUID REFERENCES public.members(id),
    assigned_cell_group UUID REFERENCES public.cell_groups(id),
    assigned_follow_up_leader UUID REFERENCES public.profiles(id),
    department_joined UUID REFERENCES public.departments(id),
    
    status member_status NOT NULL DEFAULT 'First Timer',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

-- Follow-up Tasks (6-week pipeline)
CREATE TABLE public.follow_up_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID REFERENCES public.members(id) ON DELETE CASCADE NOT NULL,
    week_number INTEGER NOT NULL CHECK (week_number >= 1 AND week_number <= 6),
    action_name TEXT NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    assigned_to UUID REFERENCES public.profiles(id),
    due_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.follow_up_tasks ENABLE ROW LEVEL SECURITY;

-- Attendance
CREATE TABLE public.attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID REFERENCES public.members(id) ON DELETE CASCADE NOT NULL,
    service_type service_type NOT NULL,
    date DATE NOT NULL,
    logged_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Notifications
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Basic MVP Policies
CREATE POLICY "Profiles are viewable by authenticated users" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Cell groups are viewable by authenticated users" ON public.cell_groups FOR SELECT TO authenticated USING (true);
CREATE POLICY "Cell groups are modifiable by authenticated users" ON public.cell_groups FOR ALL TO authenticated USING (true);

CREATE POLICY "Departments are viewable by authenticated users" ON public.departments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Departments are modifiable by authenticated users" ON public.departments FOR ALL TO authenticated USING (true);

CREATE POLICY "Members are viewable by authenticated users" ON public.members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Members are modifiable by authenticated users" ON public.members FOR ALL TO authenticated USING (true);

CREATE POLICY "Follow up tasks are viewable by authenticated users" ON public.follow_up_tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Follow up tasks are modifiable by authenticated users" ON public.follow_up_tasks FOR ALL TO authenticated USING (true);

CREATE POLICY "Attendance is viewable by authenticated users" ON public.attendance FOR SELECT TO authenticated USING (true);
CREATE POLICY "Attendance is modifiable by authenticated users" ON public.attendance FOR ALL TO authenticated USING (true);

CREATE POLICY "Notifications are viewable by owner" ON public.notifications FOR SELECT TO authenticated USING (user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));
CREATE POLICY "Notifications are modifiable by authenticated users" ON public.notifications FOR ALL TO authenticated USING (true);

-- Timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON public.members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-create profile trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'full_name', 'New User'));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();