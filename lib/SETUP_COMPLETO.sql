-- =====================================================
-- BANCO DE RESPUESTAS — SETUP COMPLETO (idempotente)
-- =====================================================
-- Solo lo corrés UNA VEZ en tu proyecto Supabase.
-- Cada user nuevo solo instala la extensión y se loguea.
-- =====================================================

-- ============ EXTENSIONES ============
create extension if not exists "uuid-ossp";

-- ============ PROFILES ============
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  email text,
  role text not null default 'user' check (role in ('admin', 'user')),
  status text not null default 'active' check (status in ('active', 'suspended')),
  ai_provider text default 'minimax',
  ai_token text,
  created_at timestamptz default now()
);

-- ============ WORDS ============
create table if not exists public.words (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  word text not null,
  kind text not null check (kind in ('noun', 'verb', 'adj', 'phrase')),
  created_at timestamptz default now()
);
create index if not exists words_user_id_idx on public.words(user_id);

-- ============ RESPONSES ============
create table if not exists public.responses (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  text text not null,
  emoji text,
  type text not null default 'full' check (type in ('full', 'word')),
  category text,
  source text not null default 'manual' check (source in ('manual', 'ai', 'seed')),
  use_count int not null default 0,
  created_at timestamptz default now()
);
create index if not exists responses_user_id_idx on public.responses(user_id);
create index if not exists responses_created_at_idx on public.responses(created_at desc);

-- ============ FAVORITES ============
create table if not exists public.favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  response_id uuid not null references public.responses(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, response_id)
);
create index if not exists favorites_user_id_idx on public.favorites(user_id);
create index if not exists favorites_response_id_idx on public.favorites(response_id);

-- ============ TRIGGER: auto-crear perfil al registrarse ============
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    new.email
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============ RPC: limpieza automática (15 días / 50k) ============
create or replace function public.cleanup_user_responses(target_user_id uuid)
returns void as $$
declare
  total_count int;
  cutoff_date timestamptz := now() - interval '15 days';
begin
  -- Borrar respuestas con más de 15 días
  delete from public.responses
  where user_id = target_user_id
    and created_at < cutoff_date;

  -- Si todavía hay más de 50k, dejar en 49k
  select count(*) into total_count
  from public.responses
  where user_id = target_user_id;

  if total_count > 50000 then
    delete from public.responses
    where id in (
      select id from public.responses
      where user_id = target_user_id
      order by created_at asc
      limit (total_count - 49000)
    );
  end if;
end;
$$ language plpgsql security definer;

grant execute on function public.cleanup_user_responses(uuid) to authenticated;

-- ============ RLS ============
alter table public.profiles     enable row level security;
alter table public.words        enable row level security;
alter table public.responses   enable row level security;
alter table public.favorites   enable row level security;

-- ----- Profiles -----
drop policy if exists "Users manage own profile" on public.profiles;
create policy "Users manage own profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "Admins view all profiles" on public.profiles;
create policy "Admins view all profiles" on public.profiles
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ----- Words -----
drop policy if exists "Users manage own words" on public.words;
create policy "Users manage own words" on public.words
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ----- Responses -----
drop policy if exists "Users manage own responses" on public.responses;
create policy "Users manage own responses" on public.responses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ----- Favorites -----
drop policy if exists "Users manage own favorites" on public.favorites;
create policy "Users manage own favorites" on public.favorites
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Admins view all favorites" on public.favorites;
create policy "Admins view all favorites" on public.favorites
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- =====================================================
-- YA ESTÁ. La extensión ya puede usar todo.
-- =====================================================