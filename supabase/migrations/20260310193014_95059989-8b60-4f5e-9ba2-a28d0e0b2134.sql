
INSERT INTO storage.buckets (id, name, public) VALUES ('task-proofs', 'task-proofs', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Task proofs upload by authenticated" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'task-proofs');
CREATE POLICY "Task proofs viewable by authenticated" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'task-proofs');
CREATE POLICY "Task proofs deletable by authenticated" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'task-proofs');
