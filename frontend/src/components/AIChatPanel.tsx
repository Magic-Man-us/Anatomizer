import { useState, useRef, useEffect } from "react";
import { COLORS } from "../theme";
import { IconLightbulb } from "./Icons";

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}

const SUGGESTED_PROMPTS = [
  "What assembly does the for loop vs list comprehension generate?",
  "Where are the likely cache misses?",
  "Is there a deadlock risk here?",
  "How could I optimize the hot path?",
] as const;

const DEMO_RESPONSE = `This is a demo panel — AI chat is not connected to a backend in this version.

In a full setup, an AI assistant here would:
• Analyze execution patterns and identify performance bottlenecks
• Explain CPU cycle costs for specific code patterns
• Detect concurrency issues like race conditions and deadlocks
• Suggest memory optimizations and allocation improvements
• Compare different implementation approaches with concrete cycle estimates
• Help you understand the assembly output and bytecode behavior

Run the Rust backend with \`cargo run -p anatomizer-api\` and click Analyze to see real analysis data in the visualization panels.`;

/** AI Chat panel — demo/stub with suggested prompts and canned responses. */
export function AIChatPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  const send = () => {
    const q = input.trim();
    if (!q) return;

    setInput("");
    setMessages((prev) => [
      ...prev,
      { role: "user", text: q },
      { role: "assistant", text: DEMO_RESPONSE },
    ]);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <div
        style={{
          padding: "8px 12px",
          borderBottom: `1px solid ${COLORS.border}`,
          fontSize: 11,
          fontWeight: 700,
          color: COLORS.accent,
        }}
      >
        AI Assistant
      </div>

      {/* Messages */}
      <div
        ref={chatRef}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: 10,
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        {messages.length === 0 && (
          <div
            style={{
              color: COLORS.textMuted,
              fontSize: 11,
              padding: 6,
              lineHeight: 1.5,
            }}
          >
            Ask about CPU cycles, assembly, memory, optimizations...
            <div
              style={{
                marginTop: 10,
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              {SUGGESTED_PROMPTS.map((q, i) => (
                <button
                  key={i}
                  onClick={() => setInput(q)}
                  style={{
                    background: COLORS.accentDim,
                    border: `1px solid ${COLORS.accentAlpha25}`,
                    borderRadius: 5,
                    padding: "5px 8px",
                    color: COLORS.textDim,
                    fontSize: 10,
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <IconLightbulb size={10} /> {q}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              padding: "6px 10px",
              borderRadius: 6,
              fontSize: 11,
              lineHeight: 1.5,
              maxWidth: "92%",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              alignSelf: m.role === "user" ? "flex-end" : "flex-start",
              background: m.role === "user" ? COLORS.accent : COLORS.border,
              color: COLORS.text,
            }}
          >
            {m.text}
          </div>
        ))}
      </div>

      {/* Input */}
      <div
        style={{
          padding: 8,
          borderTop: `1px solid ${COLORS.border}`,
          display: "flex",
          gap: 6,
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") send();
          }}
          placeholder="Ask about this code..."
          style={{
            flex: 1,
            background: COLORS.border,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 5,
            padding: "6px 10px",
            color: COLORS.text,
            fontSize: 11,
            outline: "none",
          }}
        />
        <button
          onClick={send}
          style={{
            background: COLORS.accent,
            border: "none",
            borderRadius: 5,
            padding: "6px 12px",
            color: "#fff",
            fontSize: 11,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
