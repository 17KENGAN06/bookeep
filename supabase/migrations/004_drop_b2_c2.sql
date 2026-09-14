-- Keep only A2 and B1. Run in a new SQL Editor tab if the books table already exists.

update public.books set level = 'B1' where level in ('B2', 'C2');

alter table public.books drop constraint if exists books_level_check;
alter table public.books add constraint books_level_check check (level in ('A2', 'B1'));
