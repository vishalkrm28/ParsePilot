import React from "react";
import { TouchableOpacity, StyleSheet, Platform, ViewStyle } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface FloatingEmergencyButtonProps {
  onPress: () => void;
  style?: ViewStyle;
}

export function FloatingEmergencyButton({ onPress, style }: FloatingEmergencyButtonProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const handlePress = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    onPress();
  };

  const bottomOffset = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.85}
      style={[
        styles.button,
        {
          backgroundColor: colors.destructive,
          bottom: bottomOffset + 90,
        },
        style,
      ]}
    >
      <Feather name="alert-triangle" size={22} color="#fff" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    position: "absolute",
    right: 16,
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
