import type { CSSProperties } from "react";
import { useTheme } from "next-themes";
import { useAppSelector } from "@/redux/store";

// Resolves a ThemeMapping key for the vendor's active theme in the current mode.
export function useVendorThemeColor() {
  const { resolvedTheme } = useTheme();
  const activeTheme = useAppSelector((state) => state.theme.activeTheme);
  return (key: string): string | undefined => {
    const mapping = activeTheme?.mappings.find((m) => m.key === key);
    return mapping ? (resolvedTheme === "dark" ? mapping.dark : mapping.light) : undefined;
  };
}

// Exposes the vendor's sidebar colors as --brand-bg / --brand-text. Consumers read
// them with a zinc fallback, e.g. bg-[var(--brand-bg,var(--color-zinc-900))].
export function useVendorBrandStyle(): CSSProperties {
  const themeColor = useVendorThemeColor();
  const bg = themeColor("sidebar_bg");
  const text = themeColor("sidebar_text");
  return {
    ...(bg && { "--brand-bg": bg }),
    ...(text && { "--brand-text": text }),
  } as CSSProperties;
}
