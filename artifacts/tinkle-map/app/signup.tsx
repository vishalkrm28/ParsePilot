import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, Platform, TouchableOpacity, Alert } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SecondaryButton } from "@/components/ui/SecondaryButton";

export default function SignupScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const botInset = Platform.OS === "web" ? 34 : insets.bottom;

  const handleSignup = async () => {
    if (!email || !password || !username) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Alert.alert("Coming Soon", "Authentication will be enabled in a future update.");
    }, 800);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: topInset, paddingBottom: botInset }]}>
      <TouchableOpacity onPress={() => router.back()} style={styles.back}>
        <Feather name="arrow-left" size={24} color={colors.foreground} />
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.foreground }]}>Create account</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Join Tinkle Map to save and review toilets</Text>

        <View style={[styles.input, { backgroundColor: colors.muted, borderRadius: colors.radius }]}>
          <Feather name="user" size={16} color={colors.mutedForeground} />
          <TextInput
            value={username}
            onChangeText={setUsername}
            placeholder="Username"
            placeholderTextColor={colors.mutedForeground}
            autoCapitalize="none"
            style={[styles.inputText, { color: colors.foreground }]}
            testID="signup-username"
          />
        </View>

        <View style={[styles.input, { backgroundColor: colors.muted, borderRadius: colors.radius }]}>
          <Feather name="mail" size={16} color={colors.mutedForeground} />
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="email-address"
            autoCapitalize="none"
            style={[styles.inputText, { color: colors.foreground }]}
            testID="signup-email"
          />
        </View>

        <View style={[styles.input, { backgroundColor: colors.muted, borderRadius: colors.radius }]}>
          <Feather name="lock" size={16} color={colors.mutedForeground} />
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor={colors.mutedForeground}
            secureTextEntry
            style={[styles.inputText, { color: colors.foreground }]}
            testID="signup-password"
          />
        </View>

        <PrimaryButton label="Create Account" onPress={handleSignup} loading={loading} testID="signup-submit" />

        <View style={styles.divider}>
          <View style={[styles.divLine, { backgroundColor: colors.border }]} />
          <Text style={[styles.divText, { color: colors.mutedForeground }]}>or</Text>
          <View style={[styles.divLine, { backgroundColor: colors.border }]} />
        </View>

        <SecondaryButton
          label="Sign In"
          onPress={() => router.replace("/login")}
          testID="go-to-login"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  back: { marginBottom: 32 },
  content: { gap: 14 },
  title: { fontSize: 28, fontFamily: "Inter_700Bold" },
  subtitle: { fontSize: 15, fontFamily: "Inter_400Regular", marginBottom: 8 },
  input: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, height: 52 },
  inputText: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  divider: { flexDirection: "row", alignItems: "center", gap: 12 },
  divLine: { flex: 1, height: 1 },
  divText: { fontSize: 14, fontFamily: "Inter_400Regular" },
});
