-- =====================================================================
-- RLS på sets: hver bruger kan kun se og ændre sine egne sæt.
--
-- Kør først, når login virker, og i denne rækkefølge:
--
-- TRIN 1 – giv eksisterende sæt en ejer (kør selv, med DIT bruger-id).
-- Find id'et i Supabase: Authentication → Users → din bruger → "User UID".
-- Uden dette trin fejler NOT NULL nedenfor, og sættene bliver usynlige.
--
--   update public.sets
--   set user_id = '00000000-0000-0000-0000-000000000000'  -- ← dit bruger-id
--   where user_id is null;
--
-- Tjek bagefter, at dette giver 0:
--   select count(*) from public.sets where user_id is null;
--
-- TRIN 2 – kør resten af filen.
-- Filen kan køres flere gange; eksisterende policies erstattes.
-- =====================================================================

alter table public.sets enable row level security;

drop policy if exists "Brugere kan se egne sæt" on public.sets;
drop policy if exists "Brugere kan oprette egne sæt" on public.sets;
drop policy if exists "Brugere kan ændre egne sæt" on public.sets;
drop policy if exists "Brugere kan slette egne sæt" on public.sets;

create policy "Brugere kan se egne sæt"
  on public.sets for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "Brugere kan oprette egne sæt"
  on public.sets for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "Brugere kan ændre egne sæt"
  on public.sets for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Brugere kan slette egne sæt"
  on public.sets for delete
  to authenticated
  using (user_id = (select auth.uid()));

-- Nye sæt får automatisk den loggede brugers id
alter table public.sets alter column user_id set default auth.uid();
alter table public.sets alter column user_id set not null;
