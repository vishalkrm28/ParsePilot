import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, Platform,
  TextInput, Alert,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { addReview } from "@/services/storage";

interface SliderProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
}

function RatingSlider({ label, value, onChange }: SliderProps) {
  const colors = useColors();
  const steps = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  return (
    <View style={styles.sliderWrap}>
      <View style={styles.sliderHeader}>
        <Text style={[styles.sliderLabel, { color: colors.foreground }]}>{label}</Text>
        <Text style={[styles.sliderValue, { color: colors.primary }]}>{value.toFixed(0)}/10</Text>
      </View>
      <View style={styles.steps}>
        {steps.map((s) => (
          <View key={s} style={styles.stepWrap} onTouchEnd={() => { Haptics.selectionAsync(); onChange(s); }}>
            <View
              style={[
                styles.step,
                {
                  backgroundColor: s <= value ? colors.primary : colors.muted,
                  borderRadius: 3,
                },
              ]}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

export default function AddReviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { toilets, refreshData } = useApp();

  const toilet = toilets.find((t) => t.id === id);

  const [cleanliness, setCleanliness] = useState(7);
  const [accessibility, setAccessibility] = useState(7);
  const [safety, setSafety] = useState(7);
  const [facilities, setFacilities] = useState(7);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const botInset = Platform.OS === "web" ? 34 : insets.bottom;

  const handleSubmit = async () => {
    if (!id) return;
    setSubmitting(true);
    try {
      await addReview({
        toilet_id: id,
        cleanliness_score: cleanliness,
        accessibility_score: accessibility,
        safety_score: safety,
        facilities_score: facilities,
        overall_score: (cleanliness + accessibility + safety + facilities) / 4,
        comment: comment.trim() || undefined,
      });
      await refreshData();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (e) {
      Alert.alert("Error", "Failed to submit review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: botInset + 100 }}
      >
        {toilet && (
          <View style={[styles.toiletInfo, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
            <Text style={[styles.toiletName, { color: colors.foreground }]}>{toilet.name}</Text>
            <Text style={[styles.toiletAddr, { color: colors.mutedForeground }]}>{toilet.address}</Text>
          </View>
        )}

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Rate your visit</Text>

        <View style={[styles.ratingsCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          <RatingSlider label="Cleanliness" value={cleanliness} onChange={setCleanliness} />
          <RatingSlider label="Accessibility" value={accessibility} onChange={setAccessibility} />
          <RatingSlider label="Safety" value={safety} onChange={setSafety} />
          <RatingSlider label="Facilities" value={facilities} onChange={setFacilities} />
        </View>

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Comment (optional)</Text>
        <TextInput
          value={comment}
          onChangeText={setComment}
          placeholder="Share your experience..."
          placeholderTextColor={colors.mutedForeground}
          multiline
          numberOfLines={4}
          style={[
            styles.commentInput,
            {
              color: colors.foreground,
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: colors.radius,
            },
          ]}
        />
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: botInset + 12 }]}>
        <PrimaryButton
          label="Submit Review"
          onPress={handleSubmit}
          loading={submitting}
          testID="submit-review-btn"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  toiletInfo: { padding: 14, marginBottom: 20, borderWidth: 1 },
  toiletName: { fontSize: 16, fontFamily: "Inter_600SemiBold", marginBottom: 4 },
  toiletAddr: { fontSize: 13, fontFamily: "Inter_400Regular" },
  sectionTitle: { fontSize: 16, fontFamily: "Inter_700Bold", marginBottom: 10 },
  ratingsCard: { padding: 16, borderWidth: 1, marginBottom: 20 },
  sliderWrap: { marginBottom: 16 },
  sliderHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  sliderLabel: { fontSize: 14, fontFamily: "Inter_500Medium" },
  sliderValue: { fontSize: 14, fontFamily: "Inter_700Bold" },
  steps: { flexDirection: "row", gap: 3 },
  stepWrap: { flex: 1, height: 24, justifyContent: "flex-end" },
  step: { height: 24 },
  commentInput: {
    borderWidth: 1, padding: 14, fontSize: 15, fontFamily: "Inter_400Regular",
    minHeight: 100, textAlignVertical: "top",
  },
  footer: { paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1 },
});
