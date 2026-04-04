import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { TrustBadge } from "@/components/ui/TrustBadge";
import type { Toilet } from "@/types";

interface ToiletCardProps {
  toilet: Toilet;
  onPress: () => void;
  onSave?: () => void;
  isSaved?: boolean;
  testID?: string;
}

export function ToiletCard({ toilet, onPress, onSave, isSaved, testID }: ToiletCardProps) {
  const colors = useColors();

  const handleSave = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSave?.();
  };

  const topTags = toilet.tags?.slice(0, 3) ?? [];
  const trustPct = toilet.overall_trust_score / 10;
  const barColor =
    trustPct >= 0.7 ? colors.trustHigh :
    trustPct >= 0.4 ? colors.trustMedium :
    colors.trustLow;

  const distanceLabel = toilet.distance !== undefined
    ? toilet.distance < 1
      ? `${Math.round(toilet.distance * 1000)}m`
      : `${toilet.distance.toFixed(1)}km`
    : undefined;

  return (
    <TouchableOpacity
      testID={testID}
      onPress={onPress}
      activeOpacity={0.85}
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderRadius: colors.radius,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.titleWrap}>
          <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
            {toilet.name}
          </Text>
          <View style={styles.meta}>
            <Feather name="map-pin" size={12} color={colors.mutedForeground} />
            <Text style={[styles.metaText, { color: colors.mutedForeground }]} numberOfLines={1}>
              {toilet.address}
            </Text>
          </View>
        </View>

        <View style={styles.right}>
          <TrustBadge score={toilet.overall_trust_score} level={toilet.confidence_level} size="sm" />
          {onSave && (
            <TouchableOpacity onPress={handleSave} style={styles.saveBtn} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
              <Feather
                name="bookmark"
                size={20}
                color={isSaved ? colors.primary : colors.mutedForeground}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.pills}>
        {toilet.is_free ? (
          <View style={[styles.pill, { backgroundColor: colors.success + "20" }]}>
            <Text style={[styles.pillText, { color: colors.success }]}>Free</Text>
          </View>
        ) : (
          <View style={[styles.pill, { backgroundColor: colors.muted }]}>
            <Text style={[styles.pillText, { color: colors.mutedForeground }]}>
              {toilet.price ? `€${toilet.price}` : "Paid"}
            </Text>
          </View>
        )}
        {toilet.accessible && (
          <View style={[styles.pill, { backgroundColor: colors.primary + "20" }]}>
            <Feather name="user" size={10} color={colors.primary} />
          </View>
        )}
        {toilet.has_baby_change && (
          <View style={[styles.pill, { backgroundColor: colors.primary + "20" }]}>
            <Text style={[styles.pillText, { color: colors.primary }]}>Baby</Text>
          </View>
        )}
        {topTags.slice(0, 2).map((tag) => (
          <View key={tag.id} style={[styles.pill, { backgroundColor: colors.muted }]}>
            <Text style={[styles.pillText, { color: colors.mutedForeground }]}>{tag.tag}</Text>
          </View>
        ))}
        {distanceLabel !== undefined && (
          <View style={[styles.pill, styles.pillRight, { backgroundColor: colors.muted }]}>
            <Text style={[styles.pillText, { color: colors.mutedForeground }]}>
              {distanceLabel}
            </Text>
          </View>
        )}
      </View>

      <View style={[styles.bar, { backgroundColor: colors.muted }]}>
        <View
          style={[
            styles.barFill,
            {
              width: `${trustPct * 100}%`,
              backgroundColor: barColor,
            },
          ]}
        />
      </View>

      <View style={styles.footer}>
        <Text style={[styles.reviewCount, { color: colors.mutedForeground }]}>
          {toilet.review_count} {toilet.review_count === 1 ? "review" : "reviews"}
        </Text>
        {toilet.is_verified && (
          <View style={styles.verifiedRow}>
            <Feather name="check-circle" size={12} color={colors.primary} />
            <Text style={[styles.verified, { color: colors.primary }]}>Verified</Text>
          </View>
        )}
        {toilet.opening_hours && (
          <Text style={[styles.hours, { color: colors.mutedForeground }]}>
            {toilet.opening_hours}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 14,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  header: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  titleWrap: { flex: 1 },
  name: { fontSize: 15, fontFamily: "Inter_600SemiBold", marginBottom: 3 },
  meta: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 12, fontFamily: "Inter_400Regular", flex: 1 },
  right: { alignItems: "flex-end", gap: 6 },
  saveBtn: { padding: 2 },
  pills: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 6, marginTop: 10 },
  pill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, flexDirection: "row", alignItems: "center", gap: 3 },
  pillRight: { marginLeft: "auto" },
  pillText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  bar: { height: 4, borderRadius: 2, marginTop: 10, overflow: "hidden" },
  barFill: { height: 4, borderRadius: 2 },
  footer: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 8 },
  reviewCount: { fontSize: 12, fontFamily: "Inter_400Regular" },
  verifiedRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  verified: { fontSize: 12, fontFamily: "Inter_500Medium" },
  hours: { fontSize: 12, fontFamily: "Inter_400Regular" },
});
