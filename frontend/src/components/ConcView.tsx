import type { ConcurrencyAnalysis } from "../types";
import { COLORS, THREAD_COLORS } from "../theme";
import { Empty, InfoBox, ScrollPanel } from "./shared";
import { IconZap, IconWarning } from "./Icons";

/** Map thread event type to display color. */
function eventColor(eventType: string): string {
  switch (eventType) {
    case "lock":
      return COLORS.yellow;
    case "unlock":
      return COLORS.green;
    case "read":
      return COLORS.blue;
    case "write":
      return COLORS.orange;
    case "race":
      return COLORS.red;
    default:
      return COLORS.textMuted;
  }
}

interface ConcViewProps {
  data: ConcurrencyAnalysis | null;
}

export function ConcView({ data }: ConcViewProps) {
  if (!data?.threads?.length)
    return <Empty icon={<IconZap size={13} />} label="Analyze to see concurrency map" />;

  return (
    <ScrollPanel>
      {data.warnings.length > 0 && (
        <div
          style={{
            padding: 8,
            background: `${COLORS.red}18`,
            border: `1px solid ${COLORS.red}30`,
            borderRadius: 6,
            marginBottom: 12,
            fontSize: 11,
            color: COLORS.red,
          }}
        >
          <IconWarning size={11} /> {data.warnings.join(" | ")}
        </div>
      )}
      {data.threads.map((t, ti) => {
        const col = THREAD_COLORS[ti % THREAD_COLORS.length]!;
        return (
          <div
            key={ti}
            style={{
              padding: 10,
              background: `${col}06`,
              border: `1px solid ${col}20`,
              borderRadius: 6,
              marginBottom: 8,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: col,
                marginBottom: 6,
              }}
            >
              {t.name}
            </div>
            <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
              {t.events.map((ev, ei) => {
                const ec = eventColor(ev.type);
                const isRace = ev.type === "race";
                return (
                  <div
                    key={ei}
                    style={{
                      padding: "3px 8px",
                      borderRadius: 3,
                      background: `${ec}18`,
                      border: `1px solid ${ec}30`,
                      fontSize: 9,
                      color: ec,
                      fontFamily: "monospace",
                      fontWeight: isRace ? 700 : 400,
                    }}
                  >
                    {isRace ? <><IconWarning size={9} />{" "}</> : null}
                    {ev.label}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      {data.analysis && (
        <InfoBox color={COLORS.purple} label="Analysis" text={data.analysis} />
      )}
    </ScrollPanel>
  );
}
