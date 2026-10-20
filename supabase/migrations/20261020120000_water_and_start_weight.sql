-- Kostsiden (Figma-design): vand pr. dag og startvægt til "Opdater din vægt".

-- ---------------------------------------------------------------------
-- water_logs: antal glas vand (à 125 ml) pr. bruger pr. dag
-- ---------------------------------------------------------------------
create table public.water_logs (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  logged_on date not null,
  glasses int not null check (glasses between 0 and 20),
  updated_at timestamptz not null default now(),
  primary key (user_id, logged_on)
);

-- Genbruger set_updated_at() fra profiles-migrationen
create trigger water_logs_set_updated_at
  before update on public.water_logs
  for each row execute function public.set_updated_at();

alter table public.water_logs enable row level security;

create policy "Se eget vand"
  on public.water_logs for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "Opret eget vand"
  on public.water_logs for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "Ændre eget vand"
  on public.water_logs for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------
-- profiles.start_weight_kg: vægten ved onboarding – udgangspunktet for
-- fremgangsbaren mod målvægten. weight_kg er den nuværende vægt.
-- ---------------------------------------------------------------------
alter table public.profiles
  add column start_weight_kg numeric(5, 1) check (start_weight_kg between 30 and 300);

update public.profiles
set start_weight_kg = weight_kg
where start_weight_kg is null and weight_kg is not null;
