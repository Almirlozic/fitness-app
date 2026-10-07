-- Brugerprofil fra onboarding: kropsdata, mål og daglige næringsmål.
-- Én række pr. bruger. Fødselsdato i stedet for alder, så alderen altid er korrekt.

create table public.profiles (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  sex text check (sex in ('male', 'female')),
  birth_date date,
  height_cm int check (height_cm between 100 and 250),
  weight_kg numeric(5, 1) check (weight_kg between 30 and 300),
  training_per_week text check (training_per_week in ('0', '1-3', '3-5', '6+')),
  goal_weight_kg numeric(5, 1) check (goal_weight_kg between 30 and 300),
  kcal_target int,
  protein_g int,
  fat_g int,
  carbs_g int,
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Hold updated_at opdateret ved hver ændring
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- RLS: brugeren må kun se, oprette og ændre sin egen profil. Ingen delete
-- (profilen slettes automatisk, hvis brugeren slettes).
alter table public.profiles enable row level security;

create policy "Brugere kan se egen profil"
  on public.profiles for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "Brugere kan oprette egen profil"
  on public.profiles for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "Brugere kan ændre egen profil"
  on public.profiles for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
