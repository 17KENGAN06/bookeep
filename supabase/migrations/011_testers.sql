-- BookKeep: testers. Run in Supabase SQL Editor after 010.
--
-- A tester gets everything a subscriber gets (full books, download, translation)
-- without Stripe. Admins already count as subscribed (010) and keep that.
--
--   1. public.testers: one row per tester. A separate table, so the Stripe
--      webhook (which only writes public.subscriptions) can never undo it.
--   2. has_active_subscription(): admins, testers, active Stripe subscribers.
--      Storage policy on book-pdfs uses it, so testers get the full PDFs.
--   3. admin_list_users() / admin_set_tester(): what the /admin users panel calls.
--      Both refuse anyone who is not in public.admins.

create table if not exists public.testers (
  user_id uuid primary key references auth.users (id) on delete cascade,
  granted_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.testers enable row level security;

drop policy if exists "Users can read own tester flag" on public.testers;
create policy "Users can read own tester flag"
on public.testers
for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

-- Writes go through admin_set_tester() (or the server's service role).
grant select on table public.testers to authenticated;
grant select, insert, update, delete on table public.testers to service_role;

create or replace function public.has_active_subscription()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() is not null and (
    exists (select 1 from public.admins where user_id = auth.uid())
    or exists (select 1 from public.testers where user_id = auth.uid())
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

-- Users for the admin panel, newest first. p_search filters by email.
drop function if exists public.admin_list_users(text, integer);
create or replace function public.admin_list_users(p_search text default null, p_limit integer default 100)
returns table (
  id uuid,
  email text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  is_admin boolean,
  is_tester boolean,
  subscription_status text,
  subscription_end timestamptz
)
language plpgsql
stable
security definer
set search_path = public, auth
as $$
begin
  if not public.is_admin() then
    raise exception 'not admin' using errcode = '42501';
  end if;

  return query
  select
    u.id,
    u.email::text,
    u.created_at,
    u.last_sign_in_at,
    exists (select 1 from public.admins a where a.user_id = u.id),
    exists (select 1 from public.testers t where t.user_id = u.id),
    s.status,
    s.current_period_end
  from auth.users u
  left join public.subscriptions s on s.user_id = u.id
  where coalesce(trim(p_search), '') = ''
     or u.email ilike '%' || trim(p_search) || '%'
  order by
    exists (select 1 from public.testers t where t.user_id = u.id) desc,
    u.created_at desc
  limit least(greatest(coalesce(p_limit, 100), 1), 500);
end;
$$;

revoke all on function public.admin_list_users(text, integer) from public, anon;
grant execute on function public.admin_list_users(text, integer) to authenticated;

create or replace function public.admin_set_tester(p_user_id uuid, p_enabled boolean)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'not admin' using errcode = '42501';
  end if;

  if p_enabled then
    insert into public.testers (user_id, granted_by)
    values (p_user_id, auth.uid())
    on conflict (user_id) do nothing;
  else
    delete from public.testers where user_id = p_user_id;
  end if;
  return p_enabled;
end;
$$;

revoke all on function public.admin_set_tester(uuid, boolean) from public, anon;
grant execute on function public.admin_set_tester(uuid, boolean) to authenticated;
