-- Remap retired levels, then keep only A2, B1, B2, C2.
-- Run this if 001_init.sql was already applied with A1/C1.

update public.books set level = 'A2' where level = 'A1';
update public.books set level = 'C2' where level = 'C1';

alter table public.books drop constraint if exists books_level_check;
alter table public.books add constraint books_level_check check (level in ('A2', 'B1', 'B2', 'C2'));
