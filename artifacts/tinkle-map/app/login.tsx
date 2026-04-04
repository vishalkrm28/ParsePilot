import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, Platform, TouchableOpacity, Alert } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SecondaryButton } from "@/components/ui/SecondaryButton";

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const botInset = Platform.OS === "web" ? 34 : insets.bottom;

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter your email and password.");
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
        <Text style={[styles.title, { color: colors.foreground }]}>Welcome back</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Sign in to sync your saved places</Text>

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
            testID="login-email"
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
            testID="login-password"
          />
        </View>

        <PrimaryButton label="Sign In" onPress={handleLogin} loading={loading} testID="login-submit" />

        <View style={styles.divider}>
          <View style={[styles.divLine, { backgroundColor: colors.border }]} />
          <Text style={[styles.divText, { color: colors.mutedForeground }]}>or</Text>
          <View style={[styles.divLine, { backgroundColor: colors.border }]} />
        </View>

        <SecondaryButton
          label="Create Account"
          onPress={() => router.replace("/signup")}
          testID="go-to-signup"
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
