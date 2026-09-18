alter table public.reading_progress
  add column if not exists max_page_reached integer,
  add column if not exists completed_at timestamptz;

update public.reading_progress
set max_page_reached = greatest(coalesce(max_page_reached, 0), current_page)
where max_page_reached is null or max_page_reached < current_page;

alter table public.reading_progress
  alter column max_page_reached set default 1,
  alter column max_page_reached set not null;

alter table public.reading_progress
  drop constraint if exists reading_progress_max_page_reached_check;

alter table public.reading_progress
  add constraint reading_progress_max_page_reached_check check (max_page_reached > 0);

create table if not exists public.reading_activity (
  user_id uuid not null references auth.users (id) on delete cascade,
  book_id uuid not null references public.books (id) on delete cascade,
  read_date date not null,
  pages_read integer not null default 0 check (pages_read >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, book_id, read_date)
);

create index if not exists reading_activity_user_date_idx
  on public.reading_activity (user_id, read_date);

create table if not exists public.reading_goals (
  user_id uuid not null references auth.users (id) on delete cascade,
  read_date date not null,
  target_pages integer not null check (target_pages > 0),
  completed_at timestamptz,
  celebrated_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, read_date)
);

create index if not exists reading_goals_user_date_idx
  on public.reading_goals (user_id, read_date);

alter table public.reading_activity enable row level security;
alter table public.reading_goals enable row level security;

drop policy if exists "Users manage own reading activity" on public.reading_activity;
create policy "Users manage own reading activity"
on public.reading_activity
for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users manage own reading goals" on public.reading_goals;
create policy "Users manage own reading goals"
on public.reading_goals
for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

grant select, insert, update, delete on table public.reading_activity to authenticated, service_role;
grant select, insert, update, delete on table public.reading_goals to authenticated, service_role;

create or replace function public.record_reading_advance(
  p_book_id uuid,
  p_current_page integer,
  p_total_pages integer,
  p_read_date date
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  old_max integer := 0;
  new_pages integer := 0;
  daily_total integer := 0;
  goal_target integer;
  celebrated boolean := false;
  marked_id date;
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;

  if p_current_page < 1 or p_total_pages < 1 or p_current_page > p_total_pages then
    raise exception 'invalid page';
  end if;

  perform pg_advisory_xact_lock(hashtext(uid::text), hashtext(p_book_id::text));

  select coalesce(max_page_reached, 0)
  into old_max
  from public.reading_progress
  where user_id = uid and book_id = p_book_id;

  old_max := coalesce(old_max, 0);
  new_pages := greatest(0, p_current_page - old_max);

  insert into public.reading_progress (
    user_id,
    book_id,
    current_page,
    total_pages,
    percentage,
    max_page_reached,
    last_read_at,
    completed_at
  )
  values (
    uid,
    p_book_id,
    p_current_page,
    p_total_pages,
    round((p_current_page::numeric / p_total_pages) * 100, 1),
    greatest(old_max, p_current_page),
    now(),
    case when p_current_page >= p_total_pages then now() else null end
  )
  on conflict (user_id, book_id) do update set
    current_page = excluded.current_page,
    total_pages = excluded.total_pages,
    percentage = excluded.percentage,
    max_page_reached = greatest(public.reading_progress.max_page_reached, excluded.max_page_reached),
    last_read_at = excluded.last_read_at,
    completed_at = case
      when excluded.current_page >= excluded.total_pages
        then coalesce(public.reading_progress.completed_at, now())
      else public.reading_progress.completed_at
    end;

  if new_pages > 0 then
    insert into public.reading_activity (user_id, book_id, read_date, pages_read, updated_at)
    values (uid, p_book_id, p_read_date, new_pages, now())
    on conflict (user_id, book_id, read_date) do update set
      pages_read = public.reading_activity.pages_read + excluded.pages_read,
      updated_at = now();
  end if;

  select coalesce(sum(pages_read), 0)
  into daily_total
  from public.reading_activity
  where user_id = uid and read_date = p_read_date;

  select target_pages
  into goal_target
  from public.reading_goals
  where user_id = uid and read_date = p_read_date;

  if goal_target is not null and daily_total >= goal_target then
    update public.reading_goals
    set
      completed_at = coalesce(completed_at, now()),
      celebrated_at = coalesce(celebrated_at, now()),
      updated_at = now()
    where user_id = uid
      and read_date = p_read_date
      and celebrated_at is null
    returning read_date into marked_id;

    celebrated := marked_id is not null;
  end if;

  return jsonb_build_object(
    'newPages', new_pages,
    'dailyTotal', daily_total,
    'target', goal_target,
    'justCompleted', celebrated
  );
end;
$$;

revoke all on function public.record_reading_advance(uuid, integer, integer, date) from public;
grant execute on function public.record_reading_advance(uuid, integer, integer, date) to authenticated, service_role;
