export const Colors = {
  // Base palette — warm cream + sage
  cream: '#FDF6EE',
  creamDark: '#F5EAD8',
  parchment: '#EDE0CC',

  // Sage greens
  sage: '#7BA68A',
  sageDark: '#5C8A6E',
  sageLight: '#A8C4B0',
  sagePale: '#E8F2EC',

  // Rating colors
  calm: '#6BAF82',        // green — "Zen Zone"
  moderate: '#F0C060',    // amber — "Easy Breezy"
  stimulating: '#E8884A', // orange — "A Bit Buzzy"
  intense: '#D45C5C',     // red — "High Alert"

  // UI
  text: '#2C2016',
  textMid: '#6B5744',
  textLight: '#9E866E',
  white: '#FFFFFF',
  cardBg: '#FFFFFF',
  border: '#E8D9C8',
  inputBg: '#F5EAD8',

  // Score bar fills
  scoreCalm: '#88C9A0',
  scoreMid: '#F4D06A',
  scoreHot: '#E8884A',
  scoreRed: '#D45C5C',

  // Special
  windDown: '#9B8EC4',    // soft lavender for wind-down score
};

export const RatingConfig = {
  calm: {
    label: 'Zen Zone',
    emoji: '🧘',
    description: 'Great for any time, including wind-down',
    color: Colors.calm,
    bgColor: '#EDF7F1',
  },
  moderate: {
    label: 'Easy Breezy',
    emoji: '🌤️',
    description: 'Fine for most times, avoid right before bed',
    color: Colors.moderate,
    bgColor: '#FDF6E3',
  },
  stimulating: {
    label: 'A Bit Buzzy',
    emoji: '⚡',
    description: 'May amp up your toddler — plan ahead',
    color: Colors.stimulating,
    bgColor: '#FEF3EB',
  },
  intense: {
    label: 'High Alert',
    emoji: '🚨',
    description: 'Avoid before sleep, meals, or transitions',
    color: Colors.intense,
    bgColor: '#FDEFEF',
  },
};

export const MetricLabels = {
  pace: { label: 'Pace', icon: '⏩', low: 'Slow & gentle', high: 'Fast & frantic' },
  visualIntensity: { label: 'Visual Intensity', icon: '👁️', low: 'Soft & calm', high: 'Bright & chaotic' },
  noiseLevel: { label: 'Noise Level', icon: '🔊', low: 'Quiet & soft', high: 'Loud & jarring' },
  emotionalIntensity: { label: 'Emotional Intensity', icon: '💓', low: 'Calm & neutral', high: 'Overwhelming' },
  educationalValue: { label: 'Educational Value', icon: '📚', low: 'Not educational', high: 'Very educational' },
  windDownScore: { label: 'Wind-Down Friendly', icon: '🌙', low: 'Not for bedtime', high: 'Perfect for wind-down', inverted: true },
};

export const POPULAR_SHOWS = [
  'Bluey', 'Peppa Pig', 'Cocomelon', 'Paw Patrol', 'Daniel Tiger',
  'Sesame Street', 'Mickey Mouse Clubhouse', 'Octonauts', 'Hey Bear',
  "Mister Rogers' Neighborhood",
];
