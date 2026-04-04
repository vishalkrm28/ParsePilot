import React, { useState } from "react";
import { View, Text, StyleSheet, FlatList, TextInput, Platform, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import { ToiletCard } from "@/components/ToiletCard";
import { EmptyState } from "@/components/ui/EmptyState";

export default function SearchResultsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { toilets, toggleSave, isSaved } = useApp();

  const [query, setQuery] = useState("");
  const botInset = Platform.OS === "web" ? 34 : insets.bottom;

  const results = query.length >= 2
    ? toilets.filter((t) =>
        t.name.toLowerCase().includes(query.toLowerCase()) ||
        t.address.toLowerCase().includes(query.toLowerCase()) ||
        t.city.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.searchBar, { backgroundColor: colors.muted, borderRadius: colors.radius, margin: 16 }]}>
        <Feather name="search" size={16} color={colors.mutedForeground} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search anywhere..."
          placeholderTextColor={colors.mutedForeground}
          style={[styles.input, { color: colors.foreground }]}
          autoFocus
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery("")}>
            <Feather name="x" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}
      </View>

      {query.length < 2 ? (
        <EmptyState icon="search" title="Start typing to search" description="Search by name, address, or city." />
      ) : results.length === 0 ? (
        <EmptyState icon="map-pin" title="No results found" description={`No toilets match "${query}"`} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(t) => t.id}
          renderItem={({ item }) => (
            <ToiletCard
              toilet={item}
              onPress={() => router.push({ pathname: "/toilet/[id]", params: { id: item.id } })}
              onSave={() => toggleSave(item.id)}
              isSaved={isSaved(item.id)}
            />
          )}
          contentContainerStyle={{ paddingVertical: 8, paddingBottom: botInset + 16 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchBar: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, height: 44 },
  input: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
});
