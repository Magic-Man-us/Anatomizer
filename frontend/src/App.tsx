import { useState, useCallback } from "react";
import type { AnalysisResponse } from "./types";
import type { CodeExample } from "./examples";
import { EXAMPLES, DEFAULT_EXAMPLE_ID } from "./examples";
import type { ViewIndex } from "./theme";
import { COLORS, toggleTheme, getTheme } from "./theme";
import { detectLanguage } from "./highlight";
import { analyze as analyzeCode, resetBackendCheck } from "./api";
import { IconSun, IconMoon, IconGitHub, IconZap, IconWarning, IconHourglass, IconClipboard } from "./components/Icons";
import { useIsMobile } from "./hooks/useIsMobile";

import { CodeEditor } from "./components/CodeEditor";
import { ViewTabs } from "./components/ViewTabs";
import { ExecView } from "./components/ExecView";
import { CostView } from "./components/CostView";
import { MemView } from "./components/MemView";
import { ConcView } from "./components/ConcView";
import { AsmView } from "./components/AsmView";
import { DebugView } from "./components/DebugView";
import { CompareView } from "./components/CompareView";
import { AIChatPanel } from "./components/AIChatPanel";
import { ExampleSidebar } from "./components/ExamplePicker";

/** Height of the mobile bottom navigation bar (px). */
const MOBILE_NAV_HEIGHT = 52;

/** Height of the header row (px). */
const HEADER_HEIGHT = 48;

/** Active mobile panel — which full-screen panel is visible. */
type MobilePanel = "code" | "analysis";

const DEFAULT_EXAMPLE = EXAMPLES.find((e) => e.id === DEFAULT_EXAMPLE_ID)!;

