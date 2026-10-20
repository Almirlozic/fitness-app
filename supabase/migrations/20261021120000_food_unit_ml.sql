-- Drikkevarer måles i ml i stedet for gram.
-- Næringstal er pr. 100 g eller pr. 100 ml (Open Food Facts bruger pr. 100 ml for drikkevarer).
-- food_logs.grams er stadig mængden; amount_unit siger, om den er i g eller ml.

alter table public.foods
  add column unit text not null default 'g' check (unit in ('g', 'ml'));

alter table public.food_logs
  add column amount_unit text not null default 'g' check (amount_unit in ('g', 'ml'));
