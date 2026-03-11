
-- Allow public (anonymous) users to insert into service_attendance for QR self check-in
CREATE POLICY "Service attendance public insert" ON public.service_attendance 
FOR INSERT TO public 
WITH CHECK (true);

-- Allow public to read services (already exists via "Services viewable by anyone" but ensure service_attendance read for duplicate check)
CREATE POLICY "Service attendance public select" ON public.service_attendance 
FOR SELECT TO public 
USING (true);
