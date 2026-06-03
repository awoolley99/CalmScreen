# CalmScreen 👶📺

**IMDb for toddler nervous systems.**

Search any kids' show or movie and instantly see how overstimulating it is — with scores for pace, visual intensity, noise level, emotional intensity, educational value, and a "can my toddler wind down after this?" rating.

---

## Features

- 🔍 **Smart Search** — Searches for any show or movie, with autocomplete suggestions
- 🧠 **AI Analysis** — Uses Claude + web search to synthesize data from Common Sense Media, Sensory App House, Reddit parenting communities, and child development research
- 📊 **6 Stimulation Metrics** — Pace, Visual Intensity, Noise Level, Emotional Intensity, Educational Value, Wind-Down Score
- 🎯 **Overstimulation Gauge** — Visual dial showing overall nervous system impact (1–10)
- 💡 **Parent Tips** — Practical advice for each show
- 📺 **Similar Shows** — 3–4 recommendations at the same stimulation level
- 💾 **Offline Cache** — Results cached for 7 days (no repeated API calls)
- 📱 **App Store Ready** — Built with Expo for iOS + Android

---

## Ratings Explained

| Rating | Label | Meaning |
|--------|-------|---------|
| 🧘 1–3 | **Zen Zone** | Great any time, including wind-down |
| 🌤️ 4–5 | **Easy Breezy** | Fine most times, avoid right before bed |
| ⚡ 6–7 | **A Bit Buzzy** | May amp up your toddler — plan ahead |
| 🚨 8–10 | **High Alert** | Avoid before sleep, meals, or transitions |

---

## Setup

### 1. Prerequisites

- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- Expo Go app on your phone (for development)
- An Anthropic API key: [console.anthropic.com](https://console.anthropic.com)

### 2. Install

```bash
cd CalmScreen
npm install
```

### 3. Add Your API Key

Create a `.env` file in the project root:

```env
EXPO_PUBLIC_ANTHROPIC_API_KEY=sk-ant-your-key-here
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-public-anon-key
```

> ⚠️ **Important for production:** Don't ship your API key in the app bundle. For a production release, proxy API calls through your own backend (a simple Next.js API route or Cloudflare Worker works great).

### 4. Run

```bash
npx expo start
```

Scan the QR code with Expo Go (iOS/Android) or press `i` for iOS simulator / `a` for Android.

---

## Kids Show Database

CalmScreen includes a Supabase/Postgres pipeline for a continuously refreshed kids TV database. It discovers popular shows from TMDb instead of hardcoding titles, enriches them with watch-provider and TVmaze metadata, assigns initial rule-based scores, and upserts the top 1,000 rows.

### Database Setup

1. Create a Supabase project.
2. Open Supabase SQL Editor.
3. Run [supabase/kids_shows_schema.sql](supabase/kids_shows_schema.sql).

The schema creates:

- `kids_shows` — canonical show records with title, age range, animation type, scores, platforms, country, episode count, runtime, status, and `last_checked`.
- `show_platforms` — normalized provider rows per show and country.

### Updater Environment

Copy [.env.example](.env.example) to `.env` and fill in:

```env
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
TMDB_API_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
STREAMING_AVAILABILITY_API_KEY=
KIDS_SHOWS_LIMIT=1000
TMDB_REGION=US
```

`STREAMING_AVAILABILITY_API_KEY` is reserved for richer provider coverage if you add a paid streaming availability source. The current updater uses TMDb watch providers and TVmaze.

Use `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` in the mobile app. Use `SUPABASE_SERVICE_ROLE_KEY` only for the updater job, never in app code.

Find the public anon key in Supabase under **Project Settings → API → Project API keys → anon public**.

### Run The Updater

```bash
npm run update:kids-shows
```

The updater:

- Pulls popular TV candidates from TMDb kids, family, and animation genres.
- Filters for clearly children/preschool/family-oriented shows.
- Fetches TMDb watch providers for Netflix, Disney+, Max, Hulu, Paramount+, Peacock, Apple TV+, Prime Video, PBS Kids, YouTube Kids, Nickelodeon, Disney Channel, Cartoon Network, Nick Jr., and Disney Jr.-adjacent provider coverage where TMDb exposes it.
- Pulls episode/runtime/status metadata from TMDb and TVmaze.
- Assigns initial `educational_score` and `stimulation_score` with transparent rule-based heuristics.
- Upserts the top 1,000 records into Supabase.

### Daily Refresh

The workflow at [.github/workflows/update-kids-shows.yml](.github/workflows/update-kids-shows.yml) runs daily at 09:00 UTC and can also be triggered manually from GitHub Actions.

Add these GitHub repository secrets:

```text
TMDB_API_KEY
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
STREAMING_AVAILABILITY_API_KEY
```

---

## Project Structure

```
CalmScreen/
├── app/
│   ├── _layout.tsx       # Root navigation layout
│   ├── index.tsx         # Home / Search screen
│   └── result.tsx        # Show analysis detail screen
├── components/
│   ├── ScoreBar.tsx      # Animated metric bar
│   ├── StimGauge.tsx     # SVG radial gauge dial
│   ├── ShowCard.tsx      # Show card for lists
│   └── RatingBadge.tsx   # Rating pill badge
├── utils/
│   ├── api.ts            # Claude API calls
│   ├── storage.ts        # AsyncStorage caching
│   └── constants.ts      # Colors, labels, config
├── scripts/
│   └── updateKidsShows.js # Supabase database refresh job
├── supabase/
│   └── kids_shows_schema.sql
├── types/
│   └── index.ts          # TypeScript types
└── app.config.ts         # Expo config
```

---

## Building for the App Store

### iOS (TestFlight → App Store)

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure build
eas build:configure

# Build for iOS
eas build --platform ios

# Submit to App Store
eas submit --platform ios
```

### Android (Google Play)

```bash
eas build --platform android
eas submit --platform android
```

---

## Production Considerations

1. **API Key Security** — Proxy through a backend. Never ship keys in bundles.
2. **Rate Limiting** — The app caches results for 7 days to minimize API calls.
3. **Content Moderation** — Add a blocklist for non-children's content searches.
4. **App Store Metadata** — Category: `Kids` or `Reference`. Rating: `4+`.
5. **Privacy Policy** — Required for App Store. The app stores search history locally only.

---

## Tech Stack

- **React Native + Expo** (SDK 54)
- **Expo Router** — file-based navigation
- **TypeScript** — full type safety
- **AsyncStorage** — local caching
- **Supabase/Postgres** — continuously refreshed kids show database
- **TMDb + TVmaze** — popularity, provider, schedule, and episode metadata
- **react-native-svg** — gauge visualization
- **react-native-reanimated** — smooth animations
- **Claude API (claude-sonnet-4)** — AI analysis with web search

---

## License

MIT — build something great for parents! 🌿
