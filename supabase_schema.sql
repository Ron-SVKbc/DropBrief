-- DropBrief / SplitAI - Supabase Database & Storage Schema
-- Umiestnenie dátového centra: Frankfurt / Írsko (EU) - GDPR Compliant

-- 0. Tabuľka freelancerov (Autentifikácia Nick + 6-miestny PIN kód)
create table if not exists public.freelancers (
  id uuid primary key default gen_random_uuid(),
  nick text unique not null,
  pin_code text not null, -- POZOR: ukladame len SHA-256 hash PINu, nikdy plain-text!
  email text default '',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_freelancers_nick on public.freelancers(lower(nick));

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

-- 4. Row Level Security (RLS) & Policies
-- Pre MVP umožňujeme anonymné čítanie a aktualizáciu na základe slug/projektu
alter table public.freelancers enable row level security;
alter table public.projects enable row level security;
alter table public.project_items enable row level security;

-- Politiky pre freelancerov
-- Anonymný číteľ môže hľadať účet podľa nicku (kvoli login flow), ale NESMIE modifikovať
create policy "Anonymné vyhlačávanie freelancera podľa nicku"
  on public.freelancers for select
  using (true); -- select je nevyhnutný pre login; obsahuje len hash, nie plain-text PIN

create policy "Freelancer si môže vytvoriť účet"
  on public.freelancers for insert
  with check (true);

-- ZAKAZÁNÉ: Anonymný update/delete freelancerích účtov
-- (chybá RLS pre update/delete = implicitne zakázané bez explicitnej politiky)

-- ─── Politiky pre projekty (granulárne) ───────────────────────────────────────
-- Stará blanket politika odstránená: nahradená striktnejšími pravidlami

-- SELECT: verejné čítanie – klienti potrebujú načítať projekt podľa slug
create policy "select_projects_public"
  on public.projects for select
  using (true);

-- INSERT: povolené pre anon (freelancer bez Supabase Auth)
-- Kontrola: povinné polia musia byť vyplnené
create policy "insert_projects_anon"
  on public.projects for insert
  with check (
    freelancer_name is not null
    and freelancer_name <> ''
    and title      is not null
    and title      <> ''
    and slug       is not null
    and slug       <> ''
  );

-- UPDATE: povolené pre anon (klient odovzdáva podklady, freelancer mení stav)
create policy "update_projects_anon"
  on public.projects for update
  using (true)
  with check (true);

-- DELETE: ŽIADNA politika → RLS implicitne blokuje anon mazanie projektov.
-- Mazanie projektu vyžaduje service-role key cez /api/delete-project alebo
-- priamo cez Supabase dashboard (vyhradené pre administrátora).

-- ─── Politiky pre položky projektov (granulárne) ──────────────────────────────

-- SELECT: voľné – klienti musia vidieť checklist
create policy "select_items_public"
  on public.project_items for select
  using (true);

-- INSERT: povolené pre anon s kontrolou integrity
create policy "insert_items_anon"
  on public.project_items for insert
  with check (
    project_id is not null
    and title  is not null
    and title  <> ''
  );

-- UPDATE: voľné – klient označuje položku ako splnenú
create policy "update_items_anon"
  on public.project_items for update
  using (true)
  with check (true);

-- DELETE: povolené pre anon – freelancer maže jednotlivé položky checklistu
-- (nižšie riziko ako mazanie celého projektu)
create policy "delete_items_anon"
  on public.project_items for delete
  using (true);

-- 5. Storage Bucket pre klientske súbory
insert into storage.buckets (id, name, public)
values ('client-uploads', 'client-uploads', true)
on conflict (id) do update set public = true;

-- Politiky pre úložisko súborov
create policy "Verejné nahrávanie podkladov klientmi"
  on storage.objects for insert
  with check (bucket_id = 'client-uploads');

create policy "Verejné čítanie a sťahovanie podkladov"
  on storage.objects for select
  using (bucket_id = 'client-uploads');

-- ZAKÁZANÉ: Verejné anonymné mazanie súborov z bucketu.
-- Mazanie z cloudu je vyhradené výhradne pre autorizovaný cleanup / service role.
-- (Ak existuje stará politika, zrušte ju: drop policy if exists "Odstránenie podkladov" on storage.objects;)
drop policy if exists "Odstránenie podkladov" on storage.objects;
