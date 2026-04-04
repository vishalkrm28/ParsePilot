import React from "react";
import { View, Text, FlatList, StyleSheet, Platform } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import { ToiletCard } from "@/components/ToiletCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonCard } from "@/components/ui/LoadingState";
import { SectionHeader } from "@/components/ui/SectionHeader";

export default function SavedScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { savedPlaces, isLoading, toggleSave, isSaved } = useApp();

  const topInset = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topInset + 8, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Saved</Text>
        {savedPlaces.length > 0 && (
          <Text style={[styles.count, { color: colors.mutedForeground }]}>{savedPlaces.length} places</Text>
        )}
      </View>

      {isLoading ? (
        <FlatList
          data={[1, 2, 3]}
          keyExtractor={(i) => String(i)}
          renderItem={() => <SkeletonCard />}
          contentContainerStyle={{ paddingTop: 8, paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 16 }}
        />
      ) : savedPlaces.length === 0 ? (
        <EmptyState
          icon="bookmark"
          title="No saved places"
          description="Find a toilet you like and tap the bookmark icon to save it for quick access."
          action="Explore toilets"
          onAction={() => router.push("/(tabs)/map")}
        />
      ) : (
        <FlatList
          data={savedPlaces}
          keyExtractor={(s) => s.id}
          renderItem={({ item }) =>
            item.toilet ? (
              <ToiletCard
                toilet={item.toilet}
                onPress={() => router.push({ pathname: "/toilet/[id]", params: { id: item.toilet_id } })}
                onSave={() => toggleSave(item.toilet_id)}
                isSaved={isSaved(item.toilet_id)}
                testID={`saved-card-${item.id}`}
              />
            ) : null
          }
          contentContainerStyle={{ paddingVertical: 8, paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 16 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
  title: { fontSize: 28, fontFamily: "Inter_700Bold" },
  count: { fontSize: 14, fontFamily: "Inter_400Regular", marginTop: 2 },
});
