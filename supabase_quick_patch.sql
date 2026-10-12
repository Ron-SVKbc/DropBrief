-- ==============================================================================
-- DropBrief - Bezpečnostný Quick Patch (RLS + Nové Politiky)
-- ==============================================================================

-- 1. Explicitné zapnutie a vynútenie RLS na všetkých tabuľkách
ALTER TABLE IF EXISTS public.freelancers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.freelancers FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.projects FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.project_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.project_items FORCE ROW LEVEL SECURITY;

-- 2. Práva na úpravu a mazanie profilu pre freelancera
GRANT UPDATE (pin_code, email) ON public.freelancers TO anon, authenticated;
GRANT DELETE ON public.freelancers TO anon, authenticated;

-- 3. Bezpečná kontrola dostupnosti e-mailu
CREATE OR REPLACE FUNCTION public.check_email_available(check_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF check_email IS NULL OR length(trim(check_email)) < 3 OR position('@' in check_email) = 0 THEN
    RETURN false;
  END IF;
  RETURN NOT EXISTS (
    SELECT 1 FROM public.freelancers 
    WHERE lower(email) = lower(trim(check_email))
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.check_email_available(text) TO anon, authenticated, service_role;

-- 4. Politiky pre zmenu a zmazanie profilu (iba vlastník s platným PIN hash)
DROP POLICY IF EXISTS "freelancers_update_policy" ON public.freelancers;
CREATE POLICY "freelancers_update_policy"
  ON public.freelancers FOR UPDATE
  TO anon, authenticated
  USING (
    (
      public.get_request_header('x-freelancer-nick') IS NOT NULL
      AND lower(nick) = lower(public.get_request_header('x-freelancer-nick'))
      AND pin_code = public.get_request_header('x-freelancer-auth')
    )
    OR auth.role() = 'service_role'
  );

DROP POLICY IF EXISTS "freelancers_delete_policy" ON public.freelancers;
CREATE POLICY "freelancers_delete_policy"
  ON public.freelancers FOR DELETE
  TO anon, authenticated
  USING (
    (
      public.get_request_header('x-freelancer-nick') IS NOT NULL
      AND lower(nick) = lower(public.get_request_header('x-freelancer-nick'))
      AND pin_code = public.get_request_header('x-freelancer-auth')
    )
    OR auth.role() = 'service_role'
  );
