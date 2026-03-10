
-- Attach the trigger to the members table
CREATE TRIGGER on_member_insert_create_followup
  AFTER INSERT ON public.members
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_create_followup_tasks();

-- Backfill: create follow-up tasks for all existing First Timers that don't have any tasks yet
DO $$
DECLARE
  m RECORD;
BEGIN
  FOR m IN
    SELECT id, created_at FROM public.members
    WHERE status = 'First Timer'
      AND id NOT IN (SELECT DISTINCT member_id FROM public.follow_up_tasks)
  LOOP
    PERFORM public.create_followup_tasks(m.id, COALESCE(m.created_at, now()));
  END LOOP;
END;
$$;
