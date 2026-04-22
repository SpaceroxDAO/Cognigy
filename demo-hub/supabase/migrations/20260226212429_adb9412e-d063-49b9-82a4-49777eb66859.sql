
-- Fix the security definer view by setting it to SECURITY INVOKER
ALTER VIEW public.profiles_safe SET (security_invoker = on);
