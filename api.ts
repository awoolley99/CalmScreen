import { ShowAnalysis, StimulationScore } from '../types';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

function generateShowId(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
}

function getRatingLabel(score: number): ShowAnalysis['overallRating'] {
  if (score <= 3) return 'calm';
  if (score <= 5) return 'moderate';
  if (score <= 7) return 'stimulating';
  return 'intense';
}

export async function analyzeShow(title: string): Promise<ShowAnalysis> {
  const systemPrompt = `You are CalmScreen, an expert child development and media analyst specializing in how TV shows and movies affect toddler nervous systems (ages 1–5). You synthesize knowledge from sources like Common Sense Media, Sensory App House, Reddit parenting communities, and child psychology research.

You MUST respond with ONLY a valid JSON object — no markdown, no backticks, no explanation. Just pure JSON.`;

  const userPrompt = `Analyze the children's show or movie titled: "${title}"

Provide a detailed nervous system impact assessment for toddlers (ages 1–5). Return ONLY this JSON structure:

{
  "title": "exact title",
  "type": "show" or "movie",
  "ageRange": "e.g. 2–5 years",
  "overallScore": <number 1-10, where 1=extremely calm, 10=extremely overstimulating>,
  "scores": {
    "pace": <1-10, 1=very slow gentle pacing, 10=rapid frantic cuts>,
    "visualIntensity": <1-10, 1=soft muted calming visuals, 10=bright chaotic overwhelming>,
    "noiseLevel": <1-10, 1=quiet and soft, 10=loud jarring constant noise>,
    "emotionalIntensity": <1-10, 1=calm neutral emotions, 10=scary/upsetting/overwhelming emotions>,
    "educationalValue": <1-10, 1=no educational content, 10=highly educational>,
    "windDownScore": <1-10, where 10=great for wind-down/bedtime, 1=terrible before sleep>
  },
  "summary": "2-3 sentence parent-friendly summary of why this show is or isn't stimulating for toddlers",
  "parentTip": "one practical tip for parents about watching this show",
  "bestTimeToWatch": "e.g. 'Morning or afternoon — not near nap or bedtime'",
  "avoidBefore": "e.g. 'Bedtime, naps' or 'Nothing to avoid'",
  "similarShows": [
    {
      "title": "show name",
      "reason": "why it's similar in stimulation level",
      "overallScore": <1-10>,
      "ageRange": "age range"
    }
  ],
  "sources": ["Common Sense Media", "Reddit r/toddlers", "Sensory App House", "Child development research"]
}

Be accurate and honest. If a show is overstimulating (like some episodes of Bluey or Paw Patrol), say so clearly. Include 3–4 similar shows.`;

  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      tools: [
        {
          type: 'web_search_20250305',
          name: 'web_search',
        },
      ],
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const data = await response.json();

  // Extract text from response (may contain tool_use blocks from web search)
  let jsonText = '';
  for (const block of data.content) {
    if (block.type === 'text') {
      jsonText += block.text;
    }
  }

  // Clean up any markdown fences
  const clean = jsonText.replace(/```json|```/g, '').trim();

  // Find JSON object in the response
  const jsonMatch = clean.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON found in response');
  }

  const parsed = JSON.parse(jsonMatch[0]);

  const analysis: ShowAnalysis = {
    id: generateShowId(parsed.title || title),
    title: parsed.title || title,
    type: parsed.type || 'show',
    ageRange: parsed.ageRange || '2–5 years',
    overallRating: getRatingLabel(parsed.overallScore || 5),
    overallScore: parsed.overallScore || 5,
    scores: {
      pace: parsed.scores?.pace || 5,
      visualIntensity: parsed.scores?.visualIntensity || 5,
      noiseLevel: parsed.scores?.noiseLevel || 5,
      emotionalIntensity: parsed.scores?.emotionalIntensity || 5,
      educationalValue: parsed.scores?.educationalValue || 5,
      windDownScore: parsed.scores?.windDownScore || 5,
    },
    summary: parsed.summary || '',
    parentTip: parsed.parentTip || '',
    bestTimeToWatch: parsed.bestTimeToWatch || '',
    avoidBefore: parsed.avoidBefore || '',
    similarShows: parsed.similarShows || [],
    sources: parsed.sources || ['Common Sense Media', 'Child development research'],
    lastUpdated: new Date().toISOString(),
  };

  return analysis;
}

export async function searchShows(query: string): Promise<string[]> {
  const systemPrompt = `You are a children's media database. Return ONLY a JSON array of show/movie title strings. No markdown, no explanation.`;

  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `List up to 6 children's TV shows or movies matching: "${query}". Return ONLY a JSON array of strings like ["Title One", "Title Two"]. Focus on popular shows for toddlers ages 1–5.`,
        },
      ],
    }),
  });

  if (!response.ok) return [];

  const data = await response.json();
  const text = data.content?.find((b: any) => b.type === 'text')?.text || '[]';
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) return [];

  try {
    return JSON.parse(match[0]);
  } catch {
    return [];
  }
}
