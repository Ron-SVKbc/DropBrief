-- DropBrief / SplitAI - Supabase Database & Storage Schema
-- Umiestnenie dátového centra: Frankfurt / Írsko (EU) - GDPR Compliant

-- 0. Tabuľka freelancerov (Autentifikácia Nick + 6-miestny PIN kód)
create table if not exists public.freelancers (
  id uuid primary key default gen_random_uuid(),
  nick text unique not null,
  pin_code text not null, -- POZOR: ukladame len SHA-256 hash PINu, nikdy plain-text!
  email text default '',
  tier text not null default 'free',            -- 'free' | 'pro'
  max_projects integer not null default 2,      -- free = 2 sloty, VIP PRO = 5 slotov (+2 za referral)
  referred_by text default null,                -- nickname používateľa, ktorý poslal pozvánku
  referral_count integer not null default 0,    -- počet úspešných odporúčaní
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_freelancers_nick on public.freelancers(lower(nick));
create index if not exists idx_freelancers_email on public.freelancers(lower(email));
create index if not exists idx_freelancers_referred_by on public.freelancers(lower(referred_by));

-- Idempotentná migrácia stĺpcov pre existujúce databázy
alter table public.freelancers add column if not exists tier text not null default 'free';
alter table public.freelancers add column if not exists max_projects integer not null default 2;
alter table public.freelancers add column if not exists referred_by text default null;
alter table public.freelancers add column if not exists referral_count integer not null default 0;
alter table public.freelancers alter column pin_code drop not null;
alter table public.freelancers add column if not exists auth_provider text not null default 'pin';
alter table public.freelancers add column if not exists avatar_url text default null;

-- 1. Tabuľka projektov
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  freelancer_id uuid references public.freelancers(id) on delete set null,
  slug text unique not null,
  title text not null,
  client_name text not null,
  client_email text not null,
  freelancer_name text not null default 'Freelancer',
  freelancer_email text not null default '',
  deadline text default '',
  reminder_frequency integer default 3,
  last_reminder_sent text,
  status text not null default 'pending', -- 'pending' | 'completed'
  project_type text not null default 'one-off', -- 'one-off' (jednorazové) | 'ongoing' (dlhodobé)
  cadence_days integer default 1,               -- frekvencia zberu v dňoch: 1 = denne, 2, 7 = týždenne, atď.
  batches jsonb default '[]'::jsonb,            -- zoznam odovzdaných dávok podkladov podľa dní
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Migrácia pre existujúce databázy
alter table public.projects add column if not exists freelancer_id uuid;
alter table public.projects add column if not exists project_type text default 'one-off';
alter table public.projects add column if not exists cadence_days integer default 1;
alter table public.projects add column if not exists batches jsonb default '[]'::jsonb;
-- 30-dňová retencia a automatická GDPR skartácia:
alter table public.projects add column if not exists completed_at timestamp with time zone;
alter table public.projects add column if not exists purged_at timestamp with time zone;
alter table public.projects add column if not exists files_purged boolean default false;
alter table public.project_items add column if not exists purged boolean default false;

-- 2. Tabuľka položiek checklistu
create table if not exists public.project_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade not null,
  title text not null,
  description text default '',
  type text not null default 'file', -- 'file' | 'text'
  required boolean default true,
  is_completed boolean default false,
  completed_at timestamp with time zone,
  value jsonb, -- { fileName, fileSize, fileType, fileUrl } alebo reťazec textu
  sort_order integer default 0
);

-- 3. Indexy pre bleskové vyhľadávanie
create index if not exists idx_projects_slug on public.projects(slug);
create index if not exists idx_projects_freelancer_id on public.projects(freelancer_id);
create index if not exists idx_projects_freelancer_name on public.projects(lower(freelancer_name));
create index if not exists idx_project_items_project_id on public.project_items(project_id);

-- 4. Row Level Security (RLS) & Policies (Zero-Trust & Multi-Tenant Isolation)
alter table public.freelancers enable row level security;
alter table public.freelancers force row level security;

alter table public.projects enable row level security;
alter table public.projects force row level security;

alter table public.project_items enable row level security;
alter table public.project_items force row level security;

-- Pomocná funkcia na bezpečné čítanie hlavičiek z požiadavky (PostgREST)
create or replace function public.get_request_header(header_name text)
returns text
language plpgsql
stable
set search_path = public
as $$
declare
  headers_raw text;
