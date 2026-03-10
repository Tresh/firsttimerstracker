ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'foundation_school_staff';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'foundation_school_leader';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'department_staff';

-- Allow admins to insert into user_roles
CREATE POLICY "Admins can insert user_roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'king_admin') OR
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'erediauwa_admin') OR
  public.has_role(auth.uid(), 'loveworldcity_admin') OR
  public.has_role(auth.uid(), 'youth_teens_admin')
);

-- Allow admins to update user_roles
CREATE POLICY "Admins can update user_roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'king_admin') OR
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'erediauwa_admin') OR
  public.has_role(auth.uid(), 'loveworldcity_admin') OR
  public.has_role(auth.uid(), 'youth_teens_admin')
);

-- Allow admins to read all user_roles
CREATE POLICY "Admins can read all user_roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'king_admin') OR
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'erediauwa_admin') OR
  public.has_role(auth.uid(), 'loveworldcity_admin') OR
  public.has_role(auth.uid(), 'youth_teens_admin')
);

-- Allow admins to insert profiles for other users
CREATE POLICY "Admins can insert profiles"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id OR
  public.has_role(auth.uid(), 'king_admin') OR
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'erediauwa_admin') OR
  public.has_role(auth.uid(), 'loveworldcity_admin') OR
  public.has_role(auth.uid(), 'youth_teens_admin')
);

-- Allow admins to update any profile
CREATE POLICY "Admins can update profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'king_admin') OR
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'erediauwa_admin') OR
  public.has_role(auth.uid(), 'loveworldcity_admin') OR
  public.has_role(auth.uid(), 'youth_teens_admin')
);