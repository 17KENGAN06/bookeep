-- BookKeep — run this in the Supabase SQL Editor (once).
-- Dashboard → SQL Editor → New query → paste → Run.
--
-- Do NOT put the service role key in the frontend.
-- After this script:
-- 1. Authentication → Users → Add user (email + password) for the admin.
-- 2. Copy Project URL + anon public key into .env as VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.

create extension if not exists "pgcrypto";

create table if not exists public.books (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title_original text not null,

  title_en text,
  title_fi text,
  title_uk text,
  title_ru text,

  description_en text,
  description_fi text,
  description_uk text,
  description_ru text,

  language text not null check (language in ('fi', 'en')),
  level text not null check (level in ('A2', 'B1')),

  cover_path text,
  pdf_path text,
  page_count integer check (page_count is null or page_count > 0),

  published boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists books_language_idx on public.books (language);
create index if not exists books_level_idx on public.books (level);
create index if not exists books_published_created_idx on public.books (published, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists books_set_updated_at on public.books;
create trigger books_set_updated_at
before update on public.books
for each row
execute function public.set_updated_at();

alter table public.books enable row level security;

drop policy if exists "Public can read published books" on public.books;
create policy "Public can read published books"
on public.books
for select
to anon, authenticated
using (published = true);

drop policy if exists "Admins can read all books" on public.books;
create policy "Admins can read all books"
on public.books
for select
to authenticated
using (true);

drop policy if exists "Admins can insert books" on public.books;
create policy "Admins can insert books"
on public.books
for insert
to authenticated
with check (true);

drop policy if exists "Admins can update books" on public.books;
create policy "Admins can update books"
on public.books
for update
to authenticated
using (true)
with check (true);

drop policy if exists "Admins can delete books" on public.books;
create policy "Admins can delete books"
on public.books
for delete
to authenticated
using (true);

insert into storage.buckets (id, name, public)
values
  ('book-covers', 'book-covers', true),
  ('book-pdfs', 'book-pdfs', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Public can read covers" on storage.objects;
create policy "Public can read covers"
on storage.objects
for select
to public
using (bucket_id = 'book-covers');

drop policy if exists "Public can read pdfs" on storage.objects;
create policy "Public can read pdfs"
on storage.objects
for select
to public
using (bucket_id = 'book-pdfs');

drop policy if exists "Admins can upload covers" on storage.objects;
create policy "Admins can upload covers"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'book-covers');

drop policy if exists "Admins can update covers" on storage.objects;
create policy "Admins can update covers"
on storage.objects
for update
to authenticated
using (bucket_id = 'book-covers')
with check (bucket_id = 'book-covers');

drop policy if exists "Admins can delete covers" on storage.objects;
create policy "Admins can delete covers"
on storage.objects
for delete
to authenticated
using (bucket_id = 'book-covers');

drop policy if exists "Admins can upload pdfs" on storage.objects;
create policy "Admins can upload pdfs"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'book-pdfs');

drop policy if exists "Admins can update pdfs" on storage.objects;
create policy "Admins can update pdfs"
on storage.objects
for update
to authenticated
using (bucket_id = 'book-pdfs')
with check (bucket_id = 'book-pdfs');

drop policy if exists "Admins can delete pdfs" on storage.objects;
create policy "Admins can delete pdfs"
on storage.objects
for delete
to authenticated
using (bucket_id = 'book-pdfs');

grant usage on schema public to anon, authenticated, service_role;
grant select on table public.books to anon, authenticated, service_role;
grant insert, update, delete on table public.books to authenticated, service_role;
