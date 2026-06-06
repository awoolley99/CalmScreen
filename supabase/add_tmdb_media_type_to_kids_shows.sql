alter table public.kids_shows
add column if not exists tmdb_media_type text not null default 'tv';

alter table public.kids_shows
drop constraint if exists kids_shows_tmdb_id_key;

alter table public.kids_shows
drop constraint if exists kids_shows_tmdb_media_type_check;

alter table public.kids_shows
add constraint kids_shows_tmdb_media_type_check
check (tmdb_media_type in ('tv', 'movie'));

create unique index if not exists kids_shows_tmdb_media_unique
on public.kids_shows (tmdb_media_type, tmdb_id);
