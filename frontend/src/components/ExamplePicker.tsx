import type { CodeExample } from "../examples";
import { EXAMPLES } from "../examples";
import { COLORS } from "../theme";

interface ExampleSidebarProps {
  activeExampleId: string | null;
  onSelect: (example: CodeExample) => void;
}

/** Toggle button rendered in the header. */
export function ExampleToggle({
  open,
  onToggle,
}: {
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      aria-label="Toggle examples panel"
      style={{
        background: open ? `${COLORS.accent}18` : "transparent",
        border: `1px solid ${open ? COLORS.accent : COLORS.border}`,
        borderRadius: 6,
        padding: "5px 10px",
        color: open ? COLORS.accent : COLORS.textDim,
        fontSize: 11,
        fontWeight: 600,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 6,
        transition: "all 0.2s",
        whiteSpace: "nowrap",
      }}
    >
      <IconFolder size={12} />
      <span>Examples</span>
    </button>
  );
}

/** Slide-out sidebar showing all available examples. */
export function ExampleSidebar({ activeExampleId, onSelect }: ExampleSidebarProps) {
  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: COLORS.panel,
        borderRight: `1px solid ${COLORS.border}`,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "12px 14px 8px",
          fontSize: 9,
          fontWeight: 700,
          color: COLORS.textMuted,
          letterSpacing: 1.2,
          textTransform: "uppercase",
          borderBottom: `1px solid ${COLORS.border}`,
        }}
      >
        Examples ({EXAMPLES.length})
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: "auto", padding: 6 }}>
        {EXAMPLES.map((example) => {
          const isActive = example.id === activeExampleId;
          return (
            <button
              key={example.id}
              onClick={() => onSelect(example)}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 8,
                width: "100%",
                padding: "10px 10px",
                border: isActive
                  ? `1px solid ${COLORS.accent}40`
                  : "1px solid transparent",
                borderRadius: 6,
                background: isActive ? `${COLORS.accent}12` : "transparent",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.15s",
                marginBottom: 2,
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = `${COLORS.textMuted}10`;
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = isActive
                  ? `${COLORS.accent}12`
                  : "transparent";
              }}
            >
              {/* Language badge */}
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 800,
                  color: isActive ? COLORS.accent : COLORS.textMuted,
                  background: isActive
                    ? `${COLORS.accent}15`
                    : `${COLORS.textMuted}10`,
                  borderRadius: 3,
                  padding: "2px 5px",
                  lineHeight: "14px",
                  flexShrink: 0,
                  fontFamily: "'SF Mono',Consolas,monospace",
                  marginTop: 1,
                }}
              >
                {example.language.slice(0, 2).toUpperCase()}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: isActive ? COLORS.accent : COLORS.text,
                    lineHeight: "15px",
                  }}
                >
                  {example.title}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: COLORS.textMuted,
                    lineHeight: "14px",
                    marginTop: 2,
                  }}
                >
                  {example.description}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── Inline icon ─────────────────────────────────────────────────── */

function IconFolder({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      style={{ verticalAlign: "middle" }}
    >
      <path
        d="M2 4.5A1.5 1.5 0 013.5 3H6l1.5 1.5h5A1.5 1.5 0 0114 6v5.5a1.5 1.5 0 01-1.5 1.5h-9A1.5 1.5 0 012 11.5v-7z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}
