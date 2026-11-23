-- Ejecuta este archivo en Supabase > SQL Editor.
create table if not exists public.cards (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  kind text not null default 'Monstruo',
  element text not null default 'Neutro',
  attack integer not null default 0,
  defense integer not null default 0,
  description text not null default '',
  image_url text,
  frame_color text not null default '#9b4d18',
  created_at timestamptz not null default now()
);

create table if not exists public.inventory (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  card_id uuid not null references public.cards(id) on delete cascade,
  quantity integer not null default 1 check (quantity > 0),
  unique(user_id, card_id)
);

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  status text not null default 'in_progress',
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.cards enable row level security;
alter table public.inventory enable row level security;
alter table public.matches enable row level security;

create policy "cards read own" on public.cards for select to authenticated using (owner_id = auth.uid());
create policy "cards create own" on public.cards for insert to authenticated with check (owner_id = auth.uid());
create policy "cards update own" on public.cards for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "cards delete own" on public.cards for delete to authenticated using (owner_id = auth.uid());
create policy "inventory own all" on public.inventory for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "matches own all" on public.matches for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Bucket público para ilustraciones de cartas. En producción, valida también el tamaño y tipo de archivo.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('card-art', 'card-art', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

create policy "card art authenticated upload own folder" on storage.objects
for insert to authenticated with check (bucket_id = 'card-art' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "card art public read" on storage.objects
for select to public using (bucket_id = 'card-art');
create policy "card art owner delete" on storage.objects
for delete to authenticated using (bucket_id = 'card-art' and (storage.foldername(name))[1] = auth.uid()::text);
