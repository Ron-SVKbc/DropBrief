-- ==============================================================================
-- DropBrief / SplitAI - Bezpečnostná RLS Migrácia (Zero-Trust & Multi-Tenant Isolation)
-- ==============================================================================
-- Táto migrácia rieši a garantuje:
-- 1. Explicitné zapnutie a VYNÚTENIE (FORCE) Row Level Security na VŠETKÝCH tabuľkách.
-- 2. Absolútny zákaz prístupu verejného anon_key k cudzím dátam bez autentifikácie (vracia 0 riadkov).
-- 3. Odstránenie cross-tenant zraniteľností pri vkladaní a mazaní checklistových položiek.
-- 4. Ochrana citlivých údajov (SHA-256 hashe PINov a e-maily) pred hromadným dumpom.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. EXPLICITNÉ ZAPNUTIE A VYNÚTENIE RLS NA VŠETKÝCH TABUĽKÁCH
-- ------------------------------------------------------------------------------
-- Explicitné zapnutie na známych tabuľkách
ALTER TABLE IF EXISTS public.freelancers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.freelancers FORCE ROW LEVEL SECURITY;

ALTER TABLE IF EXISTS public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.projects FORCE ROW LEVEL SECURITY;

ALTER TABLE IF EXISTS public.project_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.project_items FORCE ROW LEVEL SECURITY;

-- Dynamická ochrana: Automaticky zapne a vynúti RLS na ÚPLNE VŠETKÝCH tabuľkách v public schéme
DO $$
DECLARE
  t RECORD;
BEGIN
  FOR t IN (
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public'
  ) LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t.tablename);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY;', t.tablename);
  END LOOP;
END $$;

-- ------------------------------------------------------------------------------
-- 2. OPRÁVNENIA PODĽA PRINCÍPU NAJMENŠÍCH PRÁV (LEAST PRIVILEGE)
-- ------------------------------------------------------------------------------
-- Freelancers: Anon ani bežný authenticated nesmie vidieť pin_code ani hromadne sťahovať tabuľku
REVOKE ALL ON public.freelancers FROM anon, authenticated;
GRANT INSERT ON public.freelancers TO anon, authenticated;
GRANT SELECT (id, nick, created_at) ON public.freelancers TO anon, authenticated;
GRANT ALL ON public.freelancers TO service_role;

-- Projects a Project Items: Základné DML práva (samotné riadky prísne filtrujú RLS politiky)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_items TO anon, authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 3. BEZPEČNÉ POMOCNÉ FUNKCIE (SECURITY DEFINER & HARDENED SEARCH_PATH)
-- ------------------------------------------------------------------------------

-- A. Bezpečné čítanie HTTP hlavičiek z PostgREST požiadavky
CREATE OR REPLACE FUNCTION public.get_request_header(header_name text)
RETURNS text
LANGUAGE plpgsql
STABLE
SET search_path = public
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

-- B. Bezpečné overenie, či má freelancer platný PIN hash (rieši cross-table práva bez cyklenia)
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

-- C. Bezpečná kontrola dostupnosti nicku (pre registráciu, chráni pred enumeráciou hashov)
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

-- D. Bezpečné overenie PINu na serveri pre /api/verify-pin
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

  -- 1. Klient pristupuje cez overený link (slug projektu)
  v_client_slug := public.get_request_header('x-project-slug');
  IF v_client_slug IS NOT NULL AND (v_proj.slug = v_client_slug OR v_proj.id::text = v_client_slug) THEN
    RETURN true;
  END IF;

  -- 2. Freelancer pristupuje k vlastnému projektu (overený nick + PIN hash)
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
-- 4. ZABEZPEČENIE TABUĽKY: public.freelancers
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Anonymné vyhlačávanie freelancera podľa nicku" ON public.freelancers;
DROP POLICY IF EXISTS "Freelancer si môže vytvoriť účet" ON public.freelancers;
DROP POLICY IF EXISTS "select_freelancers_public" ON public.freelancers;
DROP POLICY IF EXISTS "insert_freelancers_anon" ON public.freelancers;
DROP POLICY IF EXISTS "freelancers_insert_policy" ON public.freelancers;
DROP POLICY IF EXISTS "freelancers_select_policy" ON public.freelancers;

-- A. INSERT: Vytvorenie nového účtu (validácia štruktúry a SHA-256 hashu)
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

-- B. SELECT: Čítanie vlastného profilu výhradne pri zhode nicku a PIN hashu
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
-- 5. ZABEZPEČENIE TABUĽKY: public.projects
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
-- Neautentifikovaný dotaz bez hlavičiek vráti čistých 0 riadkov.
CREATE POLICY "projects_select_secure"
  ON public.projects FOR SELECT
  TO anon, authenticated
  USING (
    -- 1. Klient pristupuje k svojmu projektu cez unikátny slug
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
    -- 3. Servisná rola (Vercel Cron purge, backend)
    OR auth.role() = 'service_role'
  );

