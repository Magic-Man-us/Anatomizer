import { useState, useCallback } from "react";
import type { AnalysisResponse } from "./types";
import type { ViewIndex } from "./theme";
import { COLORS, toggleTheme, getTheme } from "./theme";
import { detectLanguage } from "./highlight";
import { analyze as analyzeCode, resetBackendCheck } from "./api";
import { IconSun, IconMoon, IconGitHub, IconZap, IconWarning, IconHourglass, IconClipboard } from "./components/Icons";

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

const SAMPLE_CODE = `import threading
import time

counter = 0
lock = threading.Lock()

def increment(n):
    global counter
    for i in range(n):
        lock.acquire()
        temp = counter
        time.sleep(0.001)
        counter = temp + 1
        lock.release()

def fast_sum(data):
    result_comp = sum([x * 2 for x in data])
    result_loop = 0
    for x in data:
        result_loop += x * 2
    return result_comp, result_loop

t1 = threading.Thread(target=increment, args=(100,))
t2 = threading.Thread(target=increment, args=(100,))
t1.start()
t2.start()
t1.join()
t2.join()
print(f"Counter: {counter}")`;

export default function App() {
  const [code, setCode] = useState(SAMPLE_CODE);
  const [activeView, setActiveView] = useState<ViewIndex>(0);
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState(false);

  const [isDark, setIsDark] = useState(() => getTheme() === "dark");
  const lang = detectLanguage(code);

  const handleToggleTheme = useCallback(() => {
    const next = toggleTheme();
    setIsDark(next === "dark");
  }, []);

  const handleAnalyze = async () => {
    setBusy(true);
    setError(null);
    try {
      const { data, demo } = await analyzeCode(code, lang);
      setAnalysis(data);
      setDemoMode(demo);
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

  const renderActiveView = () => {
    switch (activeView) {
      case 0:
        return <ExecView data={analysis?.execution ?? null} />;
      case 1:
        return <CostView data={analysis?.cost ?? null} code={code} />;
      case 2:
        return <MemView data={analysis?.memory ?? null} />;
      case 3:
        return <ConcView data={analysis?.concurrency ?? null} />;
      case 4:
        return <AsmView data={analysis?.assembly ?? null} />;
      case 5:
        return <DebugView data={analysis?.debugger ?? null} code={code} />;
      case 6:
        return <CompareView data={analysis?.compare ?? null} />;
    }
  };

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: COLORS.bg,
        display: "grid",
        gridTemplateColumns: "1fr 1fr 300px",
        gridTemplateRows: demoMode ? "48px auto 1fr" : "48px 1fr",
        fontFamily: "'Inter',system-ui,sans-serif",
        color: COLORS.text,
        overflow: "hidden",
      }}
    >
      {/* Header */}
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
            onClick={handleAnalyze}
            disabled={busy}
            style={{
              background: busy
                ? COLORS.btnDisabled
                : `linear-gradient(135deg,${COLORS.accent},${COLORS.purple})`,
              border: "none",
              borderRadius: 6,
              padding: "7px 18px",
              color: "#fff",
              fontSize: 12,
              fontWeight: 700,
              cursor: busy ? "not-allowed" : "pointer",
              boxShadow: busy ? "none" : `0 0 16px ${COLORS.accentAlpha40}`,
              transition: "all 0.2s",
            }}
          >
            {busy ? <><IconHourglass size={12} /> Analyzing...</> : <><IconZap size={12} /> Analyze</>}
          </button>
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
              border: `1px solid transparent`,
              transition: "all 0.2s",
            }}
          >
            <IconGitHub size={16} />
          </a>
        </div>
      </div>

      {/* Demo mode banner */}
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
            <IconClipboard size={12} /> Demo mode — showing pre-generated analysis for the sample code.
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
            for live analysis.
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

      {/* Editor */}
      <div style={{ borderRight: `1px solid ${COLORS.border}`, overflow: "hidden" }}>
        <CodeEditor code={code} setCode={setCode} lang={lang} />
      </div>

      {/* Visualization */}
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

      {/* AI Chat */}
      <div style={{ background: COLORS.panel, overflow: "hidden" }}>
        <AIChatPanel />
      </div>
    </div>
  );
}
