import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ShowAnalysis } from '../types';
import { RatingConfig } from '../utils/constants';

interface RatingBadgeProps {
  rating: ShowAnalysis['overallRating'];
  size?: 'sm' | 'md' | 'lg';
}

export function RatingBadge({ rating, size = 'md' }: RatingBadgeProps) {
  const config = RatingConfig[rating];

  return (
    <View style={[styles.badge, { backgroundColor: config.bgColor }, styles[`badge_${size}`]]}>
      <Text style={[styles.emoji, styles[`emoji_${size}`]]}>{config.emoji}</Text>
      <View>
        <Text style={[styles.label, styles[`label_${size}`], { color: config.color }]}>
          {config.label}
        </Text>
        {size === 'lg' && (
          <Text style={[styles.description, { color: config.color + 'CC' }]}>
            {config.description}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    gap: 6,
  },
  badge_sm: { paddingHorizontal: 8, paddingVertical: 4 },
  badge_md: { paddingHorizontal: 12, paddingVertical: 6 },
  badge_lg: { paddingHorizontal: 16, paddingVertical: 10 },
  emoji: {},
  emoji_sm: { fontSize: 12 },
  emoji_md: { fontSize: 16 },
  emoji_lg: { fontSize: 22 },
  label: {},
  label_sm: { fontSize: 11, fontWeight: '700' },
  label_md: { fontSize: 13, fontWeight: '700' },
  label_lg: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  description: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
});
