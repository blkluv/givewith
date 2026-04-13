/**
 * GiveWithLocus custom theme for Thesys C1 / Crayon UI.
 *
 * Mirrors the editorial-dark aesthetic used everywhere else in the app
 * (lime accent, charcoal surfaces, zero border-radius, Geist sans). Applied
 * via `<ThemeProvider theme={gwlLight} darkTheme={gwlDark} mode="dark">`
 * in `src/app/(main)/chat/page.tsx`.
 *
 * Token reference: @crayonai/react-ui/components/ThemeProvider/types.d.ts
 */

import type { Theme } from "@crayonai/react-ui";

const sharedLayout = {
  // Sharp corners everywhere (Locus DNA). Pills/chips only keep radiusFull.
  rounded0: "0px",
  rounded3xs: "0px",
  rounded2xs: "0px",
  roundedXs: "0px",
  roundedS: "0px",
  roundedM: "0px",
  roundedL: "0px",
  roundedXl: "2px",
  rounded2xl: "2px",
  rounded3xl: "2px",
  rounded4xl: "2px",
  roundedFull: "9999px",
  roundedClickable: "0px",

  // Spacing — matches our Tailwind scale
  spacing0: "0px",
  spacing3xs: "2px",
  spacing2xs: "4px",
  spacingXs: "6px",
  spacingS: "8px",
  spacingM: "12px",
  spacingL: "16px",
  spacingXl: "24px",
  spacing2xl: "32px",
  spacing3xl: "48px",
} as const;

// Typography uses CSS `font` shorthand. We point the family at our Geist
// variable — the CSS var() is valid inside shorthand and resolves at render.
const geistStack = "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif";
const geistMonoStack = "var(--font-geist-mono), ui-monospace, monospace";

const sharedTypography = {
  fontBody: `400 15px/1.5 ${geistStack}`,
  fontBodyLetterSpacing: "0",
  fontBodyLink: `400 15px/1.5 ${geistStack}`,
  fontBodyLinkLetterSpacing: "0",
  fontBodyHeavy: `500 15px/1.5 ${geistStack}`,
  fontBodyHeavyLetterSpacing: "0",
  fontBodyMedium: `400 15px/1.5 ${geistStack}`,
  fontBodyMediumLetterSpacing: "0",
  fontBodySmall: `400 13px/1.5 ${geistStack}`,
  fontBodySmallLetterSpacing: "0",
  fontBodySmallHeavy: `500 13px/1.5 ${geistStack}`,
  fontBodySmallHeavyLetterSpacing: "0",
  fontBodyLarge: `400 17px/1.5 ${geistStack}`,
  fontBodyLargeLetterSpacing: "0",
  fontBodyLargeHeavy: `500 17px/1.5 ${geistStack}`,
  fontBodyLargeHeavyLetterSpacing: "0",
  fontLabel: `400 14px/1.2 ${geistStack}`,
  fontLabelLetterSpacing: "0",
  fontLabelHeavy: `500 14px/1.2 ${geistStack}`,
  fontLabelHeavyLetterSpacing: "0",
  fontLabelSmall: `400 12px/1.2 ${geistStack}`,
  fontLabelSmallLetterSpacing: "0",
  fontLabelSmallHeavy: `500 12px/1.2 ${geistStack}`,
  fontLabelSmallHeavyLetterSpacing: "0",
  fontLabelExtraSmall: `500 11px/1.2 ${geistStack}`,
  fontLabelExtraSmallLetterSpacing: "0.04em",
  fontLabelExtraSmallHeavy: `600 11px/1.2 ${geistStack}`,
  fontLabelExtraSmallHeavyLetterSpacing: "0.04em",
  fontLabelLarge: `400 17px/1.2 ${geistStack}`,
  fontLabelLargeLetterSpacing: "0",
  fontLabelLargeHeavy: `500 17px/1.2 ${geistStack}`,
  fontLabelLargeHeavyLetterSpacing: "0",
  fontHeadingLarge: `500 24px/1.15 ${geistStack}`,
  fontHeadingLargeLetterSpacing: "-0.01em",
  fontHeadingMedium: `500 20px/1.2 ${geistStack}`,
  fontHeadingMediumLetterSpacing: "-0.005em",
  fontHeadingSmall: `500 17px/1.25 ${geistStack}`,
  fontHeadingSmallLetterSpacing: "0",
  fontHeadingExtraSmall: `500 15px/1.25 ${geistStack}`,
  fontHeadingExtraSmallLetterSpacing: "0",
  fontNumberLarge: `400 17px/1.4 ${geistMonoStack}`,
  fontNumberLargeLetterSpacing: "0",
  fontNumberLargeHeavy: `500 17px/1.4 ${geistMonoStack}`,
  fontNumberLargeHeavyLetterSpacing: "0",
} as const;

