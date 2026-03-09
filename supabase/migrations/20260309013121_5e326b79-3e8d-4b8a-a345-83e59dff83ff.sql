-- Ensure the views for public data are correct and accessible
-- The RLS policies in the setup already use 'true' for SELECT which means they are public
-- For members table
DROP POLICY IF EXISTS "Members are viewable by authenticated users" ON public.members;
CREATE POLICY "Members are viewable by everyone" ON public.members FOR SELECT USING (true);

-- For profiles table
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);

-- For follow_up_tasks
DROP POLICY IF EXISTS "Follow up tasks are viewable by authenticated users" ON public.follow_up_tasks;
CREATE POLICY "Follow up tasks are viewable by everyone" ON public.follow_up_tasks FOR SELECT USING (true);
