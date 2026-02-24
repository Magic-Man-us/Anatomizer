import type { CostAnalysis } from "../types";
import { COLORS } from "../theme";
import { Empty, InfoBox, ScrollPanel } from "./shared";
import { IconZap } from "./Icons";

/** Thresholds for cost heatmap coloring. */
const LOW_THRESHOLD = 0.3;
const MID_THRESHOLD = 0.6;
const OPACITY_SCALE_LOW = 0.4;
const OPACITY_SCALE_HIGH = 0.5;

function costBackground(normalized: number): string {
  if (normalized === 0) return "transparent";
  if (normalized < LOW_THRESHOLD)
    return `rgba(34,197,94,${normalized * OPACITY_SCALE_LOW})`;
  if (normalized < MID_THRESHOLD)
    return `rgba(234,179,8,${normalized * OPACITY_SCALE_LOW})`;
  return `rgba(239,68,68,${normalized * OPACITY_SCALE_HIGH})`;
}

function costColor(normalized: number): string {
  if (normalized < LOW_THRESHOLD) return COLORS.green;
  if (normalized < MID_THRESHOLD) return COLORS.yellow;
  return COLORS.red;
}

interface CostViewProps {
  data: CostAnalysis | null;
  code: string;
  isMobile?: boolean;
}

export function CostView({ data, code, isMobile = false }: CostViewProps) {
  if (!data?.lines?.length)
    return <Empty icon={<IconZap size={13} />} label="Analyze to see cost heatmap" />;

  const lines = code.split("\n");
  const maxCost = data.maxCost || 100;

  return (
    <ScrollPanel style={{ fontFamily: "monospace", fontSize: 11 }}>
      {lines.map((line, i) => {
        const info = data.lines.find((l) => l.line === i + 1);
        const cost = info?.cost ?? 0;
        const n = Math.min(1, cost / maxCost);
        return (
          <div
            key={i}
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "28px 1fr 70px" : "32px 1fr 90px",
              padding: "2px 6px",
              background: costBackground(n),
              borderRadius: 2,
              alignItems: "center",
            }}
          >
            <span style={{ color: COLORS.textMuted, fontSize: 10 }}>
              {i + 1}
            </span>
            <span style={{ color: COLORS.text, whiteSpace: "pre" }}>
              {line || " "}
            </span>
            {info && (
              <span
                style={{
                  textAlign: "right",
                  fontSize: 9,
                  color: costColor(n),
                  fontWeight: 600,
                }}
              >
                {info.label}
              </span>
            )}
          </div>
        );
      })}
      {data.insights && (
        <InfoBox color={COLORS.orange} label="Optimization" text={data.insights} />
      )}
    </ScrollPanel>
  );
}