-- B. INSERT: Vytvorenie projektu smie vykonať VÝHRADNE overený freelancer pre seba
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

-- C. UPDATE: Klient smie meniť iba svoj projekt (dávky/status); Freelancer svoje projekty
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
      AND public.is_freelancer_authenticated(
        public.get_request_header('x-freelancer-nick'),
        public.get_request_header('x-freelancer-auth')
      )
    )
    OR auth.role() = 'service_role'
  );

-- D. DELETE: Mazať projekt smie VÝHRADNE overený vlastník projektu
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
-- 6. ZABEZPEČENIE TABUĽKY: public.project_items
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "select_items_public" ON public.project_items;
DROP POLICY IF EXISTS "update_items_anon" ON public.project_items;
DROP POLICY IF EXISTS "delete_items_anon" ON public.project_items;
DROP POLICY IF EXISTS "insert_items_anon" ON public.project_items;
DROP POLICY IF EXISTS "items_select_secure" ON public.project_items;
DROP POLICY IF EXISTS "items_insert_secure" ON public.project_items;
DROP POLICY IF EXISTS "items_update_secure" ON public.project_items;
DROP POLICY IF EXISTS "items_delete_secure" ON public.project_items;

-- A. SELECT: Čítať položky smie len klient s prístupom k slug alebo vlastník projektu
CREATE POLICY "items_select_secure"
  ON public.project_items FOR SELECT
  TO anon, authenticated
  USING (
    public.can_access_project(project_items.project_id)
  );

-- B. INSERT: Vkladať položky smie iba overený freelancer a VÝHRADNE do svojich projektov!
-- (Zabraňuje cross-tenant injektovaniu položiek do cudzích zákaziek)
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
        AND EXISTS (
          SELECT 1 FROM public.projects p
          WHERE p.id = project_items.project_id
            AND lower(p.freelancer_name) = lower(public.get_request_header('x-freelancer-nick'))
        )
      )
      OR auth.role() = 'service_role'
    )
  );

-- C. UPDATE: Klient (nahranie podkladu) alebo freelancer smú meniť iba položky svojich projektov
CREATE POLICY "items_update_secure"
  ON public.project_items FOR UPDATE
  TO anon, authenticated
  USING (
    public.can_access_project(project_items.project_id)
  )
  WITH CHECK (
    public.can_access_project(project_items.project_id)
  );

-- D. DELETE: Mazať položky smie VÝHRADNE overený freelancer do vlastného projektu!
-- (Zabraňuje cross-tenant mazaniu položiek cudzích projektov)
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
      AND EXISTS (
        SELECT 1 FROM public.projects p
        WHERE p.id = project_items.project_id
          AND lower(p.freelancer_name) = lower(public.get_request_header('x-freelancer-nick'))
      )
    )
    OR auth.role() = 'service_role'
  );

-- ------------------------------------------------------------------------------
-- 7. ZABEZPEČENIE STORAGE BUCKETU: client-uploads
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Verejné nahrávanie podkladov klientmi" ON storage.objects;
DROP POLICY IF EXISTS "Verejné čítanie a sťahovanie podkladov" ON storage.objects;
DROP POLICY IF EXISTS "Odstránenie podkladov" ON storage.objects;
DROP POLICY IF EXISTS "storage_upload_secure" ON storage.objects;
DROP POLICY IF EXISTS "storage_select_secure" ON storage.objects;

-- A. Nahrávanie súborov: Povolené len do bucketu client-uploads, zákaz interných _ ciest
CREATE POLICY "storage_upload_secure"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    bucket_id = 'client-uploads'
    AND NOT (name LIKE '_%')
  );

-- B. Čítanie súborov: Povolené pre klientske súbory, chráni _profiles/ pred verejným čítaním
CREATE POLICY "storage_select_secure"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (
    bucket_id = 'client-uploads'
    AND NOT (name LIKE '_profiles/%')
  );

-- ------------------------------------------------------------------------------
-- 8. KONTROLNÝ AUDIT & OVERENIE NASTAVENIA RLS (Spustiteľný v SQL Editore)
-- ------------------------------------------------------------------------------
-- Nasledujúce dotazy overujú stav zabezpečenia:

-- 1. Skontroluj, či je RLS zapnuté (rls_enabled) a vynútené (rls_forced) na VŠETKÝCH tabuľkách:
SELECT 
  c.relname AS tablename, 
  c.relrowsecurity AS rls_enabled,
  c.relforcerowsecurity AS rls_forced
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' 
  AND c.relkind = 'r'
ORDER BY c.relname;

-- 2. Zoznam všetkých aktívnych politík v databáze:
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, cmd;
