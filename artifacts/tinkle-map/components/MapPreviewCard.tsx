import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { TrustBadge } from "@/components/ui/TrustBadge";
import type { Toilet } from "@/types";

interface MapPreviewCardProps {
  toilet: Toilet;
  onPress: () => void;
  onSave?: () => void;
  isSaved?: boolean;
}

export function MapPreviewCard({ toilet, onPress, onSave, isSaved }: MapPreviewCardProps) {
  const colors = useColors();

  const distanceLabel = toilet.distance !== undefined
    ? toilet.distance < 1
      ? `${Math.round(toilet.distance * 1000)}m`
      : `${toilet.distance.toFixed(1)}km`
    : undefined;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderRadius: colors.radius + 4,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={styles.left}>
        <View style={[styles.iconWrap, { backgroundColor: colors.primary + "15", borderRadius: colors.radius }]}>
          <Feather name="map-pin" size={24} color={colors.primary} />
        </View>
      </View>

      <View style={styles.content}>
        <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
          {toilet.name}
        </Text>
        <Text style={[styles.address, { color: colors.mutedForeground }]} numberOfLines={1}>
          {toilet.address}
        </Text>
        <View style={styles.meta}>
          {toilet.is_free ? (
            <Text style={[styles.free, { color: colors.success }]}>Free</Text>
          ) : (
            <Text style={[styles.free, { color: colors.mutedForeground }]}>{`€${toilet.price}`}</Text>
          )}
          {toilet.accessible && (
            <Feather name="user" size={12} color={colors.primary} style={styles.accessibleIcon} />
          )}
          {distanceLabel !== undefined && (
            <Text style={[styles.dist, { color: colors.mutedForeground }]}>
              {distanceLabel}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.right}>
        <TrustBadge score={toilet.overall_trust_score} level={toilet.confidence_level} size="md" />
        {onSave && (
          <TouchableOpacity onPress={onSave} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }} style={styles.saveIcon}>
            <Feather
              name="bookmark"
              size={20}
              color={isSaved ? colors.primary : colors.mutedForeground}
            />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 8,
    gap: 12,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  left: {},
  iconWrap: { width: 48, height: 48, alignItems: "center", justifyContent: "center" },
  content: { flex: 1 },
  name: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  address: { fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 4 },
  meta: { flexDirection: "row", alignItems: "center", gap: 8 },
  free: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  accessibleIcon: {},
  dist: { fontSize: 12, fontFamily: "Inter_400Regular", marginLeft: 4 },
  right: { alignItems: "center" },
  saveIcon: { marginTop: 6 },
});