export default function App() {
  const [code, setCode] = useState(DEFAULT_EXAMPLE.code);
  const [activeView, setActiveView] = useState<ViewIndex>(0);
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState(false);
  const [activeExampleId, setActiveExampleId] = useState<string | null>(DEFAULT_EXAMPLE_ID);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>("code");

  const [isDark, setIsDark] = useState(() => getTheme() === "dark");
  const isMobile = useIsMobile();
  const lang = detectLanguage(code);

  const handleToggleTheme = useCallback(() => {
    const next = toggleTheme();
    setIsDark(next === "dark");
  }, []);

  const handleSelectExample = useCallback((example: CodeExample) => {
    setCode(example.code);
    setActiveExampleId(example.id);
    setAnalysis(null);
    setError(null);
    setDemoMode(false);
  }, []);

  const handleAnalyze = async () => {
    setBusy(true);
    setError(null);
    try {
      const { data, demo } = await analyzeCode(code, lang);
      setAnalysis(data);
      setDemoMode(demo);
      // Auto-switch to analysis panel on mobile so user sees results
      if (isMobile) setMobilePanel("analysis");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      setError(msg);
    } finally {
      setBusy(false);
    }
  };

  const handleRetryLive = () => {
    resetBackendCheck();
    setDemoMode(false);
    setAnalysis(null);
  };

  const handleToggleSidebar = useCallback(() => {
    setSidebarOpen((p) => !p);
  }, []);

  const renderActiveView = () => {
    switch (activeView) {
      case 0:
        return <ExecView data={analysis?.execution ?? null} isMobile={isMobile} />;
      case 1:
        return <CostView data={analysis?.cost ?? null} code={code} isMobile={isMobile} />;
      case 2:
        return <MemView data={analysis?.memory ?? null} isMobile={isMobile} />;
      case 3:
        return <ConcView data={analysis?.concurrency ?? null} />;
      case 4:
        return <AsmView data={analysis?.assembly ?? null} isMobile={isMobile} />;
      case 5:
        return <DebugView data={analysis?.debugger ?? null} code={code} isMobile={isMobile} />;
      case 6:
        return <CompareView data={analysis?.compare ?? null} isMobile={isMobile} />;
    }
  };

  /* ── Mobile layout ──────────────────────────────────────────────── */

  if (isMobile) {
    return (
      <div
        style={{
          width: "100vw",
          height: "100vh",
          background: COLORS.bg,
          display: "grid",
          gridTemplateColumns: "1fr",
          gridTemplateRows: demoMode
            ? `${HEADER_HEIGHT}px auto 1fr ${MOBILE_NAV_HEIGHT}px`
            : `${HEADER_HEIGHT}px 1fr ${MOBILE_NAV_HEIGHT}px`,
          fontFamily: "'Inter',system-ui,sans-serif",
          color: COLORS.text,
          overflow: "hidden",
        }}
      >
        {/* ── Mobile header ──────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 12px",
            borderBottom: `1px solid ${COLORS.border}`,
            background: COLORS.panel,
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 800, color: COLORS.accent, display: "flex", alignItems: "center", gap: 4 }}>
            <IconZap size={13} /> Anatomizer
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {error && (
              <span style={{ fontSize: 10, color: COLORS.red, maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                <IconWarning size={10} />
              </span>
            )}
            <button
              onClick={handleToggleTheme}
              aria-label="Toggle theme"
              style={{
                background: "transparent",
                border: `1px solid ${COLORS.border}`,
                borderRadius: 6,
                padding: 6,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: COLORS.textDim,
              }}
            >
              {isDark ? <IconSun size={15} /> : <IconMoon size={15} />}
            </button>
            <a
              href="https://github.com/JoshMLesworthy/Anatomizer"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub repository"
              style={{ display: "flex", alignItems: "center", color: COLORS.textDim, padding: 6 }}
            >
              <IconGitHub size={16} />
            </a>
          </div>
        </div>

        {/* ── Demo mode banner (mobile) ──────────────────────────── */}
        {demoMode && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: "6px 12px",
              background: `${COLORS.yellow}12`,
              borderBottom: `1px solid ${COLORS.yellow}30`,
              fontSize: 10,
              color: COLORS.yellow,
            }}
          >
            <span><IconClipboard size={10} /> Demo mode</span>
            <button
              onClick={handleRetryLive}
              style={{
                background: `${COLORS.yellow}20`,
                border: `1px solid ${COLORS.yellow}40`,
                borderRadius: 4,
                padding: "3px 8px",
                color: COLORS.yellow,
                fontSize: 9,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Retry Live
            </button>
          </div>
        )}

        {/* ── Mobile body ────────────────────────────────────────── */}
        <div style={{ overflow: "hidden", display: "flex", flexDirection: "column" }}>
          {mobilePanel === "code" ? (
            /* Code editor panel */
            <>
              <div style={{ flex: 1, overflow: "hidden" }}>
                <CodeEditor
                  code={code}
                  setCode={(newCode: string) => {
                    setCode(newCode);
                    if (activeExampleId) setActiveExampleId(null);
                  }}
                  lang={lang}
                />
              </div>
              {/* Analyze action bar */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "8px 12px",
                  borderTop: `1px solid ${COLORS.border}`,
                  background: COLORS.panel,
                  flexShrink: 0,
                }}
              >
                <button
                  onClick={handleAnalyze}
                  disabled={busy}
                  style={{
                    flex: 1,
                    background: busy
                      ? COLORS.btnDisabled
                      : `linear-gradient(135deg,${COLORS.accent},${COLORS.purple})`,
                    border: "none",
                    borderRadius: 6,
                    padding: "10px 22px",
                    color: "#fff",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: busy ? "not-allowed" : "pointer",
                    boxShadow: busy ? "none" : `0 0 16px ${COLORS.accentAlpha40}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    minHeight: 44,
                  }}
                >
                  {busy ? (
                    <><IconHourglass size={12} /> Analyzing...</>
                  ) : (
                    <><IconZap size={12} /> Analyze</>
                  )}
                </button>
                <span style={{ fontSize: 10, color: COLORS.textMuted }}>{lang}</span>
              </div>
            </>
          ) : (
            /* Analysis panel */
            <div style={{ display: "flex", flexDirection: "column", overflow: "hidden", height: "100%" }}>
              <ViewTabs
                activeView={activeView}
                setActiveView={setActiveView}
                analysis={analysis}
                isMobile
              />
              <div style={{ flex: 1, overflow: "hidden" }}>{renderActiveView()}</div>
            </div>
          )}
        </div>

        {/* ── Mobile bottom navigation ───────────────────────────── */}
        <div
          style={{
            display: "flex",
            borderTop: `1px solid ${COLORS.border}`,
            background: COLORS.panel,
          }}
        >
          {(["code", "analysis"] as const).map((panel) => {
            const active = mobilePanel === panel;
            return (
              <button
                key={panel}
                onClick={() => setMobilePanel(panel)}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  border: "none",
                  borderTop: active ? `2px solid ${COLORS.accent}` : "2px solid transparent",
                  background: "transparent",
                  color: active ? COLORS.accent : COLORS.textMuted,
                  fontSize: 12,
                  fontWeight: active ? 700 : 500,
                  cursor: "pointer",
                  padding: "8px 0",
                  minHeight: MOBILE_NAV_HEIGHT,
                }}
              >
                {panel === "code" ? <IconZap size={14} /> : <IconClipboard size={14} />}
                {panel === "code" ? "Code" : "Analysis"}
              </button>
            );
          })}
        </div>

        {/* ── Mobile examples sidebar (left edge rail + overlay) ── */}
        <ExampleSidebar
          activeExampleId={activeExampleId}
          onSelect={handleSelectExample}
          open={sidebarOpen}
          onToggle={handleToggleSidebar}
          isMobile
        />
      </div>
    );
  }

  /* ── Desktop layout ─────────────────────────────────────────────── */

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: COLORS.bg,
        display: "flex",
        fontFamily: "'Inter',system-ui,sans-serif",
        color: COLORS.text,
        overflow: "hidden",
      }}
    >
      {/* ── Left sidebar — always visible ───────────────────────── */}
      <ExampleSidebar
        activeExampleId={activeExampleId}
        onSelect={handleSelectExample}
        open={sidebarOpen}
        onToggle={handleToggleSidebar}
      />

      {/* ── Main area (header + content grid) ───────────────────── */}
      <div
        style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: "1fr 1fr 300px",
          gridTemplateRows: demoMode ? `${HEADER_HEIGHT}px auto 1fr` : `${HEADER_HEIGHT}px 1fr`,
          overflow: "hidden",
        }}
      >
        {/* ── Header ──────────────────────────────────────────────── */}
        <div
          style={{
            gridColumn: "1/-1",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 16px",
            borderBottom: `1px solid ${COLORS.border}`,
            background: COLORS.panel,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 15, fontWeight: 800, color: COLORS.accent, display: "flex", alignItems: "center", gap: 4 }}>
              <IconZap size={14} /> Anatomizer
            </span>
            <span
              style={{ fontSize: 10, color: COLORS.textMuted, letterSpacing: 1 }}
            >
              CODE EXECUTION VISUALIZER
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {error && (
              <span
                style={{
                  fontSize: 10,
                  color: COLORS.red,
                  maxWidth: 300,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                <IconWarning size={10} /> {error}
              </span>
            )}
            <button
              onClick={handleToggleTheme}
              aria-label="Toggle theme"
              style={{
                background: "transparent",
                border: `1px solid ${COLORS.border}`,
                borderRadius: 6,
                padding: 6,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: COLORS.textDim,
                transition: "all 0.2s",
              }}
            >
              {isDark ? <IconSun size={15} /> : <IconMoon size={15} />}
            </button>
            <a
              href="https://github.com/JoshMLesworthy/Anatomizer"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub repository"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: COLORS.textDim,
                padding: 6,
                borderRadius: 6,
                border: "1px solid transparent",
                transition: "all 0.2s",
              }}
            >
              <IconGitHub size={16} />
            </a>
          </div>
        </div>

        {/* ── Demo mode banner ────────────────────────────────────── */}
        {demoMode && (
          <div
            style={{
              gridColumn: "1/-1",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              padding: "6px 16px",
              background: `${COLORS.yellow}12`,
              borderBottom: `1px solid ${COLORS.yellow}30`,
              fontSize: 11,
              color: COLORS.yellow,
            }}
          >
            <span>
              <IconClipboard size={12} /> Demo mode — showing pre-generated analysis.
              Start the backend with{" "}
              <code
                style={{
                  background: `${COLORS.yellow}18`,
                  padding: "1px 6px",
                  borderRadius: 3,
                  fontFamily: "monospace",
                }}
              >
                cargo run -p anatomizer-api
              </code>{" "}
              for live analysis of any code.
            </span>
            <button
              onClick={handleRetryLive}
              style={{
                background: `${COLORS.yellow}20`,
                border: `1px solid ${COLORS.yellow}40`,
                borderRadius: 4,
                padding: "3px 10px",
                color: COLORS.yellow,
                fontSize: 10,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Retry Live
            </button>
          </div>
        )}

        {/* ── Editor + Analyze bar ────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            borderRight: `1px solid ${COLORS.border}`,
            overflow: "hidden",
          }}
        >
          {/* Code editor */}
          <div style={{ flex: 1, overflow: "hidden" }}>
            <CodeEditor
              code={code}
              setCode={(newCode: string) => {
                setCode(newCode);
                if (activeExampleId) setActiveExampleId(null);
              }}
              lang={lang}
            />
          </div>

          {/* Analyze action bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 12px",
              borderTop: `1px solid ${COLORS.border}`,
              background: COLORS.panel,
            }}
          >
            <button
              onClick={handleAnalyze}
              disabled={busy}
              style={{
                background: busy
                  ? COLORS.btnDisabled
                  : `linear-gradient(135deg,${COLORS.accent},${COLORS.purple})`,
                border: "none",
                borderRadius: 6,
                padding: "8px 22px",
                color: "#fff",
                fontSize: 12,
                fontWeight: 700,
                cursor: busy ? "not-allowed" : "pointer",
                boxShadow: busy ? "none" : `0 0 16px ${COLORS.accentAlpha40}`,
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              {busy ? (
                <><IconHourglass size={12} /> Analyzing...</>
              ) : (
                <><IconZap size={12} /> Analyze</>
              )}
            </button>
            <span
              style={{
                fontSize: 10,
                color: COLORS.textMuted,
              }}
            >
              {lang}
            </span>
          </div>
        </div>

        {/* ── Visualization ───────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            borderRight: `1px solid ${COLORS.border}`,
            overflow: "hidden",
          }}
        >
          <ViewTabs
            activeView={activeView}
            setActiveView={setActiveView}
            analysis={analysis}
          />
          <div style={{ flex: 1, overflow: "hidden" }}>{renderActiveView()}</div>
        </div>

        {/* ── AI Chat ─────────────────────────────────────────────── */}
        <div style={{ background: COLORS.panel, overflow: "hidden" }}>
          <AIChatPanel />
        </div>
      </div>
    </div>
  );
}
