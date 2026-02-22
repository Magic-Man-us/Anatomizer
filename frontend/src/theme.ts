// ---------------------------------------------------------------------------
// Theme system — CSS custom properties with dark/light mode toggle
// ---------------------------------------------------------------------------
// Structural colors (bg, text, borders, etc.) are CSS vars that swap on toggle.
// Semantic colors (green, red, yellow, etc.) stay as hex values because they're
// frequently composed with hex opacity suffixes like `${COLORS.red}18`.
// ---------------------------------------------------------------------------

/** Supported theme modes. */
export type ThemeMode = "dark" | "light";

/** localStorage key for persisted preference. */
const STORAGE_KEY = "anatomizer-theme" as const;

// ---------------------------------------------------------------------------
// Structural color maps — these change between themes via CSS custom properties
// ---------------------------------------------------------------------------

interface StructuralColors {
  bg: string;
  panel: string;
  border: string;
  accent: string;
  accentDim: string;
  accentAlpha10: string;
  accentAlpha25: string;
  accentAlpha40: string;
  text: string;
  textDim: string;
  textMuted: string;
  gutterBg: string;
  lineNum: string;
  btnDisabled: string;
  // Syntax highlighting
  hlKeyword: string;
  hlString: string;
  hlComment: string;
  hlNumber: string;
  hlFunction: string;
  hlMacro: string;
}

const DARK_STRUCTURAL: StructuralColors = {
  bg: "#0a0e17",
  panel: "#111827",
  border: "#1e293b",
  accent: "#6366f1",
  accentDim: "#6366f120",
  accentAlpha10: "#6366f110",
  accentAlpha25: "#6366f125",
  accentAlpha40: "#6366f140",
  text: "#e2e8f0",
  textDim: "#94a3b8",
  textMuted: "#64748b",
  gutterBg: "#0d1117",
  lineNum: "#4a5568",
  btnDisabled: "#334155",
  hlKeyword: "#c084fc",
  hlString: "#86efac",
  hlComment: "#64748b",
  hlNumber: "#fbbf24",
  hlFunction: "#67e8f9",
  hlMacro: "#f472b6",
};

const LIGHT_STRUCTURAL: StructuralColors = {
  bg: "#f8fafc",
  panel: "#ffffff",
  border: "#e2e8f0",
  accent: "#4f46e5",
  accentDim: "#4f46e510",
  accentAlpha10: "#4f46e510",
  accentAlpha25: "#4f46e525",
  accentAlpha40: "#4f46e540",
  text: "#1e293b",
  textDim: "#64748b",
  textMuted: "#94a3b8",
  gutterBg: "#f1f5f9",
  lineNum: "#94a3b8",
  btnDisabled: "#cbd5e1",
  hlKeyword: "#7c3aed",
  hlString: "#16a34a",
  hlComment: "#94a3b8",
  hlNumber: "#d97706",
  hlFunction: "#0891b2",
  hlMacro: "#db2777",
};

/** Map of structural key to CSS custom property name. */
const VAR_MAP: Record<keyof StructuralColors, string> = {
  bg: "--color-bg",
  panel: "--color-panel",
  border: "--color-border",
  accent: "--color-accent",
  accentDim: "--color-accent-dim",
  accentAlpha10: "--color-accent-a10",
  accentAlpha25: "--color-accent-a25",
  accentAlpha40: "--color-accent-a40",
  text: "--color-text",
  textDim: "--color-text-dim",
  textMuted: "--color-text-muted",
  gutterBg: "--color-gutter-bg",
  lineNum: "--color-line-num",
  btnDisabled: "--color-btn-disabled",
  hlKeyword: "--color-hl-keyword",
  hlString: "--color-hl-string",
  hlComment: "--color-hl-comment",
  hlNumber: "--color-hl-number",
  hlFunction: "--color-hl-function",
  hlMacro: "--color-hl-macro",
};

