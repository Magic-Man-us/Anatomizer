# Anatomizer

Static analysis engine that takes source code and produces detailed execution, cost, memory, concurrency, assembly, debugger, and comparison analyses. Results are served via a JSON API and rendered in an interactive browser-based visualization layer.

This is a personal project I had to  help me learn Rust, some compiler internals, and static analysis techniques with . The code is open source under a dual MIT/GPL-3.0 license. Contributions and feedback are welcome!

![Rust](https://img.shields.io/badge/Rust-2021-orange)
![React](https://img.shields.io/badge/React-19-blue)
![License](https://img.shields.io/badge/license-MIT%20%2F%20GPL--3.0-green)

**[Check out the Demo](https://anatomizer.mimsec.com)**

---

## What It Does

Paste code into the editor, hit Analyze, and get seven views of how that code behaves at a low level:

- **Execution** -- Pseudo-assembly with per-instruction CPU cycle estimates and cost bars.
- **Cost Map** -- Heatmap overlay on source lines showing relative computational cost.
- **Memory** -- Stack vs heap allocation breakdown with sizes and types.
- **Concurrency** -- Thread timeline with lock/unlock, read/write, and race condition detection.
- **Assembly** -- Disassembled output (Python bytecode works today; Rust/C/Go are stubs).
- **Debugger** -- Step-through execution with variable state and call stack at each step.
- **Compare** -- Side-by-side pattern comparison (e.g. list comprehension vs for-loop) with cycle and memory stats.

Supports Python, Rust, TypeScript/JavaScript, Go, and C++. Language is auto-detected from code content.

---

## Quick Start

### Prerequisites

- Rust toolchain (1.75+)
- Node.js (20+)
- Python 3 (required for Python bytecode disassembly)

### Run

```bash
# Terminal 1 -- start the API server
cargo run -p anatomizer-api

# Terminal 2 -- start the frontend dev server
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. The frontend proxies API requests to the Rust backend on port 3001.

If the backend is not running, the frontend falls back to demo mode with pre-generated analysis data for the sample code.

---

## Project Structure

```
Anatomizer/
  crates/
    core/        Shared types (AnalysisRequest, AnalysisResponse, all sub-structs)
    parser/      Tree-sitter AST parsing with per-language modules
    analyzer/    Analysis engines (cost, memory, concurrency, debugger, compare)
    assembler/   Disassembly and bytecode output, instruction cycle tables
    api/         Axum HTTP server, single POST /analyze endpoint
  frontend/
    src/
      components/  React view components (one per analysis tab)
      theme.ts     CSS custom property system with dark/light mode
      highlight.ts Syntax highlighting engine
      api.ts       Backend communication with demo fallback
      types.ts     TypeScript types mirroring core crate structs
      mock.ts      Pre-generated demo analysis data
```

### Backend Crates

**core** -- The API contract. All types derive `Serialize`/`Deserialize` with `serde(rename_all = "camelCase")`. Changing these types affects the frontend.

**parser** -- Tree-sitter grammars for Python, Rust, JavaScript/TypeScript, Go, and C++. Each language module implements the `LanguageParser` trait to extract functions, loops, locks, shared accesses, async operations, allocations, and variables.

**analyzer** -- Takes parsed AST data and produces response structs. Uses petgraph for graph analysis. Individual engines for cost estimation, memory modeling, concurrency analysis, debugger step generation, and pattern comparison.

**assembler** -- Generates disassembly output. Python bytecode disassembly works via the `python3` `dis` module. `cycles.rs` contains x86-64 and CPython bytecode instruction cycle cost tables. Rust, C, and Go disassembly are stubs.

**api** -- Axum server on port 3001. Single `POST /analyze` endpoint accepts `{ code, language }` and returns the full analysis response. CORS enabled for frontend development.

### Frontend

React 19 + TypeScript + Vite. No CSS files -- all styling uses inline `style={}` objects referencing a centralized theme system. Seven visualization tabs, a code editor with syntax highlighting, and an AI chat panel (stub).

The theme system uses CSS custom properties set on `:root`. Toggling between dark and light mode swaps the property values without triggering React re-renders. Theme preference is persisted in localStorage.

---

## Build Commands

```bash
# Backend
cargo check                    # Type-check all crates
cargo build                    # Debug build
cargo build --release          # Release build
cargo test                     # Run all tests
cargo run -p anatomizer-api    # Start API server on :3001

# Frontend
cd frontend
npm install                    # Install dependencies (first time)
npm run dev                    # Dev server on :5173 with hot reload
npm run build                  # Production build (tsc + vite)
npm run preview                # Preview production build
```

---

## API

### POST /analyze

Request:

```json
{
  "code": "def foo():\n    return 42",
  "language": "python"
}
```

Response: a JSON object with keys `execution`, `cost`, `memory`, `concurrency`, `assembly`, `debugger`, and `compare`, each containing the corresponding analysis data. All field names use camelCase.

Supported language values: `python`, `rust`, `typescript`, `go`, `cpp`.

---

## Dependencies

### Backend

| Crate | Version | Purpose |
|-------|---------|---------|
| tree-sitter | 0.24 | AST parsing framework |
| tree-sitter-{python,rust,javascript,go,cpp} | 0.23.x | Language grammars |
| axum | 0.8 | HTTP server |
| tokio | 1 | Async runtime |
| tower-http | 0.6 | CORS and request limits |
| petgraph | 0.6 | Graph analysis |
| serde / serde_json | 1 | Serialization |
| regex | 1 | Pattern matching |
| tempfile | 3 | Temporary files for disassembly |

### Frontend

| Package | Version | Purpose |
|---------|---------|---------|
| react | 19 | UI framework |
| react-dom | 19 | DOM rendering |
| vite | 6 | Build tool and dev server |
| typescript | 5.7 | Type checking |

Zero runtime dependencies beyond React. No CSS framework, no component library, no state management library.

---

## Current State

This is an early-stage project. The type system and frontend visualization are complete. Most backend analysis engines return stub/default data.

What works today:
- Full frontend with all seven visualization views
- Dark/light theme toggle with system preference detection
- Demo mode with pre-generated analysis data
- Python bytecode disassembly via `python3`
- x86-64 and CPython instruction cycle cost tables
- Tree-sitter parsing infrastructure with all language grammars wired up

What is stubbed:
- Most analysis engine logic (cost estimation, memory modeling, concurrency detection, etc.)
- Rust/C/Go disassembly
- AI chat panel backend
- Parser extraction logic beyond basic tree-sitter setup

---

## License

Dual licensed under [MIT](LICENSE-MIT) and [GPL-3.0](LICENSE). Choose whichever you prefer.
