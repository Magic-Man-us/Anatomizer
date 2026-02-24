import type { AssemblyAnalysis } from "../types";
import { COLORS } from "../theme";
import { Empty, InfoBox, ScrollPanel } from "./shared";
import { IconZap } from "./Icons";

/** Determine instruction color by opcode category. */
function opcodeColor(op: string): string {
  if (/^(call|jmp|je|jne|jg|jl|ret)/.test(op)) return COLORS.yellow;
  if (/^(mov|lea|load|store)/.test(op)) return COLORS.cyan;
  if (/^(add|sub|mul|imul|div|inc|dec|cmp|xor|and|or|shl|shr)/.test(op))
    return COLORS.green;
  return COLORS.text;
}

interface AsmViewProps {
  data: AssemblyAnalysis | null;
  isMobile?: boolean;
}

export function AsmView({ data, isMobile = false }: AsmViewProps) {
  if (!data?.blocks?.length)
    return <Empty icon={<IconZap size={13} />} label="Analyze to see assembly output" />;

  return (
    <ScrollPanel style={{ fontFamily: "monospace", fontSize: 11 }}>
      <div
        style={{
          fontSize: 12,
          color: COLORS.textDim,
          marginBottom: 10,
          fontFamily: "sans-serif",
        }}
      >
        Target: <b style={{ color: COLORS.pink }}>{data.arch || "x86-64"}</b>
      </div>
      {data.blocks.map((blk, bi) => (
        <div key={bi} style={{ marginBottom: 14 }}>
          <div
            style={{
              color: COLORS.pink,
              fontWeight: 700,
              fontSize: 12,
              marginBottom: 4,
              padding: "4px 0",
              borderBottom: `1px solid ${COLORS.border}`,
            }}
          >
            {blk.label}
          </div>
          {blk.instructions.map((ins, ii) => (
            <div
              key={ii}
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "40px 1fr" : "60px 1fr 1fr",
                padding: "2px 4px",
                color: COLORS.text,
              }}
            >
              <span style={{ color: COLORS.textMuted }}>{ins.addr || ""}</span>
              <span style={{ color: opcodeColor(ins.op || "") }}>
                {ins.op} {ins.operands || ""}
              </span>
              {!isMobile && (
                <span style={{ color: COLORS.textMuted, fontSize: 10 }}>
                  {ins.comment || ""}
                </span>
              )}
            </div>
          ))}
        </div>
      ))}
      {data.notes && (
        <InfoBox color={COLORS.pink} label="Notes" text={data.notes} />
      )}
    </ScrollPanel>
  );
}
