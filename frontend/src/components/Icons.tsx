import type { CSSProperties } from "react";

interface IconProps {
  size?: number;
  color?: string;
  style?: CSSProperties;
}

const DEFAULT_SIZE = 14;

/** Execution — play/flow arrow */
export function IconExec({ size = DEFAULT_SIZE, color = "currentColor", style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={style}>
      <path d="M4 2.5v11l9-5.5L4 2.5z" fill={color} />
    </svg>
  );
}

/** Cost Map — flame/heatmap */
export function IconCost({ size = DEFAULT_SIZE, color = "currentColor", style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={style}>
      <path
        d="M8 1C8 1 3 6 3 9.5C3 12 5.2 14 8 14s5-2 5-4.5C13 6 8 1 8 1zM8 12c-1.7 0-3-1.2-3-2.5C5 7.8 8 4 8 4s3 3.8 3 5.5C11 10.8 9.7 12 8 12z"
        fill={color}
      />
    </svg>
  );
}

/** Memory — stacked blocks */
export function IconMem({ size = DEFAULT_SIZE, color = "currentColor", style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={style}>
      <rect x="2" y="9" width="12" height="4" rx="1" stroke={color} strokeWidth="1.5" />
      <rect x="4" y="5" width="8" height="3.5" rx="1" stroke={color} strokeWidth="1.5" />
      <rect x="5.5" y="2" width="5" height="2.5" rx="0.75" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

/** Concurrency — parallel tracks */
export function IconConc({ size = DEFAULT_SIZE, color = "currentColor", style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={style}>
      <path d="M2 4h12M2 8h12M2 12h12" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="5" cy="4" r="1.5" fill={color} />
      <circle cx="10" cy="8" r="1.5" fill={color} />
      <circle cx="7" cy="12" r="1.5" fill={color} />
    </svg>
  );
}

/** Assembly — angle brackets / low-level */
export function IconAsm({ size = DEFAULT_SIZE, color = "currentColor", style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={style}>
      <path d="M5 3L1.5 8 5 13" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11 3l3.5 5L11 13" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.5 2l-3 12" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/** Debugger — breakpoint circle with pause bars */
export function IconDebug({ size = DEFAULT_SIZE, color = "currentColor", style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={style}>
      <circle cx="8" cy="8" r="6" stroke={color} strokeWidth="1.5" />
      <rect x="5.5" y="5" width="2" height="6" rx="0.5" fill={color} />
      <rect x="8.5" y="5" width="2" height="6" rx="0.5" fill={color} />
    </svg>
  );
}

/** Compare — side-by-side diff arrows */
export function IconCompare({ size = DEFAULT_SIZE, color = "currentColor", style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={style}>
      <path d="M2 5h8M7 2l3 3-3 3" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 11H6M9 14l-3-3 3-3" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Sun — light mode indicator */
export function IconSun({ size = DEFAULT_SIZE, color = "currentColor", style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={style}>
      <circle cx="8" cy="8" r="3" stroke={color} strokeWidth="1.5" />
      <path
        d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.4 3.4l1.4 1.4M11.2 11.2l1.4 1.4M3.4 12.6l1.4-1.4M11.2 4.8l1.4-1.4"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Moon — dark mode indicator */
export function IconMoon({ size = DEFAULT_SIZE, color = "currentColor", style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={style}>
      <path
        d="M13.5 9.5a5.5 5.5 0 01-7-7 5.5 5.5 0 107 7z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** GitHub octocat logo */
export function IconGitHub({ size = DEFAULT_SIZE, color = "currentColor", style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill={color} style={style}>
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Utility icons — replacements for emoji characters
// ---------------------------------------------------------------------------

/** Zap / lightning bolt */
export function IconZap({ size = DEFAULT_SIZE, color = "currentColor", style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ verticalAlign: "middle", ...style }}>
      <path d="M9 1L3 9h4.5l-1 6L13 7H8.5L9 1z" fill={color} />
    </svg>
  );
}

/** Warning triangle */
export function IconWarning({ size = DEFAULT_SIZE, color = "currentColor", style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ verticalAlign: "middle", ...style }}>
      <path d="M8 1.5L1 14h14L8 1.5z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M8 6v4" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="8" cy="12" r="0.75" fill={color} />
    </svg>
  );
}

/** Hourglass / loading indicator */
export function IconHourglass({ size = DEFAULT_SIZE, color = "currentColor", style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ verticalAlign: "middle", ...style }}>
      <path d="M4 1h8M4 15h8M4.5 1v3.5L8 8l-3.5 3.5V15M11.5 1v3.5L8 8l3.5 3.5V15" stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Skip to start */
export function IconSkipBack({ size = DEFAULT_SIZE, color = "currentColor", style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ verticalAlign: "middle", ...style }}>
      <path d="M12 3L6 8l6 5V3z" fill={color} />
      <path d="M4 3v10" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/** Previous / chevron left */
export function IconChevronLeft({ size = DEFAULT_SIZE, color = "currentColor", style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ verticalAlign: "middle", ...style }}>
      <path d="M10 3L5 8l5 5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Next / chevron right */
export function IconChevronRight({ size = DEFAULT_SIZE, color = "currentColor", style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ verticalAlign: "middle", ...style }}>
      <path d="M6 3l5 5-5 5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Skip to end */
export function IconSkipForward({ size = DEFAULT_SIZE, color = "currentColor", style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ verticalAlign: "middle", ...style }}>
      <path d="M4 3l6 5-6 5V3z" fill={color} />
      <path d="M12 3v10" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/** Right arrow */
export function IconArrowRight({ size = DEFAULT_SIZE, color = "currentColor", style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ verticalAlign: "middle", ...style }}>
      <path d="M2 8h11M9 4l4 4-4 4" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Check mark */
export function IconCheck({ size = DEFAULT_SIZE, color = "currentColor", style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ verticalAlign: "middle", ...style }}>
      <path d="M3 8.5l3.5 3.5L13 4" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Light bulb / suggestion indicator */
export function IconLightbulb({ size = DEFAULT_SIZE, color = "currentColor", style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ verticalAlign: "middle", ...style }}>
      <path d="M6 13h4M6.5 14.5h3M8 1a5 5 0 00-2.5 9.33V12h5v-1.67A5 5 0 008 1z" stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Clipboard / document */
export function IconClipboard({ size = DEFAULT_SIZE, color = "currentColor", style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ verticalAlign: "middle", ...style }}>
      <rect x="3" y="2" width="10" height="12" rx="1.5" stroke={color} strokeWidth="1.3" />
      <path d="M6 1.5h4a1 1 0 011 1v1H5v-1a1 1 0 011-1z" stroke={color} strokeWidth="1.3" />
      <path d="M5.5 7h5M5.5 9.5h3.5" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

/** All view icons as an ordered array matching VIEWS. */
export const VIEW_ICON_COMPONENTS = [
  IconExec,
  IconCost,
  IconMem,
  IconConc,
  IconAsm,
  IconDebug,
  IconCompare,
] as const;
