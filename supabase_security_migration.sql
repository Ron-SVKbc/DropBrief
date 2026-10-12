-- ==============================================================================
-- DropBrief / SplitAI - Bezpečnostná RLS Migrácia (Zero-Trust & Multi-Tenant Isolation)
-- ==============================================================================
-- Táto migrácia opravuje krížové oprávnenia pomocou SECURITY DEFINER funkcií,
-- čím zabraňuje 'permission denied' chybám pri vyhodnocovaní RLS politík
-- a zabezpečuje, že neautorizované dotazy vracajú čistých 0 riadkov.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. EXPLICITNÉ ZAPNUTIE A VYNÚTENIE RLS NA VŠETKÝCH TABUĽKÁCH
-- ------------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.freelancers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.freelancers FORCE ROW LEVEL SECURITY;

ALTER TABLE IF EXISTS public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.projects FORCE ROW LEVEL SECURITY;

ALTER TABLE IF EXISTS public.project_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.project_items FORCE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 2. BEZPEČNÉ POMOCNÉ FUNKCIE (SECURITY DEFINER)
-- ------------------------------------------------------------------------------

-- A. Čítanie HTTP hlavičiek z PostgREST požiadavky
CREATE OR REPLACE FUNCTION public.get_request_header(header_name text)
RETURNS text
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  headers_raw text;
BEGIN
  headers_raw := current_setting('request.headers', true);
  IF headers_raw IS NULL OR headers_raw = '' THEN
    RETURN NULL;
  END IF;
  RETURN nullif((headers_raw::jsonb ->> lower(header_name)), '');
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_request_header(text) TO anon, authenticated, service_role;

