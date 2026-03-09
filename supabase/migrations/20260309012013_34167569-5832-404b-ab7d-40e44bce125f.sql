ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;

CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY "Cell groups are modifiable by authenticated users" ON public.cell_groups;
CREATE POLICY "Cell groups insert" ON public.cell_groups FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Cell groups update" ON public.cell_groups FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "Cell groups delete" ON public.cell_groups FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

DROP POLICY "Departments are modifiable by authenticated users" ON public.departments;
CREATE POLICY "Departments insert" ON public.departments FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Departments update" ON public.departments FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "Departments delete" ON public.departments FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

DROP POLICY "Members are modifiable by authenticated users" ON public.members;
CREATE POLICY "Members insert" ON public.members FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Members update" ON public.members FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "Members delete" ON public.members FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

DROP POLICY "Follow up tasks are modifiable by authenticated users" ON public.follow_up_tasks;
CREATE POLICY "Follow up tasks insert" ON public.follow_up_tasks FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Follow up tasks update" ON public.follow_up_tasks FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "Follow up tasks delete" ON public.follow_up_tasks FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

DROP POLICY "Attendance is modifiable by authenticated users" ON public.attendance;
CREATE POLICY "Attendance insert" ON public.attendance FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Attendance update" ON public.attendance FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "Attendance delete" ON public.attendance FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

DROP POLICY "Notifications are modifiable by authenticated users" ON public.notifications;
CREATE POLICY "Notifications insert" ON public.notifications FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Notifications update" ON public.notifications FOR UPDATE TO authenticated USING (user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));
CREATE POLICY "Notifications delete" ON public.notifications FOR DELETE TO authenticated USING (user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));
