import React, { ReactNode } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from "react-native";
import { useColors } from "@/hooks/useColors";

interface SectionHeaderProps {
  title: string;
  action?: string;
  onAction?: () => void;
  right?: ReactNode;
  style?: ViewStyle;
}

export function SectionHeader({ title, action, onAction, right, style }: SectionHeaderProps) {
  const colors = useColors();

  return (
    <View style={[styles.container, style]}>
      <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
      {right}
      {action && onAction && (
        <TouchableOpacity onPress={onAction} activeOpacity={0.7}>
          <Text style={[styles.action, { color: colors.primary }]}>{action}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  title: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    flex: 1,
  },
  action: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
});
