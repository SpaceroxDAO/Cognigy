
-- Create a security definer function to safely get the current user's email
CREATE OR REPLACE FUNCTION public.get_current_user_email()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email::text FROM auth.users WHERE id = auth.uid()
$$;

-- Recreate the broken policy
DROP POLICY IF EXISTS "Users can view own access requests" ON public.access_requests;

CREATE POLICY "Users can view own access requests"
  ON public.access_requests FOR SELECT
  TO authenticated
  USING (lower(email) = lower(public.get_current_user_email()));
