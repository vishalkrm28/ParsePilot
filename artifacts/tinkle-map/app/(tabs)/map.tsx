import React, { useState } from "react";
import {
  View, Text, StyleSheet, FlatList, TextInput,
  Platform, TouchableOpacity, ScrollView,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import { ToiletCard } from "@/components/ToiletCard";
import { FilterChip } from "@/components/ui/FilterChip";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonCard } from "@/components/ui/LoadingState";
import { FloatingEmergencyButton } from "@/components/ui/FloatingEmergencyButton";
import type { ToiletFilter } from "@/types";

const CITIES = ["London", "Amsterdam", "Barcelona", "Paris", "New York"];

type BooleanFilterKey = Extract<keyof ToiletFilter, "isFree" | "accessible" | "hasBabyChange" | "hasShower">;

interface FilterOption {
  key: BooleanFilterKey;
  label: string;
}

const FILTER_OPTIONS: FilterOption[] = [
  { key: "isFree", label: "Free" },
  { key: "accessible", label: "Accessible" },
  { key: "hasBabyChange", label: "Baby Change" },
  { key: "hasShower", label: "Shower" },
];

export default function MapScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { toilets, isLoading, filters, setFilters, sortOption, setSortOption, userCity, setUserCity, toggleSave, isSaved } = useApp();

  const [search, setSearch] = useState("");
  const [showCityPicker, setShowCityPicker] = useState(false);

  const filtered = toilets.filter((t) => {
    if (t.city !== userCity) return false;
    if (search && !t.name.toLowerCase().includes(search.toLowerCase()) && !t.address.toLowerCase().includes(search.toLowerCase())) return false;
    if (filters.isFree && !t.is_free) return false;
    if (filters.accessible && !t.accessible) return false;
    if (filters.hasBabyChange && !t.has_baby_change) return false;
    if (filters.hasShower && !t.has_shower) return false;
    return true;
  }).sort((a, b) => {
    if (sortOption === "rating") return b.overall_trust_score - a.overall_trust_score;
    if (sortOption === "trust") {
      const order = { High: 0, Medium: 1, Low: 2 };
      return order[a.confidence_level] - order[b.confidence_level];
    }
    if (sortOption === "newest") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    return 0;
  });

  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const toggleFilter = (key: BooleanFilterKey) => {
    const next: ToiletFilter = { ...filters };
    if (next[key]) {
      delete next[key];
    } else {
      next[key] = true;
    }
    setFilters(next);
  };

  const renderSkeleton = () => (
    <>
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topInset + 8, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => setShowCityPicker(!showCityPicker)} style={styles.cityRow}>
          <Feather name="map-pin" size={16} color={colors.primary} />
          <Text style={[styles.cityLabel, { color: colors.foreground }]}>{userCity}</Text>
          <Feather name={showCityPicker ? "chevron-up" : "chevron-down"} size={16} color={colors.mutedForeground} />
        </TouchableOpacity>

        <View style={[styles.searchBar, { backgroundColor: colors.muted, borderRadius: colors.radius }]}>
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search toilets..."
            placeholderTextColor={colors.mutedForeground}
            style={[styles.searchInput, { color: colors.foreground }]}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Feather name="x" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {showCityPicker && (
        <View style={[styles.cityPicker, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {CITIES.map((city) => (
            <TouchableOpacity
              key={city}
              onPress={() => { setUserCity(city); setShowCityPicker(false); }}
              style={[styles.cityOption, city === userCity && { backgroundColor: colors.primary + "15" }]}
            >
              <Text style={[styles.cityOptionText, { color: city === userCity ? colors.primary : colors.foreground }]}>
                {city}
              </Text>
              {city === userCity && <Feather name="check" size={16} color={colors.primary} />}
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={styles.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <FilterChip
            label="Nearest"
            selected={sortOption === "distance"}
            onPress={() => setSortOption("distance")}
          />
          <FilterChip
            label="Best Rated"
            selected={sortOption === "rating"}
            onPress={() => setSortOption("rating")}
          />
          {FILTER_OPTIONS.map((fo) => (
            <FilterChip
              key={fo.key}
              label={fo.label}
              selected={!!filters[fo.key]}
              onPress={() => toggleFilter(fo.key)}
            />
          ))}
        </ScrollView>
      </View>

      {isLoading ? (
        <FlatList
          data={[1, 2, 3]}
          keyExtractor={(i) => String(i)}
          renderItem={renderSkeleton}
          contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 90 }}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="map-pin"
          title="No toilets found"
          description="Try changing your filters or searching in a different area."
          action="Clear filters"
          onAction={() => { setFilters({}); setSearch(""); }}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(t) => t.id}
          renderItem={({ item }) => (
            <ToiletCard
              toilet={item}
              onPress={() => router.push({ pathname: "/toilet/[id]", params: { id: item.id } })}
              onSave={() => toggleSave(item.id)}
              isSaved={isSaved(item.id)}
              testID={`toilet-card-${item.id}`}
            />
          )}
          contentContainerStyle={{ paddingVertical: 8, paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 90 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      <FloatingEmergencyButton onPress={() => router.push("/emergency")} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 10, borderBottomWidth: 1 },
  cityRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 },
  cityLabel: { fontSize: 18, fontFamily: "Inter_700Bold" },
  searchBar: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, height: 44 },
  searchInput: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  filterRow: { borderBottomWidth: 0 },
  filterScroll: { paddingHorizontal: 16, paddingVertical: 10 },
  cityPicker: {
    position: "absolute", top: 130, left: 16, right: 16, zIndex: 100,
    borderRadius: 12, borderWidth: 1, shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 8,
  },
  cityOption: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14 },
  cityOptionText: { fontSize: 15, fontFamily: "Inter_500Medium" },
});
