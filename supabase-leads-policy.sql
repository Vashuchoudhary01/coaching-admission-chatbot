-- Run this in Supabase Dashboard > SQL Editor.
-- It allows your public chatbot form to insert leads, without allowing users to read leads.

grant usage on schema public to anon;
grant usage on schema public to service_role;
grant insert on table public.leads to anon;
grant select on table public.leads to service_role;

alter table public.leads enable row level security;

-- Normalize existing phone values before adding the unique index.
update public.leads
set phone = regexp_replace(phone, '\D', '', 'g')
where phone is not null;

update public.leads
set phone = right(phone, 10)
where phone is not null and length(phone) > 10;

-- If your table already has duplicate phone numbers, keep the first row and remove the rest.
delete from public.leads a
using public.leads b
where a.phone = b.phone
  and a.ctid > b.ctid;

-- Prevent the same phone number from being saved twice.
create unique index if not exists leads_phone_unique_idx
on public.leads (phone);

drop policy if exists "Allow public lead submissions" on public.leads;

create policy "Allow public lead submissions"
on public.leads
for insert
to anon
with check (
  name is not null
  and btrim(name) <> ''
  and phone is not null
  and btrim(phone) <> ''
  and phone ~ '^[0-9]{10}$'
  and course is not null
  and btrim(course) <> ''
);