-- B. Bezpečné overenie, či má freelancer platný PIN hash (rieši cross-table oprávnenia)
CREATE OR REPLACE FUNCTION public.is_freelancer_authenticated(p_nick text, p_pin_hash text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_nick IS NULL OR p_pin_hash IS NULL OR trim(p_nick) = '' OR trim(p_pin_hash) = '' THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.freelancers
    WHERE lower(nick) = lower(trim(p_nick))
      AND pin_code = trim(p_pin_hash)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_freelancer_authenticated(text, text) TO anon, authenticated, service_role;

-- C. Bezpečná kontrola dostupnosti nicku (pre registráciu)
CREATE OR REPLACE FUNCTION public.check_nick_available(check_nick text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF check_nick IS NULL OR length(trim(check_nick)) < 2 THEN
    RETURN false;
  END IF;
  RETURN NOT EXISTS (
    SELECT 1 FROM public.freelancers 
    WHERE lower(nick) = lower(trim(check_nick))
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_nick_available(text) TO anon, authenticated, service_role;

-- D. Bezpečné overenie PINu pre /api/verify-pin
CREATE OR REPLACE FUNCTION public.verify_freelancer_pin(
  p_nick text,
  p_salted_hash text,
  p_unsalted_hash text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user record;
BEGIN
  IF p_nick IS NULL OR (p_salted_hash IS NULL AND p_unsalted_hash IS NULL) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Chýbajúce prihlasovacie údaje.');
  END IF;

  SELECT id, nick, email, created_at, pin_code
  INTO v_user
  FROM public.freelancers
  WHERE lower(nick) = lower(trim(p_nick));

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Nesprávny nickname alebo PIN kód.');
  END IF;

  IF v_user.pin_code = p_salted_hash OR v_user.pin_code = p_unsalted_hash THEN
    RETURN jsonb_build_object(
      'success', true,
      'user', jsonb_build_object(
        'id', v_user.id,
        'nick', v_user.nick,
        'email', v_user.email,
        'createdAt', v_user.created_at,
        'pinHash', v_user.pin_code
      )
    );
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Nesprávny nickname alebo PIN kód.');
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.verify_freelancer_pin(text, text, text) TO anon, authenticated, service_role;

-- E. Bezpečná kontrola prístupu k položkám projektu
CREATE OR REPLACE FUNCTION public.can_access_project(p_project_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_proj record;
  v_client_slug text;
  v_fl_nick text;
  v_fl_auth text;
BEGIN
  IF p_project_id IS NULL THEN
    RETURN false;
  END IF;

  IF auth.role() = 'service_role' THEN
    RETURN true;
  END IF;

  SELECT slug, id, freelancer_name INTO v_proj
  FROM public.projects
  WHERE id = p_project_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  v_client_slug := public.get_request_header('x-project-slug');
  IF v_client_slug IS NOT NULL AND (v_proj.slug = v_client_slug OR v_proj.id::text = v_client_slug) THEN
    RETURN true;
  END IF;

  v_fl_nick := public.get_request_header('x-freelancer-nick');
  v_fl_auth := public.get_request_header('x-freelancer-auth');
  IF v_fl_nick IS NOT NULL AND lower(v_proj.freelancer_name) = lower(v_fl_nick) THEN
    RETURN public.is_freelancer_authenticated(v_fl_nick, v_fl_auth);
  END IF;

  RETURN false;
END;
$$;

GRANT EXECUTE ON FUNCTION public.can_access_project(uuid) TO anon, authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 3. ZABEZPEČENIE TABUĽKY: public.freelancers
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Anonymné vyhlačávanie freelancera podľa nicku" ON public.freelancers;
DROP POLICY IF EXISTS "Freelancer si môže vytvoriť účet" ON public.freelancers;
DROP POLICY IF EXISTS "select_freelancers_public" ON public.freelancers;
DROP POLICY IF EXISTS "insert_freelancers_anon" ON public.freelancers;
DROP POLICY IF EXISTS "freelancers_insert_policy" ON public.freelancers;
DROP POLICY IF EXISTS "freelancers_select_policy" ON public.freelancers;

-- Zákaz priameho čítania hesiel/hashov celej tabuľky
REVOKE ALL ON public.freelancers FROM anon;
GRANT INSERT ON public.freelancers TO anon;
GRANT SELECT (id, nick, created_at) ON public.freelancers TO anon;

CREATE POLICY "freelancers_insert_policy"
  ON public.freelancers FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    nick IS NOT NULL 
    AND length(trim(nick)) >= 2 
    AND length(trim(nick)) <= 50
    AND pin_code IS NOT NULL 
    AND length(pin_code) = 64
  );

CREATE POLICY "freelancers_select_policy"
  ON public.freelancers FOR SELECT
  TO anon, authenticated
  USING (
    (
      public.get_request_header('x-freelancer-nick') IS NOT NULL
      AND lower(nick) = lower(public.get_request_header('x-freelancer-nick'))
      AND pin_code = public.get_request_header('x-freelancer-auth')
    )
    OR auth.role() = 'service_role'
  );

-- ------------------------------------------------------------------------------
-- 4. ZABEZPEČENIE TABUĽKY: public.projects
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "select_projects_public" ON public.projects;
DROP POLICY IF EXISTS "update_projects_anon" ON public.projects;
DROP POLICY IF EXISTS "delete_projects_anon" ON public.projects;
DROP POLICY IF EXISTS "insert_projects_anon" ON public.projects;
DROP POLICY IF EXISTS "projects_select_secure" ON public.projects;
DROP POLICY IF EXISTS "projects_update_secure" ON public.projects;
DROP POLICY IF EXISTS "projects_delete_secure" ON public.projects;
DROP POLICY IF EXISTS "projects_insert_secure" ON public.projects;

-- A. SELECT: Zákaz neoprávneného dumpu všetkých projektov!
CREATE POLICY "projects_select_secure"
  ON public.projects FOR SELECT
  TO anon, authenticated
  USING (
    -- 1. Klient pristupuje k svojmu projektu cez hlavičku x-project-slug
    (
      public.get_request_header('x-project-slug') IS NOT NULL
      AND (
        slug = public.get_request_header('x-project-slug')
        OR id::text = public.get_request_header('x-project-slug')
      )
    )
    -- 2. Freelancer pristupuje k svojim projektom (overené nick + PIN hash)
    OR (
      public.get_request_header('x-freelancer-nick') IS NOT NULL
      AND lower(freelancer_name) = lower(public.get_request_header('x-freelancer-nick'))
      AND public.is_freelancer_authenticated(
        public.get_request_header('x-freelancer-nick'),
        public.get_request_header('x-freelancer-auth')
      )
    )
    -- 3. Service role
    OR auth.role() = 'service_role'
  );

-- B. INSERT: Vytvorenie projektu smie vykonať iba overený freelancer
CREATE POLICY "projects_insert_secure"
  ON public.projects FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    title IS NOT NULL AND length(trim(title)) > 0
    AND slug IS NOT NULL AND length(trim(slug)) > 0
    AND client_name IS NOT NULL AND length(trim(client_name)) > 0
    AND freelancer_name IS NOT NULL AND length(trim(freelancer_name)) > 0
    AND (
      (
        public.get_request_header('x-freelancer-nick') IS NOT NULL
        AND lower(freelancer_name) = lower(public.get_request_header('x-freelancer-nick'))
        AND public.is_freelancer_authenticated(
          public.get_request_header('x-freelancer-nick'),
          public.get_request_header('x-freelancer-auth')
        )
      )
      OR auth.role() = 'service_role'
    )
  );

-- C. UPDATE: Klient smie meniť iba svoj projekt; Freelancer svoje projekty
CREATE POLICY "projects_update_secure"
  ON public.projects FOR UPDATE
  TO anon, authenticated
  USING (
    (
      public.get_request_header('x-project-slug') IS NOT NULL
      AND (
        slug = public.get_request_header('x-project-slug')
        OR id::text = public.get_request_header('x-project-slug')
      )
    )
    OR (
      public.get_request_header('x-freelancer-nick') IS NOT NULL
      AND lower(freelancer_name) = lower(public.get_request_header('x-freelancer-nick'))
      AND public.is_freelancer_authenticated(
        public.get_request_header('x-freelancer-nick'),
        public.get_request_header('x-freelancer-auth')
      )
    )
    OR auth.role() = 'service_role'
  )
  WITH CHECK (
    (
      public.get_request_header('x-project-slug') IS NOT NULL
      AND (
        slug = public.get_request_header('x-project-slug')
        OR id::text = public.get_request_header('x-project-slug')
      )
    )
    OR (
      public.get_request_header('x-freelancer-nick') IS NOT NULL
      AND lower(freelancer_name) = lower(public.get_request_header('x-freelancer-nick'))
    )
    OR auth.role() = 'service_role'
  );

-- D. DELETE: Mazať projekt smie VÝHRADNE overený freelancer (vlastník)
CREATE POLICY "projects_delete_secure"
  ON public.projects FOR DELETE
  TO anon, authenticated
  USING (
    (
      public.get_request_header('x-freelancer-nick') IS NOT NULL
      AND lower(freelancer_name) = lower(public.get_request_header('x-freelancer-nick'))
      AND public.is_freelancer_authenticated(
        public.get_request_header('x-freelancer-nick'),
        public.get_request_header('x-freelancer-auth')
      )
    )
    OR auth.role() = 'service_role'
  );

-- ------------------------------------------------------------------------------
-- 5. ZABEZPEČENIE TABUĽKY: public.project_items
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "select_items_public" ON public.project_items;
DROP POLICY IF EXISTS "update_items_anon" ON public.project_items;
DROP POLICY IF EXISTS "delete_items_anon" ON public.project_items;
DROP POLICY IF EXISTS "insert_items_anon" ON public.project_items;
DROP POLICY IF EXISTS "items_select_secure" ON public.project_items;
DROP POLICY IF EXISTS "items_insert_secure" ON public.project_items;
DROP POLICY IF EXISTS "items_update_secure" ON public.project_items;
DROP POLICY IF EXISTS "items_delete_secure" ON public.project_items;

CREATE POLICY "items_select_secure"
  ON public.project_items FOR SELECT
  TO anon, authenticated
  USING (
    public.can_access_project(project_items.project_id)
  );

CREATE POLICY "items_insert_secure"
  ON public.project_items FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    project_id IS NOT NULL
    AND title IS NOT NULL AND length(trim(title)) > 0
    AND (
      (
        public.get_request_header('x-freelancer-nick') IS NOT NULL
        AND public.is_freelancer_authenticated(
          public.get_request_header('x-freelancer-nick'),
          public.get_request_header('x-freelancer-auth')
        )
      )
      OR auth.role() = 'service_role'
    )
  );

CREATE POLICY "items_update_secure"
  ON public.project_items FOR UPDATE
  TO anon, authenticated
  USING (
    public.can_access_project(project_items.project_id)
  );

CREATE POLICY "items_delete_secure"
  ON public.project_items FOR DELETE
  TO anon, authenticated
  USING (
    (
      public.get_request_header('x-freelancer-nick') IS NOT NULL
      AND public.is_freelancer_authenticated(
        public.get_request_header('x-freelancer-nick'),
        public.get_request_header('x-freelancer-auth')
      )
    )
    OR auth.role() = 'service_role'
  );

-- ------------------------------------------------------------------------------
-- 6. ZABEZPEČENIE STORAGE BUCKETU: client-uploads
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Verejné nahrávanie podkladov klientmi" ON storage.objects;
DROP POLICY IF EXISTS "Verejné čítanie a sťahovanie podkladov" ON storage.objects;
DROP POLICY IF EXISTS "Odstránenie podkladov" ON storage.objects;
DROP POLICY IF EXISTS "storage_upload_secure" ON storage.objects;
DROP POLICY IF EXISTS "storage_select_secure" ON storage.objects;

CREATE POLICY "storage_upload_secure"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    bucket_id = 'client-uploads'
    AND NOT (name LIKE '_%')
  );

CREATE POLICY "storage_select_secure"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (
    bucket_id = 'client-uploads'
    AND NOT (name LIKE '_profiles/%')
  );
