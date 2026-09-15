-- BookKeep user accounts and library.
-- Run in Supabase SQL Editor after 001–004.
--
-- CRITICAL: current book write policies treat every signed-in user as admin.
-- This script locks writes to the admins table only, then adds reader shelves.
--
-- After it runs, mark your existing admin (replace the email):
--   insert into public.admins (user_id)
--   select id from auth.users where email = 'you@example.com'
--   on conflict (user_id) do nothing;
--
-- Auth → Providers: enable Email and Google.
-- Auth → URL configuration:
--   Site URL = https://bookkeep.cloud
--   Redirect URLs include https://bookkeep.cloud/** and http://localhost:5173/**

create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;

drop policy if exists "Users can read own admin flag" on public.admins;
create policy "Users can read own admin flag"
on public.admins
for select
to authenticated
using (user_id = auth.uid());

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admins where user_id = auth.uid()
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated, service_role;

drop policy if exists "Admins can read all books" on public.books;
create policy "Admins can read all books"
on public.books
for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can insert books" on public.books;
create policy "Admins can insert books"
on public.books
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "Admins can update books" on public.books;
create policy "Admins can update books"
on public.books
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can delete books" on public.books;
create policy "Admins can delete books"
on public.books
for delete
to authenticated
using (public.is_admin());

drop policy if exists "Admins can upload covers" on storage.objects;
create policy "Admins can upload covers"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'book-covers' and public.is_admin());

drop policy if exists "Admins can update covers" on storage.objects;
create policy "Admins can update covers"
on storage.objects
for update
to authenticated
using (bucket_id = 'book-covers' and public.is_admin())
with check (bucket_id = 'book-covers' and public.is_admin());

drop policy if exists "Admins can delete covers" on storage.objects;
create policy "Admins can delete covers"
on storage.objects
for delete
to authenticated
using (bucket_id = 'book-covers' and public.is_admin());

drop policy if exists "Admins can upload pdfs" on storage.objects;
create policy "Admins can upload pdfs"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'book-pdfs' and public.is_admin());

drop policy if exists "Admins can update pdfs" on storage.objects;
create policy "Admins can update pdfs"
on storage.objects
for update
to authenticated
using (bucket_id = 'book-pdfs' and public.is_admin())
with check (bucket_id = 'book-pdfs' and public.is_admin());

drop policy if exists "Admins can delete pdfs" on storage.objects;
create policy "Admins can delete pdfs"
on storage.objects
for delete
to authenticated
using (bucket_id = 'book-pdfs' and public.is_admin());

create table if not exists public.favorites (
  user_id uuid not null references auth.users (id) on delete cascade,
  book_id uuid not null references public.books (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, book_id)
);

create table if not exists public.planned_books (
  user_id uuid not null references auth.users (id) on delete cascade,
  book_id uuid not null references public.books (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, book_id)
);

create table if not exists public.reading_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  book_id uuid not null references public.books (id) on delete cascade,
  current_page integer not null check (current_page > 0),
  total_pages integer not null check (total_pages > 0),
  percentage numeric(5, 1) not null default 0,
  last_read_at timestamptz not null default now(),
  primary key (user_id, book_id)
);

create index if not exists favorites_user_idx on public.favorites (user_id, created_at desc);
create index if not exists planned_books_user_idx on public.planned_books (user_id, created_at desc);
create index if not exists reading_progress_user_idx on public.reading_progress (user_id, last_read_at desc);

alter table public.favorites enable row level security;
alter table public.planned_books enable row level security;
alter table public.reading_progress enable row level security;

drop policy if exists "Users manage own favorites" on public.favorites;
create policy "Users manage own favorites"
on public.favorites
for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users manage own planned books" on public.planned_books;
create policy "Users manage own planned books"
on public.planned_books
for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users manage own reading progress" on public.reading_progress;
create policy "Users manage own reading progress"
on public.reading_progress
for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

grant select on table public.admins to authenticated, service_role;
grant insert, update, delete on table public.admins to service_role;

grant select, insert, update, delete on table public.favorites to authenticated, service_role;
grant select, insert, update, delete on table public.planned_books to authenticated, service_role;
grant select, insert, update, delete on table public.reading_progress to authenticated, service_role;
