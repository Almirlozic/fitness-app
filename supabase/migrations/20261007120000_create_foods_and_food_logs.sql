-- Kalorie-tracker: fødevarer og det, man har spist.

-- ---------------------------------------------------------------------
-- foods: cache fra Open Food Facts ('off') og brugernes egne ('custom')
-- ---------------------------------------------------------------------
create table public.foods (
  id uuid primary key default gen_random_uuid(),
  source text not null check (source in ('off', 'custom')),
  barcode text,
  name text not null check (btrim(name) <> ''),
  brand text,
  kcal_100g numeric(6, 2) not null check (kcal_100g >= 0),
  protein_100g numeric(6, 2) not null check (protein_100g >= 0),
  carbs_100g numeric(6, 2) not null check (carbs_100g >= 0),
  fat_100g numeric(6, 2) not null check (fat_100g >= 0),
  serving_g numeric(6, 1) check (serving_g > 0),
  created_by uuid references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Egne fødevarer har altid en ejer; OFF-fødevarer har ingen
  constraint foods_owner_matches_source check (
    (source = 'custom' and created_by is not null)
    or (source = 'off' and created_by is null)
  )
);

-- Én OFF-række pr. stregkode
create unique index foods_off_barcode_key
  on public.foods (barcode)
  where source = 'off' and barcode is not null;

-- En bruger kan kun have én egen fødevare pr. stregkode
create unique index foods_custom_barcode_per_user_key
  on public.foods (created_by, barcode)
  where source = 'custom' and barcode is not null;

create index foods_created_by_idx on public.foods (created_by) where source = 'custom';

-- Genbruger set_updated_at() fra profiles-migrationen
create trigger foods_set_updated_at
  before update on public.foods
  for each row execute function public.set_updated_at();

alter table public.foods enable row level security;

-- Alle loggede brugere kan læse OFF-fødevarer; egne fødevarer kun af ejeren
create policy "Læs OFF-fødevarer og egne fødevarer"
  on public.foods for select
  to authenticated
  using (source = 'off' or created_by = (select auth.uid()));

-- Brugere kan kun oprette/ændre/slette egne custom-fødevarer.
-- OFF-rækker skrives kun fra serveren med service role (omgår RLS).
create policy "Opret egne fødevarer"
  on public.foods for insert
  to authenticated
  with check (source = 'custom' and created_by = (select auth.uid()));

create policy "Ændre egne fødevarer"
  on public.foods for update
  to authenticated
  using (source = 'custom' and created_by = (select auth.uid()))
  with check (source = 'custom' and created_by = (select auth.uid()));

create policy "Slette egne fødevarer"
  on public.foods for delete
  to authenticated
  using (source = 'custom' and created_by = (select auth.uid()));

-- ---------------------------------------------------------------------
-- food_logs: det, brugeren har spist. Næringstallene gemmes ved logning,
-- så historikken ikke ændrer sig, hvis fødevaren rettes eller slettes.
-- ---------------------------------------------------------------------
create table public.food_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  -- Appen sender altid datoen regnet i Europe/Copenhagen; standarden er kun en reserve
  eaten_on date not null default (now() at time zone 'Europe/Copenhagen')::date,
  meal text not null check (meal in ('breakfast', 'lunch', 'dinner', 'snack')),
  food_id uuid references public.foods (id) on delete set null,
  food_name text not null check (btrim(food_name) <> ''),
  grams numeric(6, 1) not null check (grams > 0),
  kcal numeric(7, 1) not null check (kcal >= 0),
  protein_g numeric(7, 1) not null check (protein_g >= 0),
  carbs_g numeric(7, 1) not null check (carbs_g >= 0),
  fat_g numeric(7, 1) not null check (fat_g >= 0),
  created_at timestamptz not null default now()
);

create index food_logs_user_eaten_on_idx on public.food_logs (user_id, eaten_on);

alter table public.food_logs enable row level security;

create policy "Se egne logs"
  on public.food_logs for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "Opret egne logs"
  on public.food_logs for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "Ændre egne logs"
  on public.food_logs for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Slette egne logs"
  on public.food_logs for delete
  to authenticated
  using (user_id = (select auth.uid()));
