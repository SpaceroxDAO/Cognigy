
CREATE TABLE public.security_attempts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  attempt_count integer NOT NULL DEFAULT 0,
  locked_until timestamp with time zone,
  last_attempt_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create unique index on email for fast lookups
CREATE UNIQUE INDEX idx_security_attempts_email ON public.security_attempts (lower(email));

-- Enable RLS
ALTER TABLE public.security_attempts ENABLE ROW LEVEL SECURITY;

-- No RLS policies needed — this table is only accessed by edge functions using service_role_key
-- Auto-cleanup: delete old records after 24 hours via a scheduled function
CREATE OR REPLACE FUNCTION public.cleanup_old_security_attempts()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  DELETE FROM public.security_attempts
  WHERE last_attempt_at < now() - interval '24 hours';
$$;
