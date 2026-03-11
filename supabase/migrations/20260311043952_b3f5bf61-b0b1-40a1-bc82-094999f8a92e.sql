CREATE OR REPLACE VIEW public.analytics_summary AS
SELECT
  o.id as org_id,
  o.name as org_name,
  o.level as org_level,
  COUNT(DISTINCT m.id) FILTER (WHERE m.status = 'First Timer') as total_first_timers,
  COUNT(DISTINCT m.id) FILTER (WHERE m.status = 'Member') as total_members,
  COUNT(DISTINCT m.id) FILTER (WHERE m.created_at >= NOW() - INTERVAL '30 days') as new_this_month,
  COUNT(DISTINCT m.id) FILTER (WHERE m.created_at >= NOW() - INTERVAL '7 days') as new_this_week,
  COUNT(DISTINCT ft.id) FILTER (WHERE ft.status = 'done') as tasks_completed,
  COUNT(DISTINCT ft.id) FILTER (WHERE ft.status = 'pending') as tasks_pending,
  COUNT(DISTINCT ft.id) FILTER (WHERE ft.status = 'overdue') as tasks_overdue,
  COUNT(DISTINCT m.id) FILTER (WHERE m.fs_graduated = true) as fs_graduated,
  COUNT(DISTINCT m.id) FILTER (WHERE m.fs_enrolled = true AND m.fs_graduated = false) as fs_in_progress,
  COUNT(DISTINCT sa.id) as total_service_checkins
FROM public.organizations o
LEFT JOIN public.members m ON m.organization_id = o.id
LEFT JOIN public.follow_up_tasks ft ON ft.member_id = m.id
LEFT JOIN public.service_attendance sa ON sa.member_id = m.id
GROUP BY o.id, o.name, o.level