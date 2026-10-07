-- Enheder til fødevarer ("1 stk = 55 g"), så man kan logge uden at veje.
-- Gram er stadig det, der regnes og gemmes på; en enhed er kun en genvej.

create table public.food_units (
  id uuid primary key default gen_random_uuid(),
  food_id uuid not null references public.foods (id) on delete cascade,
  -- null = fælles enhed (fx "portion" fra Open Food Facts), ellers brugerens egen
  user_id uuid references auth.users (id) on delete cascade,
  name text not null check (btrim(name) <> '' and char_length(name) <= 20),
  grams numeric(6, 1) not null check (grams > 0),
  created_at timestamptz not null default now()
);

-- Unik pr. vare, ejer og navn (uanset store/små bogstaver). "nulls not distinct"
-- gør, at der også kun kan være én fælles enhed med samme navn (user_id = null).
create unique index food_units_food_user_name_key
  on public.food_units (food_id, user_id, lower(name)) nulls not distinct;

create index food_units_food_id_idx on public.food_units (food_id);

alter table public.food_units enable row level security;

create policy "Læs fælles og egne enheder"
  on public.food_units for select
  to authenticated
  using (user_id is null or user_id = (select auth.uid()));

-- Fælles enheder (user_id null) skrives kun fra serveren med service role
create policy "Opret egne enheder"
  on public.food_units for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "Ændre egne enheder"
  on public.food_units for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Slette egne enheder"
  on public.food_units for delete
  to authenticated
  using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------
-- food_logs: antal og enhed til visning/redigering. grams er stadig sandheden.
-- ---------------------------------------------------------------------
alter table public.food_logs
  add column quantity numeric(6, 2) check (quantity > 0),
  add column unit_name text check (unit_name is null or char_length(unit_name) <= 20),
  add constraint food_logs_quantity_unit_together
    check ((quantity is null) = (unit_name is null));

-- ---------------------------------------------------------------------
-- Eksisterende data: "portion" ud fra portionsstørrelsen
-- ---------------------------------------------------------------------
insert into public.food_units (food_id, user_id, name, grams)
select id, null, 'portion', serving_g
from public.foods
where source = 'off' and serving_g is not null
on conflict do nothing;

insert into public.food_units (food_id, user_id, name, grams)
select id, created_by, 'portion', serving_g
from public.foods
where source = 'custom' and serving_g is not null
on conflict do nothing;
