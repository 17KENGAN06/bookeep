-- Homepage hero: up to 3 books chosen in admin, slots 1–3.

alter table public.books
  add column if not exists hero_slot smallint;

alter table public.books
  drop constraint if exists books_hero_slot_check;

alter table public.books
  add constraint books_hero_slot_check check (hero_slot is null or hero_slot between 1 and 3);

drop index if exists books_hero_slot_uidx;
create unique index books_hero_slot_uidx on public.books (hero_slot)
where hero_slot is not null;

create or replace function public.set_home_hero_books(
  p_slot_1 uuid,
  p_slot_2 uuid,
  p_slot_3 uuid
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null or not exists (select 1 from public.admins where user_id = uid) then
    raise exception 'not admin';
  end if;

  if p_slot_1 is not null and (p_slot_1 = p_slot_2 or p_slot_1 = p_slot_3) then
    raise exception 'duplicate hero book';
  end if;
  if p_slot_2 is not null and p_slot_2 = p_slot_3 then
    raise exception 'duplicate hero book';
  end if;

  update public.books set hero_slot = null where hero_slot is not null;

  if p_slot_1 is not null then
    update public.books set hero_slot = 1 where id = p_slot_1;
  end if;
  if p_slot_2 is not null then
    update public.books set hero_slot = 2 where id = p_slot_2;
  end if;
  if p_slot_3 is not null then
    update public.books set hero_slot = 3 where id = p_slot_3;
  end if;
end;
$$;

revoke all on function public.set_home_hero_books(uuid, uuid, uuid) from public;
grant execute on function public.set_home_hero_books(uuid, uuid, uuid) to authenticated, service_role;
