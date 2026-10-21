-- Run once in the Supabase SQL editor. No service-role key belongs in the app.
create table public.entries (
 user_id uuid not null references auth.users(id) on delete cascade,
 id text not null,
 kind text not null check (kind in ('habit','check','task','goal','journal')),
 payload jsonb not null default '{}',
 version bigint not null default 1,
 primary key(user_id,id)
);
alter table public.entries enable row level security;
create policy "Own records only" on public.entries for all to authenticated
 using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
grant select,insert,update,delete on public.entries to authenticated;
-- Atomic compare-and-swap prevents offline devices overwriting newer edits.
create function public.put_entry(entry_id text, entry_kind text, body jsonb, expected bigint)
returns setof public.entries language plpgsql security invoker set search_path=public as $$
begin
 if expected=0 then
  return query insert into public.entries(user_id,id,kind,payload)
   values(auth.uid(),entry_id,entry_kind,body) on conflict do nothing returning *;
 else
  return query update public.entries set payload=body,version=version+1
   where user_id=auth.uid() and id=entry_id and version=expected returning *;
 end if;
end $$;
revoke all on function public.put_entry(text,text,jsonb,bigint) from public,anon;
grant execute on function public.put_entry(text,text,jsonb,bigint) to authenticated;
