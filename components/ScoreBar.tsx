import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Colors } from '../utils/constants';

interface ScoreBarProps {
  label: string;
  icon: string;
  value: number;
  lowLabel: string;
  highLabel: string;
  inverted?: boolean;
  delay?: number;
}

function getBarColor(value: number, inverted: boolean): string {
  const effective = inverted ? 11 - value : value;
  if (effective <= 3) return Colors.scoreCalm;
  if (effective <= 5) return Colors.scoreMid;
  if (effective <= 7) return Colors.scoreHot;
  return Colors.scoreRed;
}

export function ScoreBar({ label, icon, value, lowLabel, highLabel, inverted = false, delay = 0 }: ScoreBarProps) {
  const animWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animWidth, {
      toValue: value / 10,
      duration: 700,
      delay,
      useNativeDriver: false,
    }).start();
  }, [value]);

  const color = inverted ? Colors.windDown : getBarColor(value, false);
  const effectiveScore = inverted ? 11 - value : value;
  const displayColor = inverted ? Colors.windDown : getBarColor(value, false);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.icon}>{icon}</Text>
        <Text style={styles.label}>{label}</Text>
        <View style={[styles.badge, { backgroundColor: displayColor + '22', borderColor: displayColor + '44' }]}>
          <Text style={[styles.badgeText, { color: displayColor }]}>{value}/10</Text>
        </View>
      </View>
      <View style={styles.track}>
        <Animated.View
          style={[
            styles.fill,
            {
              backgroundColor: displayColor,
              width: animWidth.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>
      <View style={styles.labels}>
        <Text style={styles.rangeLabel}>{lowLabel}</Text>
        <Text style={styles.rangeLabel}>{highLabel}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 18,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  icon: {
    fontSize: 16,
  },
  label: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    letterSpacing: -0.2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  track: {
    height: 10,
    backgroundColor: Colors.parchment,
    borderRadius: 6,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 6,
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  rangeLabel: {
    fontSize: 10,
    color: Colors.textLight,
    letterSpacing: 0.2,
  },
});
