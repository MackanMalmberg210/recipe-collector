-- ==============================================================================
-- Recipe Collector — Complete Supabase PostgreSQL Schema & Security Policies
-- Migration: 20260914_initial_schema.sql
-- ==============================================================================

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ==============================================================================
-- 1. USER PROFILES TABLE
-- ==============================================================================
create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  role text default 'user' check (role in ('user', 'admin')),
  subscription_tier text default 'free' check (subscription_tier in ('free', 'pro')),
  unit_system text default 'metric' check (unit_system in ('metric', 'imperial')),
  default_servings integer default 4,
  dietary_preferences jsonb default '[]'::jsonb,
  strict_dietary_filter boolean default false,
  auto_scale_recipes boolean default true,
  auto_add_low_pantry boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.user_profiles enable row level security;

-- Trigger to auto-create user_profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.user_profiles (user_id, email, display_name, role, subscription_tier)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    'user',
    'free'
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helper function: Is Current User Admin
create or replace function public.is_admin()
returns boolean language sql security definer as $$
  select exists (
    select 1 from public.user_profiles
    where user_id = auth.uid() and role = 'admin'
  );
$$;

-- Policies for user_profiles
drop policy if exists "Users can view own profile or admins can view all" on public.user_profiles;
create policy "Users can view own profile or admins can view all"
  on public.user_profiles for select
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Users can update own settings" on public.user_profiles;
create policy "Users can update own settings"
  on public.user_profiles for update
  using (auth.uid() = user_id or public.is_admin())
  with check (
    -- Non-admins cannot elevate their own role or subscription_tier directly
    (auth.uid() = user_id and (role = (select role from public.user_profiles where user_id = auth.uid())) and (subscription_tier = (select subscription_tier from public.user_profiles where user_id = auth.uid())))
    or public.is_admin()
  );

drop policy if exists "Users can insert own profile" on public.user_profiles;
create policy "Users can insert own profile"
  on public.user_profiles for insert
  with check (auth.uid() = user_id);

-- ==============================================================================
-- 2. RECIPES TABLE
-- ==============================================================================
create table if not exists public.recipes (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  image text default '',
  cook_time integer,
  calories integer,
  servings integer,
  category text,
  meal_type text,
  origin text default 'user',
  ingredients jsonb not null default '[]'::jsonb,
  instructions jsonb not null default '[]'::jsonb,
  nutrition jsonb default '{}'::jsonb,
  tags text[] default '{}',
  source_url text,
  source_name text,
  is_public boolean default false,
  author_name text,
  is_quarantined boolean default false,
  moderation_reason text,
  created_at timestamptz default now()
);

alter table public.recipes enable row level security;

create index if not exists idx_recipes_user on public.recipes(user_id);
create index if not exists idx_recipes_public on public.recipes(is_public) where is_public = true;
create index if not exists idx_recipes_category on public.recipes(category);
create index if not exists idx_recipes_meal_type on public.recipes(meal_type);

-- Policies for recipes
drop policy if exists "Public recipes viewable by everyone" on public.recipes;
create policy "Public recipes viewable by everyone"
  on public.recipes for select
  using (
    (is_public = true and (is_quarantined is null or is_quarantined = false))
    or (auth.uid() = user_id)
    or public.is_admin()
  );

drop policy if exists "Authenticated users can create recipes" on public.recipes;
create policy "Authenticated users can create recipes"
  on public.recipes for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own recipes or admins update any" on public.recipes;
create policy "Users can update own recipes or admins update any"
  on public.recipes for update
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Users can delete own recipes or admins delete any" on public.recipes;
create policy "Users can delete own recipes or admins delete any"
  on public.recipes for delete
  using (auth.uid() = user_id or public.is_admin());

-- ==============================================================================
-- 3. RECIPE COOK PHOTOS TABLE
-- ==============================================================================
create table if not exists public.recipe_cook_photos (
  id uuid primary key default gen_random_uuid(),
  recipe_id bigint not null,
  user_id uuid references auth.users(id) on delete cascade,
  author_name text default 'Home Cook',
  image_url text not null,
  storage_path text,
  caption text default '',
  rating numeric,
  is_quarantined boolean default false,
  created_at timestamptz default now()
);

alter table public.recipe_cook_photos enable row level security;

create index if not exists idx_cook_photos_recipe on public.recipe_cook_photos(recipe_id);

drop policy if exists "Public can view non-quarantined cook photos" on public.recipe_cook_photos;
create policy "Public can view non-quarantined cook photos"
  on public.recipe_cook_photos for select
  using (
    (is_quarantined is null or is_quarantined = false)
    or (auth.uid() = user_id)
    or public.is_admin()
  );

drop policy if exists "Authenticated users can add cook photos" on public.recipe_cook_photos;
create policy "Authenticated users can add cook photos"
  on public.recipe_cook_photos for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own cook photo captions or admins can moderate" on public.recipe_cook_photos;
