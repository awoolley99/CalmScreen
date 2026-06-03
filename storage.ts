import AsyncStorage from '@react-native-async-storage/async-storage';
import { ShowAnalysis } from '../types';

const CACHE_PREFIX = 'show_analysis_';
const RECENTS_KEY = 'recent_searches';
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function getCachedAnalysis(id: string): Promise<ShowAnalysis | null> {
  try {
    const raw = await AsyncStorage.getItem(`${CACHE_PREFIX}${id}`);
    if (!raw) return null;
    const { data, timestamp } = JSON.parse(raw);
    if (Date.now() - timestamp > CACHE_TTL) {
      await AsyncStorage.removeItem(`${CACHE_PREFIX}${id}`);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export async function cacheAnalysis(analysis: ShowAnalysis): Promise<void> {
  try {
    await AsyncStorage.setItem(
      `${CACHE_PREFIX}${analysis.id}`,
      JSON.stringify({ data: analysis, timestamp: Date.now() })
    );
  } catch {}
}

export async function getRecentSearches(): Promise<ShowAnalysis[]> {
  try {
    const raw = await AsyncStorage.getItem(RECENTS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function addToRecents(analysis: ShowAnalysis): Promise<void> {
  try {
    const recents = await getRecentSearches();
    const filtered = recents.filter((r) => r.id !== analysis.id);
    const updated = [analysis, ...filtered].slice(0, 20);
    await AsyncStorage.setItem(RECENTS_KEY, JSON.stringify(updated));
  } catch {}
}

export async function clearRecents(): Promise<void> {
  try {
    await AsyncStorage.removeItem(RECENTS_KEY);
  } catch {}
}
