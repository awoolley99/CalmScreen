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
```

Then update `utils/api.ts` — replace the headers section to use the env var:

```typescript
headers: {
  'Content-Type': 'application/json',
  'x-api-key': process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY!,
  'anthropic-version': '2023-06-01',
  'anthropic-dangerous-direct-browser-access': 'true',
},
```

> ⚠️ **Important for production:** Don't ship your API key in the app bundle. For a production release, proxy API calls through your own backend (a simple Next.js API route or Cloudflare Worker works great).

### 4. Run

```bash
npx expo start
```

Scan the QR code with Expo Go (iOS/Android) or press `i` for iOS simulator / `a` for Android.

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

- **React Native + Expo** (SDK 51)
- **Expo Router** — file-based navigation
- **TypeScript** — full type safety
- **AsyncStorage** — local caching
- **react-native-svg** — gauge visualization
- **react-native-reanimated** — smooth animations
- **Claude API (claude-sonnet-4)** — AI analysis with web search

---

## License

MIT — build something great for parents! 🌿
