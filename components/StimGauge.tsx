import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Svg, { Path, Circle, G, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Colors, RatingConfig } from '../utils/constants';
import { ShowAnalysis } from '../types';

interface StimGaugeProps {
  score: number;
  rating: ShowAnalysis['overallRating'];
  size?: number;
}

export function StimGauge({ score, rating, size = 160 }: StimGaugeProps) {
  const config = RatingConfig[rating];
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(animValue, {
      toValue: score / 10,
      tension: 60,
      friction: 8,
      useNativeDriver: false,
    }).start();
  }, [score]);

  const cx = size / 2;
  const cy = size / 2 + 10;
  const r = size * 0.38;
  const strokeWidth = size * 0.095;

  // Arc from -210deg to 30deg (240 degree sweep)
  const startAngle = -210;
  const endAngle = 30;
  const totalDegrees = 240;

  function polarToCartesian(angle: number) {
    const rad = (angle * Math.PI) / 180;
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad),
    };
  }

  function describeArc(fromAngle: number, toAngle: number) {
    const start = polarToCartesian(fromAngle);
    const end = polarToCartesian(toAngle);
    const largeArc = toAngle - fromAngle > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
  }

  const needleAngle = startAngle + (score / 10) * totalDegrees;
  const needleEnd = polarToCartesian(needleAngle);
  const needleLength = r * 0.7;
  const needleTip = {
    x: cx + needleLength * Math.cos((needleAngle * Math.PI) / 180),
    y: cy + needleLength * Math.sin((needleAngle * Math.PI) / 180),
  };

  // Segments
  const segments = [
    { from: startAngle, to: startAngle + 72, color: Colors.scoreCalm },
    { from: startAngle + 72, to: startAngle + 144, color: Colors.scoreMid },
    { from: startAngle + 144, to: startAngle + 192, color: Colors.scoreHot },
    { from: startAngle + 192, to: endAngle, color: Colors.scoreRed },
  ];

  return (
    <View style={[styles.container, { width: size, height: size * 0.75 }]}>
      <Svg width={size} height={size * 0.9} viewBox={`0 0 ${size} ${size * 0.85}`}>
        {/* Track */}
        <Path
          d={describeArc(startAngle, endAngle)}
          stroke={Colors.parchment}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
        />

        {/* Colored segments */}
        {segments.map((seg, i) => (
          <Path
            key={i}
            d={describeArc(seg.from, seg.to)}
            stroke={seg.color}
            strokeWidth={strokeWidth * 0.7}
            fill="none"
            opacity={0.35}
          />
        ))}

        {/* Active fill */}
        <Path
          d={describeArc(startAngle, needleAngle)}
          stroke={config.color}
          strokeWidth={strokeWidth * 0.7}
          fill="none"
          strokeLinecap="round"
        />

        {/* Needle */}
        <Path
          d={`M ${cx} ${cy} L ${needleTip.x} ${needleTip.y}`}
          stroke={Colors.text}
          strokeWidth={2.5}
          strokeLinecap="round"
          opacity={0.7}
        />
        <Circle cx={cx} cy={cy} r={6} fill={Colors.text} opacity={0.7} />
        <Circle cx={cx} cy={cy} r={3} fill={Colors.cream} />
      </Svg>

      <View style={styles.scoreContainer}>
        <Text style={[styles.scoreNum, { color: config.color }]}>{score}</Text>
        <Text style={styles.scoreDenom}>/10</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  scoreContainer: {
    position: 'absolute',
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  scoreNum: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -1,
  },
  scoreDenom: {
    fontSize: 16,
    color: Colors.textLight,
    fontWeight: '500',
  },
});