begin
  headers_raw := current_setting('request.headers', true);
  if headers_raw is null or headers_raw = '' then
    return null;
  end if;
  return nullif((headers_raw::jsonb ->> lower(header_name)), '');
exception when others then
  return null;
end;
$$;

grant execute on function public.get_request_header(text) to anon, authenticated, service_role;

-- ─── Bezpečné pomocné funkcie (SECURITY DEFINER) ──────────────────────────────
revoke all on public.freelancers from anon, authenticated;
grant insert on public.freelancers to anon, authenticated;
grant select on public.freelancers to anon, authenticated;
grant update (pin_code, email) on public.freelancers to anon, authenticated;
grant delete on public.freelancers to anon, authenticated;

-- Bezpečné overenie, či má freelancer platný PIN hash (rieši cross-table práva bez chýb)
create or replace function public.is_freelancer_authenticated(p_nick text, p_pin_hash text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_nick is null or p_pin_hash is null or trim(p_nick) = '' or trim(p_pin_hash) = '' then
    return false;
  end if;

  return exists (
    select 1 from public.freelancers
    where lower(nick) = lower(trim(p_nick))
      and pin_code = trim(p_pin_hash)
  );
end;
$$;

grant execute on function public.is_freelancer_authenticated(text, text) to anon, authenticated, service_role;

-- Bezpečná kontrola dostupnosti nicku (SECURITY DEFINER funkcia bez úniku hashov)
create or replace function public.check_nick_available(check_nick text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if check_nick is null or length(trim(check_nick)) < 2 then
    return false;
  end if;
  return not exists (
    select 1 from public.freelancers 
    where lower(nick) = lower(trim(check_nick))
  );
end;
$$;

grant execute on function public.check_nick_available(text) to anon, authenticated, service_role;

-- Bezpečná kontrola dostupnosti e-mailu (SECURITY DEFINER funkcia bez úniku hashov)
create or replace function public.check_email_available(check_email text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if check_email is null or length(trim(check_email)) < 3 or position('@' in check_email) = 0 then
    return false;
  end if;
  return not exists (
    select 1 from public.freelancers 
    where lower(email) = lower(trim(check_email))
  );
end;
$$;

grant execute on function public.check_email_available(text) to anon, authenticated, service_role;

-- Bezpečné overenie PIN kódu na serverovej úrovni (podporuje Nick aj E-mail, vracia tier a limity)
create or replace function public.verify_freelancer_pin(
  p_nick text,
  p_salted_hash text,
  p_unsalted_hash text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user record;
begin
  if p_nick is null or (p_salted_hash is null and p_unsalted_hash is null) then
    return jsonb_build_object('success', false, 'error', 'Chýbajúce prihlasovacie údaje.');
  end if;

  select id, nick, email, created_at, pin_code, tier, max_projects, referral_count, referred_by
  into v_user
  from public.freelancers
  where lower(nick) = lower(trim(p_nick)) or lower(email) = lower(trim(p_nick));

  if not found then
    return jsonb_build_object('success', false, 'error', 'Nesprávny nickname alebo PIN kód.');
  end if;

  if v_user.pin_code = p_salted_hash or v_user.pin_code = p_unsalted_hash then
    return jsonb_build_object(
      'success', true,
      'user', jsonb_build_object(
        'id', v_user.id,
        'nick', v_user.nick,
        'email', v_user.email,
        'createdAt', v_user.created_at,
        'pinHash', v_user.pin_code,
        'tier', coalesce(v_user.tier, 'free'),
        'max_projects', coalesce(v_user.max_projects, 2),
        'maxProjects', coalesce(v_user.max_projects, 2),
        'referral_count', coalesce(v_user.referral_count, 0),
        'referralCount', coalesce(v_user.referral_count, 0),
        'referred_by', v_user.referred_by,
        'referredBy', v_user.referred_by
      )
    );
  else
    return jsonb_build_object('success', false, 'error', 'Nesprávny nickname alebo PIN kód.');
  end if;
end;
$$;

grant execute on function public.verify_freelancer_pin(text, text, text) to anon, authenticated, service_role;

-- Bezpečná registrácia freelancera so spracovaním referralov (SECURITY DEFINER)
create or replace function public.register_freelancer(
  p_nick text,
  p_pin_hash text,
  p_email text default '',
  p_referred_by text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_clean_nick text;
  v_clean_email text;
  v_clean_ref text;
  v_inviter record;
  v_valid_inviter text := null;
  v_new_user record;
begin
  -- Kontrola nicku (dĺžka 2 až 50 znakov)
  if p_nick is null or length(trim(p_nick)) < 2 or length(trim(p_nick)) > 50 then
    return jsonb_build_object('success', false, 'error', 'Nickname must be between 2 and 50 characters.');
  end if;

  -- Kontrola PIN hashu (64-znakový SHA-256)
  if p_pin_hash is null or length(trim(p_pin_hash)) != 64 then
    return jsonb_build_object('success', false, 'error', 'Invalid PIN hash.');
  end if;

  v_clean_nick := trim(p_nick);
  v_clean_email := lower(trim(coalesce(p_email, '')));
  v_clean_ref := nullif(trim(coalesce(p_referred_by, '')), '');

  -- Overenie dostupnosti nicku
  if exists (select 1 from public.freelancers where lower(nick) = lower(v_clean_nick)) then
    return jsonb_build_object('success', false, 'error', 'Nickname is already taken.');
  end if;

  -- Overenie dostupnosti e-mailu (ak bol zadaný)
  if v_clean_email != '' and exists (select 1 from public.freelancers where lower(email) = v_clean_email) then
    return jsonb_build_object('success', false, 'error', 'An account with this email already exists.');
  end if;

  -- Validácia referralu:
  -- 1. Zákaz self-referralu (používateľ nesmie odporučiť sám seba)
  -- 2. Overenie existencie pozývajúceho v tabuľke freelancers
  if v_clean_ref is not null and lower(v_clean_ref) != lower(v_clean_nick) then
    select nick into v_inviter
    from public.freelancers
    where lower(nick) = lower(v_clean_ref);

    if found then
      v_valid_inviter := v_inviter.nick;
      -- Odmena: navýšenie počtu odporúčaní o +1 a odomknutie +2 slotov pre pozývajúceho
      update public.freelancers
      set referral_count = coalesce(referral_count, 0) + 1,
          max_projects = coalesce(max_projects, 2) + 2
      where lower(nick) = lower(v_clean_ref);
    end if;
  end if;

  -- Vloženie nového freelancera do databázy
  insert into public.freelancers (
    nick,
    pin_code,
    email,
    tier,
    max_projects,
    referred_by,
    referral_count
  ) values (
    v_clean_nick,
    trim(p_pin_hash),
    v_clean_email,
    'free',
    2,
    v_valid_inviter,
    0
  )
  returning id, nick, email, tier, max_projects, referral_count, referred_by, created_at, pin_code
  into v_new_user;

  return jsonb_build_object(
    'success', true,
    'user', jsonb_build_object(
      'id', v_new_user.id,
      'nick', v_new_user.nick,
      'email', v_new_user.email,
      'tier', v_new_user.tier,
      'max_projects', v_new_user.max_projects,
      'maxProjects', v_new_user.max_projects,
      'referral_count', v_new_user.referral_count,
      'referralCount', v_new_user.referral_count,
      'referred_by', v_new_user.referred_by,
      'referredBy', v_new_user.referred_by,
      'createdAt', v_new_user.created_at,
      'pinHash', v_new_user.pin_code
    )
  );
end;
$$;

grant execute on function public.register_freelancer(text, text, text, text) to anon, authenticated, service_role;

-- Synchronizácia používateľa prihláseného cez Google OAuth (SECURITY DEFINER)
create or replace function public.sync_google_freelancer(
  p_name text,
  p_avatar text default null,
  p_referred_by text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_email text := auth.jwt()->>'email';
  v_existing record;
  v_clean_nick text;
  v_candidate_nick text;
  v_counter integer := 1;
  v_user record;
  v_valid_inviter text := null;
  v_inviter record;
begin
  if v_uid is null or v_email is null or trim(v_email) = '' then
    return jsonb_build_object('success', false, 'error', 'Neoprávnený prístup. Vyžaduje sa aktívna Google relácia.');
  end if;

  v_email := lower(trim(v_email));

  -- 1. Pozrieť, či už existuje záznam pre toto email alebo id
  select * into v_existing
  from public.freelancers
  where id = v_uid or lower(email) = v_email
  limit 1;

  if found then
    -- Aktualizovať existujúci záznam s Google údajmi
    update public.freelancers
    set avatar_url = coalesce(p_avatar, avatar_url),
        auth_provider = 'google'
    where id = v_existing.id;

    -- Ak projekty mali starý freelancer_id alebo prázdny, prepojiť
    update public.projects
    set freelancer_id = v_existing.id
    where freelancer_id is null and lower(freelancer_email) = v_email;

    select id, nick, email, tier, max_projects, referral_count, referred_by, created_at, avatar_url, auth_provider
    into v_user
    from public.freelancers
    where id = v_existing.id;

    return jsonb_build_object(
      'success', true,
      'isNew', false,
      'user', jsonb_build_object(
        'id', v_user.id,
        'nick', v_user.nick,
        'email', v_user.email,
        'tier', coalesce(v_user.tier, 'free'),
        'max_projects', coalesce(v_user.max_projects, 2),
        'maxProjects', coalesce(v_user.max_projects, 2),
        'referral_count', coalesce(v_user.referral_count, 0),
        'referralCount', coalesce(v_user.referral_count, 0),
        'referred_by', v_user.referred_by,
        'referredBy', v_user.referred_by,
        'createdAt', v_user.created_at,
        'avatarUrl', v_user.avatar_url,
        'authProvider', 'google'
      )
    );
  end if;

  -- 2. Nový používateľ: Vytvoriť unikátny nick
  v_clean_nick := nullif(trim(coalesce(p_name, '')), '');
  if v_clean_nick is null then
    v_clean_nick := split_part(v_email, '@', 1);
  end if;
  v_clean_nick := regexp_replace(v_clean_nick, '[^a-zA-Z0-9_\-\s]', '', 'g');
  if length(v_clean_nick) < 2 then
    v_clean_nick := split_part(v_email, '@', 1);
  end if;
  if length(v_clean_nick) > 40 then
    v_clean_nick := substring(v_clean_nick from 1 for 40);
  end if;

  v_candidate_nick := v_clean_nick;
  while exists (select 1 from public.freelancers where lower(nick) = lower(v_candidate_nick)) loop
    v_counter := v_counter + 1;
    v_candidate_nick := v_clean_nick || ' ' || v_counter;
  end loop;

  -- Spracovať referral kód
  if p_referred_by is not null and trim(p_referred_by) != '' and lower(trim(p_referred_by)) != lower(v_candidate_nick) then
    select nick into v_inviter
    from public.freelancers
    where lower(nick) = lower(trim(p_referred_by));

    if found then
      v_valid_inviter := v_inviter.nick;
      update public.freelancers
      set referral_count = coalesce(referral_count, 0) + 1,
          max_projects = coalesce(max_projects, 2) + 2
      where lower(nick) = lower(v_valid_inviter);
    end if;
  end if;

  -- Vložiť nového používateľa
  insert into public.freelancers (
    id,
    nick,
    pin_code,
    email,
    tier,
    max_projects,
    referred_by,
    referral_count,
    auth_provider,
    avatar_url
  ) values (
    v_uid,
    v_candidate_nick,
    null,
    v_email,
    'free',
    2,
    v_valid_inviter,
    0,
    'google',
    p_avatar
  )
  returning id, nick, email, tier, max_projects, referral_count, referred_by, created_at, avatar_url, auth_provider
  into v_user;

  return jsonb_build_object(
    'success', true,
    'isNew', true,
    'user', jsonb_build_object(
      'id', v_user.id,
      'nick', v_user.nick,
      'email', v_user.email,
      'tier', coalesce(v_user.tier, 'free'),
      'max_projects', coalesce(v_user.max_projects, 2),
      'maxProjects', coalesce(v_user.max_projects, 2),
      'referral_count', coalesce(v_user.referral_count, 0),
      'referralCount', coalesce(v_user.referral_count, 0),
      'referred_by', v_user.referred_by,
      'referredBy', v_user.referred_by,
      'createdAt', v_user.created_at,
      'avatarUrl', v_user.avatar_url,
      'authProvider', 'google'
    )
  );
end;
$$;

grant execute on function public.sync_google_freelancer(text, text, text) to authenticated, anon, service_role;

-- ─── SQL Príkaz na povýšenie early VIP používateľov na Founding PRO (5 slotov) ──
-- update public.freelancers set tier = 'pro', max_projects = 5 where lower(nick) in ('marko', 'studio creative');

-- Bezpečná obnova PINu na serveri pre /api/reset-pin (VÝHRADNE service_role, NIKDY anon!)
create or replace function public.reset_freelancer_pin(
  p_email text,
  p_new_pin_hash text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user record;
begin
  -- Absolútny zákaz volania z verejného frontendu / anon:
  if auth.role() != 'service_role' then
    return jsonb_build_object('success', false, 'error', 'Neoprávnený prístup. Vyžaduje sa service_role.');
  end if;

  if p_email is null or p_new_pin_hash is null or length(p_new_pin_hash) != 64 then
    return jsonb_build_object('success', false, 'error', 'Neplatné vstupné údaje.');
  end if;

  select id, nick, email into v_user
  from public.freelancers
  where lower(email) = lower(trim(p_email));

  if not found then
    return jsonb_build_object('success', false, 'error', 'Účet s týmto e-mailom sa nenašiel.');
  end if;

  update public.freelancers
  set pin_code = p_new_pin_hash
  where id = v_user.id;

  return jsonb_build_object(
    'success', true,
    'user', jsonb_build_object(
      'id', v_user.id,
      'nick', v_user.nick,
      'email', v_user.email
    )
  );
end;
$$;

revoke all on function public.reset_freelancer_pin(text, text) from public, anon, authenticated;
grant execute on function public.reset_freelancer_pin(text, text) to service_role;

-- Bezpečné a nezvratné zmazanie účtu a projektov (GDPR čl. 17 - Právo na vymazanie)
create or replace function public.delete_freelancer_account(
  p_nick text,
  p_salted_hash text,
  p_unsalted_hash text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user record;
  v_proj record;
  v_deleted_projects integer := 0;
  v_slugs text[] := array[]::text[];
begin
  if p_nick is null or (p_salted_hash is null and p_unsalted_hash is null) then
    return jsonb_build_object('success', false, 'error', 'Chýbajúce prihlasovacie údaje pre overenie identity.');
  end if;

  select id, nick, email, pin_code into v_user
  from public.freelancers
  where lower(nick) = lower(trim(p_nick)) or lower(email) = lower(trim(p_nick));

  if not found then
    return jsonb_build_object('success', false, 'error', 'Používateľský účet sa nenašiel.');
  end if;

  if v_user.pin_code != p_salted_hash and v_user.pin_code != p_unsalted_hash then
    return jsonb_build_object('success', false, 'error', 'Nesprávny PIN kód. Z bezpečnostných dôvodov nie je možné účet zmazať.');
  end if;

  -- Zozbierať projekty a vymazať ich spolu s položkami
  for v_proj in (
    select id, slug 
    from public.projects 
    where freelancer_id = v_user.id or lower(freelancer_name) = lower(v_user.nick)
  ) loop
    v_slugs := array_append(v_slugs, v_proj.slug);
    delete from public.project_items where project_id = v_proj.id;
    delete from public.projects where id = v_proj.id;
    v_deleted_projects := v_deleted_projects + 1;
  end loop;

  -- Odstrániť samotného freelancera
  delete from public.freelancers where id = v_user.id;

  return jsonb_build_object(
    'success', true,
    'message', 'Účet a všetky súvisiace projekty boli úspešne vymazané.',
    'deletedProjects', v_deleted_projects,
    'projectSlugs', to_jsonb(v_slugs),
    'userNick', v_user.nick
  );
end;
$$;

grant execute on function public.delete_freelancer_account(text, text, text) to anon, authenticated, service_role;

-- Bezpečná kontrola prístupu k položkám projektu
create or replace function public.can_access_project(p_project_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_proj record;
  v_client_slug text;
  v_fl_nick text;
  v_fl_auth text;
begin
  if p_project_id is null then
    return false;
  end if;

  if auth.role() = 'service_role' then
    return true;
  end if;

  select slug, id, freelancer_name into v_proj
  from public.projects
  where id = p_project_id;

  if not found then
    return false;
  end if;

  v_client_slug := public.get_request_header('x-project-slug');
  if v_client_slug is not null and (v_proj.slug = v_client_slug or v_proj.id::text = v_client_slug) then
    return true;
  end if;

  v_fl_nick := public.get_request_header('x-freelancer-nick');
  v_fl_auth := public.get_request_header('x-freelancer-auth');
  if v_fl_nick is not null and lower(v_proj.freelancer_name) = lower(v_fl_nick) then
    return public.is_freelancer_authenticated(v_fl_nick, v_fl_auth);
  end if;

  return false;
end;
$$;

grant execute on function public.can_access_project(uuid) to anon, authenticated, service_role;

-- Bezpečná kontrola správy položiek projektu (vkladanie a mazanie smie vykonať iba overený vlastník projektu)
create or replace function public.can_manage_project_items(p_project_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_fl_name text;
  v_fl_nick text;
  v_fl_auth text;
begin
  if p_project_id is null then
    return false;
  end if;

  if auth.role() = 'service_role' then
    return true;
  end if;

  v_fl_nick := public.get_request_header('x-freelancer-nick');
  v_fl_auth := public.get_request_header('x-freelancer-auth');

  if v_fl_nick is null or v_fl_auth is null then
    return false;
  end if;

  if not public.is_freelancer_authenticated(v_fl_nick, v_fl_auth) then
    return false;
  end if;

  select freelancer_name into v_fl_name
  from public.projects
  where id = p_project_id;

  if not found then
    return false;
  end if;

  return lower(v_fl_name) = lower(v_fl_nick);
end;
$$;

grant execute on function public.can_manage_project_items(uuid) to anon, authenticated, service_role;


create policy "freelancers_insert_policy"
  on public.freelancers for insert
  to anon, authenticated
  with check (
    nick is not null 
    and length(trim(nick)) >= 2 
    and length(trim(nick)) <= 50
    and pin_code is not null 
    and length(pin_code) = 64
  );

create policy "freelancers_select_policy"
  on public.freelancers for select
  to anon, authenticated
  using (
    (
      public.get_request_header('x-freelancer-nick') is not null
      and lower(nick) = lower(public.get_request_header('x-freelancer-nick'))
      and pin_code = public.get_request_header('x-freelancer-auth')
    )
    or auth.role() = 'service_role'
  );

create policy "freelancers_update_policy"
  on public.freelancers for update
  to anon, authenticated
  using (
    (
      public.get_request_header('x-freelancer-nick') is not null
      and lower(nick) = lower(public.get_request_header('x-freelancer-nick'))
      and pin_code = public.get_request_header('x-freelancer-auth')
    )
    or auth.role() = 'service_role'
  )
  with check (
    (
      public.get_request_header('x-freelancer-nick') is not null
      and lower(nick) = lower(public.get_request_header('x-freelancer-nick'))
      and (pin_code is null or length(pin_code) = 64)
    )
    or auth.role() = 'service_role'
  );

create policy "freelancers_delete_policy"
  on public.freelancers for delete
  to anon, authenticated
  using (
    (
      public.get_request_header('x-freelancer-nick') is not null
      and lower(nick) = lower(public.get_request_header('x-freelancer-nick'))
      and pin_code = public.get_request_header('x-freelancer-auth')
    )
    or auth.role() = 'service_role'
  );

-- ─── Politiky pre projekty (granulárne & bezpečné) ───────────────────────────

create policy "projects_select_secure"
  on public.projects for select
  to anon, authenticated
  using (
    (
      public.get_request_header('x-project-slug') is not null
      and (
        slug = public.get_request_header('x-project-slug')
        or id::text = public.get_request_header('x-project-slug')
      )
    )
    or (
      public.get_request_header('x-freelancer-nick') is not null
      and lower(freelancer_name) = lower(public.get_request_header('x-freelancer-nick'))
      and public.is_freelancer_authenticated(
        public.get_request_header('x-freelancer-nick'),
        public.get_request_header('x-freelancer-auth')
      )
    )
    or auth.role() = 'service_role'
  );

create policy "projects_insert_secure"
  on public.projects for insert
  to anon, authenticated
  with check (
    title is not null and length(trim(title)) > 0
    and slug is not null and length(trim(slug)) > 0
    and client_name is not null and length(trim(client_name)) > 0
    and freelancer_name is not null and length(trim(freelancer_name)) > 0
    and (
      (
        public.get_request_header('x-freelancer-nick') is not null
        and lower(freelancer_name) = lower(public.get_request_header('x-freelancer-nick'))
        and public.is_freelancer_authenticated(
          public.get_request_header('x-freelancer-nick'),
          public.get_request_header('x-freelancer-auth')
        )
      )
      or auth.role() = 'service_role'
    )
  );

create policy "projects_update_secure"
  on public.projects for update
  to anon, authenticated
  using (
    (
      public.get_request_header('x-project-slug') is not null
      and (
        slug = public.get_request_header('x-project-slug')
        or id::text = public.get_request_header('x-project-slug')
      )
    )
    or (
      public.get_request_header('x-freelancer-nick') is not null
      and lower(freelancer_name) = lower(public.get_request_header('x-freelancer-nick'))
      and public.is_freelancer_authenticated(
        public.get_request_header('x-freelancer-nick'),
        public.get_request_header('x-freelancer-auth')
      )
    )
    or auth.role() = 'service_role'
  )
  with check (
    (
      public.get_request_header('x-project-slug') is not null
      and (
        slug = public.get_request_header('x-project-slug')
        or id::text = public.get_request_header('x-project-slug')
      )
    )
    or (
      public.get_request_header('x-freelancer-nick') is not null
      and lower(freelancer_name) = lower(public.get_request_header('x-freelancer-nick'))
      and public.is_freelancer_authenticated(
        public.get_request_header('x-freelancer-nick'),
        public.get_request_header('x-freelancer-auth')
      )
    )
    or auth.role() = 'service_role'
  );

create policy "projects_delete_secure"
  on public.projects for delete
  to anon, authenticated
  using (
    (
      public.get_request_header('x-freelancer-nick') is not null
      and lower(freelancer_name) = lower(public.get_request_header('x-freelancer-nick'))
      and public.is_freelancer_authenticated(
        public.get_request_header('x-freelancer-nick'),
        public.get_request_header('x-freelancer-auth')
      )
    )
    or auth.role() = 'service_role'
  );

-- ─── Politiky pre položky projektov (granulárne & bezpečné) ───────────────────

create policy "items_select_secure"
  on public.project_items for select
  to anon, authenticated
  using (
    public.can_access_project(project_items.project_id)
  );

create policy "items_insert_secure"
  on public.project_items for insert
  to anon, authenticated
  with check (
    project_id is not null
    and title is not null and length(trim(title)) > 0
    and (
      public.can_manage_project_items(project_items.project_id)
      or auth.role() = 'service_role'
    )
  );

create policy "items_update_secure"
  on public.project_items for update
  to anon, authenticated
  using (
    public.can_access_project(project_items.project_id)
  )
  with check (
    public.can_access_project(project_items.project_id)
  );

create policy "items_delete_secure"
  on public.project_items for delete
  to anon, authenticated
  using (
    public.can_manage_project_items(project_items.project_id)
    or auth.role() = 'service_role'
  );

-- 5. Storage Bucket pre klientske súbory
insert into storage.buckets (id, name, public)
values ('client-uploads', 'client-uploads', true)
on conflict (id) do update set public = true;

grant all on storage.objects to anon, authenticated, service_role;
grant all on storage.buckets to anon, authenticated, service_role;

drop policy if exists "Verejná aktualizácia v bucket" on storage.objects;
drop policy if exists "Verejné nahrávanie podkladov klientmi" on storage.objects;
drop policy if exists "Verejné čítanie a sťahovanie podkladov" on storage.objects;
drop policy if exists "Odstránenie podkladov" on storage.objects;
drop policy if exists "storage_upload_secure" on storage.objects;
drop policy if exists "storage_select_secure" on storage.objects;
drop policy if exists "storage_update_secure" on storage.objects;
drop policy if exists "storage_delete_secure" on storage.objects;

-- A. Nahrávanie súborov: Povolené do bucketu client-uploads do klientskych priečinkov
create policy "storage_upload_secure"
  on storage.objects for insert
  to anon, authenticated
  with check (
    bucket_id = 'client-uploads'
    and left(name, 1) != '_'
    and position('/' in name) > 1
  );

-- B. Čítanie a listing súborov: Zákaz plošného zoznamovania celého disku
create policy "storage_select_secure"
  on storage.objects for select
  to anon, authenticated
  using (
    auth.role() = 'service_role'
    or (
      bucket_id = 'client-uploads'
      and public.get_request_header('x-freelancer-nick') is not null
      and public.is_freelancer_authenticated(
        public.get_request_header('x-freelancer-nick'),
        public.get_request_header('x-freelancer-auth')
      )
      and exists (
        select 1 from public.projects p
        where lower(p.freelancer_name) = lower(public.get_request_header('x-freelancer-nick'))
          and split_part(name, '/', 1) in (p.slug, p.id::text)
      )
    )
    or (
      bucket_id = 'client-uploads'
      and public.get_request_header('x-project-slug') is not null
      and split_part(name, '/', 1) = public.get_request_header('x-project-slug')
    )
  );

-- C. Prepísanie súborov (upsert): Povolené iba pre overeného vlastníka projektu alebo service_role
create policy "storage_update_secure"
  on storage.objects for update
  to anon, authenticated
  using (
    auth.role() = 'service_role'
    or (
      bucket_id = 'client-uploads'
      and public.get_request_header('x-freelancer-nick') is not null
      and public.is_freelancer_authenticated(
        public.get_request_header('x-freelancer-nick'),
        public.get_request_header('x-freelancer-auth')
      )
      and exists (
        select 1 from public.projects p
        where lower(p.freelancer_name) = lower(public.get_request_header('x-freelancer-nick'))
          and split_part(name, '/', 1) in (p.slug, p.id::text)
      )
    )
  )
  with check (
    bucket_id = 'client-uploads'
    and left(name, 1) != '_'
  );

-- D. Mazanie súborov: Povolené iba pre overeného vlastníka projektu alebo service_role (GDPR skartácia)
create policy "storage_delete_secure"
  on storage.objects for delete
  to anon, authenticated
  using (
    auth.role() = 'service_role'
    or (
      bucket_id = 'client-uploads'
      and public.get_request_header('x-freelancer-nick') is not null
      and public.is_freelancer_authenticated(
        public.get_request_header('x-freelancer-nick'),
        public.get_request_header('x-freelancer-auth')
      )
      and exists (
        select 1 from public.projects p
        where lower(p.freelancer_name) = lower(public.get_request_header('x-freelancer-nick'))
          and split_part(name, '/', 1) in (p.slug, p.id::text)
      )
    )
  );

-- 6. Integritné triggery (Ochrana citlivých polí pri aktualizácii klientom)
create or replace function public.enforce_project_update_integrity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_fl boolean;
begin
  if auth.role() = 'service_role' then
    return new;
  end if;

  v_is_fl := (
    public.get_request_header('x-freelancer-nick') is not null
    and lower(old.freelancer_name) = lower(public.get_request_header('x-freelancer-nick'))
    and public.is_freelancer_authenticated(
      public.get_request_header('x-freelancer-nick'),
      public.get_request_header('x-freelancer-auth')
    )
  );

  if not v_is_fl then
    new.id := old.id;
    new.slug := old.slug;
    new.freelancer_id := old.freelancer_id;
    new.freelancer_name := old.freelancer_name;
    new.freelancer_email := old.freelancer_email;
    new.client_name := old.client_name;
    new.client_email := old.client_email;
    new.title := old.title;
    new.created_at := old.created_at;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_protect_project_integrity on public.projects;
create trigger trg_protect_project_integrity
  before update on public.projects
  for each row
  execute function public.enforce_project_update_integrity();

create or replace function public.enforce_item_update_integrity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_fl boolean;
  v_proj record;
begin
  if auth.role() = 'service_role' then
    return new;
  end if;

  new.project_id := old.project_id;

  select freelancer_name into v_proj
  from public.projects
  where id = old.project_id;

  v_is_fl := (
    v_proj.freelancer_name is not null
    and public.get_request_header('x-freelancer-nick') is not null
    and lower(v_proj.freelancer_name) = lower(public.get_request_header('x-freelancer-nick'))
    and public.is_freelancer_authenticated(
      public.get_request_header('x-freelancer-nick'),
      public.get_request_header('x-freelancer-auth')
    )
  );

  if not v_is_fl then
    new.title := old.title;
    new.description := old.description;
    new.type := old.type;
    new.required := old.required;
    new.sort_order := old.sort_order;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_protect_item_integrity on public.project_items;
create trigger trg_protect_item_integrity
  before update on public.project_items
  for each row
  execute function public.enforce_item_update_integrity();

-- 7. Povolenie Supabase Realtime (WebSockets synchronizácia zmien v reálnom čase)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'projects'
  ) then
    alter publication supabase_realtime add table public.projects;
  end if;

  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'project_items'
  ) then
    alter publication supabase_realtime add table public.project_items;
  end if;
end $$;
