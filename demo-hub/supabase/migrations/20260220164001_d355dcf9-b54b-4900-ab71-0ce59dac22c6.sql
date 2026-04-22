-- Add UPDATE policy for users to update their own demo logs (for ending sessions)
CREATE POLICY "Users can update own demo logs"
  ON public.demo_logs
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);