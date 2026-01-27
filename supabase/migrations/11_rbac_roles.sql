-- Create a table for public profiles linked to auth.users
create table if not exists public.profiles (
    id uuid not null references auth.users(id) on delete cascade,
    role text not null default 'staff' check (role in ('admin', 'manager', 'staff', 'cashier')),
    full_name text,
    updated_at timestamp with time zone default timezone('utc'::text, now()),
    primary key (id)
);
-- Enable RLS
alter table public.profiles enable row level security;
-- Policies for Profiles
create policy "Users can view their own profile" on public.profiles for
select using (auth.uid() = id);
create policy "Admins can view all profiles" on public.profiles for
select using (
        auth.uid() in (
            select id
            from public.profiles
            where role in ('admin', 'manager')
        )
    );
-- Function to handle new user signup (automatically create profile)
create or replace function public.handle_new_user() returns trigger as $$ begin
insert into public.profiles (id, full_name, role)
values (
        new.id,
        new.raw_user_meta_data->>'full_name',
        'staff'
    );
return new;
end;
$$ language plpgsql security definer;
-- Trigger for new user signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after
insert on auth.users for each row execute procedure public.handle_new_user();
-- Add RLS Policies for other tables based on Role
-- Example: Only Admin/Manager can insert/delete Zones
-- (Assuming RLS is already enabled on 'zones')
-- Policy: Staff can VIEW zones but NOT modify
drop policy if exists "Enable read access for all users" on zones;
create policy "Enable read access for all users" on zones for
select using (true);
drop policy if exists "Enable insert for authenticated users" on zones;
create policy "Enable insert for admins only" on zones for
insert with check (
        auth.uid() in (
            select id
            from public.profiles
            where role in ('admin', 'manager')
        )
    );
drop policy if exists "Enable update for authenticated users" on zones;
create policy "Enable update for admins only" on zones for
update using (
        auth.uid() in (
            select id
            from public.profiles
            where role in ('admin', 'manager')
        )
    );
drop policy if exists "Enable delete for authenticated users" on zones;
create policy "Enable delete for admins only" on zones for delete using (
    auth.uid() in (
        select id
        from public.profiles
        where role in ('admin', 'manager')
    )
);