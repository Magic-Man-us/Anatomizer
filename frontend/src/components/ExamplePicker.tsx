import type { CodeExample } from "../examples";
import { EXAMPLES } from "../examples";
import { COLORS } from "../theme";

/** Width of the collapsed sidebar rail (px). */
const RAIL_WIDTH = 38;

/** Width of the expanded sidebar panel (px). */
export const SIDEBAR_EXPANDED_WIDTH = 240;

interface ExampleSidebarProps {
  activeExampleId: string | null;
  onSelect: (example: CodeExample) => void;
  open: boolean;
  onToggle: () => void;
  isMobile?: boolean;
}

/**
 * Collapsible examples sidebar.
 *
 * **Desktop**: Always rendered on the left edge.
 *   - Collapsed: a narrow rail with a vertical "Examples" label + chevron.
 *   - Expanded: full 240px panel with scrollable example list.
 *
 * **Mobile**: Full-screen overlay with backdrop, triggered by the rail.
 */
export function ExampleSidebar({
  activeExampleId,
  onSelect,
  open,
  onToggle,
  isMobile = false,
}: ExampleSidebarProps) {

  /* ── Mobile: full-screen overlay ──────────────────────────────── */
  if (isMobile) {
    return (
      <>
        {/* Collapsed rail — always visible at left edge */}
        <div
          onClick={onToggle}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            bottom: 0,
            width: RAIL_WIDTH,
            background: COLORS.panel,
            borderRight: `1px solid ${COLORS.border}`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            zIndex: 900,
          }}
        >
          <span
            style={{
              writingMode: "vertical-rl",
              textOrientation: "mixed",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 1.5,
              color: COLORS.accent,
              textTransform: "uppercase",
            }}
          >
            Examples
          </span>
          <IconChevronRight size={12} style={{ marginTop: 6, color: COLORS.accent }} />
        </div>

        {/* Expanded overlay */}
        {open && (
          <>
            {/* Backdrop */}
            <div
              onClick={onToggle}
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.5)",
                zIndex: 997,
              }}
            />
            {/* Panel */}
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                bottom: 0,
                width: "85vw",
                maxWidth: 320,
                background: COLORS.panel,
                zIndex: 999,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                boxShadow: "4px 0 24px rgba(0,0,0,0.3)",
              }}
            >
              {/* Header with close */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "14px 14px 10px",
                  borderBottom: `1px solid ${COLORS.border}`,
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: COLORS.accent,
                    letterSpacing: 0.5,
                    textTransform: "uppercase",
                  }}
                >
                  <IconFolder size={13} /> Examples ({EXAMPLES.length})
                </span>
                <button
                  onClick={onToggle}
                  aria-label="Close examples"
                  style={{
                    background: "transparent",
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: 6,
                    padding: "6px 12px",
                    color: COLORS.textDim,
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Close
                </button>
              </div>
              {/* List */}
              <div style={{ flex: 1, overflowY: "auto", padding: 6 }}>
                {EXAMPLES.map((example) => (
                  <ExampleItem
                    key={example.id}
                    example={example}
                    isActive={example.id === activeExampleId}
                    onSelect={() => { onSelect(example); onToggle(); }}
                    touchTarget
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </>
    );
  }

  /* ── Desktop: inline collapsible sidebar ──────────────────────── */
  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: COLORS.panel,
        borderRight: `1px solid ${COLORS.border}`,
        overflow: "hidden",
        width: open ? SIDEBAR_EXPANDED_WIDTH : RAIL_WIDTH,
        transition: "width 0.2s ease",
        flexShrink: 0,
      }}
    >
      {/* Toggle handle / header */}
      <div
        onClick={onToggle}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: open ? "12px 14px 8px" : "12px 0 8px",
          justifyContent: open ? "space-between" : "center",
          borderBottom: `1px solid ${COLORS.border}`,
          cursor: "pointer",
          userSelect: "none",
          transition: "all 0.2s",
        }}
      >
        {open ? (
          <>
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                color: COLORS.accent,
                letterSpacing: 1.2,
                textTransform: "uppercase",
              }}
            >
              Examples ({EXAMPLES.length})
            </span>
            <IconChevronLeft size={12} style={{ color: COLORS.textMuted }} />
          </>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
            }}
          >
            <IconFolder size={14} style={{ color: COLORS.accent }} />
            <span
              style={{
                writingMode: "vertical-rl",
                textOrientation: "mixed",
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: 1.5,
                color: COLORS.accent,
                textTransform: "uppercase",
              }}
            >
              Examples
            </span>
          </div>
        )}
      </div>

      {/* Example list — only rendered when expanded */}
      {open && (
        <div style={{ flex: 1, overflowY: "auto", padding: 6 }}>
          {EXAMPLES.map((example) => (
            <ExampleItem
              key={example.id}
              example={example}
              isActive={example.id === activeExampleId}
              onSelect={() => onSelect(example)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Example list item ──────────────────────────────────────────── */

function ExampleItem({
  example,
  isActive,
  onSelect,
  touchTarget = false,
}: {
  example: CodeExample;
  isActive: boolean;
  onSelect: () => void;
  touchTarget?: boolean;
}) {
  return (
    <button
      onClick={onSelect}
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
        minHeight: touchTarget ? 44 : undefined,
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
}

/* ── Inline icons ───────────────────────────────────────────────── */

function IconFolder({ size = 14, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      style={{ verticalAlign: "middle", ...style }}
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

function IconChevronLeft({ size = 14, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      style={{ verticalAlign: "middle", ...style }}
    >
      <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconChevronRight({ size = 14, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      style={{ verticalAlign: "middle", ...style }}
    >
      <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
