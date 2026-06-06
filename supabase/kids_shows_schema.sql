create extension if not exists "pgcrypto";

create table if not exists public.kids_shows (
  id uuid primary key default gen_random_uuid(),
  tmdb_id integer not null,
  tmdb_media_type text not null default 'tv' check (tmdb_media_type in ('tv', 'movie')),
  tvmaze_id integer,
  title text not null,
  age_range text not null default '2-5',
  animation_type text not null default 'unknown',
  educational_score integer not null check (educational_score between 1 and 10),
  stimulation_score integer not null check (stimulation_score between 1 and 10),
  platforms text[] not null default '{}',
  country text,
  episodes integer,
  runtime_minutes integer,
  status text,
  last_checked timestamptz not null default now(),
  popularity numeric,
  overview text,
  first_air_date date,
  last_air_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists kids_shows_tmdb_media_unique
on public.kids_shows (tmdb_media_type, tmdb_id);

create table if not exists public.show_platforms (
  id uuid primary key default gen_random_uuid(),
  show_id uuid not null references public.kids_shows(id) on delete cascade,
  provider_name text not null,
  provider_type text not null default 'stream',
  country text not null default 'US',
  last_checked timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (show_id, provider_name, provider_type, country)
);

create index if not exists kids_shows_title_idx on public.kids_shows using gin (to_tsvector('english', title));
create index if not exists kids_shows_platforms_idx on public.kids_shows using gin (platforms);
create index if not exists kids_shows_scores_idx on public.kids_shows (stimulation_score, educational_score);
create index if not exists kids_shows_last_checked_idx on public.kids_shows (last_checked);
create index if not exists show_platforms_provider_idx on public.show_platforms (provider_name, country);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists kids_shows_set_updated_at on public.kids_shows;
create trigger kids_shows_set_updated_at
before update on public.kids_shows
for each row execute function public.set_updated_at();

drop trigger if exists show_platforms_set_updated_at on public.show_platforms;
create trigger show_platforms_set_updated_at
before update on public.show_platforms
for each row execute function public.set_updated_at();

alter table public.kids_shows enable row level security;
alter table public.show_platforms enable row level security;

drop policy if exists "Kids shows are publicly readable" on public.kids_shows;
create policy "Kids shows are publicly readable"
on public.kids_shows for select
using (true);

drop policy if exists "Show platforms are publicly readable" on public.show_platforms;
create policy "Show platforms are publicly readable"
on public.show_platforms for select
using (true);
