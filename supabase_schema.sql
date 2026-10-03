-- DropBrief / SplitAI - Supabase Database & Storage Schema
-- Umiestnenie dátového centra: Frankfurt / Írsko (EU) - GDPR Compliant

-- 0. Tabuľka freelancerov (Autentifikácia Nick + 6-miestny PIN kód)
create table if not exists public.freelancers (
  id uuid primary key default gen_random_uuid(),
  nick text unique not null,
  pin_code text not null,
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
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

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
create index if not exists idx_project_items_project_id on public.project_items(project_id);

-- 4. Row Level Security (RLS) & Policies
-- Pre MVP umožňujeme anonymné čítanie a aktualizáciu na základe slug/projektu
alter table public.freelancers enable row level security;
alter table public.projects enable row level security;
alter table public.project_items enable row level security;

-- Politiky pre freelancerov
create policy "Verejný prístup k freelancerom" 
  on public.freelancers for all 
  using (true) 
  with check (true);

-- Politiky pre projekty
create policy "Anonymný prístup k projektom" 
  on public.projects for all 
  using (true) 
  with check (true);

-- Politiky pre položky projektov
create policy "Anonymný prístup k položkám projektov" 
  on public.project_items for all 
  using (true) 
  with check (true);

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

create policy "Odstránenie podkladov"
  on storage.objects for delete
  using (bucket_id = 'client-uploads');
