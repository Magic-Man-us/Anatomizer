import { COLORS, VIEWS } from "../theme";
import type { ViewIndex } from "../theme";
import type { AnalysisResponse } from "../types";
import { VIEW_ICON_COMPONENTS } from "./Icons";

interface ViewTabsProps {
  activeView: ViewIndex;
  setActiveView: (v: ViewIndex) => void;
  analysis: AnalysisResponse | null;
}

/** Tab bar for switching between the 7 visualization views. */
export function ViewTabs({ activeView, setActiveView, analysis }: ViewTabsProps) {
  /** Check whether a view has data to display. */
  const hasData = (idx: ViewIndex): boolean => {
    if (!analysis) return false;
    const slices = [
      analysis.execution,
      analysis.cost,
      analysis.memory,
      analysis.concurrency,
      analysis.assembly,
      analysis.debugger,
      analysis.compare,
    ] as const;
    const d = slices[idx];
    return d != null && JSON.stringify(d) !== "{}";
  };

  return (
    <div
      style={{
        display: "flex",
        borderBottom: `1px solid ${COLORS.border}`,
        background: COLORS.panel,
        flexShrink: 0,
      }}
    >
      {VIEWS.map((label, i) => {
        const idx = i as ViewIndex;
        const active = activeView === idx;
        const color = active ? COLORS.accent : COLORS.textMuted;
        const Icon = VIEW_ICON_COMPONENTS[idx];
        return (
          <button
            key={label}
            onClick={() => setActiveView(idx)}
            style={{
              flex: 1,
              padding: "8px 2px",
              border: "none",
              borderBottom: active
                ? `2px solid ${COLORS.accent}`
                : "2px solid transparent",
              background: "transparent",
              color,
              fontSize: 10,
              fontWeight: 600,
              cursor: "pointer",
              opacity: hasData(idx) ? 1 : 0.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
            }}
          >
            <Icon size={12} color={color} /> {label}
          </button>
        );
      })}
    </div>
  );
}
