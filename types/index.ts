export interface StimulationScore {
  pace: number;           // 1–10: 1 = slow/gentle, 10 = rapid/frantic
  visualIntensity: number; // 1–10: 1 = muted/calm, 10 = chaotic/bright
  noiseLevel: number;      // 1–10: 1 = quiet/soft, 10 = loud/jarring
  emotionalIntensity: number; // 1–10: 1 = calm/neutral, 10 = scary/overwhelming
  educationalValue: number;   // 1–10: 1 = none, 10 = highly educational
  windDownScore: number;      // 1–10: 10 = great for wind-down, 1 = terrible
}

export interface ShowAnalysis {
  id: string;
  title: string;
  type: 'show' | 'movie';
  ageRange: string;
  thumbnail?: string;
  overallRating: 'calm' | 'moderate' | 'stimulating' | 'intense';
  overallScore: number; // 1–10 overall overstimulation (lower = calmer)
  scores: StimulationScore;
  summary: string;
  parentTip: string;
  bestTimeToWatch: string;
  avoidBefore: string; // e.g. "bedtime", "naps"
  similarShows: SimilarShow[];
  sources: string[];
  lastUpdated: string;
}

export interface SimilarShow {
  title: string;
  reason: string;
  overallScore: number;
  ageRange: string;
}

export type RatingLabel = 'Zen Zone' | 'Easy Breezy' | 'A Bit Buzzy' | 'High Alert';

export interface SearchResult {
  title: string;
  type: 'show' | 'movie';
  year?: string;
  description?: string;
}