const THEMES: Record<ThemeMode, StructuralColors> = {
  dark: DARK_STRUCTURAL,
  light: LIGHT_STRUCTURAL,
};

// ---------------------------------------------------------------------------
// Semantic colors — static hex values, identical (or nearly so) in both themes.
// These are used with hex opacity suffixes (`${COLORS.red}18`) so they must
// remain raw hex strings, not CSS var references.
// ---------------------------------------------------------------------------

const SEMANTIC = {
  green: "#22c55e",
  yellow: "#eab308",
  red: "#ef4444",
  orange: "#f97316",
  blue: "#3b82f6",
  cyan: "#06b6d4",
  purple: "#a855f7",
  pink: "#ec4899",
} as const;

// ---------------------------------------------------------------------------
// Exported COLORS — structural as var() refs, semantic as raw hex
// ---------------------------------------------------------------------------

/** Color palette consumed by all components.
 *
 * Structural values are CSS var references (`var(--color-bg)`) — the actual
 * hex value is set on `:root` and swapped by `applyTheme()`.
 * Semantic values are raw hex strings safe for opacity-suffix composition.
 */
export const COLORS = {
  bg: "var(--color-bg)",
  panel: "var(--color-panel)",
  border: "var(--color-border)",
  accent: "var(--color-accent)",
  accentDim: "var(--color-accent-dim)",
  accentAlpha10: "var(--color-accent-a10)",
  accentAlpha25: "var(--color-accent-a25)",
  accentAlpha40: "var(--color-accent-a40)",
  text: "var(--color-text)",
  textDim: "var(--color-text-dim)",
  textMuted: "var(--color-text-muted)",
  gutterBg: "var(--color-gutter-bg)",
  lineNum: "var(--color-line-num)",
  btnDisabled: "var(--color-btn-disabled)",
  // Semantic — raw hex
  ...SEMANTIC,
} as const;

export type ColorKey = keyof typeof COLORS;

// ---------------------------------------------------------------------------
// Theme application — sets CSS vars on :root, data-theme on <html>
// ---------------------------------------------------------------------------

/** Apply a theme by setting CSS custom properties on the document root. */
export function applyTheme(mode: ThemeMode): void {
  const root = document.documentElement;
  const colors = THEMES[mode];

  for (const [key, varName] of Object.entries(VAR_MAP)) {
    root.style.setProperty(varName, colors[key as keyof StructuralColors]);
  }

  root.setAttribute("data-theme", mode);

  // Also set body background for edge cases (scroll overscroll, etc.)
  document.body.style.background = colors.bg;

  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // localStorage may be unavailable in some contexts
  }
}

/** Read the currently active theme from the DOM attribute. */
export function getTheme(): ThemeMode {
  const attr = document.documentElement.getAttribute("data-theme");
  return attr === "light" ? "light" : "dark";
}

/** Toggle between dark and light themes. Returns the new mode. */
export function toggleTheme(): ThemeMode {
  const next: ThemeMode = getTheme() === "dark" ? "light" : "dark";
  applyTheme(next);
  return next;
}

/** Read saved preference, falling back to system preference, then dark. */
export function getSavedOrSystemTheme(): ThemeMode {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    // ignore
  }
  if (typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: light)").matches) {
    return "light";
  }
  return "dark";
}

// ---------------------------------------------------------------------------
// View definitions — unchanged
// ---------------------------------------------------------------------------

/** View definitions — each tab in the visualization panel. */
export const VIEWS = [
  "Execution",
  "Cost Map",
  "Memory",
  "Concurrency",
  "Assembly",
  "Debugger",
  "Compare",
] as const;

export type ViewIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** Thread lane colors — cycles through for multiple threads. */
export const THREAD_COLORS = [
  SEMANTIC.blue,
  SEMANTIC.purple,
  SEMANTIC.cyan,
  SEMANTIC.green,
  SEMANTIC.orange,
] as const;
