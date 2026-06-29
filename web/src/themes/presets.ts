import type { DashboardTheme, ThemeTypography, ThemeLayout } from "./types";

/**
 * Built-in dashboard themes.
 *
 * Each theme defines its own palette, typography, and layout so switching
 * themes produces visible changes beyond just color — fonts, density, and
 * corner-radius all shift to match the theme's personality.
 *
 * Theme names must stay in sync with the backend's
 * `_BUILTIN_DASHBOARD_THEMES` list in `hermes_cli/web_server.py`.
 */

// ---------------------------------------------------------------------------
// Shared typography / layout presets
// ---------------------------------------------------------------------------

/** Default system stack — neutral, safe fallback for every platform. */
const SYSTEM_SANS =
  'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
const SYSTEM_MONO =
  'ui-monospace, "SF Mono", "Cascadia Mono", Menlo, Consolas, monospace';

const DEFAULT_TYPOGRAPHY: ThemeTypography = {
  fontSans: SYSTEM_SANS,
  fontMono: SYSTEM_MONO,
  baseSize: "15px",
  lineHeight: "1.55",
  letterSpacing: "0",
};

const DEFAULT_LAYOUT: ThemeLayout = {
  radius: "0.5rem",
  density: "comfortable",
};

// ---------------------------------------------------------------------------
// Themes
// ---------------------------------------------------------------------------

export const defaultTheme: DashboardTheme = {
  name: "default",
  label: "Hermes Teal",
  description: "Classic dark teal — the canonical Hermes look",
  palette: {
    background: { hex: "#041c1c", alpha: 1 },
    midground: { hex: "#ffe6cb", alpha: 1 },
    foreground: { hex: "#ffffff", alpha: 0 },
    warmGlow: "rgba(255, 189, 56, 0.35)",
    noiseOpacity: 1,
  },
  typography: DEFAULT_TYPOGRAPHY,
  layout: DEFAULT_LAYOUT,
  terminalBackground: "#000000",
};

export const midnightTheme: DashboardTheme = {
  name: "midnight",
  label: "Midnight",
  description: "Deep blue-violet with cool accents",
  palette: {
    background: { hex: "#0a0a1f", alpha: 1 },
    midground: { hex: "#d4c8ff", alpha: 1 },
    foreground: { hex: "#ffffff", alpha: 0 },
    warmGlow: "rgba(167, 139, 250, 0.32)",
    noiseOpacity: 0.8,
  },
  typography: {
    ...DEFAULT_TYPOGRAPHY,
    fontSans: `"Inter", ${SYSTEM_SANS}`,
    fontMono: `"JetBrains Mono", ${SYSTEM_MONO}`,
    fontUrl:
      "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap",
    letterSpacing: "-0.005em",
  },
  layout: {
    ...DEFAULT_LAYOUT,
    radius: "0.75rem",
  },
};

export const emberTheme: DashboardTheme = {
  name: "ember",
  label: "Ember",
  description: "Warm crimson and bronze — forge vibes",
  palette: {
    background: { hex: "#1a0a06", alpha: 1 },
    midground: { hex: "#ffd8b0", alpha: 1 },
    foreground: { hex: "#ffffff", alpha: 0 },
    warmGlow: "rgba(249, 115, 22, 0.38)",
    noiseOpacity: 1,
  },
  typography: {
    ...DEFAULT_TYPOGRAPHY,
    fontSans: `"Spectral", Georgia, "Times New Roman", serif`,
    fontMono: `"IBM Plex Mono", ${SYSTEM_MONO}`,
    fontUrl:
      "https://fonts.googleapis.com/css2?family=Spectral:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;700&display=swap",
  },
  layout: {
    ...DEFAULT_LAYOUT,
    radius: "0.25rem",
  },
  colorOverrides: {
    destructive: "#c92d0f",
    warning: "#f97316",
  },
};

export const monoTheme: DashboardTheme = {
  name: "mono",
  label: "Mono",
  description: "Clean grayscale — minimal and focused",
  palette: {
    background: { hex: "#0e0e0e", alpha: 1 },
    midground: { hex: "#eaeaea", alpha: 1 },
    foreground: { hex: "#ffffff", alpha: 0 },
    warmGlow: "rgba(255, 255, 255, 0.1)",
    noiseOpacity: 0.6,
  },
  typography: {
    ...DEFAULT_TYPOGRAPHY,
    fontSans: `"IBM Plex Sans", ${SYSTEM_SANS}`,
    fontMono: `"IBM Plex Mono", ${SYSTEM_MONO}`,
    fontUrl:
      "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap",
  },
  layout: {
    ...DEFAULT_LAYOUT,
    radius: "0",
  },
};

