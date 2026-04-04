import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { ScoreBar } from "@/components/ui/ScoreBar";
import type { ToiletReview } from "@/types";

interface ReviewCardProps {
  review: ToiletReview;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function ReviewCard({ review }: ReviewCardProps) {
  const colors = useColors();

  return (
    <View
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
        <View style={[styles.avatar, { backgroundColor: colors.primary + "20" }]}>
          <Feather name="user" size={16} color={colors.primary} />
        </View>
        <View style={styles.meta}>
          <Text style={[styles.author, { color: colors.foreground }]}>
            {review.user?.username ?? "Anonymous"}
          </Text>
          <Text style={[styles.date, { color: colors.mutedForeground }]}>
            {formatDate(review.created_at)}
          </Text>
        </View>
        <View style={[styles.overallBadge, { backgroundColor: colors.primary + "15" }]}>
          <Text style={[styles.overallText, { color: colors.primary }]}>
            {review.overall_score.toFixed(1)}
          </Text>
        </View>
      </View>

      {review.comment && (
        <Text style={[styles.comment, { color: colors.foreground }]}>{review.comment}</Text>
      )}

      <View style={styles.scores}>
        <ScoreBar label="Cleanliness" score={review.cleanliness_score} />
        <ScoreBar label="Accessibility" score={review.accessibility_score} />
        <ScoreBar label="Safety" score={review.safety_score} />
        <ScoreBar label="Facilities" score={review.facilities_score} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 14,
    marginHorizontal: 16,
    marginVertical: 6,
    borderWidth: 1,
  },
  header: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  meta: { flex: 1 },
  author: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  date: { fontSize: 12, fontFamily: "Inter_400Regular" },
  overallBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  overallText: { fontSize: 14, fontFamily: "Inter_700Bold" },
  comment: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20, marginBottom: 12 },
  scores: { gap: 2 },
});
