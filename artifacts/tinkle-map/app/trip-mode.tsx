import React, { useState } from "react";
import { View, Text, StyleSheet, Platform, ScrollView, TextInput, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import { ToiletCard } from "@/components/ToiletCard";
import { FilterChip } from "@/components/ui/FilterChip";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { router } from "expo-router";

const CITIES = ["London", "Amsterdam", "Barcelona", "Paris", "New York"];

export default function TripModeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { toilets, userCity, setUserCity, toggleSave, isSaved } = useApp();

  const [selectedCities, setSelectedCities] = useState<string[]>([userCity]);

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const botInset = Platform.OS === "web" ? 34 : insets.bottom;

  const toggleCity = (city: string) => {
    setSelectedCities((prev) =>
      prev.includes(city) ? prev.filter((c) => c !== city) : [...prev, city]
    );
  };

  const tripToilets = toilets
    .filter((t) => selectedCities.includes(t.city) && t.overall_trust_score >= 7)
    .sort((a, b) => b.overall_trust_score - a.overall_trust_score);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topInset + 8, backgroundColor: colors.primary }]}>
        <Text style={styles.title}>Trip Mode</Text>
        <Text style={styles.subtitle}>Plan your city visits with the best toilets</Text>
      </View>

      <View style={styles.citySection}>
        <Text style={[styles.cityLabel, { color: colors.mutedForeground }]}>Select cities on your trip</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cityRow}>
          {CITIES.map((city) => (
            <FilterChip
              key={city}
              label={city}
              selected={selectedCities.includes(city)}
              onPress={() => toggleCity(city)}
            />
          ))}
        </ScrollView>
      </View>

      {tripToilets.length === 0 ? (
        <EmptyState
          icon="map"
          title="Select some cities"
          description="Choose which cities you're visiting to see the best-rated toilets."
        />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: botInset + 24 }}
        >
          <SectionHeader
            title={`${tripToilets.length} top-rated spots`}
            style={{ paddingVertical: 12 }}
          />
          {tripToilets.map((t) => (
            <ToiletCard
              key={t.id}
              toilet={t}
              onPress={() => router.push({ pathname: "/toilet/[id]", params: { id: t.id } })}
              onSave={() => toggleSave(t.id)}
              isSaved={isSaved(t.id)}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 24, paddingBottom: 32 },
  title: { color: "#fff", fontSize: 24, fontFamily: "Inter_700Bold" },
  subtitle: { color: "rgba(255,255,255,0.8)", fontSize: 14, fontFamily: "Inter_400Regular", marginTop: 4 },
  citySection: { padding: 16 },
  cityLabel: { fontSize: 13, fontFamily: "Inter_500Medium", marginBottom: 10, letterSpacing: 0.5 },
  cityRow: { paddingBottom: 4 },
});