export const cyberpunkTheme: DashboardTheme = {
  name: "cyberpunk",
  label: "Cyberpunk",
  description: "Neon green on black — matrix terminal",
  palette: {
    background: { hex: "#040608", alpha: 1 },
    midground: { hex: "#9bffcf", alpha: 1 },
    foreground: { hex: "#ffffff", alpha: 0 },
    warmGlow: "rgba(0, 255, 136, 0.22)",
    noiseOpacity: 1.2,
  },
  typography: {
    ...DEFAULT_TYPOGRAPHY,
    fontSans: `"Share Tech Mono", "JetBrains Mono", ${SYSTEM_MONO}`,
    fontMono: `"Share Tech Mono", "JetBrains Mono", ${SYSTEM_MONO}`,
    fontUrl:
      "https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=JetBrains+Mono:wght@400;700&display=swap",
  },
  layout: {
    ...DEFAULT_LAYOUT,
    radius: "0",
  },
  colorOverrides: {
    success: "#00ff88",
    warning: "#ffd700",
    destructive: "#ff0055",
  },
};

export const roseTheme: DashboardTheme = {
  name: "rose",
  label: "Rosé",
  description: "Soft pink and warm ivory — easy on the eyes",
  palette: {
    background: { hex: "#1a0f15", alpha: 1 },
    midground: { hex: "#ffd4e1", alpha: 1 },
    foreground: { hex: "#ffffff", alpha: 0 },
    warmGlow: "rgba(249, 168, 212, 0.3)",
    noiseOpacity: 0.9,
  },
  typography: {
    ...DEFAULT_TYPOGRAPHY,
    fontSans: `"Fraunces", Georgia, serif`,
    fontMono: `"DM Mono", ${SYSTEM_MONO}`,
    fontUrl:
      "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=DM+Mono:wght@400;500&display=swap",
  },
  layout: {
    ...DEFAULT_LAYOUT,
    radius: "1rem",
  },
};

/**
 * Nous Blue — the inverted "light mode" Hermes look, ported from the
 * LENS_5I overlay preset in `@nous-research/ui`.
 *
 * Unlike the other built-ins (which paint dark color directly on the
 * canvas), this theme relies on `<Backdrop />`'s foreground inversion
 * layer: an opaque white sheet at z-200 with `mix-blend-mode: difference`
 * that flips the entire stack below it. Authoring colors stay dark
 * (`#170d02` brown background, `#FFAC02` orange midground), and the
 * inversion converts them to their visual complements at paint time —
 * the orange midground reads as #0053FD Nous-blue on screen, against a
 * cream `#E8F2FD` canvas.
 *
 * Note on bg blend mode: the DS Lens uses `multiply` for LENS_5I because
 * nousnet-web's <body> is white; hermes-agent's App root is `bg-black`,
 * so we leave the bg layer's blend mode at the `difference` default —
 * `difference(#170d02, #000)` passes the bg through unchanged, and the
 * subsequent FG-difference layer then inverts it to cream. Using
 * `multiply` here would collapse the bg to pure black against the
 * `bg-black` root and produce a plain-white canvas instead of the
 * intended cream-blue.
 *
 * Source of truth for the palette: `design-language/src/ui/components/
 * overlays/lens.ts` (LENS_5I export).
 */
