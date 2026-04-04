import React from "react";
import { View, ActivityIndicator, Text, StyleSheet, ViewStyle, DimensionValue } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming } from "react-native-reanimated";
import { useColors } from "@/hooks/useColors";

interface LoadingStateProps {
  message?: string;
  style?: ViewStyle;
}

export function LoadingState({ message, style }: LoadingStateProps) {
  const colors = useColors();

  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator color={colors.primary} size="large" />
      {message && (
        <Text style={[styles.message, { color: colors.mutedForeground }]}>{message}</Text>
      )}
    </View>
  );
}

interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width = "100%", height = 16, borderRadius = 8, style }: SkeletonProps) {
  const colors = useColors();
  const opacity = useSharedValue(1);

  React.useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.4, { duration: 800 }),
      -1,
      true
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        { width, height, borderRadius, backgroundColor: colors.muted },
        animStyle,
        style,
      ]}
    />
  );
}

export function SkeletonCard({ style }: { style?: ViewStyle }) {
  const colors = useColors();
  return (
    <View style={[styles.skeletonCard, { backgroundColor: colors.card, borderRadius: 16 }, style]}>
      <View style={styles.skeletonRow}>
        <Skeleton width={40} height={40} borderRadius={20} />
        <View style={styles.skeletonContent}>
          <Skeleton width="60%" height={14} />
          <Skeleton width="40%" height={12} style={{ marginTop: 6 }} />
        </View>
        <Skeleton width={44} height={44} borderRadius={10} />
      </View>
      <Skeleton width="100%" height={6} style={{ marginTop: 12 }} borderRadius={4} />
      <View style={[styles.skeletonTags, { marginTop: 10 }]}>
        <Skeleton width={60} height={24} borderRadius={12} />
        <Skeleton width={80} height={24} borderRadius={12} style={{ marginLeft: 8 }} />
        <Skeleton width={50} height={24} borderRadius={12} style={{ marginLeft: 8 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  message: { fontSize: 14, fontFamily: "Inter_400Regular" },
  skeletonCard: { padding: 16, margin: 8 },
  skeletonRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  skeletonContent: { flex: 1, gap: 6 },
  skeletonTags: { flexDirection: "row" },
});
