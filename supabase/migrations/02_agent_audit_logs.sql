-- ============================================
-- MESS Reservations - Agent Audit Logs Table (Updated)
-- ============================================
-- Add this to your migrations after 01_missing_tables.sql
-- Drop and recreate table with trace_id support
drop table if exists public.agent_audit_logs cascade;
-- Create agent audit logs table with tracing support
create table public.agent_audit_logs (
    id uuid default uuid_generate_v4() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    -- Distributed tracing support
    trace_id uuid not null,
    -- Links all skills in the same user flow
    -- Skill execution data
    skill_name text not null,
    input_data jsonb not null,
    output_result text not null,
    -- 'success' or 'failure'
    error_details jsonb,
    -- Optional: execution time tracking
    execution_time_ms int
);
-- Enable RLS
alter table public.agent_audit_logs enable row level security;
-- Policies (adjust based on your authentication requirements)
create policy "Enable read access for authenticated users" on public.agent_audit_logs for
select using (auth.role() = 'authenticated');
create policy "Enable insert for system" on public.agent_audit_logs for
insert with check (true);
-- Permite inserts desde el sistema
-- Indexes for performance and tracing queries
create index idx_agent_audit_logs_created_at on public.agent_audit_logs(created_at desc);
create index idx_agent_audit_logs_skill_name on public.agent_audit_logs(skill_name);
create index idx_agent_audit_logs_output_result on public.agent_audit_logs(output_result);
create index idx_agent_audit_logs_trace_id on public.agent_audit_logs(trace_id);
-- Critical for trace queries
-- Optional: Enable Realtime for monitoring
alter publication supabase_realtime
add table public.agent_audit_logs;