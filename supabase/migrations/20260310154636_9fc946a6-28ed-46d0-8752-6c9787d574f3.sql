-- Allow admins to delete profiles (needed for test account cleanup via service role)
CREATE POLICY "Admins can delete profiles"
ON public.profiles
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'king_admin'::app_role)
);

-- Allow king_admin to delete user_roles
CREATE POLICY "Admins can delete user_roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'king_admin'::app_role)
);