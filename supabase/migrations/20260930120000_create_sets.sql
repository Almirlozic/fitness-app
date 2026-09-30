-- Et sæt = én øvelse, én vægt, ét antal reps på en dato.
-- Rækker overskrives aldrig; progression beregnes ud fra historikken.

create table public.sets (
  id uuid primary key default gen_random_uuid(),
  -- Nullable indtil login er bygget. auth.uid() er null for anonyme kald.
  user_id uuid default auth.uid() references auth.users (id) on delete cascade,
  exercise_name text not null
    check (
      exercise_name = btrim(exercise_name)
      and exercise_name <> ''
      and exercise_name !~ '\s{2,}'
    ),
  wger_exercise_id int, -- null = egen øvelse
  weight_kg numeric(6, 2) not null check (weight_kg >= 0),
  reps int not null check (reps between 1 and 200),
  performed_on date not null default current_date,
  created_at timestamptz not null default now()
);

create index sets_user_exercise_performed_on_idx
  on public.sets (user_id, lower(exercise_name), performed_on);

-- RLS er slået fra her, så tabellen kunne bruges før login fandtes.
-- 20260930120100_sets_rls.sql slår den til igen. Kør den, før appen deployes.
alter table public.sets disable row level security;