export const nousBlueTheme: DashboardTheme = {
  name: "nous-blue",
  label: "Nous Blue",
  description: "Light mode — vivid Nous-blue accents on cream canvas",
  palette: {
    background: { hex: "#170d02", alpha: 1 },
    midground: { hex: "#FFAC02", alpha: 1 },
    foreground: { hex: "#FFFFFF", alpha: 1 },
    // Same warm-amber as nousnet-web's overlay glow; after the FG
    // inversion it reads as a cool ultraviolet vignette in the top-left.
    warmGlow: "rgba(255, 172, 2, 0.18)",
    // Noise sits above the FG inversion and is NOT flipped, so a softer
    // multiplier keeps it from speckling over the bright post-inversion
    // canvas.
    noiseOpacity: 0.4,
  },
  typography: DEFAULT_TYPOGRAPHY,
  layout: DEFAULT_LAYOUT,
  // Inverted page: the embedded terminal is below the FG layer too, so
  // a `#000000` source paints as visual white — i.e. a proper light-mode
  // terminal pane. xterm picks lighter palette colors against the "black"
  // canvas, which then read as dark text on screen post-inversion.
  terminalBackground: "#000000",
  componentStyles: {
    backdrop: {
      // Lower than LENS_5I.Lens.fillerOpacity (0.06). The filler texture
      // gets amplified post-inversion: small variations against the deep
      // `#170d02` source bg are barely visible, but those same variations
      // against the bright `#E8F2FD` post-inversion canvas read as a
      // heavy cloud/marble pattern — especially on near-empty pages
      // (loading spinners, blank states). 0.02 keeps subtle grain
      // without overwhelming the canvas.
      fillerOpacity: "0.02",
    },
  },
  // Pre-invert absolute-hex tokens so they read as their familiar colors
  // through the FG difference layer. e.g. source #04D3C9 (cyan) is what
  // gets painted, and `255 - channel` flips it to #FB2C36 (red) on screen.
  // Without these, the default destructive/success/warning tokens would
  // appear as their unintuitive complements.
  colorOverrides: {
    destructive: "#04d3c9",
    destructiveForeground: "#000000",
    success: "#b5217f",
    warning: "#0042c7",
  },
  // Pre-inverted data-series accents for the Analytics/Models token
  // charts. The defaults (#ffe6cb cream + #34d399 emerald) would render
  // through the FG difference layer as dark navy + hot-coral on the
  // bright Nous-blue canvas — the coral is the "red" users see for
  // Output values without these overrides. Source → on-screen:
  //   Input:  #ffe6cb → #001934 (dark navy)        ← unchanged
  //   Output: #ffac02 → #0053fd (vivid Nous-blue)  ← brand accent
  // Input keeps the cream source so it stays a neutral, low-contrast
  // dark-blue against the cream canvas; output paints as the brand
  // Nous-blue so the "primary" series in token-flow charts reads as
  // the highlight color, matching the rest of the inverted UI chrome.
  seriesColors: {
    inputTokenAccent: "#ffe6cb",
    outputTokenAccent: "#ffac02",
  },
  // Explicit picker swatch — the raw palette hex (`#170d02`, `#FFAC02`,
  // amber rgba) doesn't reflect what users see after the FG inversion,
  // so we paint the post-inversion visual triplet directly:
  //   white → vivid Nous-blue → cream/light-blue
  // matching the actual on-screen rendering of the theme.
  swatchColors: ["#FFFFFF", "#0053FD", "#E8F2FD"],
};

/**
 * Same look as ``defaultTheme`` but with a larger root font size, looser
 * line-height, and ``spacious`` density so every rem-based size in the
 * dashboard scales up. For users who find the default 15px UI too dense.
 */
export const defaultLargeTheme: DashboardTheme = {
  name: "default-large",
  label: "Hermes Teal (Large)",
  description: "Hermes Teal with bigger fonts and roomier spacing",
  palette: defaultTheme.palette,
  typography: {
    ...DEFAULT_TYPOGRAPHY,
    baseSize: "18px",
    lineHeight: "1.65",
  },
  layout: {
    ...DEFAULT_LAYOUT,
    density: "spacious",
  },
};

/**
 * Código Sin Siesta — full port of the @codigosinsiesta/theme v0.7.0
 * "dark blueprint" design system onto the dashboard, including the
 * chrome elements (top accent bar, breadcrumb, footer, eyebrow bars,
 * pulse-dots, floating orb) that are baked into `chrome.css` for the
 * deck slides. Without them the theme reads as "generic dark mode with
 * a cobalto tint" rather than the CSS look — this preset rebuilds that
 * visual signature on top of the dashboard shell.
 *
 * Token map (source → dashboard):
 *   --color-fondo    → background (slate-900 canvas)
 *   --color-tinta    → midground (slate-100 primary text)
 *   --color-cielo    → warm-glow tint (sky-400)
 *   --font-display   → Space Grotesk (chrome, h1)
 *   --font-body      → Inter (body)
 *   --font-mono      → JetBrains Mono (technical)
 *   --radius-md      → 1.25rem corner radius (CSS Theme goes up to 1.5)
 *
 * What lives in customCSS (raw CSS injected via the theme's customCSS
 * slot, scoped to the dashboard shell):
 *   - .csi-accent-bar: 3px gradient top bar (cobalto → eléctrico → cielo)
 *   - .csi-breadcrumb / .csi-footer: mono breadcrumb + footer chrome
 *   - .csi-eyebrow: 24×2px bar + uppercase mono for h2/h3
 *   - .csi-pulse-dot: 2s pulse for status indicators
 *   - .csi-float-orb: slow floating radial gradient behind the canvas
 *
 * We do NOT touch index.css or any component — this is a pure preset
 * addition. Glassmorphism on cards lives in `componentStyles.card` so it
 * reacts to the existing `.card` selector without component edits.
 */
