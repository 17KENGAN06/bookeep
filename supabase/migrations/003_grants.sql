-- Grants for Data API roles. Run once in SQL Editor after 001_init.sql.
-- Needed if "Automatically expose new tables" was disabled.

grant usage on schema public to anon, authenticated, service_role;

grant select on table public.books to anon, authenticated, service_role;
grant insert, update, delete on table public.books to authenticated, service_role;
