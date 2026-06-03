#!/usr/bin/env node

require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TVMAZE_BASE_URL = 'https://api.tvmaze.com';
const TARGET_LIMIT = Number(process.env.KIDS_SHOWS_LIMIT || 1000);
const TMDB_REGION = process.env.TMDB_REGION || 'US';
const REQUEST_DELAY_MS = Number(process.env.UPDATE_REQUEST_DELAY_MS || 80);

const REQUIRED_ENV = ['TMDB_API_KEY', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
const missingEnv = REQUIRED_ENV.filter((key) => !process.env[key]);

if (missingEnv.length) {
  throw new Error(`Missing required environment variables: ${missingEnv.join(', ')}`);
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

const TARGET_PROVIDER_NAMES = new Set([
  'Netflix',
  'Disney Plus',
  'Max',
  'Hulu',
  'Paramount Plus',
  'Peacock Premium',
  'Peacock Premium Plus',
  'Apple TV Plus',
  'Amazon Prime Video',
  'PBS Kids Amazon Channel',
  'YouTube',
  'YouTube Premium',
  'Nickhits Amazon Channel',
  'Boomerang Amazon Channel',
  'Cartoon Network',
  'DisneyNOW',
]);

const PROVIDER_ALIASES = new Map([
  ['Disney Plus', 'Disney+'],
  ['Paramount Plus', 'Paramount+'],
  ['Peacock Premium', 'Peacock'],
  ['Peacock Premium Plus', 'Peacock'],
  ['Apple TV Plus', 'Apple TV+'],
  ['Amazon Prime Video', 'Prime Video'],
  ['PBS Kids Amazon Channel', 'PBS Kids'],
  ['Nickhits Amazon Channel', 'Nickelodeon'],
  ['Boomerang Amazon Channel', 'Cartoon Network'],
  ['DisneyNOW', 'Disney Channel'],
  ['YouTube Premium', 'YouTube Kids'],
  ['YouTube', 'YouTube Kids'],
]);

const CHILD_NETWORK_TERMS = [
  'pbs',
  'pbs kids',
  'nickelodeon',
  'nick jr',
  'disney channel',
  'disney junior',
  'disney jr',
  'cartoon network',
  'boomerang',
  'cbeebies',
  'treehouse',
  'universal kids',
  'netflix kids',
];

const CHILD_KEYWORDS = [
  'children',
  'child',
  'kids',
  'kid',
  'preschool',
  'toddler',
  'family',
  'educational',
  'learning',
  'animation',
  'cartoon',
  'puppet',
  'nursery',
  'school',
  'friendship',
  'animals',
];

const EDUCATIONAL_TERMS = [
  'educational',
  'learning',
  'preschool',
  'school',
  'science',
  'nature',
  'math',
  'numbers',
  'letters',
  'reading',
  'music',
  'problem solving',
  'social emotional',
  'kindness',
  'friendship',
];

const STIMULATING_TERMS = [
  'action',
  'adventure',
  'superhero',
  'battle',
  'fight',
  'monster',
  'robot',
  'chase',
  'competition',
  'magic',
  'villain',
  'loud',
  'slapstick',
];

const CALM_TERMS = [
  'gentle',
  'calm',
  'quiet',
  'bedtime',
  'nature',
  'friendship',
  'kindness',
  'preschool',
  'puppet',
];

const EXCLUDE_TERMS = [
  'adult animation',
  'sitcom',
  'crime',
  'murder',
  'horror',
  'serial killer',
  'erotic',
  'dating',
  'reality',
  'war',
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function compact(value) {
  return String(value || '').toLowerCase();
}

function clamp(value, min = 1, max = 10) {
  return Math.min(max, Math.max(min, value));
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function textBundle(show, details) {
  const keywords = details?.keywords?.results?.map((item) => item.name).join(' ') || '';
  const genres = details?.genres?.map((item) => item.name).join(' ') || '';
  const networks = details?.networks?.map((item) => item.name).join(' ') || '';
  return compact([
    show.name,
    show.original_name,
    show.overview,
    details?.overview,
    genres,
    keywords,
    networks,
  ].join(' '));
}

async function fetchJson(url, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    const response = await fetch(url);

    if (response.ok) {
      return response.json();
    }

    if (response.status === 429 || response.status >= 500) {
      await sleep(REQUEST_DELAY_MS * attempt * 5);
      continue;
    }

    const body = await response.text();
    throw new Error(`Request failed ${response.status}: ${url}\n${body.slice(0, 500)}`);
  }

  throw new Error(`Request failed after ${retries} attempts: ${url}`);
}

function tmdbUrl(path, params = {}) {
  const url = new URL(`${TMDB_BASE_URL}${path}`);
  url.searchParams.set('api_key', process.env.TMDB_API_KEY);

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, value);
    }
  }

  return url.toString();
}