// ---- DARK (canonical for GiveWithLocus) ----
export const gwlDark: Theme = {
  ...sharedLayout,
  ...sharedTypography,

  // Surfaces
  backgroundFills: "#0f0f10",
  containerFills: "#1b1b1c",
  overlayFills: "rgba(0,0,0,0.65)",
  sunkFills: "#141414",
  sunkBgFills: "#141414",
  elevatedFills: "#1b1b1c",
  invertedFills: "#fdfdfd",

  // Semantic tint fills — subtle, aligned with our editorial palette.
  // `info` is remapped to LIME so any generative-UI info callout
  // (e.g. "Wallet Address:") renders in our brand color, not teal/blue.
  dangerFills: "rgba(239,68,68,0.08)",
  successFills: "rgba(74,222,128,0.08)",
  infoFills: "rgba(215,255,75,0.06)",
  alertFills: "rgba(250,204,21,0.08)",

  // Strokes
  strokeDefault: "#2a2a2b",
  strokeInteractiveEl: "#3a3a3b",
  strokeInteractiveElSelected: "#d7ff4b",
  strokeEmphasis: "#5a5a5c",
  strokeAccent: "#d7ff4b",
  strokeAccentEmphasis: "#d7ff4b",
  strokeInfo: "rgba(215,255,75,0.35)",
  strokeInfoEmphasis: "#d7ff4b",
  strokeAlert: "rgba(250,204,21,0.35)",
  strokeAlertEmphasis: "#facc15",
  strokeSuccess: "rgba(74,222,128,0.35)",
  strokeSuccessEmphasis: "#4ade80",
  strokeDanger: "rgba(239,68,68,0.35)",
  strokeDangerEmphasis: "#ef4444",

  // Text
  primaryText: "#fdfdfd",
  secondaryText: "#c7c8ca",
  disabledText: "#7a7a7a",
  linkText: "#d7ff4b",

  accentPrimaryText: "#0f0f10", // text on lime fill
  accentSecondaryText: "rgba(15,15,16,0.7)",
  accentDisabledText: "rgba(15,15,16,0.4)",
  successPrimaryText: "#4ade80",
  successInvertedText: "#052e16",
  alertPrimaryText: "#facc15",
  alertInvertedText: "#1c1400",
  dangerPrimaryText: "#f87171",
  dangerSecondaryText: "rgba(248,113,113,0.7)",
  dangerDisabledText: "rgba(248,113,113,0.4)",
  dangerInvertedPrimaryText: "#fdfdfd",
  dangerInvertedSecondaryText: "rgba(253,253,253,0.7)",
  dangerInvertedDisabledText: "rgba(253,253,253,0.4)",
  infoPrimaryText: "#d7ff4b",
  infoInvertedText: "#0f0f10",

  // Interactive (for buttons, clickable rows, etc.)
  interactiveDefault: "#1b1b1c",
  interactiveHover: "#262627",
  interactivePressed: "#2a2a2b",
  interactiveDisabled: "#1b1b1c",
  interactiveAccent: "#d7ff4b",
  interactiveAccentHover: "#b6c927",
  interactiveAccentPressed: "#a0b521",
  interactiveAccentDisabled: "rgba(215,255,75,0.4)",
  interactiveDestructive: "rgba(239,68,68,0.06)",
  interactiveDestructiveHover: "rgba(239,68,68,0.14)",
  interactiveDestructivePressed: "rgba(239,68,68,0.22)",
  interactiveDestructiveDisabled: "rgba(239,68,68,0.04)",
  interactiveDestructiveAccent: "#ef4444",
  interactiveDestructiveAccentHover: "#dc2626",
  interactiveDestructiveAccentPressed: "#b91c1c",
  interactiveDestructiveAccentDisabled: "rgba(239,68,68,0.4)",

  // Highlights (selected cells, focus rings, etc.)
  highlightSubtle: "rgba(215,255,75,0.08)",
  highlightStrong: "#d7ff4b",

  // Chat-specific — mirrors our demo's visual language exactly
  chatContainerBg: "#0f0f10",
  chatAssistantResponseBg: "#1b1b1c",
  chatAssistantResponseText: "#fdfdfd",
  chatUserResponseBg: "#d7ff4b",
  chatUserResponseText: "#0f0f10",

  // Chart palette — lime-forward with warm secondary tones
  defaultChartPalette: [
    "#d7ff4b",
    "#e8dfc4",
    "#60a5fa",
    "#facc15",
    "#f87171",
    "#4ade80",
  ],
};

// ---- LIGHT (fallback only — app forces dark) ----
export const gwlLight: Theme = {
  ...sharedLayout,
  ...sharedTypography,
  backgroundFills: "#fdfdfd",
  containerFills: "#ffffff",
  sunkFills: "#f5f5f5",
  sunkBgFills: "#f5f5f5",
  elevatedFills: "#ffffff",
  strokeDefault: "#e5e5e5",
  strokeInteractiveEl: "#d0d0d0",
  strokeEmphasis: "#a0a0a0",
  strokeAccent: "#0f0f10",
  strokeAccentEmphasis: "#0f0f10",
  primaryText: "#0f0f10",
  secondaryText: "#555555",
  disabledText: "#a0a0a0",
  linkText: "#0f0f10",
  accentPrimaryText: "#fdfdfd",
  interactiveAccent: "#0f0f10",
  interactiveAccentHover: "#000000",
  highlightSubtle: "rgba(15,15,16,0.06)",
  highlightStrong: "#d7ff4b",
  chatContainerBg: "#fdfdfd",
  chatAssistantResponseBg: "#f5f5f5",
  chatAssistantResponseText: "#0f0f10",
  chatUserResponseBg: "#0f0f10",
  chatUserResponseText: "#fdfdfd",
};
