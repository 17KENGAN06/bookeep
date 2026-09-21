-- Separate shorter image for catalog cards. Tall cover stays on the book page.

alter table public.books
  add column if not exists thumbnail_path text;
