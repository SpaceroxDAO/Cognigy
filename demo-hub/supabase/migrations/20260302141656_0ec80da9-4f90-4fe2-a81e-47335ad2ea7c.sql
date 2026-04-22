
-- Drop the broken restrictive policies
DROP POLICY IF EXISTS "Anyone can create access request" ON public.access_requests;
DROP POLICY IF EXISTS "Admins can view access requests" ON public.access_requests;
DROP POLICY IF EXISTS "Admins can update access requests" ON public.access_requests;
DROP POLICY IF EXISTS "User managers can view access requests" ON public.access_requests;
DROP POLICY IF EXISTS "User managers can update access requests" ON public.access_requests;
DROP POLICY IF EXISTS "Users can view own access requests" ON public.access_requests;

-- Recreate as PERMISSIVE
CREATE POLICY "Anyone can create access request"
  ON public.access_requests FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view access requests"
  ON public.access_requests FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update access requests"
  ON public.access_requests FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "User managers can view access requests"
  ON public.access_requests FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'user-manager'::app_role));

CREATE POLICY "User managers can update access requests"
  ON public.access_requests FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'user-manager'::app_role));

CREATE POLICY "Users can view own access requests"
  ON public.access_requests FOR SELECT
  TO authenticated
  USING (lower(email) = lower((SELECT users.email FROM auth.users WHERE users.id = auth.uid())::text));
