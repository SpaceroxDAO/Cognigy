
-- 1. Remove anonymous SELECT policy on flows (app requires authentication)
DROP POLICY IF EXISTS "Public can view enabled flows" ON public.flows;

-- 2. Add documentation comment to has_role function explaining SECURITY DEFINER
COMMENT ON FUNCTION public.has_role(uuid, app_role) IS 
'Checks if a user has a given role. Uses SECURITY DEFINER intentionally to bypass RLS on user_roles table, preventing infinite recursion when RLS policies call this function. The function has a fixed search_path and only performs a read-only EXISTS check, making it safe for elevated execution.';
