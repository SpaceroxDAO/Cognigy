
-- Allow sales-managers to view all demo logs
CREATE POLICY "Sales managers can view demo logs"
  ON public.demo_logs FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'sales-manager'::app_role));

-- Allow sales-managers to view flows (needed for report labels)
CREATE POLICY "Sales managers can view all flows"
  ON public.flows FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'sales-manager'::app_role));
