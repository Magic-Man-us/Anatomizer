import { useState, useEffect } from "react";
import type { DebuggerAnalysis } from "../types";
import { COLORS } from "../theme";
import { Empty } from "./shared";
import { IconSkipBack, IconChevronLeft, IconChevronRight, IconSkipForward, IconArrowRight, IconZap } from "./Icons";

const BTN_STYLE: React.CSSProperties = {
  background: COLORS.border,
  border: `1px solid ${COLORS.border}`,
  borderRadius: 4,
  padding: "4px 10px",
  color: COLORS.text,
  fontSize: 12,
  cursor: "pointer",
};

/** Minimum touch target size for mobile accessibility (px). */
const MOBILE_TOUCH_TARGET = 44;

interface DebugViewProps {
  data: DebuggerAnalysis | null;
  code: string;
  isMobile?: boolean;
}

export function DebugView({ data, code, isMobile = false }: DebugViewProps) {
  const [step, setStep] = useState(0);

  // Reset step when data changes
  useEffect(() => setStep(0), [data]);

  if (!data?.steps?.length)
    return <Empty icon={<IconZap size={13} />} label="Analyze to step through execution" />;

  const s = data.steps[step]!;
  const lines = code.split("\n");
  const totalSteps = data.steps.length;

  return (
    <div
      style={{
        padding: 14,
        overflowY: "auto",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      {/* Step controls */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexShrink: 0,
        }}
      >
        <button
          onClick={() => setStep(0)}
          disabled={step === 0}
          style={{ ...BTN_STYLE, ...(isMobile && { minWidth: MOBILE_TOUCH_TARGET, minHeight: MOBILE_TOUCH_TARGET, display: "flex", alignItems: "center", justifyContent: "center" }) }}
        >
          <IconSkipBack size={12} />
        </button>
        <button
          onClick={() => setStep(Math.max(0, step - 1))}
          disabled={step === 0}
          style={{ ...BTN_STYLE, ...(isMobile && { minWidth: MOBILE_TOUCH_TARGET, minHeight: MOBILE_TOUCH_TARGET, display: "flex", alignItems: "center", justifyContent: "center" }) }}
        >
          <IconChevronLeft size={12} />
        </button>
        <div
          style={{
            flex: 1,
            textAlign: "center",
            fontSize: 12,
            color: COLORS.text,
          }}
        >
          Step <b style={{ color: COLORS.accent }}>{step + 1}</b> / {totalSteps}
        </div>
        <button
          onClick={() => setStep(Math.min(totalSteps - 1, step + 1))}
          disabled={step >= totalSteps - 1}
          style={{ ...BTN_STYLE, ...(isMobile && { minWidth: MOBILE_TOUCH_TARGET, minHeight: MOBILE_TOUCH_TARGET, display: "flex", alignItems: "center", justifyContent: "center" }) }}
        >
          <IconChevronRight size={12} />
        </button>
        <button
          onClick={() => setStep(totalSteps - 1)}
          disabled={step >= totalSteps - 1}
          style={{ ...BTN_STYLE, ...(isMobile && { minWidth: MOBILE_TOUCH_TARGET, minHeight: MOBILE_TOUCH_TARGET, display: "flex", alignItems: "center", justifyContent: "center" }) }}
        >
          <IconSkipForward size={12} />
        </button>
      </div>

      {/* Code display with current line highlighted */}
      <div
        style={{
          background: COLORS.gutterBg,
          borderRadius: 6,
          padding: 8,
          fontFamily: "monospace",
          fontSize: 11,
          maxHeight: 180,
          overflowY: "auto",
          flexShrink: 0,
        }}
      >
        {lines.map((line, i) => {
          const isActive = s.line === i + 1;
          return (
            <div
              key={i}
              style={{
                display: "flex",
                gap: 8,
                padding: "1px 4px",
                background: isActive ? COLORS.accentAlpha25 : "transparent",
                borderLeft: isActive
                  ? `3px solid ${COLORS.accent}`
                  : "3px solid transparent",
                borderRadius: 2,
              }}
            >
              <span
                style={{
                  color: COLORS.lineNum,
                  width: 24,
                  textAlign: "right",
                  flexShrink: 0,
                }}
              >
                {i + 1}
              </span>
              <span
                style={{
                  color: isActive ? COLORS.text : COLORS.textMuted,
                  whiteSpace: "pre",
                }}
              >
                {line}
              </span>
            </div>
          );
        })}
      </div>

      {/* Variables & Stack */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
          gap: 10,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            background: COLORS.gutterBg,
            borderRadius: 6,
            padding: 10,
            border: `1px solid ${COLORS.border}`,
          }}
        >
          <div
            style={{
              fontSize: 10,
              color: COLORS.accent,
              fontWeight: 700,
              marginBottom: 6,
            }}
          >
            VARIABLES / STATE
          </div>
          {s.registers &&
            Object.entries(s.registers).map(([k, v]) => (
              <div
                key={k}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 11,
                  fontFamily: "monospace",
                  padding: "1px 0",
                }}
              >
                <span style={{ color: COLORS.cyan }}>{k}</span>
                <span style={{ color: COLORS.yellow }}>{String(v)}</span>
              </div>
            ))}
        </div>
        <div
          style={{
            background: COLORS.gutterBg,
            borderRadius: 6,
            padding: 10,
            border: `1px solid ${COLORS.border}`,
          }}
        >
          <div
            style={{
              fontSize: 10,
              color: COLORS.green,
              fontWeight: 700,
              marginBottom: 6,
            }}
          >
            STACK / MEMORY
          </div>
          {s.stack?.map((item, i) => (
            <div
              key={i}
              style={{
                fontSize: 11,
                fontFamily: "monospace",
                color: COLORS.textDim,
                padding: "1px 0",
              }}
            >
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* Step description */}
      <div
        style={{
          background: COLORS.accentAlpha10,
          border: `1px solid ${COLORS.accentAlpha25}`,
          borderRadius: 6,
          padding: 10,
          fontSize: 11,
          color: COLORS.textDim,
          lineHeight: 1.5,
        }}
      >
        <IconArrowRight size={12} color={COLORS.accent} /> {s.description}
      </div>
    </div>
  );
}
