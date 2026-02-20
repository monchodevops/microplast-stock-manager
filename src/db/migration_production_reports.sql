-- Create table for tracking production reports (Cutoff points for Delta calculation)
create table if not exists public.production_report_logs (
  id uuid default gen_random_uuid() primary key,
  generated_at timestamp with time zone default now() not null,
  production_date date not null,
  user_id uuid, -- Optional: Link to auth.users if authentication is fully implemented
  
  -- Metadata
  created_at timestamp with time zone default now()
);

-- Index for faster queries on date
create index if not exists idx_production_report_logs_date on public.production_report_logs(production_date);

-- Security Policies (RLS) - Assuming public access for this internal tool based on existing code
-- If RLS is enabled on other tables, we should enable it here too.
alter table public.production_report_logs enable row level security;

create policy "Allow public read access"
  on public.production_report_logs
  for select
  to anon
  using (true);

create policy "Allow public insert access"
  on public.production_report_logs
  for insert
  to anon
  with check (true);
