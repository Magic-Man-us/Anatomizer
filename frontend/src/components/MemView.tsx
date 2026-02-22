import type { MemoryAnalysis } from "../types";
import { COLORS } from "../theme";
import { Empty, Stat, InfoBox, ScrollPanel } from "./shared";
import { IconZap } from "./Icons";

interface MemViewProps {
  data: MemoryAnalysis | null;
}

export function MemView({ data }: MemViewProps) {
  if (!data?.allocations?.length)
    return <Empty icon={<IconZap size={13} />} label="Analyze to see memory model" />;

  return (
    <ScrollPanel>
      <div style={{ display: "flex", gap: 16, marginBottom: 14, flexWrap: "wrap" }}>
        <Stat label="Stack" value={data.stackTotal || "—"} color={COLORS.green} />
        <Stat label="Heap" value={data.heapTotal || "—"} color={COLORS.orange} />
        <Stat label="Allocs" value={data.allocCount || 0} color={COLORS.blue} />
      </div>
      {data.allocations.map((a, i) => {
        const isHeap = a.type === "heap";
        const color = isHeap ? COLORS.orange : COLORS.green;
        return (
          <div
            key={i}
            style={{
              display: "grid",
              gridTemplateColumns: "64px 120px 1fr 60px",
              padding: "6px 10px",
              background: isHeap ? `${COLORS.orange}08` : `${COLORS.green}08`,
              border: `1px solid ${color}15`,
              borderRadius: 5,
              fontSize: 11,
              alignItems: "center",
              marginBottom: 3,
            }}
          >
            <span
              style={{
                color,
                fontWeight: 700,
                textTransform: "uppercase",
                fontSize: 9,
              }}
            >
              {a.type}
            </span>
            <span style={{ color: COLORS.cyan, fontFamily: "monospace" }}>
              {a.name}
            </span>
            <span style={{ color: COLORS.textDim }}>{a.detail}</span>
            <span
              style={{
                color: COLORS.textMuted,
                textAlign: "right",
                fontSize: 10,
              }}
            >
              {a.size}
            </span>
          </div>
        );
      })}
      {data.notes && (
        <InfoBox color={COLORS.blue} label="Notes" text={data.notes} />
      )}
    </ScrollPanel>
  );
}
