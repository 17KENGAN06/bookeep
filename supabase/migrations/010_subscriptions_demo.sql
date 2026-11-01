-- BookKeep: subscriptions flag + demo copies of books.
-- Run in Supabase SQL Editor after 001–009.
--
-- What it does:
--   1. public.subscriptions: one row per user, written by the Stripe webhook on
--      the Railway server (service role). Users can only read their own row.
--   2. public.has_active_subscription(): true for admins and active subscribers.
--   3. books.demo_path / books.demo_pages: a short public PDF (first pages).
--   4. Bucket "book-demos" (public) for those demo PDFs.
--   5. Bucket "book-pdfs" becomes PRIVATE: the full PDF is readable only by
--      subscribers and admins, through short-lived signed URLs.
--
-- After it runs: open /admin and press "Create missing demos" once, so every
-- existing book gets its demo PDF. Until then visitors without a subscription
-- see "demo is being prepared" for those books.
--
-- Give someone free access by hand, without Stripe (replace the email; null = no end date):
--   insert into public.subscriptions (user_id, plan, status, current_period_end)
--   select id, 'premium', 'active', null from auth.users where email = 'reader@example.com'
--   on conflict (user_id) do update
--     set status = 'active', plan = excluded.plan, current_period_end = excluded.current_period_end;
--
-- Take it away:
--   update public.subscriptions set status = 'canceled'
--   where user_id = (select id from auth.users where email = 'reader@example.com');

create table if not exists public.subscriptions (
  user_id uuid primary key references auth.users (id) on delete cascade,
  plan text not null default 'premium',
  -- Stripe's own statuses; trialing / active / past_due open the books.
  status text not null default 'active'
    check (status in ('trialing', 'active', 'past_due', 'incomplete', 'canceled', 'expired')),
  -- null means the subscription does not end on its own (manual grants).
  current_period_end timestamptz,
  trial_end timestamptz,
  cancel_at_period_end boolean not null default false,
  -- The 3-day trial is given once per account.
  trial_used boolean not null default false,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists subscriptions_set_updated_at on public.subscriptions;
create trigger subscriptions_set_updated_at
before update on public.subscriptions
for each row
execute function public.set_updated_at();

alter table public.subscriptions enable row level security;

drop policy if exists "Users can read own subscription" on public.subscriptions;
create policy "Users can read own subscription"
on public.subscriptions
for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

-- Writes come from the server (service role) only; it bypasses RLS.
grant select on table public.subscriptions to authenticated;
grant select, insert, update, delete on table public.subscriptions to service_role;

create or replace function public.has_active_subscription()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() is not null and (
    exists (select 1 from public.admins where user_id = auth.uid())
    or exists (
      select 1
      from public.subscriptions
      where user_id = auth.uid()
        and status in ('trialing', 'active', 'past_due')
        and (current_period_end is null or current_period_end > now() - interval '1 day')
    )
  );
$$;

revoke all on function public.has_active_subscription() from public;
grant execute on function public.has_active_subscription() to anon, authenticated, service_role;

alter table public.books
  add column if not exists demo_path text,
  add column if not exists demo_pages integer not null default 10;

alter table public.books drop constraint if exists books_demo_pages_check;
alter table public.books
  add constraint books_demo_pages_check check (demo_pages between 1 and 100);

-- Demo PDFs: public, anyone can read them.
insert into storage.buckets (id, name, public)
values ('book-demos', 'book-demos', true)
on conflict (id) do update set public = true;

drop policy if exists "Public can read demos" on storage.objects;
create policy "Public can read demos"
on storage.objects
for select
to public
using (bucket_id = 'book-demos');

drop policy if exists "Admins can upload demos" on storage.objects;
create policy "Admins can upload demos"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'book-demos' and public.is_admin());

drop policy if exists "Admins can update demos" on storage.objects;
create policy "Admins can update demos"
on storage.objects
for update
to authenticated
using (bucket_id = 'book-demos' and public.is_admin())
with check (bucket_id = 'book-demos' and public.is_admin());

drop policy if exists "Admins can delete demos" on storage.objects;
create policy "Admins can delete demos"
on storage.objects
for delete
to authenticated
using (bucket_id = 'book-demos' and public.is_admin());

-- Full PDFs: private. A public bucket serves files to anyone who knows the
-- URL and skips these policies, so the flag itself has to go.
update storage.buckets set public = false where id = 'book-pdfs';

drop policy if exists "Public can read pdfs" on storage.objects;
drop policy if exists "Subscribers can read pdfs" on storage.objects;
create policy "Subscribers can read pdfs"
on storage.objects
for select
to authenticated
using (bucket_id = 'book-pdfs' and public.has_active_subscription());

-- Explanations: a daily counter per account (u:<id>) or per guest IP (ip:<addr>).
-- Only the server touches it, with the service role.
create table if not exists public.explain_usage (
  key text not null,
  day date not null default (now() at time zone 'utc')::date,
  requests integer not null default 0,
  input_tokens bigint not null default 0,
  output_tokens bigint not null default 0,
  primary key (key, day)
);

alter table public.explain_usage enable row level security;
revoke all on table public.explain_usage from anon, authenticated;
grant select, insert, update, delete on table public.explain_usage to service_role;

-- Counts one request if the day's limit allows it. Returns the new count, or -1 when the limit is reached.
create or replace function public.take_explain_quota(p_key text, p_limit integer)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  used integer;
begin
  insert into public.explain_usage as u (key, day, requests)
  values (p_key, (now() at time zone 'utc')::date, 1)
  on conflict (key, day) do update
    set requests = u.requests + 1
    where u.requests < p_limit
  returning requests into used;
  return coalesce(used, -1);
end;
$$;

create or replace function public.add_explain_tokens(p_key text, p_input integer, p_output integer)
returns void
language sql
security definer
set search_path = public
as $$
  update public.explain_usage
  set input_tokens = input_tokens + greatest(p_input, 0),
      output_tokens = output_tokens + greatest(p_output, 0)
  where key = p_key and day = (now() at time zone 'utc')::date;
$$;

revoke all on function public.take_explain_quota(text, integer) from public, anon, authenticated;
revoke all on function public.add_explain_tokens(text, integer, integer) from public, anon, authenticated;
grant execute on function public.take_explain_quota(text, integer) to service_role;
grant execute on function public.add_explain_tokens(text, integer, integer) to service_role;