async function getDiscoverPage(page, genreExpression) {
  return fetchJson(
    tmdbUrl('/discover/tv', {
      sort_by: 'popularity.desc',
      include_adult: 'false',
      include_null_first_air_dates: 'false',
      language: 'en-US',
      page,
      with_genres: genreExpression,
      watch_region: TMDB_REGION,
    })
  );
}

async function collectCandidates() {
  const candidates = new Map();
  const genreQueries = ['10762', '10751', '16'];

  for (const genreExpression of genreQueries) {
    for (let page = 1; page <= 25 && candidates.size < TARGET_LIMIT * 3; page += 1) {
      const data = await getDiscoverPage(page, genreExpression);
      for (const show of data.results || []) {
        if (!candidates.has(show.id)) {
          candidates.set(show.id, show);
        }
      }
      await sleep(REQUEST_DELAY_MS);
      if (page >= (data.total_pages || 1)) break;
    }
  }

  return [...candidates.values()].sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
}

async function getTmdbDetails(tmdbId) {
  return fetchJson(
    tmdbUrl(`/tv/${tmdbId}`, {
      append_to_response: 'external_ids,content_ratings,keywords',
      language: 'en-US',
    })
  );
}

async function getWatchProviders(tmdbId) {
  const data = await fetchJson(tmdbUrl(`/tv/${tmdbId}/watch/providers`));
  const region = data.results?.[TMDB_REGION] || {};
  const buckets = ['flatrate', 'free', 'ads'];
  const providers = [];

  for (const bucket of buckets) {
    for (const provider of region[bucket] || []) {
      const providerName = provider.provider_name;
      if (TARGET_PROVIDER_NAMES.has(providerName)) {
        providers.push(PROVIDER_ALIASES.get(providerName) || providerName);
      }
    }
  }

  return unique(providers);
}

async function getTvmazeMetadata(details) {
  const imdbId = details?.external_ids?.imdb_id;
  const tvdbId = details?.external_ids?.tvdb_id;

  try {
    if (tvdbId) {
      return await fetchJson(`${TVMAZE_BASE_URL}/lookup/shows?thetvdb=${encodeURIComponent(tvdbId)}`, 2);
    }

    if (imdbId) {
      return await fetchJson(`${TVMAZE_BASE_URL}/lookup/shows?imdb=${encodeURIComponent(imdbId)}`, 2);
    }
  } catch (error) {
    return null;
  }

  return null;
}

function isClearlyForKids(show, details) {
  const bundle = textBundle(show, details);
  const genreIds = new Set(show.genre_ids || details?.genres?.map((genre) => genre.id) || []);
  const ratingValues = details?.content_ratings?.results?.map((rating) => rating.rating).filter(Boolean) || [];

  if (EXCLUDE_TERMS.some((term) => bundle.includes(term))) return false;
  if (ratingValues.some((rating) => ['TV-MA', 'TV-14'].includes(rating))) return false;

  const hasKidsGenre = genreIds.has(10762);
  const hasFamilyGenre = genreIds.has(10751);
  const hasAnimationGenre = genreIds.has(16);
  const hasChildKeyword = CHILD_KEYWORDS.some((term) => bundle.includes(term));
  const hasChildNetwork = CHILD_NETWORK_TERMS.some((term) => bundle.includes(term));
  const hasKidRating = ratingValues.some((rating) => ['TV-Y', 'TV-Y7', 'TV-G', 'G'].includes(rating));

  return hasKidsGenre || hasKidRating || hasChildNetwork || (hasFamilyGenre && (hasAnimationGenre || hasChildKeyword));
}

function inferAgeRange(show, details) {
  const bundle = textBundle(show, details);
  const ratings = details?.content_ratings?.results?.map((rating) => rating.rating) || [];

  if (bundle.includes('baby') || bundle.includes('nursery')) return '1-3';
  if (bundle.includes('toddler') || bundle.includes('preschool') || ratings.includes('TV-Y')) return '2-5';
  if (ratings.includes('TV-Y7')) return '6-10';
  if (ratings.includes('TV-G')) return '4-8';
  if (bundle.includes('teen')) return '8-12';

  return '3-7';
}

function inferAnimationType(show, details) {
  const bundle = textBundle(show, details);
  const genreNames = details?.genres?.map((genre) => genre.name.toLowerCase()) || [];

  if (bundle.includes('puppet')) return 'puppet';
  if (bundle.includes('live action') || bundle.includes('live-action')) return 'live_action';
  if (bundle.includes('stop motion') || bundle.includes('stop-motion')) return 'stop_motion';
  if (genreNames.includes('animation') || (show.genre_ids || []).includes(16)) return 'animated';

  return 'mixed_or_live_action';
}

