import type { CompareAnalysis } from "../types";
import { COLORS } from "../theme";
import { Empty, ScrollPanel } from "./shared";
import { IconZap, IconCheck } from "./Icons";

interface CompareViewProps {
  data: CompareAnalysis | null;
  isMobile?: boolean;
}

export function CompareView({ data, isMobile = false }: CompareViewProps) {
  if (!data?.comparisons?.length)
    return <Empty icon={<IconZap size={13} />} label="Analyze to see pattern comparisons" />;

  return (
    <ScrollPanel>
      {data.comparisons.map((comp, ci) => (
        <div
          key={ci}
          style={{
            marginBottom: 16,
            background: COLORS.gutterBg,
            borderRadius: 8,
            border: `1px solid ${COLORS.border}`,
            overflow: "hidden",
          }}
        >
          {/* Title */}
          <div
            style={{
              padding: "8px 12px",
              background: COLORS.accentDim,
              fontSize: 12,
              fontWeight: 700,
              color: COLORS.accent,
            }}
          >
            {comp.title}
          </div>

          {/* Code patterns side by side */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
              borderBottom: `1px solid ${COLORS.border}`,
            }}
          >
            {comp.patterns.map((p, pi) => (
              <div
                key={pi}
                style={{
                  padding: 10,
                  borderRight:
                    !isMobile && pi === 0 ? `1px solid ${COLORS.border}` : "none",
                  borderBottom:
                    isMobile && pi === 0 ? `1px solid ${COLORS.border}` : "none",
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: pi === 0 ? COLORS.red : COLORS.green,
                    marginBottom: 4,
                    textTransform: "uppercase",
                  }}
                >
                  {p.label}
                </div>
                <pre
                  style={{
                    fontSize: 10,
                    color: COLORS.textDim,
                    fontFamily: "monospace",
                    whiteSpace: "pre-wrap",
                    margin: 0,
                  }}
                >
                  {p.code}
                </pre>
              </div>
            ))}
          </div>

          {/* Stats comparison */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr" }}>
            {comp.patterns.map((p, pi) => (
              <div
                key={pi}
                style={{
                  padding: 10,
                  borderRight:
                    !isMobile && pi === 0 ? `1px solid ${COLORS.border}` : "none",
                  borderBottom:
                    isMobile && pi === 0 ? `1px solid ${COLORS.border}` : "none",
                }}
              >
                <div style={{ fontSize: 11, color: COLORS.textDim }}>
                  <div>
                    Cycles:{" "}
                    <b
                      style={{
                        color: pi === 0 ? COLORS.orange : COLORS.green,
                      }}
                    >
                      {p.cycles}
                    </b>
                  </div>
                  <div>
                    Memory: <b style={{ color: COLORS.blue }}>{p.memory}</b>
                  </div>
                  {p.notes && (
                    <div
                      style={{
                        marginTop: 4,
                        fontSize: 10,
                        color: COLORS.textMuted,
                      }}
                    >
                      {p.notes}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Winner */}
          {comp.winner && (
            <div
              style={{
                padding: "6px 12px",
                background: `${COLORS.green}10`,
                fontSize: 11,
                color: COLORS.green,
              }}
            >
              <IconCheck size={12} /> {comp.winner}
            </div>
          )}
        </div>
      ))}
    </ScrollPanel>
  );
}