create policy "Users can update own cook photo captions or admins can moderate"
  on public.recipe_cook_photos for update
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Users can delete own cook photos or admins can delete any" on public.recipe_cook_photos;
create policy "Users can delete own cook photos or admins can delete any"
  on public.recipe_cook_photos for delete
  using (auth.uid() = user_id or public.is_admin());

-- ==============================================================================
-- 4. USER FAVORITES TABLE
-- ==============================================================================
create table if not exists public.user_favorites (
  user_id uuid references auth.users(id) on delete cascade,
  recipe_id bigint not null,
  created_at timestamptz default now(),
  primary key (user_id, recipe_id)
);

alter table public.user_favorites enable row level security;

drop policy if exists "Users manage own favorites" on public.user_favorites;
create policy "Users manage own favorites"
  on public.user_favorites for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ==============================================================================
-- 5. GROCERY ITEMS TABLE
-- ==============================================================================
create table if not exists public.grocery_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  list_name text default 'main',
  name text not null,
  bought boolean default false,
  category text default 'Other',
  quantity text default '1',
  unit text default '',
  notes text default '',
  recipe_id bigint,
  recipe_title text default '',
  created_at timestamptz default now()
);

alter table public.grocery_items enable row level security;

create index if not exists idx_groceries_user_list on public.grocery_items(user_id, list_name);

drop policy if exists "Users manage own groceries" on public.grocery_items;
create policy "Users manage own groceries"
  on public.grocery_items for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ==============================================================================
-- 6. PANTRY ITEMS TABLE
-- ==============================================================================
create table if not exists public.pantry_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  in_stock boolean default true,
  category text default 'Other',
  last_updated timestamptz default now(),
  unique (user_id, name)
);

alter table public.pantry_items enable row level security;

drop policy if exists "Users manage own pantry inventory" on public.pantry_items;
create policy "Users manage own pantry inventory"
  on public.pantry_items for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ==============================================================================
-- 7. MEAL PLANS TABLE
-- ==============================================================================
create table if not exists public.meal_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  day_of_week text not null,
  slot text not null,
  recipe_id bigint not null,
  created_at timestamptz default now(),
  unique (user_id, day_of_week, slot)
);

alter table public.meal_plans enable row level security;

drop policy if exists "Users manage own meal plan" on public.meal_plans;
create policy "Users manage own meal plan"
  on public.meal_plans for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ==============================================================================
-- 8. CONTENT REPORTS TABLE (Admin Moderation Queue)
-- ==============================================================================
create table if not exists public.content_reports (
  id uuid primary key default gen_random_uuid(),
  target_id text not null,
  target_type text not null check (target_type in ('recipe', 'cook_photo')),
  reporter_id uuid references auth.users(id) on delete set null,
  reason text not null,
  details text default '',
  status text default 'pending' check (status in ('pending', 'resolved', 'dismissed')),
  created_at timestamptz default now()
);

alter table public.content_reports enable row level security;

drop policy if exists "Anyone can submit a content report" on public.content_reports;
create policy "Anyone can submit a content report"
  on public.content_reports for insert
  with check (true);

drop policy if exists "Only admins can view and resolve reports" on public.content_reports;
create policy "Only admins can view and resolve reports"
  on public.content_reports for select
  using (public.is_admin());

drop policy if exists "Only admins can update reports" on public.content_reports;
create policy "Only admins can update reports"
  on public.content_reports for update
  using (public.is_admin());

-- ==============================================================================
-- 9. GDPR RIGHT TO BE FORGOTTEN: DELETE USER ACCOUNT RPC
-- ==============================================================================
create or replace function public.delete_user_account()
returns void language plpgsql security definer as $$
declare
  caller_id uuid;
begin
  caller_id := auth.uid();
  if caller_id is null then
    raise exception 'Not authenticated';
  end if;

  -- Remove user from auth.users (cascades automatically to all associated tables)
  delete from auth.users where id = caller_id;
end;
$$;

-- Grant execution to authenticated users
grant execute on function public.delete_user_account() to authenticated;

-- ==============================================================================
-- 10. SUPABASE STORAGE BUCKET: recipe-media
-- ==============================================================================
insert into storage.buckets (id, name, public)
values ('recipe-media', 'recipe-media', true)
on conflict (id) do update set public = true;

-- Storage Policies
drop policy if exists "Public can read recipe-media images" on storage.objects;
create policy "Public can read recipe-media images"
  on storage.objects for select
  using (bucket_id = 'recipe-media');

drop policy if exists "Authenticated users can upload recipe-media" on storage.objects;
create policy "Authenticated users can upload recipe-media"
  on storage.objects for insert
  with check (
    bucket_id = 'recipe-media'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users can delete own recipe-media or admins can delete any" on storage.objects;
create policy "Users can delete own recipe-media or admins can delete any"
  on storage.objects for delete
  using (
    bucket_id = 'recipe-media'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_admin()
    )
  );
