import React from "react";
import { View, Text, StyleSheet, Platform, ScrollView, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import { router } from "expo-router";

type FeatherIconName = React.ComponentProps<typeof Feather>["name"];

interface SettingRowProps {
  icon: FeatherIconName;
  label: string;
  value?: string;
  onPress?: () => void;
  testID?: string;
}

function SettingRow({ icon, label, value, onPress, testID }: SettingRowProps) {
  const colors = useColors();
  return (
    <TouchableOpacity
      testID={testID}
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.row, { borderBottomColor: colors.border }]}
    >
      <View style={[styles.rowIcon, { backgroundColor: colors.primary + "15", borderRadius: 10 }]}>
        <Feather name={icon} size={18} color={colors.primary} />
      </View>
      <Text style={[styles.rowLabel, { color: colors.foreground }]}>{label}</Text>
      <View style={styles.rowRight}>
        {value && <Text style={[styles.rowValue, { color: colors.mutedForeground }]}>{value}</Text>}
        <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
      </View>
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { savedPlaces, toilets, userCity } = useApp();

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const botInset = Platform.OS === "web" ? 34 : insets.bottom;

  const cityCount = toilets.filter((t) => t.city === userCity).length;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: botInset + 24 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.header, { paddingTop: topInset + 16, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <View style={[styles.avatar, { backgroundColor: colors.primary + "20" }]}>
          <Feather name="user" size={36} color={colors.primary} />
        </View>
        <Text style={[styles.username, { color: colors.foreground }]}>Tinkle Explorer</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Restroom Connoisseur</Text>

        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={[styles.statNum, { color: colors.primary }]}>{savedPlaces.length}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Saved</Text>
          </View>
          <View style={[styles.statDiv, { backgroundColor: colors.border }]} />
          <View style={styles.stat}>
            <Text style={[styles.statNum, { color: colors.primary }]}>{cityCount}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>In {userCity}</Text>
          </View>
          <View style={[styles.statDiv, { backgroundColor: colors.border }]} />
          <View style={styles.stat}>
            <Text style={[styles.statNum, { color: colors.primary }]}>{toilets.length}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Worldwide</Text>
          </View>
        </View>
      </View>

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>ACCOUNT</Text>
        <SettingRow icon="log-in" label="Sign In" onPress={() => router.push("/login")} testID="profile-login" />
        <SettingRow icon="user-plus" label="Create Account" onPress={() => router.push("/signup")} testID="profile-signup" />
      </View>

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>SETTINGS</Text>
        <SettingRow icon="globe" label="Default City" value={userCity} />
        <SettingRow icon="moon" label="Appearance" value="System" />
        <SettingRow icon="bell" label="Notifications" />
      </View>

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>ABOUT</Text>
        <SettingRow icon="info" label="About Tinkle Map" />
        <SettingRow icon="shield" label="Privacy Policy" />
        <SettingRow icon="file-text" label="Terms of Service" />
      </View>

      <View style={styles.version}>
        <Text style={[styles.versionText, { color: colors.mutedForeground }]}>Tinkle Map v1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { alignItems: "center", paddingHorizontal: 24, paddingBottom: 24, borderBottomWidth: 1, gap: 8 },
  avatar: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  username: { fontSize: 22, fontFamily: "Inter_700Bold" },
  subtitle: { fontSize: 14, fontFamily: "Inter_400Regular" },
  stats: { flexDirection: "row", alignItems: "center", marginTop: 16, gap: 16 },
  stat: { alignItems: "center" },
  statNum: { fontSize: 22, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  statDiv: { width: 1, height: 32 },
  section: { marginTop: 20, marginHorizontal: 16, borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  sectionTitle: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4 },
  row: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, gap: 12 },
  rowIcon: { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
  rowLabel: { flex: 1, fontSize: 15, fontFamily: "Inter_500Medium" },
  rowRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  rowValue: { fontSize: 14, fontFamily: "Inter_400Regular" },
  version: { alignItems: "center", marginTop: 32 },
  versionText: { fontSize: 12, fontFamily: "Inter_400Regular" },
});
