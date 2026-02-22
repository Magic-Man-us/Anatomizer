import { useRef, useMemo } from "react";
import { COLORS } from "../theme";
import { highlightCode, HIGHLIGHT_CSS } from "../highlight";

interface CodeEditorProps {
  code: string;
  setCode: (code: string) => void;
  lang: string;
}

/**
 * Custom code editor with synchronized syntax highlighting overlay.
 *
 * Security note: The highlighted HTML is safe because `highlightCode()` first
 * escapes all `&`, `<`, `>` characters before applying regex-based span
 * wrapping. The only HTML injected is our own `<span class="hl-*">` tags.
 * The input `code` prop comes from the user's own editor textarea — it is
 * not untrusted third-party content.
 */
export function CodeEditor({ code, setCode, lang }: CodeEditorProps) {
  const taRef = useRef<HTMLTextAreaElement>(null);
  const hlRef = useRef<HTMLDivElement>(null);
  const lnRef = useRef<HTMLDivElement>(null);

  const lines = code.split("\n");
  const highlighted = useMemo(() => highlightCode(code, lang), [code, lang]);

  const syncScroll = () => {
    const ta = taRef.current;
    if (!ta) return;
    const { scrollTop, scrollLeft } = ta;
    if (hlRef.current) {
      hlRef.current.scrollTop = scrollTop;
      hlRef.current.scrollLeft = scrollLeft;
    }
    if (lnRef.current) {
      lnRef.current.scrollTop = scrollTop;
    }
  };

  return (
    <div style={{ position: "relative", height: "100%", background: COLORS.panel }}>
      <style>{HIGHLIGHT_CSS}</style>
      <div
        style={{
          position: "absolute",
          top: 8,
          right: 12,
          background: COLORS.accent,
          color: "#fff",
          padding: "2px 10px",
          borderRadius: 4,
          fontSize: 10,
          fontWeight: 700,
          textTransform: "uppercase",
          zIndex: 5,
          letterSpacing: 1,
        }}
      >
        {lang}
      </div>
      <div className="ed-wrap">
        <div className="ed-ln" ref={lnRef}>
          {lines.map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>
        {/* Safe: highlightCode() HTML-escapes all input before wrapping with spans */}
        <div
          className="ed-hl"
          ref={hlRef}
          dangerouslySetInnerHTML={{ __html: highlighted }}
        />
        <textarea
          className="ed-ta"
          ref={taRef}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onScroll={syncScroll}
          spellCheck={false}
        />
      </div>
    </div>
  );
}
