import { ShowAnalysis } from '../types';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

type KidsShowRow = {
  id: string;
  tmdb_id: number;
  title: string;
  age_range: string | null;
  animation_type: string | null;
  educational_score: number | null;
  stimulation_score: number | null;
  platforms: string[] | null;
  country: string | null;
  episodes: number | null;
  runtime_minutes: number | null;
  status: string | null;
  overview: string | null;
  last_checked: string | null;
};

function hasSupabaseConfig() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

function getRatingLabel(score: number): ShowAnalysis['overallRating'] {
  if (score <= 3) return 'calm';
  if (score <= 5) return 'moderate';
  if (score <= 7) return 'stimulating';
  return 'intense';
}

function buildUrl(path: string, params: Record<string, string>) {
  if (!SUPABASE_URL) {
    throw new Error('Missing EXPO_PUBLIC_SUPABASE_URL');
  }

  const url = new URL(`${SUPABASE_URL}/rest/v1/${path}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return url.toString();
}

async function supabaseGet<T>(path: string, params: Record<string, string>): Promise<T> {
  if (!SUPABASE_ANON_KEY) {
    throw new Error('Missing EXPO_PUBLIC_SUPABASE_ANON_KEY');
  }

  const response = await fetch(buildUrl(path, params), {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Supabase error: ${response.status}`);
  }

  return response.json();
}

function databaseRowToAnalysis(row: KidsShowRow, similarRows: KidsShowRow[] = []): ShowAnalysis {
  const stimulationScore = row.stimulation_score || 5;
  const educationalScore = row.educational_score || 5;
  const platforms = row.platforms?.length ? row.platforms.join(', ') : 'availability varies by region';
  const runtime = row.runtime_minutes ? `${row.runtime_minutes} minute episodes` : 'episode length varies';
  const episodes = row.episodes ? `${row.episodes} episodes` : 'episode count unavailable';

  return {
    id: row.title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-'),
    title: row.title,
    type: 'show',
    ageRange: row.age_range || '2-5',
    overallRating: getRatingLabel(stimulationScore),
    overallScore: stimulationScore,
    scores: {
      pace: stimulationScore,
      visualIntensity: stimulationScore,
      noiseLevel: stimulationScore,
      emotionalIntensity: Math.max(1, stimulationScore - 1),
      educationalValue: educationalScore,
      windDownScore: Math.max(1, 11 - stimulationScore),
    },
    summary:
      row.overview ||
      `${row.title} is listed in the CalmScreen kids database with a stimulation score of ${stimulationScore}/10 and an educational score of ${educationalScore}/10. It is available on ${platforms}.`,
    parentTip: `Start with one ${runtime} and watch how your child transitions afterward. Current database metadata lists ${episodes}.`,
    bestTimeToWatch:
      stimulationScore <= 4 ? 'Wind-down, morning, or quiet afternoon' : 'Morning or afternoon, with a calm buffer afterward',
    avoidBefore: stimulationScore >= 6 ? 'Bedtime, naps, meals, or hard transitions' : 'Nothing major, but keep bedtime calm',
    similarShows: similarRows.slice(0, 4).map((similar) => ({
      title: similar.title,
      reason: `Similar database stimulation score (${similar.stimulation_score || 5}/10)`,
      overallScore: similar.stimulation_score || 5,
      ageRange: similar.age_range || '2-5',
    })),
    sources: ['CalmScreen kids database', 'TMDb', 'TVmaze'],
    lastUpdated: row.last_checked || new Date().toISOString(),
  };
}

export async function searchDatabaseShows(query: string): Promise<string[]> {
  if (!hasSupabaseConfig() || query.trim().length < 2) return [];

  const rows = await supabaseGet<KidsShowRow[]>('kids_shows', {
    select: 'title',
    title: `ilike.*${query.trim()}*`,
    order: 'popularity.desc.nullslast,title.asc',
    limit: '6',
  });

  return rows.map((row) => row.title);
}

export async function getDatabaseShowAnalysis(title: string): Promise<ShowAnalysis | null> {
  if (!hasSupabaseConfig()) return null;

  const rows = await supabaseGet<KidsShowRow[]>('kids_shows', {
    select:
      'id,tmdb_id,title,age_range,animation_type,educational_score,stimulation_score,platforms,country,episodes,runtime_minutes,status,overview,last_checked',
    title: `ilike.${title.trim()}`,
    limit: '1',
  });

  const show = rows[0];
  if (!show) return null;

  const lowerBound = Math.max(1, (show.stimulation_score || 5) - 1);
  const upperBound = Math.min(10, (show.stimulation_score || 5) + 1);
  const similarRows = await supabaseGet<KidsShowRow[]>('kids_shows', {
    select: 'title,age_range,stimulation_score',
    stimulation_score: `gte.${lowerBound}`,
    and: `(stimulation_score.lte.${upperBound},title.neq.${show.title})`,
    order: 'popularity.desc.nullslast',
    limit: '4',
  }).catch(() => []);

  return databaseRowToAnalysis(show, similarRows);
}
