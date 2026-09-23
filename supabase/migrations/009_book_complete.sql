-- Whether the adaptation is finished. Existing books stay complete;
-- new titles can be published while still in progress.

alter table public.books
  add column if not exists complete boolean not null default true;
