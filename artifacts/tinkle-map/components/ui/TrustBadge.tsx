import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { useColors } from "@/hooks/useColors";
import type { ConfidenceLevel } from "@/types";

interface TrustBadgeProps {
  score: number;
  level: ConfidenceLevel;
  size?: "sm" | "md" | "lg";
  style?: ViewStyle;
}

export function TrustBadge({ score, level, size = "md", style }: TrustBadgeProps) {
  const colors = useColors();

  const bgColor =
    level === "High" ? colors.trustHigh :
    level === "Medium" ? colors.trustMedium :
    colors.trustLow;

  const sizeStyles = {
    sm: { container: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }, score: { fontSize: 12 }, label: { fontSize: 10 } },
    md: { container: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 }, score: { fontSize: 14 }, label: { fontSize: 11 } },
    lg: { container: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12 }, score: { fontSize: 18 }, label: { fontSize: 12 } },
  }[size];

  return (
    <View style={[styles.container, { backgroundColor: bgColor }, sizeStyles.container, style]}>
      <Text style={[styles.score, { color: "#fff" }, sizeStyles.score]}>
        {score.toFixed(1)}
      </Text>
      <Text style={[styles.label, { color: "rgba(255,255,255,0.85)" }, sizeStyles.label]}>
        {level}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  score: {
    fontFamily: "Inter_700Bold",
    lineHeight: 20,
  },
  label: {
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    lineHeight: 14,
  },
});
