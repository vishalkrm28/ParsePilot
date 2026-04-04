import React from "react";
import {
  View, Text, StyleSheet, Platform, ScrollView,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ToiletCard } from "@/components/ToiletCard";
import { router } from "expo-router";

type FeatherIconName = React.ComponentProps<typeof Feather>["name"];

interface EmergencyTip {
  icon: FeatherIconName;
  tip: string;
}

const EMERGENCY_TIPS: EmergencyTip[] = [
  { icon: "navigation", tip: "Look for nearby cafes, hotels, or department stores — they often have accessible toilets." },
  { icon: "map-pin", tip: "Train stations and airports almost always have public facilities." },
  { icon: "shopping-bag", tip: "Major supermarkets and shopping centres frequently have restrooms." },
  { icon: "coffee", tip: "Ask politely at a nearby cafe — most will allow emergency use." },
  { icon: "home", tip: "Public parks often have toilet blocks near main entrances." },
];

export default function EmergencyScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { toilets, userCity } = useApp();

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const botInset = Platform.OS === "web" ? 34 : insets.bottom;

  const nearbyHighRated = toilets
    .filter((t) => t.city === userCity && t.overall_trust_score >= 6)
    .sort((a, b) => b.overall_trust_score - a.overall_trust_score)
    .slice(0, 3);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: botInset + 24 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.header, { paddingTop: topInset + 8, backgroundColor: colors.destructive }]}>
        <Feather name="alert-triangle" size={28} color="#fff" />
        <Text style={styles.headerTitle}>Emergency</Text>
        <Text style={styles.headerSubtitle}>Need a toilet urgently? Here&apos;s what to do.</Text>
      </View>

      <View style={styles.section}>
        <SectionHeader title={`Best Toilets Near ${userCity}`} />
        {nearbyHighRated.map((t) => (
          <ToiletCard
            key={t.id}
            toilet={t}
            onPress={() => router.push({ pathname: "/toilet/[id]", params: { id: t.id } })}
            testID={`emergency-card-${t.id}`}
          />
        ))}
      </View>

      <View style={[styles.tipsCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
        <Text style={[styles.tipsTitle, { color: colors.foreground }]}>Quick Tips</Text>
        {EMERGENCY_TIPS.map((tip, i) => (
          <View key={i} style={styles.tipRow}>
            <View style={[styles.tipIcon, { backgroundColor: colors.primary + "15", borderRadius: 20 }]}>
              <Feather name={tip.icon} size={16} color={colors.primary} />
            </View>
            <Text style={[styles.tipText, { color: colors.foreground }]}>{tip.tip}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 24, paddingBottom: 32, gap: 8, alignItems: "center" },
  headerTitle: { color: "#fff", fontSize: 26, fontFamily: "Inter_700Bold" },
  headerSubtitle: { color: "rgba(255,255,255,0.85)", fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
  section: { marginTop: 20 },
  tipsCard: { margin: 16, padding: 16, borderWidth: 1, gap: 14 },
  tipsTitle: { fontSize: 16, fontFamily: "Inter_700Bold", marginBottom: 4 },
  tipRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  tipIcon: { width: 36, height: 36, alignItems: "center", justifyContent: "center", marginTop: 2 },
  tipText: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
});
