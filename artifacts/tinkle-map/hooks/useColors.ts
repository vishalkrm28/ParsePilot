import { useColorScheme } from "react-native";

import colors from "@/constants/colors";

type ColorPalette = typeof colors.light;

/**
 * Returns the design tokens for the current color scheme.
 *
 * The returned object contains all color tokens for the active palette
 * plus scheme-independent values like `radius`.
 *
 * Falls back to the light palette when no dark key is defined in
 * constants/colors.ts (the scaffold ships light-only by default).
 * When a `dark` key is present in colors.ts, this hook automatically
 * switches palettes based on the device's appearance setting.
 */
export function useColors(): ColorPalette & { radius: number } {
  const scheme = useColorScheme();
  const darkPalette: ColorPalette | undefined = "dark" in colors
    ? (colors as typeof colors & { dark: ColorPalette }).dark
    : undefined;
  const palette = scheme === "dark" && darkPalette ? darkPalette : colors.light;
  return { ...palette, radius: colors.radius };
}
