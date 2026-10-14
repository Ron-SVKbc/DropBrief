-- ==============================================================================
-- DropBrief / SplitAI - Kritický Bezpečnostný Patch (Hotfix)
-- ==============================================================================
-- Tento skript okamžite opravuje:
-- 1. Odstránenie nebezpečných / legacy politík zo storage.objects (Verejná aktualizácia, neobmedzený delete a list)
-- 2. Nasadenie Zero-Trust Multi-Tenant Storage politík (nikto nemôže listovať ani mazať cudzie súbory)
-- 3. Zabezpečenie RPC funkcií: delete_freelancer_account výhradne pre service_role
-- 4. Anti-brute-force ochrana v funkcii verify_freelancer_pin (350ms throttle pri nesprávnom PINe)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. STORAGE: ODSTRÁNENIE DERAVÝCH POLITÍK
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Verejná aktualizácia v bucket" ON storage.objects;
DROP POLICY IF EXISTS "Verejné nahrávanie podkladov klientmi" ON storage.objects;
DROP POLICY IF EXISTS "Verejné čítanie a sťahovanie podkladov" ON storage.objects;
DROP POLICY IF EXISTS "Odstránenie podkladov" ON storage.objects;
DROP POLICY IF EXISTS "storage_upload_secure" ON storage.objects;
DROP POLICY IF EXISTS "storage_select_secure" ON storage.objects;
DROP POLICY IF EXISTS "storage_update_secure" ON storage.objects;
DROP POLICY IF EXISTS "storage_delete_secure" ON storage.objects;

-- ------------------------------------------------------------------------------
-- 2. STORAGE: NASADENIE NEPRIESTRELNÝCH MULTI-TENANT POLITÍK
-- ------------------------------------------------------------------------------

-- A. INSERT: Nahrávanie súborov (klient aj freelancer) výhradne do klientskych priečinkov
CREATE POLICY "storage_upload_secure"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    bucket_id = 'client-uploads'
    AND left(name, 1) != '_'
    AND position('/' in name) > 1
  );

-- B. SELECT: ZÁKAZ ANONYMNÉHO LISTOVANIA VŠETKÝCH SÚBOROV (Anti-Exfiltration)
-- Listing a čítanie API je povolené IBA servisnej role (cron/backend),
-- overenému freelancerovi pre jeho vlastné zákazky,
-- alebo klientovi s platným slugom zákazky.
CREATE POLICY "storage_select_secure"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (
    -- 1. Servisná rola (backend / cron purge)
    auth.role() = 'service_role'
    -- 2. Overený freelancer pristupujúci k súborom vlastných zákaziek
    OR (
      bucket_id = 'client-uploads'
      AND public.get_request_header('x-freelancer-nick') IS NOT NULL
      AND public.is_freelancer_authenticated(
        public.get_request_header('x-freelancer-nick'),
        public.get_request_header('x-freelancer-auth')
      )
      AND EXISTS (
        SELECT 1 FROM public.projects p
        WHERE lower(p.freelancer_name) = lower(public.get_request_header('x-freelancer-nick'))
          AND split_part(name, '/', 1) IN (p.slug, p.id::text)
      )
    )
    -- 3. Klient pristupujúci cez unikátny capability slug zákazky
    OR (
      bucket_id = 'client-uploads'
      AND public.get_request_header('x-project-slug') IS NOT NULL
      AND split_part(name, '/', 1) = public.get_request_header('x-project-slug')
    )
  );

-- C. UPDATE: Prepísanie súboru smie vykonať VÝHRADNE vlastník projektu alebo service_role
CREATE POLICY "storage_update_secure"
  ON storage.objects FOR UPDATE
  TO anon, authenticated
  USING (
    auth.role() = 'service_role'
    OR (
      bucket_id = 'client-uploads'
      AND public.get_request_header('x-freelancer-nick') IS NOT NULL
      AND public.is_freelancer_authenticated(
        public.get_request_header('x-freelancer-nick'),
        public.get_request_header('x-freelancer-auth')
      )
      AND EXISTS (
        SELECT 1 FROM public.projects p
        WHERE lower(p.freelancer_name) = lower(public.get_request_header('x-freelancer-nick'))
          AND split_part(name, '/', 1) IN (p.slug, p.id::text)
      )
    )
  )
  WITH CHECK (
    bucket_id = 'client-uploads'
    AND left(name, 1) != '_'
  );

-- D. DELETE: Mazať súbory smie VÝHRADNE overený vlastník projektu alebo service_role (GDPR skartácia)
CREATE POLICY "storage_delete_secure"
  ON storage.objects FOR DELETE
  TO anon, authenticated
  USING (
    auth.role() = 'service_role'
    OR (
      bucket_id = 'client-uploads'
      AND public.get_request_header('x-freelancer-nick') IS NOT NULL
      AND public.is_freelancer_authenticated(
        public.get_request_header('x-freelancer-nick'),
        public.get_request_header('x-freelancer-auth')
      )
      AND EXISTS (
        SELECT 1 FROM public.projects p
        WHERE lower(p.freelancer_name) = lower(public.get_request_header('x-freelancer-nick'))
          AND split_part(name, '/', 1) IN (p.slug, p.id::text)
      )
    )
  );

-- ------------------------------------------------------------------------------
-- 3. ZABEZPEČENIE CITLIVÝCH RPC FUNKCIÍ
-- ------------------------------------------------------------------------------

-- A. delete_freelancer_account: Zákaz priameho volania z anonymného frontendu
REVOKE ALL ON FUNCTION public.delete_freelancer_account(text, text, text) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_freelancer_account(text, text, text) TO service_role;

-- B. verify_freelancer_pin: Doplnenie 350ms kryptografického spomalenia pri zlyhaní (Anti Brute-Force)
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
    PERFORM pg_sleep(0.35);
    RETURN jsonb_build_object('success', false, 'error', 'Chýbajúce prihlasovacie údaje.');
  END IF;

  SELECT id, nick, email, created_at, pin_code
  INTO v_user
  FROM public.freelancers
  WHERE lower(nick) = lower(trim(p_nick)) OR lower(email) = lower(trim(p_nick));

  IF NOT FOUND THEN
    PERFORM pg_sleep(0.35);
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
    PERFORM pg_sleep(0.35);
    RETURN jsonb_build_object('success', false, 'error', 'Nesprávny nickname alebo PIN kód.');
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.verify_freelancer_pin(text, text, text) TO anon, authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 4. KONTROLNÝ AUDIT (Výstup politík storage.objects)
-- ------------------------------------------------------------------------------
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    roles, 
    cmd
FROM pg_policies 
WHERE schemaname = 'storage' AND tablename = 'objects'
ORDER BY cmd;
