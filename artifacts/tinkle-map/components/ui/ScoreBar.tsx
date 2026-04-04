import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { useColors } from "@/hooks/useColors";

interface ScoreBarProps {
  label: string;
  score: number;
  maxScore?: number;
  style?: ViewStyle;
}

export function ScoreBar({ label, score, maxScore = 10, style }: ScoreBarProps) {
  const colors = useColors();
  const pct = Math.min(1, score / maxScore);
  const barColor = pct >= 0.7 ? colors.trustHigh : pct >= 0.4 ? colors.trustMedium : colors.trustLow;

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <Text style={[styles.label, { color: colors.mutedForeground }]}>{label}</Text>
        <Text style={[styles.score, { color: colors.foreground }]}>{score.toFixed(1)}</Text>
      </View>
      <View style={[styles.track, { backgroundColor: colors.muted, borderRadius: 4 }]}>
        <View style={[styles.fill, { width: `${pct * 100}%`, backgroundColor: barColor, borderRadius: 4 }]} />
      </View>
    </View>
  );
}

interface ScorePillProps {
  score: number;
  maxScore?: number;
  style?: ViewStyle;
}

export function ScorePill({ score, maxScore = 10, style }: ScorePillProps) {
  const colors = useColors();
  const pct = score / maxScore;
  const bgColor = pct >= 0.7 ? colors.trustHigh : pct >= 0.4 ? colors.trustMedium : colors.trustLow;

  return (
    <View style={[styles.pill, { backgroundColor: bgColor }, style]}>
      <Text style={styles.pillText}>{score.toFixed(1)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 10 },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  label: { fontSize: 13, fontFamily: "Inter_400Regular" },
  score: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  track: { height: 6 },
  fill: { height: 6 },
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  pillText: { color: "#fff", fontSize: 12, fontFamily: "Inter_700Bold" },
});
