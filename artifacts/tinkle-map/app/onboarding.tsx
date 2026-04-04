import React, { useState, useRef } from "react";
import { View, Text, StyleSheet, Dimensions, Platform, ScrollView, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { PrimaryButton } from "@/components/ui/PrimaryButton";

const { width: W } = Dimensions.get("window");

type FeatherIconName = React.ComponentProps<typeof Feather>["name"];

interface Slide {
  icon: FeatherIconName;
  title: string;
  description: string;
}

const SLIDES: Slide[] = [
  {
    icon: "map-pin",
    title: "Find Clean Toilets Nearby",
    description: "Browse verified public toilets in cities across the globe with real-time trust scores.",
  },
  {
    icon: "shield",
    title: "Trust Scores You Can Rely On",
    description: "Our trust algorithm weighs recency, review count, and community votes to give you accurate scores.",
  },
  {
    icon: "star",
    title: "Rate & Review",
    description: "Help others by rating cleanliness, accessibility, safety, and facilities after each visit.",
  },
  {
    icon: "bookmark",
    title: "Save Your Favourites",
    description: "Bookmark the best loos in each city so you never get caught short again.",
  },
];

export default function OnboardingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [page, setPage] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const botInset = Platform.OS === "web" ? 34 : insets.bottom;

  const goNext = () => {
    Haptics.selectionAsync();
    if (page < SLIDES.length - 1) {
      scrollRef.current?.scrollTo({ x: (page + 1) * W, animated: true });
      setPage(page + 1);
    } else {
      router.replace("/(tabs)/map");
    }
  };

  const skip = () => router.replace("/(tabs)/map");

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: topInset }]}>
      <TouchableOpacity onPress={skip} style={styles.skipBtn}>
        <Text style={[styles.skipText, { color: colors.mutedForeground }]}>Skip</Text>
      </TouchableOpacity>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        style={{ flex: 1 }}
      >
        {SLIDES.map((slide, i) => (
          <View key={i} style={[styles.slide, { width: W }]}>
            <View style={[styles.iconWrap, { backgroundColor: colors.primary + "15", borderRadius: 50 }]}>
              <Feather name={slide.icon} size={48} color={colors.primary} />
            </View>
            <Text style={[styles.slideTitle, { color: colors.foreground }]}>{slide.title}</Text>
            <Text style={[styles.slideDesc, { color: colors.mutedForeground }]}>{slide.description}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: botInset + 24 }]}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                { backgroundColor: i === page ? colors.primary : colors.muted },
                i === page && styles.dotActive,
              ]}
            />
          ))}
        </View>
        <PrimaryButton
          label={page === SLIDES.length - 1 ? "Get Started" : "Next"}
          onPress={goNext}
          testID="onboarding-next"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  skipBtn: { position: "absolute", top: 60, right: 24, zIndex: 10 },
  skipText: { fontSize: 15, fontFamily: "Inter_500Medium" },
  slide: { alignItems: "center", justifyContent: "center", padding: 32, gap: 24 },
  iconWrap: { width: 100, height: 100, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  slideTitle: { fontSize: 26, fontFamily: "Inter_700Bold", textAlign: "center" },
  slideDesc: { fontSize: 16, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 24 },
  footer: { paddingHorizontal: 32, gap: 20 },
  dots: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  dot: { height: 8, width: 8, borderRadius: 4 },
  dotActive: { width: 20 },
});
