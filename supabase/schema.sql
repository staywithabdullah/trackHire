-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- -----------------------------------------------------------------------------
-- Profiles Table
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- Enable RLS for Profiles
alter table public.profiles enable row level security;

-- Policies for Profiles
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url, created_at, updated_at)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', ''),
    now(),
    now()
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to run handle_new_user on signup
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- -----------------------------------------------------------------------------
-- Resumes Table
-- -----------------------------------------------------------------------------
create table if not exists public.resumes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  file_url text not null,
  created_at timestamp with time zone default now() not null
);

-- Enable RLS for Resumes
alter table public.resumes enable row level security;

-- Policies for Resumes
create policy "Users can view their own resumes"
  on public.resumes for select
  using (auth.uid() = user_id);

create policy "Users can create their own resumes"
  on public.resumes for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own resumes"
  on public.resumes for delete
  using (auth.uid() = user_id);


-- -----------------------------------------------------------------------------
-- Jobs Table
-- -----------------------------------------------------------------------------
create table if not exists public.jobs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  job_title text not null,
  company_name text not null,
  company_website text,
  job_post_url text,
  location text,
  employment_type text,
  salary text,
  resume_id uuid references public.resumes(id) on delete set null,
  priority text check (priority in ('High', 'Medium', 'Low')),
  status text default 'Applied' not null check (status in ('Applied', 'Assessment', 'HR Interview', 'Technical Interview', 'Final Interview', 'Offer Received', 'Accepted', 'Rejected')),
  notes text,
  date_applied date default current_date not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- Enable RLS for Jobs
alter table public.jobs enable row level security;

-- Policies for Jobs
create policy "Users can view their own jobs"
  on public.jobs for select
  using (auth.uid() = user_id);

create policy "Users can create their own jobs"
  on public.jobs for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own jobs"
  on public.jobs for update
  using (auth.uid() = user_id);

create policy "Users can delete their own jobs"
  on public.jobs for delete
  using (auth.uid() = user_id);


-- -----------------------------------------------------------------------------
-- Triggers for Automatic updated_at
-- -----------------------------------------------------------------------------
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace trigger on_profile_updated
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

create or replace trigger on_job_updated
  before update on public.jobs
  for each row execute procedure public.handle_updated_at();


-- -----------------------------------------------------------------------------
-- Storage Setup
-- -----------------------------------------------------------------------------
-- Insert buckets if not exists
insert into storage.buckets (id, name, public) 
values ('resumes', 'resumes', false) 
on conflict (id) do nothing;

insert into storage.buckets (id, name, public) 
values ('profile-images', 'profile-images', true) 
on conflict (id) do nothing;

-- Enable storage RLS policies
-- resumes policies
create policy "Allow users to read their own resumes"
  on storage.objects for select
  using ( bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text );

create policy "Allow users to insert their own resumes"
  on storage.objects for insert
  with check ( bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text and auth.role() = 'authenticated' );

create policy "Allow users to update their own resumes"
  on storage.objects for update
  using ( bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text );

create policy "Allow users to delete their own resumes"
  on storage.objects for delete
  using ( bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text );

-- profile-images policies
create policy "Allow public to read profile images"
  on storage.objects for select
  using ( bucket_id = 'profile-images' );

create policy "Allow users to insert their own profile images"
  on storage.objects for insert
  with check ( bucket_id = 'profile-images' and (storage.foldername(name))[1] = auth.uid()::text and auth.role() = 'authenticated' );

create policy "Allow users to update their own profile images"
  on storage.objects for update
  using ( bucket_id = 'profile-images' and (storage.foldername(name))[1] = auth.uid()::text );

create policy "Allow users to delete their own profile images"
  on storage.objects for delete
  using ( bucket_id = 'profile-images' and (storage.foldername(name))[1] = auth.uid()::text );


-- -----------------------------------------------------------------------------
-- Profile Links Table
-- -----------------------------------------------------------------------------
create table if not exists public.profile_links (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  url text not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- Enable RLS for Profile Links
alter table public.profile_links enable row level security;

-- Policies for Profile Links
create policy "Users can view their own links"
  on public.profile_links for select
  using (auth.uid() = user_id);

create policy "Users can insert their own links"
  on public.profile_links for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own links"
  on public.profile_links for update
  using (auth.uid() = user_id);

create policy "Users can delete their own links"
  on public.profile_links for delete
  using (auth.uid() = user_id);

-- Trigger for updated_at on profile_links
create or replace trigger on_profile_link_updated
  before update on public.profile_links
  for each row execute procedure public.handle_updated_at();
