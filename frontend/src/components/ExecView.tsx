import type { ExecutionAnalysis } from "../types";
import { COLORS } from "../theme";
import { Empty, InfoBox, ScrollPanel } from "./shared";
import { IconZap } from "./Icons";

/** Cycle cost thresholds for color coding. */
const LOW_CYCLE_THRESHOLD = 1;
const MID_CYCLE_THRESHOLD = 5;
const HIGH_CYCLE_THRESHOLD = 20;
const BAR_MAX_PERCENT = 100;

function cycleColor(cycles: number): string {
  if (cycles <= LOW_CYCLE_THRESHOLD) return COLORS.green;
  if (cycles <= MID_CYCLE_THRESHOLD) return COLORS.yellow;
  if (cycles <= HIGH_CYCLE_THRESHOLD) return COLORS.orange;
  return COLORS.red;
}

interface ExecViewProps {
  data: ExecutionAnalysis | null;
  isMobile?: boolean;
}

export function ExecView({ data, isMobile = false }: ExecViewProps) {
  if (!data?.instructions?.length)
    return <Empty icon={<IconZap size={13} />} label="Analyze to see execution flow" />;

  const maxCycles = data.maxCycles || BAR_MAX_PERCENT;

  return (
    <ScrollPanel>
      <div style={{ fontSize: 12, color: COLORS.textDim, marginBottom: 10 }}>
        Pseudo-assembly with CPU cycle estimates
      </div>
      {data.instructions.map((inst, i) => {
        const cc = cycleColor(inst.cycles);
        const w = Math.min(BAR_MAX_PERCENT, (inst.cycles / maxCycles) * BAR_MAX_PERCENT);
        return (
          <div
            key={i}
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "42px 1fr 60px" : "42px 120px 1fr 60px 100px",
              alignItems: "center",
              padding: "4px 6px",
              borderRadius: 3,
              background: i % 2 === 0 ? COLORS.accentDim : "transparent",
              fontSize: 11,
              fontFamily: "monospace",
            }}
          >
            <span style={{ color: COLORS.textMuted }}>
              {String(i).padStart(3, "0")}
            </span>
            {isMobile ? (
              <span
                style={{
                  color: COLORS.textDim,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                <span style={{ color: COLORS.cyan, fontWeight: 600 }}>{inst.op}</span>{" "}
                {inst.detail}
              </span>
            ) : (
              <>
                <span style={{ color: COLORS.cyan, fontWeight: 600 }}>
                  {inst.op}
                </span>
                <span
                  style={{
                    color: COLORS.textDim,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {inst.detail}
                </span>
              </>
            )}
            <span style={{ color: cc, fontWeight: 700, textAlign: "right" }}>
              {inst.cycles}c
            </span>
            {!isMobile && <div
              style={{
                marginLeft: 6,
                height: 5,
                background: COLORS.border,
                borderRadius: 3,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${w}%`,
                  height: "100%",
                  background: cc,
                  borderRadius: 3,
                }}
              />
            </div>}
          </div>
        );
      })}
      {data.summary && (
        <InfoBox color={COLORS.accent} label="Summary" text={data.summary} />
      )}
    </ScrollPanel>
  );
}
