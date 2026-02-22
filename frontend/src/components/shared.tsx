import type { CSSProperties, ReactNode } from "react";
import { COLORS } from "../theme";

interface EmptyProps {
  label: string;
  /** Optional SVG icon rendered before "Hit ... {label}" text. */
  icon?: ReactNode;
}

/** Placeholder shown when a view has no data yet. */
export function Empty({ label, icon }: EmptyProps) {
  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: COLORS.textMuted,
        fontSize: 13,
        padding: 20,
        textAlign: "center",
        gap: 6,
      }}
    >
      {icon ? <>Hit {icon} {label}</> : label}
    </div>
  );
}

interface StatProps {
  label: string;
  value: string | number;
  color: string;
}

/** Single stat display with colored background. */
export function Stat({ label, value, color }: StatProps) {
  return (
    <div
      style={{
        padding: "6px 14px",
        background: `${color}10`,
        border: `1px solid ${color}30`,
        borderRadius: 6,
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: 16,
          fontWeight: 800,
          color,
          fontFamily: "monospace",
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 9, color: COLORS.textMuted, marginTop: 1 }}>
        {label}
      </div>
    </div>
  );
}

interface InfoBoxProps {
  color: string;
  label: string;
  text: string;
}

/** Colored info callout box. */
export function InfoBox({ color, label, text }: InfoBoxProps) {
  return (
    <div
      style={{
        marginTop: 14,
        padding: 10,
        background: `${color}12`,
        border: `1px solid ${color}30`,
        borderRadius: 6,
        fontSize: 11,
        color: COLORS.textDim,
        lineHeight: 1.6,
      }}
    >
      <b style={{ color }}>{label}:</b> {text}
    </div>
  );
}

interface ScrollPanelProps {
  children: ReactNode;
  style?: CSSProperties;
}

/** Scrollable panel wrapper used by most views. */
export function ScrollPanel({ children, style }: ScrollPanelProps) {
  return (
    <div
      style={{
        padding: 14,
        overflowY: "auto",
        height: "100%",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
