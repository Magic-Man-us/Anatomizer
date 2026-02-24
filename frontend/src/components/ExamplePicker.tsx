import { useMemo } from "react";
import type { CodeExample } from "../examples";
import { EXAMPLES } from "../examples";
import { COLORS } from "../theme";

/** Width of the collapsed icon rail (px). */
const COLLAPSED_WIDTH = 44;

/** Width of the expanded sidebar panel (px). */
const EXPANDED_WIDTH = 260;

/** Transition timing for expand/collapse animation. */
const TRANSITION = "width 0.25s cubic-bezier(0.4,0,0.2,1)";

interface ExampleSidebarProps {
  activeExampleId: string | null;
  onSelect: (example: CodeExample) => void;
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  isMobile?: boolean;
}

/**
 * Collapsible examples sidebar with language-icon rail.
 *
 * **Collapsed**: Thin column showing unique language badges (PY, RS, GO…).
 * Active example's language is highlighted. Click any badge to expand.
 *
 * **Expanded**: Full panel with scrollable example list. Smooth width transition.
 * Click the collapse chevron or select an example to browse.
 */
export function ExampleSidebar({
  activeExampleId,
  onSelect,
  open,
  onOpen,
  onClose,
  isMobile = false,
}: ExampleSidebarProps) {

  /** Unique languages in example order, for the collapsed icon rail. */
  const uniqueLangs = useMemo(() => {
    const seen = new Set<string>();
    const result: { lang: string; badge: string }[] = [];
    for (const ex of EXAMPLES) {
      if (!seen.has(ex.language)) {
        seen.add(ex.language);
        result.push({
          lang: ex.language,
          badge: ex.language.slice(0, 2).toUpperCase(),
        });
      }
    }
    return result;
  }, []);

  /** Language of the currently active example. */
  const activeLang = useMemo(() => {
    const active = EXAMPLES.find((e) => e.id === activeExampleId);
    return active?.language ?? null;
  }, [activeExampleId]);

  /* ── Mobile: full-screen overlay ──────────────────────────────── */
  if (isMobile) {
    return (
      <>
        {/* Collapsed rail — always visible */}
        {!open && (
          <div
            onClick={onOpen}
            style={{
              position: "fixed",
              top: 48,
              left: 0,
              bottom: 52,
              width: COLLAPSED_WIDTH,
              background: COLORS.panel,
              borderRight: `1px solid ${COLORS.border}`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              paddingTop: 8,
              gap: 4,
              zIndex: 50,
            }}
          >
            {uniqueLangs.map(({ lang, badge }) => (
              <LangBadge
                key={lang}
                badge={badge}
                active={lang === activeLang}
              />
            ))}
          </div>
        )}

        {/* Expanded overlay */}
        {open && (
          <>
            <div
              onClick={onClose}
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.45)",
                zIndex: 997,
              }}
            />
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
                boxShadow: "4px 0 20px rgba(0,0,0,0.25)",
              }}
            >
              <SidebarHeader count={EXAMPLES.length} onClose={onClose} />
              <ExampleList
                activeExampleId={activeExampleId}
                onSelect={(ex) => { onSelect(ex); onClose(); }}
                touchTarget
              />
            </div>
          </>
        )}
      </>
    );
  }

  /* ── Desktop: inline collapsible with smooth transition ───────── */
  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: COLORS.panel,
        borderRight: `1px solid ${COLORS.border}`,
        overflow: "hidden",
        width: open ? EXPANDED_WIDTH : COLLAPSED_WIDTH,
        transition: TRANSITION,
        flexShrink: 0,
      }}
    >
      {open ? (
        /* ── Expanded state ──────────────────────────────────────── */
        <>
          <SidebarHeader count={EXAMPLES.length} onClose={onClose} />
          <ExampleList
            activeExampleId={activeExampleId}
            onSelect={onSelect}
          />
        </>
      ) : (
        /* ── Collapsed icon rail ─────────────────────────────────── */
        <div
          onClick={onOpen}
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            paddingTop: 10,
            gap: 4,
            cursor: "pointer",
          }}
        >
          {uniqueLangs.map(({ lang, badge }) => (
            <LangBadge
              key={lang}
              badge={badge}
              active={lang === activeLang}
            />
          ))}
          {/* Expand hint */}
          <div style={{ marginTop: 8, color: COLORS.textMuted, opacity: 0.5 }}>
            <IconChevronRight size={10} />
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Sidebar header with title + close ──────────────────────────── */

function SidebarHeader({ count, onClose }: { count: number; onClose: () => void }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 12px 8px",
        borderBottom: `1px solid ${COLORS.border}`,
        flexShrink: 0,
      }}
    >
      <span
        style={{
          fontSize: 9,
          fontWeight: 700,
          color: COLORS.accent,
          letterSpacing: 1.2,
          textTransform: "uppercase",
        }}
      >
        Examples ({count})
      </span>
      <button
        onClick={onClose}
        aria-label="Collapse examples"
        style={{
          background: "transparent",
          border: "none",
          padding: 4,
          cursor: "pointer",
          color: COLORS.textMuted,
          display: "flex",
          alignItems: "center",
        }}
      >
        <IconChevronLeft size={14} />
      </button>
    </div>
  );
}

/* ── Scrollable example list ────────────────────────────────────── */

function ExampleList({
  activeExampleId,
  onSelect,
  touchTarget = false,
}: {
  activeExampleId: string | null;
  onSelect: (example: CodeExample) => void;
  touchTarget?: boolean;
}) {
  return (
    <div style={{ flex: 1, overflowY: "auto", padding: 6 }}>
      {EXAMPLES.map((example) => (
        <ExampleItem
          key={example.id}
          example={example}
          isActive={example.id === activeExampleId}
          onSelect={() => onSelect(example)}
          touchTarget={touchTarget}
        />
      ))}
    </div>
  );
}

/* ── Language badge (collapsed rail) ────────────────────────────── */

function LangBadge({ badge, active }: { badge: string; active: boolean }) {
  return (
    <div
      style={{
        width: 30,
        height: 26,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 5,
        fontSize: 9,
        fontWeight: 800,
        fontFamily: "'SF Mono',Consolas,monospace",
        color: active ? COLORS.accent : COLORS.textMuted,
        background: active ? `${COLORS.accent}18` : `${COLORS.textMuted}08`,
        border: active ? `1px solid ${COLORS.accent}40` : "1px solid transparent",
        transition: "all 0.2s",
      }}
    >
      {badge}
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

function IconChevronLeft({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ verticalAlign: "middle" }}>
      <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconChevronRight({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ verticalAlign: "middle" }}>
      <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
