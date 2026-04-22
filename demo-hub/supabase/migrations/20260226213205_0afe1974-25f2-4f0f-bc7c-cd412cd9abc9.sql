
-- Revoke SELECT on security_answer_hash columns from authenticated and anon roles
-- This prevents direct queries to these columns even through RLS
REVOKE SELECT (security_answer_hash, security_answer_hash_2) ON public.profiles FROM authenticated;
REVOKE SELECT (security_answer_hash, security_answer_hash_2) ON public.profiles FROM anon;