export const codigoSinSiestaTheme: DashboardTheme = {
  name: "codigo-sin-siesta",
  label: "Código Sin Siesta",
  description:
    "Dark blueprint — cobalto sobre slate-900 con tipografía Space Grotesk · Inter · JetBrains Mono",
  palette: {
    background: { hex: "#0f172a", alpha: 1 }, // --color-fondo (slate-900)
    midground: { hex: "#f1f5f9", alpha: 1 }, // --color-tinta (slate-100)
    foreground: { hex: "#ffffff", alpha: 0 },
    // --color-cielo (sky-400) bumped from 0.28 → 0.45 so the blueprint
    // glow reads at the edges without competing with the accent bar.
    warmGlow: "rgba(96, 165, 250, 0.45)",
    noiseOpacity: 0.95,
  },
  typography: {
    ...DEFAULT_TYPOGRAPHY,
    fontSans: `"Inter", ${SYSTEM_SANS}`,
    fontDisplay: `"Space Grotesk", "Inter", ${SYSTEM_SANS}`,
    fontMono: `"JetBrains Mono", ${SYSTEM_MONO}`,
    fontUrl:
      "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap",
    // Bumped 15 → 16px so body copy breathes like the deck slides do
    // (BRAND.md forbids body < 16px in preview, 24px on slide scale).
    baseSize: "16px",
    lineHeight: "1.6",
    letterSpacing: "0",
  },
  layout: {
    // --radius-lg (1.5rem) is the CSS Theme's signature; we sit one step
    // below (1.25rem) so the embedded terminal doesn't look toy-like
    // against the generous radius.
    radius: "1.25rem",
    density: "comfortable",
  },
  // Semantic token overrides. The DS cascade in index.css derives
  // --color-card from `color-mix(midground 4%, background)` which gives
  // a near-invisible slate card on a slate canvas. CSS Theme's glass
  // uses cobalto at ~25% with a sky-400 20% border + 10px backdrop blur
  // — we rebuild that here and also pin the destructive / success /
  // warning / border so chart and badge accents match the deck palette.
  colorOverrides: {
    card: "rgba(30, 58, 138, 0.22)", // --color-cobalto @ 22% (glass base)
    cardForeground: "#f1f5f9",
    popover: "rgba(21, 32, 51, 0.85)", // --color-fondo-elev @ 85%
    primary: "#60a5fa", // --color-cielo (sky-400) → primary accent
    primaryForeground: "#0f172a",
    secondary: "rgba(96, 165, 250, 0.12)", // --color-electric-soft
    muted: "rgba(30, 58, 138, 0.18)",
    mutedForeground: "#cbd5e1", // --color-tinta2 (slate-300)
    accent: "rgba(96, 165, 250, 0.18)", // --color-electric-soft
    accentForeground: "#93c5fd", // --color-cielo2 (sky-300)
    destructive: "#f87171", // --color-err (red-400)
    destructiveForeground: "#f1f5f9",
    success: "#34d399", // --color-ok (emerald-400)
    warning: "#fbbf24", // --color-warn (amber-400)
    border: "rgba(96, 165, 250, 0.22)", // sky @ 22% (CSS Theme border)
    input: "rgba(96, 165, 250, 0.20)",
    ring: "#60a5fa", // sky-400 → focus ring
  },
  // Data-series accents — CSS Theme's identity colors. Output bumps from
  // blue-500 (#3b82f6) to sky-400 (#60a5fa) so the highlight reads as
  // "the sky" not "the cobalt", matching the deck palette hierarchy.
  seriesColors: {
    inputTokenAccent: "#cbd5e1", // --color-tinta2 (slate-300)
    outputTokenAccent: "#60a5fa", // --color-cielo (sky-400)
  },
  swatchColors: ["#0f172a", "#3b82f6", "#60a5fa"], // bg / electric / sky
  terminalBackground: "#0c1e4f", // --color-marino (navy canvas)
  // ──────────────────────────────────────────────────────────────────
  // COMPONENT STYLES — emit CSS vars consumed by shell components
  // ──────────────────────────────────────────────────────────────────
  componentStyles: {
    card: {
      // CSS Theme's card-glass: rgba cobalto + backdrop blur + sky
      // border + tinted shadow. The 10px blur is what gives the
      // "blueprint" feel even on a solid slate-900 canvas (the blur
      // collapses to the same color, but the border + shadow + tint
      // combo is enough to read as a translucent layer).
      background: "rgba(30, 58, 138, 0.22)",
      "backdrop-filter": "blur(10px)",
      "-webkit-backdrop-filter": "blur(10px)",
      border: "1px solid rgba(96, 165, 250, 0.22)",
      "box-shadow":
        "0 1px 3px rgba(0, 0, 0, 0.3), 0 8px 24px rgba(0, 0, 0, 0.25)",
      "transition": "all 300ms ease-out",
    },
    header: {
      // Backdrop-filter on the header so content scrolls under it and
      // the breadcrumb / brand mark float on a glass plate. Matches
      // CSS Theme's chrome philosophy.
      "backdrop-filter": "blur(10px) saturate(140%)",
      "-webkit-backdrop-filter": "blur(10px) saturate(140%)",
      "background": "rgba(15, 23, 42, 0.55)",
      "border-bottom": "1px solid rgba(96, 165, 250, 0.18)",
    },
    sidebar: {
      background: "rgba(15, 23, 42, 0.65)",
      "backdrop-filter": "blur(10px) saturate(140%)",
      "-webkit-backdrop-filter": "blur(10px) saturate(140%)",
      "border-right": "1px solid rgba(96, 165, 250, 0.18)",
    },
    tab: {
      // Tabs underline active = sky-400 (CSS Theme's accent identity).
      "border-bottom": "2px solid transparent",
      "transition": "all 200ms ease-out",
    },
    badge: {
      "font-family": `"JetBrains Mono", ${SYSTEM_MONO}`,
      "letter-spacing": "0.06em",
      "text-transform": "uppercase",
      "font-weight": "600",
    },
    page: {
      "background": "transparent", // let the floating orb show through
    },
    backdrop: {
      // Stronger blueprint grid so the dark canvas never feels empty.
      "background-image":
        "linear-gradient(rgba(96, 165, 250, 0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(96, 165, 250, 0.045) 1px, transparent 1px)",
      "background-size": "32px 32px",
    },
  },
  // ──────────────────────────────────────────────────────────────────
  // CUSTOM CSS — raw CSS injected as <style> in <head>. This is the
  // heavy lifter: it builds the structural chrome (accent bar,
  // breadcrumb, footer, eyebrow bars, pulse-dots, floating orb) that
  // makes the dashboard READ as Código Sin Siesta rather than as a
  // generic dark theme. Selectors are scoped to the dashboard shell so
  // we don't bleed into plugin content.
  // ──────────────────────────────────────────────────────────────────
  customCSS: `
/* ════════════════════════════════════════════════════════════════════
   Código Sin Siesta — V4 chrome port
   ════════════════════════════════════════════════════════════════════ */

/* ── 0. Inyecta el accent-bar y los orbes como pseudo-elementos del body.
   Sin tocar componentes: el navegador pinta el chrome a partir del
   background CSS puro. Queda activo en cada vista del dashboard.
   !important para pisar cualquier ::before/::after que el backdrop
   global de @nous-research/ui pueda definir. ── */
body::before,
html::before {
  content: '' !important;
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  width: 100% !important;
  height: 4px !important;
  background: linear-gradient(90deg,
    #1e3a8a 0%,
    #3b82f6 35%,
    #60a5fa 70%,
    #93c5fd 100%) !important;
  z-index: 9999 !important;
  pointer-events: none !important;
  border: none !important;
  box-shadow: 0 1px 12px rgba(96, 165, 250, 0.45) !important;
}
body::after,
html::after {
  content: '' !important;
  position: fixed !important;
  top: -180px !important;
  left: -180px !important;
  width: 720px !important;
  height: 720px !important;
  background: radial-gradient(circle at center,
    rgba(96, 165, 250, 0.32) 0%,
    rgba(59, 130, 246, 0.18) 25%,
    rgba(30, 58, 138, 0.08) 50%,
    transparent 75%) !important;
  z-index: 0 !important;
  pointer-events: none !important;
  border: none !important;
  animation: csi-float 14s ease-in-out infinite alternate !important;
  filter: blur(4px) !important;
}
@media (prefers-reduced-motion: reduce) {
  body::after, html::after { animation: none !important; }
}

/* ── Font weight on display so the chrome reads as "space grotesk 800" ── */
:root { --csi-font-display-weight: 700; }

/* ── 1. Top accent bar — 3px gradient cobalto → eléctrico → cielo ── */
.csi-accent-bar {
  position: fixed;
  top: 0; left: 0; right: 0;
  height: 3px;
  background: linear-gradient(90deg,
    #1e3a8a 0%,
    #3b82f6 50%,
    #60a5fa 100%);
  z-index: 9999;
  pointer-events: none;
}

/* ── 2. Floating orb — slow radial behind the canvas (9–15s float) ── */
.csi-float-orb {
  position: fixed;
  top: -200px;
  left: -200px;
  width: 600px;
  height: 600px;
  background: radial-gradient(circle at center,
    rgba(96, 165, 250, 0.18) 0%,
    rgba(30, 58, 138, 0.10) 35%,
    transparent 70%);
  z-index: 0;
  pointer-events: none;
  animation: csi-float 14s ease-in-out infinite alternate;
  filter: blur(8px);
}
.csi-float-orb--br {
  top: auto;
  left: auto;
  bottom: -240px;
  right: -200px;
  width: 700px;
  height: 700px;
  background: radial-gradient(circle at center,
    rgba(30, 58, 138, 0.18) 0%,
    rgba(96, 165, 250, 0.08) 40%,
    transparent 70%);
  animation-duration: 18s;
  animation-delay: -3s;
}
@keyframes csi-float {
  0%   { transform: translate(0, 0) scale(1); }
  50%  { transform: translate(40px, -30px) scale(1.08); }
  100% { transform: translate(-30px, 40px) scale(0.95); }
}
@media (prefers-reduced-motion: reduce) {
  .csi-float-orb { animation: none; }
}

/* ── 3. Pulse dot — 2s ease-in-out infinite ── */
.csi-pulse-dot {
  display: inline-block;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #3b82f6;
  box-shadow: 0 0 8px #3b82f6, 0 0 14px rgba(96, 165, 250, 0.4);
  animation: csi-pulse 2s ease-in-out infinite;
  margin-right: 8px;
  vertical-align: middle;
  flex-shrink: 0;
}
@keyframes csi-pulse {
  0%, 100% { opacity: 1;   transform: scale(1); }
  50%      { opacity: 0.6; transform: scale(0.85); }
}
@media (prefers-reduced-motion: reduce) {
  .csi-pulse-dot { animation: none; opacity: 0.85; }
}

/* ── 4. Eyebrow — 24×2px bar + uppercase mono before headings ──
   Target the dashboard's h2/h3 hierarchy. CSS Theme's chrome.css
   does this via ::before on .label; we mimic it on the actual h1/h2/h3
   elements so the heading "RECENT SESSIONS" reads as the deck label. */
main h2,
main h3,
[data-page-header] h1 {
  position: relative;
  padding-top: 14px;
  margin-top: 0.5rem;
}
main h2::before,
main h3::before,
[data-page-header] h1::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 24px;
  height: 2px;
  background: linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%);
  border-radius: 1px;
}
main h2,
main h3 {
  font-family: var(--theme-font-display);
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  font-size: 0.78em;
  color: #cbd5e1; /* --color-tinta2 */
  margin-bottom: 0.85em;
}
[data-page-header] h1 {
  font-family: var(--theme-font-display);
  font-weight: 700;
  letter-spacing: -0.01em;
  text-transform: none;
  font-size: 2rem;
}

/* ── 5. Breadcrumb strip — top mono bar with pulse + org/deck ── */
.csi-breadcrumb {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-family: var(--theme-font-mono);
  font-size: 11px;
  color: #94a3b8; /* --color-tinta3 */
  letter-spacing: 0.04em;
  margin-bottom: 1rem;
}
.csi-breadcrumb .crumbs { display: flex; align-items: center; gap: 10px; }
.csi-breadcrumb .org {
  font-weight: 600;
  color: #60a5fa; /* --color-cielo */
}
.csi-breadcrumb .sep { color: #475569; /* --color-tinta4 */ }
.csi-breadcrumb .deck { color: #cbd5e1; /* --color-tinta2 */ }
.csi-breadcrumb .counter {
  font-variant-numeric: tabular-nums;
  color: #64748b;
}

/* ── 6. Footer mono strip — "Hecho con ♥ por Código Sin Siesta" ── */
.csi-footer {
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-family: var(--theme-font-mono);
  font-size: 11px;
  color: #64748b; /* --color-tinta4 */
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(96, 165, 250, 0.10);
  letter-spacing: 0.04em;
}
.csi-footer .heart { color: #3b82f6; /* --color-electrico */ }
.csi-footer a { color: #60a5fa; text-decoration: none; }
.csi-footer a:hover { text-decoration: underline; text-decoration-color: rgba(96, 165, 250, 0.4); }

/* ── 7. Card hover lift — CSS Theme card-glass hover state ── */
.card,
[data-slot="card"],
.rounded-xl.border,
.rounded-lg.border {
  transition: background 300ms ease-out,
              border-color 300ms ease-out,
              box-shadow 300ms ease-out,
              transform 300ms ease-out !important;
}
.card:hover,
[data-slot="card"]:hover,
.rounded-xl.border:hover,
.rounded-lg.border:hover {
  background: rgba(30, 58, 138, 0.32) !important;
  border-color: rgba(96, 165, 250, 0.45) !important;
  box-shadow:
    0 12px 40px 0 rgba(59, 130, 246, 0.22),
    inset 0 1px 1px 0 rgba(96, 165, 250, 0.25) !important;
  transform: translateY(-3px);
}

/* ── 8. Status pills — sky outline + pulse dot for "connected" ── */
.csi-status-pill {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px 3px 8px;
  font-family: var(--theme-font-mono);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #60a5fa;
  background: rgba(96, 165, 250, 0.10);
  border: 1px solid rgba(96, 165, 250, 0.32);
  border-radius: 999px;
}

/* ── 9. Owl mark — small footer decoration (SVG inline, brand color) ── */
.csi-owl-mark {
  width: 18px;
  height: 18px;
  display: inline-block;
  vertical-align: middle;
  margin-right: 6px;
  color: #60a5fa;
}

/* ── 10. Selection color — sky tint instead of default blue ── */
::selection {
  background: rgba(96, 165, 250, 0.35);
  color: #f1f5f9;
}

/* ── 11. Scrollbar — sky tint on the thumb ── */
::-webkit-scrollbar { width: 10px; height: 10px; }
::-webkit-scrollbar-track { background: rgba(15, 23, 42, 0.4); }
::-webkit-scrollbar-thumb {
  background: rgba(96, 165, 250, 0.25);
  border-radius: 8px;
  border: 2px solid rgba(15, 23, 42, 0.4);
}
::-webkit-scrollbar-thumb:hover { background: rgba(96, 165, 250, 0.45); }

/* ── 12. Sidebar brand cell — owl mark + 'Ibid' wordmark.
   App.tsx ships a #app-sidebar-brand wrapper containing
   #app-sidebar-brand-default ("Hermes / Agent"). This block hides the
   default text and paints the brand mark via two pseudo-elements on
   the wrapper so the slot survives without React changes. ── */
#app-sidebar-brand-default {
  display: none !important;
}
#app-sidebar-brand::before {
  /* Owl mark — inline SVG from @codigosinsiesta/theme brand assets
     (src/assets/logo-owl-csi.svg). Brand owl of codigosinsiesta.com,
     originally inlined in src/components/Header.astro of the
     codigosinsiesta repo with the comment
       "búho line-art, usa currentColor para el glow"
     Drawn at viewBox 25940 20865 18235 13449 with three layered groups:
       - body silhouette (fill #60a5fa)
       - eye outlines + beak diamond (stroke #60a5fa, w=470)
       - pupils (fill #60a5fa)
     Color is hardcoded to #60a5fa inside the data URI because
     background-image SVGs do not reliably resolve currentColor from
     the parent element's CSS color — most browsers fall back to
     black. filter: drop-shadow() still tints the glow correctly. */
  content: '' !important;
  display: inline-block !important;
  width: 30px !important;
  height: 30px !important;
  margin-right: 10px !important;
  flex-shrink: 0 !important;
  background-image: url("data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%2225940%2020865%2018235%2013449%22%3E%3Cg%20fill%3D%22%2360a5fa%22%20transform%3D%22scale%2869.3555%29%22%3E%3Cpath%20d%3D%22M589.101%20360.074C591.869%20358.292%20597.719%20355.519%20600.847%20353.924C602.794%20356.48%20604.808%20359.714%20606.597%20362.44C623.252%20389.004%20626.849%20420.901%20604.912%20446.158C585.302%20468.737%20547.778%20472.61%20525.096%20452.012C520.101%20460.517%20516.039%20468.896%20510.723%20477.568C506.619%20469.032%20502.192%20460.655%20497.452%20452.455C490.683%20458.77%20480.102%20463.442%20471.02%20464.843C438.832%20469.809%20408.761%20447.734%20404.085%20415.423C400.449%20390.299%20408.751%20373.454%20422.938%20353.781C427.504%20356.758%20429.417%20357.64%20434.396%20359.821C432.652%20361.878%20431.008%20364.018%20429.469%20366.233C384.113%20431.377%20464.177%20484.652%20500.054%20430.435C503.067%20434.628%20508.314%20444.435%20511.362%20449.491C513.805%20445.157%20519.531%20434.661%20522.508%20431.188C531.663%20441.817%20541.7%20450.955%20555.987%20452.456C582.667%20455.26%20605.292%20435.608%20607.367%20409.154C608.946%20389.019%20601.068%20374.903%20589.101%20360.074Z%22%2F%3E%3Cpath%20d%3D%22M611.748%20311.086C615.282%20311.435%20620.461%20311.318%20623.994%20310.931C622.865%20322.387%20621.431%20328.761%20613.782%20337.655C599.064%20353.343%20573.268%20354.631%20553.684%20362.806C527.511%20373.731%20522.7%20387.22%20512.449%20411.324C508.387%20402.997%20504.443%20394.844%20499.983%20386.966C481.597%20354.493%20440.861%20361.866%20414.338%20342.076C403.944%20334.321%20401.197%20324.115%20399.935%20311.401C402.592%20311.456%20404.973%20311.373%20407.615%20311.273C409.374%20311.15%20409.957%20311.135%20411.709%20311.244C413.195%20313.068%20413.414%20319.757%20416.295%20324.664C425.011%20339.507%20449.563%20342.493%20464.784%20347.084C485.788%20353.418%20501.09%20362.707%20511.855%20382.067C525.713%20356.031%20549.949%20349.191%20576.3%20342.19C584.408%20339.754%20592.432%20337.458%20599.49%20332.61C607.901%20326.833%20610.086%20320.575%20611.748%20311.086Z%22%2F%3E%3Cpath%20d%3D%22M500.362%20323.713C522.82%20321.922%20549.098%20325.617%20569.321%20335.574C564.502%20338.856%20560.246%20340.693%20555.534%20344.383C544.754%20339.687%20535.807%20337.91%20524.125%20336.591C503.495%20335.586%20487.693%20336.076%20468.244%20344.284C464.403%20341.022%20458.855%20338.295%20454.356%20335.796C466.119%20327.801%20486.414%20324.975%20500.362%20323.713Z%22%2F%3E%3C%2Fg%3E%0A%3Cg%20fill%3D%22none%22%20stroke%3D%22%2360a5fa%22%20stroke-width%3D%22470%22%20stroke-linejoin%3D%22round%22%20stroke-linecap%3D%22round%22%3E%3Ccircle%20cx%3D%2232320%22%20cy%3D%2228010%22%20r%3D%221950%22%2F%3E%3Ccircle%20cx%3D%2238908%22%20cy%3D%2228010%22%20r%3D%221950%22%2F%3E%3Cpath%20d%3D%22M35610%2030600%20L34850%2031600%20L35610%2032850%20L36370%2031600%20Z%22%2F%3E%3C%2Fg%3E%0A%3Cg%20fill%3D%22%2360a5fa%22%3E%3Ccircle%20cx%3D%2232320%22%20cy%3D%2228010%22%20r%3D%22560%22%2F%3E%3Ccircle%20cx%3D%2238908%22%20cy%3D%2228010%22%20r%3D%22560%22%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E") !important;
  background-repeat: no-repeat !important;
  background-position: center !important;
  background-size: contain !important;
  filter: drop-shadow(0 0 6px rgba(96, 165, 250, 0.45)) !important;
}
#app-sidebar-brand::after {
  /* Brand text — 'IBID CSS' in Space Grotesk 800, treated as a single
     product wordmark (the CSS theme is the fork's flagship, so the
     abbreviation lives next to the brand mark). */
  content: 'IBID CSS' !important;
  font-family: 'Space Grotesk', 'Inter', sans-serif !important;
  font-weight: 800 !important;
  font-size: 15px !important;
  line-height: 1 !important;
  letter-spacing: 0.02em !important;
  color: #f1f5f9 !important;
  text-transform: none !important;
  display: inline-block !important;
}
`,
};

export const BUILTIN_THEMES: Record<string, DashboardTheme> = {
  default: defaultTheme,
  "default-large": defaultLargeTheme,
  "nous-blue": nousBlueTheme,
  midnight: midnightTheme,
  ember: emberTheme,
  mono: monoTheme,
  cyberpunk: cyberpunkTheme,
  rose: roseTheme,
  "codigo-sin-siesta": codigoSinSiestaTheme,
};
