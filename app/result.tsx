import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, MetricLabels, RatingConfig } from '../utils/constants';
import { ShowAnalysis } from '../types';
import { ScoreBar } from '../components/ScoreBar';
import { StimGauge } from '../components/StimGauge';
import { analyzeShow } from '../utils/api';
import { addToRecents, cacheAnalysis, getCachedAnalysis } from '../utils/storage';

export default function ResultScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data } = useLocalSearchParams<{ data: string }>();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const analysis: ShowAnalysis = JSON.parse(data || '{}');
  const config = RatingConfig[analysis.overallRating];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 80, friction: 14, useNativeDriver: true }),
    ]).start();
  }, []);

  async function handleSimilarShowPress(title: string) {
    try {
      const id = title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
      let result = await getCachedAnalysis(id);
      if (!result) {
        result = await analyzeShow(title);
        await cacheAnalysis(result);
      }
      await addToRecents(result);
      router.replace({ pathname: '/result', params: { data: JSON.stringify(result) } });
    } catch {
      Alert.alert('Oops!', 'Couldn\'t load that show right now.');
    }
  }

  const metricKeys = Object.keys(MetricLabels) as Array<keyof typeof MetricLabels>;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backArrow}>←</Text>
          <Text style={styles.backLabel}>Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          {/* Hero section */}
          <View style={[styles.hero, { backgroundColor: config.bgColor }]}>
            <View style={styles.heroTop}>
              <View style={styles.titleBlock}>
                <Text style={styles.showTitle}>{analysis.title}</Text>
                <Text style={styles.meta}>
                  {analysis.type === 'movie' ? '🎬 Movie' : '📺 TV Show'} · {analysis.ageRange}
                </Text>
              </View>
            </View>

            {/* Gauge */}
            <View style={styles.gaugeRow}>
              <StimGauge score={analysis.overallScore} rating={analysis.overallRating} size={170} />
              <View style={styles.ratingBlock}>
                <Text style={styles.ratingEmoji}>{config.emoji}</Text>
                <Text style={[styles.ratingLabel, { color: config.color }]}>{config.label}</Text>
                <Text style={styles.ratingDesc}>{config.description}</Text>
              </View>
            </View>

            <Text style={styles.summary}>{analysis.summary}</Text>
          </View>

          {/* Quick info cards */}
          <View style={styles.quickCards}>
            <InfoCard icon="🕐" label="Best Time" value={analysis.bestTimeToWatch} />
            <InfoCard icon="🚫" label="Avoid Before" value={analysis.avoidBefore} />
          </View>

          {/* Parent tip */}
          <View style={styles.tipBox}>
            <Text style={styles.tipIcon}>💡</Text>
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Parent Tip</Text>
              <Text style={styles.tipText}>{analysis.parentTip}</Text>
            </View>
          </View>

          {/* Stimulation breakdown */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Stimulation Breakdown</Text>
            <View style={styles.card}>
              {metricKeys.map((key, i) => {
                const metric = MetricLabels[key];
                const value = analysis.scores[key];
                return (
                  <ScoreBar
                    key={key}
                    label={metric.label}
                    icon={metric.icon}
                    value={value}
                    lowLabel={metric.low}
                    highLabel={metric.high}
                    inverted={'inverted' in metric ? metric.inverted : false}
                    delay={i * 80}
                  />
                );
              })}
            </View>
          </View>

          {/* Wind-down highlight */}
          <View style={[styles.windDownBox, { backgroundColor: analysis.scores.windDownScore >= 6 ? '#F0EBF8' : '#FEF3EB' }]}>
            <Text style={styles.windDownIcon}>🌙</Text>
            <View style={styles.windDownContent}>
              <Text style={styles.windDownTitle}>Wind-Down Score</Text>
              <Text style={styles.windDownScore}>{analysis.scores.windDownScore}/10</Text>
              <Text style={styles.windDownText}>
                {analysis.scores.windDownScore >= 7
                  ? 'Great choice for calming down before sleep or nap time.'
                  : analysis.scores.windDownScore >= 5
                  ? 'Okay for afternoons, but leave a buffer before sleep.'
                  : 'Avoid within 1–2 hours of sleep — this show can amp toddlers up.'}
              </Text>
            </View>
          </View>

          {/* Similar shows */}
          {analysis.similarShows?.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Similar Shows</Text>
              <Text style={styles.sectionSub}>Based on stimulation level and style</Text>
              {analysis.similarShows.map((show, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.similarCard}
                  onPress={() => handleSimilarShowPress(show.title)}
                  activeOpacity={0.75}
                >
                  <View style={styles.similarLeft}>
                    <Text style={styles.similarTitle}>{show.title}</Text>
                    <Text style={styles.similarReason}>{show.reason}</Text>
                    <Text style={styles.similarAge}>{show.ageRange}</Text>
                  </View>
                  <View style={styles.similarRight}>
                    <ScorePill score={show.overallScore} />
                    <Text style={styles.similarArrow}>→</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Sources */}
          <View style={styles.sourcesRow}>
            <Text style={styles.sourcesLabel}>Sources: </Text>
            <Text style={styles.sourcesText}>{analysis.sources?.join(', ')}</Text>
          </View>

        </Animated.View>
      </ScrollView>
    </View>
  );
}

function InfoCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={infoStyles.card}>
      <Text style={infoStyles.icon}>{icon}</Text>
      <Text style={infoStyles.label}>{label}</Text>
      <Text style={infoStyles.value}>{value}</Text>
    </View>
  );
}

