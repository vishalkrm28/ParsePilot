import React from "react";
import { View, Text, StyleSheet, Platform, ScrollView, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import { ToiletCard } from "@/components/ToiletCard";

type FeatherIconName = React.ComponentProps<typeof Feather>["name"];

interface QuickTip {
  icon: FeatherIconName;
  tip: string;
}

const TIPS: QuickTip[] = [
  { icon: "navigation", tip: "Head to the nearest hotel lobby — they almost always have accessible toilets." },
  { icon: "coffee", tip: "Ask a nearby cafe politely — most will accommodate emergencies." },
  { icon: "shopping-bag", tip: "Department stores and supermarkets typically have public facilities." },
  { icon: "map-pin", tip: "Train and bus stations are reliable spots to look." },
  { icon: "home", tip: "Public libraries have restrooms that are open to all." },
];

export default function EmergencyModal() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { toilets, userCity, toggleSave, isSaved } = useApp();

  const botInset = Platform.OS === "web" ? 34 : insets.bottom;

  const best = toilets
    .filter((t) => t.city === userCity && t.overall_trust_score >= 6)
    .sort((a, b) => b.overall_trust_score - a.overall_trust_score)
    .slice(0, 3);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.banner, { backgroundColor: colors.destructive }]}>
        <Feather name="alert-triangle" size={24} color="#fff" />
        <View style={styles.bannerText}>
          <Text style={styles.bannerTitle}>Need a toilet now?</Text>
          <Text style={styles.bannerSub}>Best-rated options in {userCity}</Text>
        </View>
        <TouchableOpacity onPress={() => router.back()} style={styles.close}>
          <Feather name="x" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: botInset + 24 }}>
        {best.map((t) => (
          <ToiletCard
            key={t.id}
            toilet={t}
            onPress={() => {
              router.back();
              router.push({ pathname: "/toilet/[id]", params: { id: t.id } });
            }}
            onSave={() => toggleSave(t.id)}
            isSaved={isSaved(t.id)}
            testID={`emergency-modal-card-${t.id}`}
          />
        ))}

        <View style={[styles.tipsSection, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius, margin: 16 }]}>
          <Text style={[styles.tipsTitle, { color: colors.foreground }]}>Quick tips</Text>
          {TIPS.map((tip, i) => (
            <View key={i} style={styles.tipRow}>
              <View style={[styles.tipIcon, { backgroundColor: colors.destructive + "15", borderRadius: 18 }]}>
                <Feather name={tip.icon} size={14} color={colors.destructive} />
              </View>
              <Text style={[styles.tipText, { color: colors.foreground }]}>{tip.tip}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  banner: {
    flexDirection: "row", alignItems: "center", gap: 12, padding: 20, paddingTop: 48,
  },
  bannerText: { flex: 1 },
  bannerTitle: { color: "#fff", fontSize: 17, fontFamily: "Inter_700Bold" },
  bannerSub: { color: "rgba(255,255,255,0.8)", fontSize: 13, fontFamily: "Inter_400Regular" },
  close: {},
  tipsSection: { padding: 16, borderWidth: 1, gap: 12 },
  tipsTitle: { fontSize: 15, fontFamily: "Inter_700Bold", marginBottom: 4 },
  tipRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  tipIcon: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  tipText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
});