function scoreEducational(show, details) {
  const bundle = textBundle(show, details);
  let score = 4;

  for (const term of EDUCATIONAL_TERMS) {
    if (bundle.includes(term)) score += 1;
  }

  if (bundle.includes('pbs') || bundle.includes('pbs kids')) score += 2;
  if (bundle.includes('preschool')) score += 1;
  if (bundle.includes('superhero') || bundle.includes('battle')) score -= 1;

  return clamp(score);
}

function scoreStimulation(show, details) {
  const bundle = textBundle(show, details);
  const runtime = firstNumber(details?.episode_run_time) || show.runtime_minutes || 22;
  let score = 5;

  for (const term of STIMULATING_TERMS) {
    if (bundle.includes(term)) score += 1;
  }

  for (const term of CALM_TERMS) {
    if (bundle.includes(term)) score -= 1;
  }

  if (runtime <= 12) score -= 1;
  if (runtime >= 30) score += 1;
  if (details?.genres?.some((genre) => genre.name === 'Action & Adventure')) score += 2;

  return clamp(score);
}

function firstNumber(values) {
  if (!Array.isArray(values)) return undefined;
  return values.find((value) => Number.isFinite(value) && value > 0);
}

function normalizeShow(show, details, tvmaze, platforms) {
  const runtime = tvmaze?.runtime || firstNumber(details?.episode_run_time) || details?.last_episode_to_air?.runtime || null;
  const episodes = tvmaze?._embedded?.episodes?.length || details?.number_of_episodes || null;
  const country = details?.origin_country?.[0] || show.origin_country?.[0] || tvmaze?.network?.country?.code || null;

  return {
    tmdb_id: show.id,
    tvmaze_id: tvmaze?.id || null,
    title: details?.name || show.name,
    age_range: inferAgeRange(show, details),
    animation_type: inferAnimationType(show, details),
    educational_score: scoreEducational(show, details),
    stimulation_score: scoreStimulation(show, details),
    platforms,
    country,
    episodes,
    runtime_minutes: runtime,
    status: details?.status || tvmaze?.status || null,
    last_checked: new Date().toISOString(),
    popularity: show.popularity || details?.popularity || null,
    overview: details?.overview || show.overview || null,
    first_air_date: details?.first_air_date || show.first_air_date || null,
    last_air_date: details?.last_air_date || null,
  };
}

async function enrichCandidate(show) {
  const details = await getTmdbDetails(show.id);
  await sleep(REQUEST_DELAY_MS);

  if (!isClearlyForKids(show, details)) return null;

  const [platforms, tvmaze] = await Promise.all([
    getWatchProviders(show.id).catch(() => []),
    getTvmazeMetadata(details),
  ]);

  return normalizeShow(show, details, tvmaze, platforms);
}

async function upsertShows(shows) {
  const rowsByTmdbId = new Map();

  for (let index = 0; index < shows.length; index += 100) {
    const chunk = shows.slice(index, index + 100);
    const { data, error } = await supabase
      .from('kids_shows')
      .upsert(chunk, { onConflict: 'tmdb_id' })
      .select('id, tmdb_id');

    if (error) throw error;

    for (const row of data || []) {
      rowsByTmdbId.set(row.tmdb_id, row.id);
    }
  }

  return rowsByTmdbId;
}

async function upsertPlatforms(shows, idsByTmdbId) {
  for (const show of shows) {
    const showId = idsByTmdbId.get(show.tmdb_id);
    if (!showId) continue;

    await supabase.from('show_platforms').delete().eq('show_id', showId);

    const platformRows = show.platforms.map((providerName) => ({
      show_id: showId,
      provider_name: providerName,
      provider_type: 'stream',
      country: TMDB_REGION,
      last_checked: new Date().toISOString(),
    }));

    if (platformRows.length) {
      const { error } = await supabase
        .from('show_platforms')
        .upsert(platformRows, { onConflict: 'show_id,provider_name,provider_type,country' });

      if (error) throw error;
    }
  }
}

async function main() {
  console.log(`Collecting TMDb kids/family candidates for ${TMDB_REGION}...`);
  const candidates = await collectCandidates();
  const shows = [];

  for (const [index, candidate] of candidates.entries()) {
    if (shows.length >= TARGET_LIMIT) break;

    try {
      const show = await enrichCandidate(candidate);
      if (show) {
        shows.push(show);
        console.log(`${shows.length}/${TARGET_LIMIT}: ${show.title}`);
      }
    } catch (error) {
      console.warn(`Skipped ${candidate.name || candidate.id}: ${error.message}`);
    }

    if ((index + 1) % 50 === 0) {
      console.log(`Reviewed ${index + 1} candidates, accepted ${shows.length}.`);
    }
  }

  const rankedShows = shows
    .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
    .slice(0, TARGET_LIMIT);

  console.log(`Upserting ${rankedShows.length} kids shows into Supabase...`);
  const idsByTmdbId = await upsertShows(rankedShows);
  await upsertPlatforms(rankedShows, idsByTmdbId);
  console.log(`Done. Refreshed ${rankedShows.length} kids shows.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
