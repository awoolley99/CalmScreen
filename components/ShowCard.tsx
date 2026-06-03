import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ShowAnalysis } from '../types';
import { RatingConfig, Colors } from '../utils/constants';

interface ShowCardProps {
  show: ShowAnalysis;
  onPress: () => void;
  compact?: boolean;
}

export function ShowCard({ show, onPress, compact = false }: ShowCardProps) {
  const config = RatingConfig[show.overallRating];

  return (
    <TouchableOpacity style={[styles.card, compact && styles.compact]} onPress={onPress} activeOpacity={0.75}>
      {/* Color stripe */}
      <View style={[styles.stripe, { backgroundColor: config.color }]} />

      <View style={styles.content}>
        <View style={styles.top}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={1}>{show.title}</Text>
            <Text style={styles.type}>{show.type === 'movie' ? '🎬' : '📺'}</Text>
          </View>
          <Text style={styles.ageRange}>{show.ageRange}</Text>
        </View>

        <View style={styles.bottom}>
          <View style={[styles.badge, { backgroundColor: config.bgColor }]}>
            <Text style={styles.badgeEmoji}>{config.emoji}</Text>
            <Text style={[styles.badgeLabel, { color: config.color }]}>{config.label}</Text>
          </View>

          {!compact && (
            <View style={styles.miniScores}>
              <MiniScore icon="⏩" value={show.scores.pace} />
              <MiniScore icon="👁️" value={show.scores.visualIntensity} />
              <MiniScore icon="🔊" value={show.scores.noiseLevel} />
              <MiniScore icon="🌙" value={show.scores.windDownScore} inverted />
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

function MiniScore({ icon, value, inverted = false }: { icon: string; value: number; inverted?: boolean }) {
  const effective = inverted ? 11 - value : value;
  let color = Colors.scoreCalm;
  if (effective > 7) color = Colors.scoreRed;
  else if (effective > 5) color = Colors.scoreHot;
  else if (effective > 3) color = Colors.scoreMid;

  return (
    <View style={miniStyles.container}>
      <Text style={miniStyles.icon}>{icon}</Text>
      <View style={[miniStyles.dot, { backgroundColor: color }]} />
    </View>
  );
}

const miniStyles = StyleSheet.create({
  container: { alignItems: 'center', gap: 2 },
  icon: { fontSize: 10 },
  dot: { width: 6, height: 6, borderRadius: 3 },
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.cardBg,
    borderRadius: 16,
    flexDirection: 'row',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  compact: {
    marginBottom: 8,
  },
  stripe: {
    width: 5,
  },
  content: {
    flex: 1,
    padding: 14,
    gap: 8,
  },
  top: {
    gap: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.3,
  },
  type: {
    fontSize: 14,
  },
  ageRange: {
    fontSize: 12,
    color: Colors.textLight,
  },
  bottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgeEmoji: { fontSize: 12 },
  badgeLabel: { fontSize: 12, fontWeight: '700' },
  miniScores: {
    flexDirection: 'row',
    gap: 10,
  },
});
