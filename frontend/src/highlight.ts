/** Supported language identifiers for syntax highlighting. */
export type HighlightLang = "python" | "typescript" | "rust" | "go" | "cpp";

interface LangRules {
  kw: RegExp;
  comment: RegExp;
  str: RegExp;
  fn: RegExp;
  num: RegExp;
  macro?: RegExp;
  prep?: RegExp;
}

const LANG_RULES: Record<HighlightLang, LangRules> = {
  python: {
    kw: /\b(import|from|def|class|return|if|elif|else|for|while|in|not|and|or|is|with|as|try|except|finally|raise|yield|lambda|global|nonlocal|pass|break|continue|True|False|None|async|await)\b/g,
    comment: /#.*$/gm,
    str: /("""[\s\S]*?"""|'''[\s\S]*?'''|f"(?:[^"\\]|\\.)*"|f'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g,
    fn: /\b([a-zA-Z_]\w*)\s*\(/g,
    num: /\b\d+\.?\d*\b/g,
  },
  typescript: {
    kw: /\b(import|export|from|const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|new|this|class|extends|implements|interface|type|enum|async|await|try|catch|finally|throw|true|false|null|undefined|void|typeof|instanceof)\b/g,
    comment: /\/\/.*$|\/\*[\s\S]*?\*\//gm,
    str: /(`[\s\S]*?`|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g,
    fn: /\b([a-zA-Z_]\w*)\s*[(<]/g,
    num: /\b\d+\.?\d*\b/g,
  },
  rust: {
    kw: /\b(use|mod|pub|fn|let|mut|const|static|struct|enum|impl|trait|type|where|if|else|match|for|while|loop|in|return|break|continue|async|await|move|ref|self|Self|super|crate|true|false|unsafe|extern)\b/g,
    comment: /\/\/.*$|\/\*[\s\S]*?\*\//gm,
    str: /("(?:[^"\\]|\\.)*")/g,
    fn: /\b([a-zA-Z_]\w*)\s*[(<]/g,
    num: /\b\d+\.?\d*\b/g,
    macro: /\b\w+!/g,
  },
  go: {
    kw: /\b(package|import|func|return|if|else|for|range|switch|case|default|break|continue|go|chan|select|defer|var|const|type|struct|interface|map|make|new|true|false|nil|append|len|cap)\b/g,
    comment: /\/\/.*$|\/\*[\s\S]*?\*\//gm,
    str: /(`[^`]*`|"(?:[^"\\]|\\.)*")/g,
    fn: /\b([a-zA-Z_]\w*)\s*\(/g,
    num: /\b\d+\.?\d*\b/g,
  },
  cpp: {
    kw: /\b(#include|using|namespace|int|float|double|char|void|bool|long|short|unsigned|signed|auto|const|static|struct|class|public|private|protected|virtual|override|new|delete|return|if|else|for|while|do|switch|case|break|continue|try|catch|throw|true|false|nullptr|sizeof|typedef|template|typename)\b/g,
    comment: /\/\/.*$|\/\*[\s\S]*?\*\//gm,
    str: /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g,
    fn: /\b([a-zA-Z_]\w*)\s*[(<]/g,
    num: /\b\d+\.?\d*\b/g,
    prep: /#\w+/g,
  },
};

interface Token {
  start: number;
  end: number;
  text: string;
  cls: string;
  rep: string | null;
}

/** Convert source code to syntax-highlighted HTML. */
export function highlightCode(code: string, lang: string): string {
  const rules = LANG_RULES[lang as HighlightLang] ?? LANG_RULES.python;
  let html = code
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const tokens: Token[] = [];

  const extract = (re: RegExp, cls: string) => {
    const r = new RegExp(re.source, re.flags);
    let m: RegExpExecArray | null;
    while ((m = r.exec(html)) !== null) {
      tokens.push({
        start: m.index,
        end: m.index + m[0].length,
        text: m[0],
        cls,
        rep:
          cls === "fn" && m[1]
            ? m[0].replace(m[1], `<span class="hl-fn">${m[1]}</span>`)
            : null,
      });
    }
  };

  extract(rules.comment, "cmt");
  extract(rules.str, "str");
  extract(rules.kw, "kw");
  extract(rules.num, "num");
  extract(rules.fn, "fn");
  if (rules.macro) extract(rules.macro, "mac");
  if (rules.prep) extract(rules.prep, "prep");

  // Sort descending by position so replacements don't shift indices
  tokens.sort((a, b) => b.start - a.start);

  const used = new Set<number>();
  for (const t of tokens) {
    let overlap = false;
    for (let i = t.start; i < t.end; i++) {
      if (used.has(i)) {
        overlap = true;
        break;
      }
    }
    if (overlap) continue;
    for (let i = t.start; i < t.end; i++) used.add(i);
    const rep = t.rep ?? `<span class="hl-${t.cls}">${t.text}</span>`;
    html = html.slice(0, t.start) + rep + html.slice(t.end);
  }

  return html;
}

/** Detect language from code content using simple heuristics. */
export function detectLanguage(code: string): HighlightLang {
  if (/import threading|def |print\(|import os/.test(code)) return "python";
  if (/async fn|let mut|fn main|->.*\{/.test(code)) return "rust";
  if (/func |go |chan |fmt\./.test(code)) return "go";
  if (/async function|const |=>|: string|: number/.test(code))
    return "typescript";
  if (/#include|std::|int main/.test(code)) return "cpp";
  return "python";
}

/** CSS for the syntax highlighting classes and editor layout.
 *  All colors reference CSS custom properties so they adapt to the active theme. */
export const HIGHLIGHT_CSS = `.hl-kw{color:var(--color-hl-keyword);font-weight:600}
.hl-str{color:var(--color-hl-string)}
.hl-cmt{color:var(--color-hl-comment);font-style:italic}
.hl-num{color:var(--color-hl-number)}
.hl-fn{color:var(--color-hl-function)}
.hl-mac{color:var(--color-hl-macro)}
.hl-prep{color:var(--color-hl-keyword)}
.ed-wrap{position:relative;height:100%;overflow:hidden;font-family:'Cascadia Code','Fira Code','Courier New',monospace;font-size:13px;line-height:1.65}
.ed-ln{position:absolute;top:0;left:0;width:44px;height:100%;overflow:hidden;text-align:right;padding:14px 8px 14px 0;color:var(--color-line-num);font-size:11px;line-height:1.65;user-select:none;background:var(--color-gutter-bg);border-right:1px solid var(--color-border);z-index:2}
.ed-hl{position:absolute;top:0;left:44px;right:0;padding:14px;white-space:pre;pointer-events:none;color:var(--color-text);overflow:hidden}
.ed-ta{position:absolute;top:0;left:44px;right:0;bottom:0;padding:14px;background:transparent;color:transparent;caret-color:var(--color-text);border:none;outline:none;resize:none;white-space:pre;font:inherit;line-height:inherit;overflow:auto;z-index:1}
.ed-ta::selection{background:var(--color-accent-a40)}`;