function ScorePill({ score }: { score: number }) {
  let color = Colors.scoreCalm;
  if (score > 7) color = Colors.scoreRed;
  else if (score > 5) color = Colors.scoreHot;
  else if (score > 3) color = Colors.scoreMid;
  return (
    <View style={[pillStyles.pill, { backgroundColor: color + '22', borderColor: color + '55' }]}>
      <Text style={[pillStyles.text, { color }]}>{score}/10</Text>
    </View>
  );
}

const pillStyles = StyleSheet.create({
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  text: { fontSize: 12, fontWeight: '700' },
});

const infoStyles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
  },
  icon: { fontSize: 20 },
  label: { fontSize: 11, color: Colors.textLight, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  value: { fontSize: 13, color: Colors.text, fontWeight: '600', lineHeight: 18 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  topBar: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
  },
  backArrow: { fontSize: 20, color: Colors.textMid },
  backLabel: { fontSize: 16, color: Colors.textMid, fontWeight: '600' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },

  // Hero
  hero: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 12,
  },
  heroTop: { marginBottom: 16 },
  titleBlock: { gap: 4 },
  showTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.7,
    lineHeight: 34,
  },
  meta: { fontSize: 13, color: Colors.textMid },
  gaugeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  ratingBlock: { flex: 1, gap: 4 },
  ratingEmoji: { fontSize: 28 },
  ratingLabel: { fontSize: 20, fontWeight: '800', letterSpacing: -0.4 },
  ratingDesc: { fontSize: 12, color: Colors.textMid, lineHeight: 18 },
  summary: {
    fontSize: 14,
    color: Colors.textMid,
    lineHeight: 22,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 14,
  },

  // Quick cards
  quickCards: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },

  // Tip
  tipBox: {
    flexDirection: 'row',
    backgroundColor: Colors.sagePale,
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.sageLight + '80',
  },
  tipIcon: { fontSize: 22, marginTop: 2 },
  tipContent: { flex: 1, gap: 4 },
  tipTitle: { fontSize: 12, fontWeight: '700', color: Colors.sageDark, textTransform: 'uppercase', letterSpacing: 0.5 },
  tipText: { fontSize: 14, color: Colors.text, lineHeight: 21 },

  // Section
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textLight,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  sectionSub: { fontSize: 12, color: Colors.textLight, marginBottom: 12 },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 8,
  },

  // Wind-down
  windDownBox: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
    gap: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  windDownIcon: { fontSize: 28, marginTop: 2 },
  windDownContent: { flex: 1, gap: 4 },
  windDownTitle: { fontSize: 12, fontWeight: '700', color: Colors.textLight, textTransform: 'uppercase', letterSpacing: 0.5 },
  windDownScore: { fontSize: 22, fontWeight: '800', color: Colors.text },
  windDownText: { fontSize: 13, color: Colors.textMid, lineHeight: 20 },

  // Similar shows
  similarCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  similarLeft: { flex: 1, gap: 3 },
  similarTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
  similarReason: { fontSize: 12, color: Colors.textMid, lineHeight: 18 },
  similarAge: { fontSize: 11, color: Colors.textLight },
  similarRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  similarArrow: { fontSize: 16, color: Colors.textLight },

  // Sources
  sourcesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  sourcesLabel: { fontSize: 11, color: Colors.textLight, fontWeight: '700' },
  sourcesText: { fontSize: 11, color: Colors.textLight, flex: 1 },
});
