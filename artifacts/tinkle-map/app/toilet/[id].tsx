import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, ScrollView, Platform,
  TouchableOpacity, Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import { TrustBadge } from "@/components/ui/TrustBadge";
import { ScoreBar } from "@/components/ui/ScoreBar";
import { FilterChip } from "@/components/ui/FilterChip";
import { ReviewCard } from "@/components/ReviewCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { LoadingState } from "@/components/ui/LoadingState";
import type { Toilet } from "@/types";

export default function ToiletDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { toilets, toggleSave, isSaved } = useApp();

  const toilet = toilets.find((t) => t.id === id);

  if (!toilet) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <LoadingState message="Loading..." />
      </View>
    );
  }

  const saved = isSaved(toilet.id);
  const botInset = Platform.OS === "web" ? 34 : insets.bottom;

  const handleSave = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleSave(toilet.id);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: botInset + 100 }}
      >
        <View style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.heroTop}>
            <View style={styles.heroInfo}>
              <Text style={[styles.name, { color: colors.foreground }]}>{toilet.name}</Text>
              <View style={styles.addressRow}>
                <Feather name="map-pin" size={13} color={colors.mutedForeground} />
                <Text style={[styles.address, { color: colors.mutedForeground }]}>{toilet.address}</Text>
              </View>
              <Text style={[styles.city, { color: colors.mutedForeground }]}>{toilet.city}, {toilet.country}</Text>
            </View>
            <TrustBadge score={toilet.overall_trust_score} level={toilet.confidence_level} size="lg" />
          </View>

          <View style={styles.chips}>
            {toilet.is_free ? (
              <FilterChip label="Free Entry" selected onPress={() => {}} />
            ) : (
              <FilterChip label={`€${toilet.price}`} selected={false} onPress={() => {}} />
            )}
            {toilet.accessible && <FilterChip label="Accessible" selected onPress={() => {}} />}
            {toilet.has_baby_change && <FilterChip label="Baby Change" selected onPress={() => {}} />}
            {toilet.has_shower && <FilterChip label="Shower" selected onPress={() => {}} />}
            {toilet.requires_key && <FilterChip label="Key Required" selected={false} onPress={() => {}} />}
          </View>

          {toilet.opening_hours && (
            <View style={styles.hoursRow}>
              <Feather name="clock" size={14} color={colors.mutedForeground} />
              <Text style={[styles.hours, { color: colors.mutedForeground }]}>{toilet.opening_hours}</Text>
            </View>
          )}

          {toilet.is_verified && (
            <View style={styles.verifiedRow}>
              <Feather name="check-circle" size={14} color={colors.primary} />
              <Text style={[styles.verified, { color: colors.primary }]}>Verified location</Text>
            </View>
          )}
        </View>

        <View style={[styles.scoresCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.scoresTitle, { color: colors.foreground }]}>Scores</Text>
          <ScoreBar label="Cleanliness" score={toilet.cleanliness_avg} />
          <ScoreBar label="Accessibility" score={toilet.accessibility_avg} />
          <ScoreBar label="Safety" score={toilet.safety_avg} />
          <ScoreBar label="Facilities" score={toilet.facilities_avg} />
        </View>

        {toilet.tags && toilet.tags.length > 0 && (
          <View style={[styles.tagsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.scoresTitle, { color: colors.foreground }]}>Tags</Text>
            <View style={styles.tagsRow}>
              {toilet.tags.map((tag) => (
                <View key={tag.id} style={[styles.tag, { backgroundColor: colors.muted, borderRadius: 20 }]}>
                  <Text style={[styles.tagText, { color: colors.mutedForeground }]}>{tag.tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.reviewsSection}>
          <View style={styles.reviewsHeader}>
            <Text style={[styles.scoresTitle, { color: colors.foreground }]}>
              Reviews ({toilet.review_count})
            </Text>
          </View>
          {(!toilet.reviews || toilet.reviews.length === 0) ? (
            <EmptyState
              icon="message-circle"
              title="No reviews yet"
              description="Be the first to review this toilet."
              style={{ paddingVertical: 32 }}
            />
          ) : (
            toilet.reviews.map((r) => <ReviewCard key={r.id} review={r} />)
          )}
        </View>
      </ScrollView>

      <View style={[
        styles.footer,
        {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          paddingBottom: botInset + 12,
        },
      ]}>
        <TouchableOpacity
          onPress={handleSave}
          style={[
            styles.saveBtn,
            { borderColor: saved ? colors.primary : colors.border, borderRadius: colors.radius },
          ]}
        >
          <Feather name="bookmark" size={20} color={saved ? colors.primary : colors.mutedForeground} />
        </TouchableOpacity>
        <PrimaryButton
          label="Add Review"
          onPress={() => router.push({ pathname: "/add-review", params: { id: toilet.id } })}
          style={{ flex: 1 }}
          testID="add-review-btn"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  heroCard: { margin: 16, padding: 16, borderRadius: 16, borderWidth: 1 },
  heroTop: { flexDirection: "row", gap: 12, marginBottom: 12 },
  heroInfo: { flex: 1 },
  name: { fontSize: 18, fontFamily: "Inter_700Bold", marginBottom: 4 },
  addressRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 2 },
  address: { fontSize: 13, fontFamily: "Inter_400Regular", flex: 1 },
  city: { fontSize: 13, fontFamily: "Inter_400Regular" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 4 },
  hoursRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10 },
  hours: { fontSize: 13, fontFamily: "Inter_400Regular" },
  verifiedRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 },
  verified: { fontSize: 13, fontFamily: "Inter_500Medium" },
  scoresCard: { marginHorizontal: 16, marginBottom: 12, padding: 16, borderRadius: 16, borderWidth: 1 },
  scoresTitle: { fontSize: 16, fontFamily: "Inter_700Bold", marginBottom: 12 },
  tagsCard: { marginHorizontal: 16, marginBottom: 12, padding: 16, borderRadius: 16, borderWidth: 1 },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tag: { paddingHorizontal: 12, paddingVertical: 6 },
  tagText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  reviewsSection: { marginBottom: 16 },
  reviewsHeader: { paddingHorizontal: 16, paddingVertical: 8 },
  footer: {
    flexDirection: "row", gap: 12, paddingHorizontal: 16, paddingTop: 12,
    borderTopWidth: 1,
  },
  saveBtn: {
    width: 52, height: 52, alignItems: "center", justifyContent: "center",
    borderWidth: 1.5,
  },
});
