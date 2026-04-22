
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS security_question text,
  ADD COLUMN IF NOT EXISTS security_answer_hash text,
  ADD COLUMN IF NOT EXISTS force_security_setup boolean NOT NULL DEFAULT true;
