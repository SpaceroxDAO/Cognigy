
-- Create enum for auth event types
CREATE TYPE public.auth_event_type AS ENUM (
  'login_success',
  'login_failure', 
  'logout',
  'password_reset_request',
  'password_reset_complete',
  'security_challenge_success',
  'security_challenge_failure',
  'account_locked'
);

-- Create auth_events table
CREATE TABLE public.auth_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NULL,
  email TEXT NOT NULL,
  event_type public.auth_event_type NOT NULL,
  ip_address TEXT NULL,
  user_agent TEXT NULL,
  metadata JSONB NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX idx_auth_events_created_at ON public.auth_events(created_at DESC);
CREATE INDEX idx_auth_events_email ON public.auth_events(email);
CREATE INDEX idx_auth_events_event_type ON public.auth_events(event_type);

-- Enable RLS
ALTER TABLE public.auth_events ENABLE ROW LEVEL SECURITY;

-- Only admins and user-managers can view auth events
CREATE POLICY "Admins can view all auth events"
  ON public.auth_events FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "User managers can view auth events"
  ON public.auth_events FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'user-manager'::app_role));

-- Authenticated users can insert their own events (for client-side logging)
CREATE POLICY "Users can insert own auth events"
  ON public.auth_events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow anonymous inserts for login failures (no user_id yet)
CREATE POLICY "Anon can insert auth events"
  ON public.auth_events FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL);
