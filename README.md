# Anatomizer

A static analysis engine that takes source code and produces detailed execution, cost, memory, concurrency, assembly, debugger, and comparison analyses. Results are served via a hardened JSON API and rendered in an interactive browser-based visualization layer.

This is a personal project I built to learn Rust, compiler internals, and static analysis techniques with tree-sitter. The code is open source under a dual MIT/GPL-3.0 license. Contributions and feedback are welcome!

![Rust](https://img.shields.io/badge/Rust-2021-orange)
![React](https://img.shields.io/badge/React-19-blue)
![License](https://img.shields.io/badge/license-AGPL--3.0-green)

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

Supports Python, Rust, TypeScript/JavaScript, Go, C, and C++. Language is auto-detected from code content or can be specified explicitly.

---

## How It Works

Understanding the data flow is key to understanding what Anatomizer does and where the security boundary sits.

### Request Lifecycle

```
User submits code via browser
         |
         v
+--------------------------------------------------------+
|                    API Layer (Axum)                      |
|                                                          |
|  Body size limit --- 256 KiB max request body            |
|  Rate limiter ------ 30 requests/minute (token bucket)   |
|  Request timeout --- 45 second hard cap                  |
|  Security headers -- CSP, X-Frame-Options, etc.          |
|  CORS -------------- Explicit origin allowlist            |
|                                                          |
|  Input validation:                                       |
|    - Code: max 64 KiB, no null bytes                     |
|    - Language: validated against enum, rejects            |
|      path traversal and unknown values                   |
+----------------------------+-----------------------------+
                             |
              +--------------+--------------+
              v              v              v
        +----------+  +-----------+  +------------+
        |  Parser  |  | Analyzer  |  | Assembler  |
        | (in-proc)|  | (in-proc) |  | (subprocess|
        |          |  |           |  |  + sandbox) |
        +----------+  +-----------+  +------------+
```

### What runs where

**In-process (no sandbox needed):**

- **tree-sitter parsing** -- A Rust library that reads code structurally to build an AST. It never executes user code. Memory-safe by construction.
- **Analysis engines** -- Pure Rust logic (cost estimation, memory modeling, concurrency analysis, debugger simulation, pattern comparison) operating on the parsed AST. No subprocesses.

**In a sandboxed subprocess:**

- **Disassembly** -- This is the one step where user-supplied code is handed to an external tool that may interpret or execute parts of it. For example, Python's `dis.dis(compile(...))` compiles user code to produce bytecode, and that compilation step can trigger arbitrary side effects from `import` statements or top-level expressions. The sandbox contains the blast radius of any such execution.

The sandbox is **not** "the environment where everything runs." It's specifically the containment layer for the step where we hand user input to an external interpreter or compiler.

### Sandbox Architecture (Linux)

On Linux, disassembly subprocesses run inside a minimal container created with:

| Isolation Layer | What It Does |
|----------------|-------------|
| **PID namespace** | Process can't see or signal anything outside the sandbox |
| **Mount namespace + chroot** | Isolated filesystem; only `/usr`, `/lib`, `/bin`, `/proc` are visible (read-only bind mounts) |
| **Network namespace** | No network access whatsoever |
| **UTS namespace** | Isolated hostname |
| **rlimits** | 64 MB RAM, 10s CPU time, 32 max PIDs, 64 max FDs, 1 MB max file writes, no core dumps |
| **PR_SET_NO_NEW_PRIVS** | Cannot gain elevated privileges via setuid binaries |
| **Unprivileged UID** | Runs as `nobody` (UID 65534) |
| **Output cap** | stdout + stderr truncated at 1 MB |
| **Concurrency limit** | Max 4 simultaneous subprocesses (semaphore-gated) |

On non-Linux platforms (macOS, Windows), or when running without root privileges, the sandbox gracefully falls back to a timeout-and-kill wrapper that enforces a 10-second deadline and kills the process tree on expiry.

### Disassembly: How Each Language Works

| Language | Method | Sandbox? | Temp Files? |
|----------|--------|----------|-------------|
| **Python** | `python3 -c "import dis; dis.dis(compile(stdin, ...))"` -- code fed via stdin | Yes | No |
| **Rust** | `rustc --emit=asm` on a temp `.rs` file | Yes | Yes (compiler requires files) |
| **C/C++** | `gcc -S` / `g++ -S` on a temp `.c`/`.cpp` file | Yes | Yes |
| **Go** | `go tool compile` + `go tool objdump` on a temp `.go` file | Yes | Yes |

Python is the only fully-implemented disassembler. Rust, C, and Go are working stubs (the sandbox and subprocess machinery runs, but the output parsing and bytecode cycle-cost annotation are minimal).

---

## API

All responses include security headers (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Content-Security-Policy`, `Referrer-Policy`, `Permissions-Policy`). Error responses return sanitized JSON -- internal paths, process output, and stack traces are never leaked to the client.

### POST /analyze

Full analysis pipeline: parse + analyze + disassemble.

```json
// Request
{
  "code": "def foo():\n    return 42",
  "language": "python"
}

// Response (200 OK)
{
  "language": "python",
  "execution": { ... },
  "cost": { ... },
  "memory": { ... },
  "concurrency": { ... },
  "assembly": { ... },
  "debugger": { ... },
  "compare": { ... }
}
```

`language` is optional -- if omitted, auto-detected via keyword heuristics. Supported values: `python`, `rust`, `typescript`, `javascript`, `go`, `cpp`, `c`.

### POST /disassemble

Disassembly only (no analysis).

### GET /health

Returns `{ "status": "ok", "version": "0.1.0" }`.

### GET /languages

Returns the list of supported languages with file extensions.

### Error Responses

```json
// 400 Bad Request (validation failure)
{ "error": "Code too large (max 65536 bytes)" }

// 422 Unprocessable Entity (analysis failure -- message is always generic)
{ "error": "Analysis failed. The code may contain syntax errors or use unsupported features." }

// 429 Too Many Requests
{ "error": "Rate limit exceeded. Try again later." }
```

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

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | API server listen port |
| `ALLOWED_ORIGIN` | `http://localhost:5173` (debug) / `https://anatomizer.mimsec.com` (release) | CORS allowed origin |

---

## Project Structure

```
Anatomizer/
  crates/
    core/        Shared types, Language enum, input validation
    parser/      Tree-sitter AST parsing with per-language modules
    analyzer/    Analysis engines (cost, memory, concurrency, debugger, compare)
    assembler/   Disassembly + sandbox integration, instruction cycle tables
    sandbox/     Linux namespace container runtime (sandbox-rt)
    api/         Axum HTTP server with security middleware
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

**core** -- The API contract and validation layer. All types derive `Serialize`/`Deserialize` with `serde(rename_all = "camelCase")`. Defines the `Language` enum, input validation functions (`validate_code`, `validated_language`), and the `MAX_CODE_BYTES` constant. Changing these types affects the frontend.

**parser** -- Tree-sitter grammars for Python, Rust, JavaScript/TypeScript, Go, and C++. Each language module implements the `LanguageParser` trait to extract functions, loops, locks, shared accesses, async operations, allocations, and variables.

**analyzer** -- Takes parsed AST data and produces response structs. Uses petgraph for graph analysis. Individual engines for cost estimation, memory modeling, concurrency analysis, debugger step generation, and pattern comparison.

**assembler** -- Generates disassembly output. Contains the sandbox integration layer that routes subprocess execution through either the Linux container runtime or the timeout-and-kill fallback. `cycles.rs` contains x86-64 and CPython bytecode instruction cycle cost tables. Enforces a concurrency semaphore limiting to 4 simultaneous subprocesses.

**sandbox** -- The `sandbox-rt` crate. A Linux-only container runtime that creates isolated execution environments using kernel namespaces (PID, mount, network, UTS), rlimits, chroot, and `PR_SET_NO_NEW_PRIVS`. Provides a lifecycle state machine (`Created -> Ready -> Running -> Completed -> Destroyed`) with the `Sandbox::run_once()` convenience method for one-shot execution. Compiled only on Linux via conditional dependencies.

**api** -- Axum server on port 3001. Routes: `POST /analyze`, `POST /disassemble`, `GET /health`, `GET /languages`. Security middleware stack: security headers, token-bucket rate limiter (30 req/min), request body limit (256 KiB), request timeout (45s), and explicit-origin CORS.

### Frontend

React 19 + TypeScript + Vite. No CSS files -- all styling uses inline `style={}` objects referencing a centralized theme system. Seven visualization tabs, a code editor with syntax highlighting, and an AI chat panel (stub).

The theme system uses CSS custom properties set on `:root`. Toggling between dark and light mode swaps the property values without triggering React re-renders. Theme preference is persisted in localStorage.

---

## Security Model

### Defense in Depth

The API is hardened in layers. No single layer is the sole line of defense:

```
Internet -> CORS (explicit origin) -> Body size limit (256 KiB) -> Rate limiter (30/min)
  -> Request timeout (45s) -> Input validation (64 KiB, no nulls, language enum)
    -> Concurrency semaphore (max 4 subprocesses) -> Sandbox (namespace isolation)
      -> rlimits (memory, CPU, PIDs, FDs, file size) -> PR_SET_NO_NEW_PRIVS
```

### What's Protected Against

| Threat | Mitigation |
|--------|-----------|
| Arbitrary code execution | Sandbox: namespace isolation, chroot, no network, unprivileged UID |
| Fork bombs | rlimit NPROC (32 PIDs max) + sandbox PID namespace |
| Memory exhaustion | rlimit AS/RSS (64 MB) |
| CPU exhaustion / infinite loops | rlimit CPU (10s) + request timeout (45s) |
| Disk filling | rlimit FSIZE (1 MB max file writes) + output cap |
| Privilege escalation | `PR_SET_NO_NEW_PRIVS`, runs as nobody (UID 65534) |
| Network exfiltration | Network namespace (no access) |
| Path traversal in language field | `Language` enum validation rejects anything not in the allowlist |
| Null byte injection | Input validation rejects null bytes |
| Oversized payloads | Body limit (256 KiB) + code validation (64 KiB) |
| DDoS / abuse | Rate limiting (30 req/min), concurrency semaphore (4 max) |
| Clickjacking | `X-Frame-Options: DENY`, `frame-ancestors 'none'` |
| MIME sniffing | `X-Content-Type-Options: nosniff` |
| Information leakage | Error sanitization -- internal paths/output never exposed to clients |

### What's NOT in Scope

- **Per-IP rate limiting** -- The current rate limiter is global. Fine for a demo site; would need Redis/in-memory per-IP tracking for production.
- **Authentication** -- This is a public demo tool. No user accounts or API keys.
- **Syscall filtering (seccomp)** -- The sandbox uses namespaces and rlimits but does not install a seccomp-bpf filter. This would be the next hardening step.
- **cgroups v2** -- Resource limits use rlimits rather than cgroups. cgroups would provide more precise memory accounting.

---

## Testing

232 tests across all crates:

```bash
cargo test           # Run everything
cargo test -p anatomizer-core       # Core types + validation (13 tests)
cargo test -p anatomizer-api        # API routes + middleware + security (31 tests)
cargo test -p anatomizer-assembler  # Disassembly + sandbox integration (45 tests)
cargo test -p sandbox-rt            # Sandbox container runtime (21 tests)
cargo test -p anatomizer-parser     # Tree-sitter parsing (82 tests)
cargo test -p anatomizer-analyzer   # Analysis engines (40 tests)
```

Test coverage includes:
- Input validation (size limits, null bytes, language parsing, boundary values)
- API endpoint behavior (success paths, error paths, auto-detection)
- Security header injection on both success and error responses
- Rate limiter token-bucket logic and middleware 429 behavior
- Error sanitization (internal paths never leaked)
- Sandbox config builder, lifecycle state machine, error types
- Disassembly output parsing, subprocess timeout, and concurrency

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

## Dependencies

### Backend

| Crate | Version | Purpose |
|-------|---------|---------|
| tree-sitter | 0.24 | AST parsing framework |
| tree-sitter-{python,rust,javascript,go,cpp} | 0.23.x | Language grammars |
| axum | 0.8 | HTTP server |
| tokio | 1 | Async runtime |
| tower-http | 0.6 | CORS, body limits, request timeout |
| tower | 0.5 | Middleware utilities |
| nix | 0.29 | Linux namespace and rlimit syscalls (sandbox) |
| libc | 0.2 | Low-level syscalls (prctl, execvpe) |
| petgraph | 0.6 | Graph analysis |
| serde / serde_json | 1 | Serialization |
| thiserror | 2 | Error type derivation |
| uuid | 1 | Sandbox instance IDs |
| regex | 1 | Pattern matching |
| tempfile | 3 | Temporary files for compilation |

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

The type system, frontend visualization, and security hardening are complete. Most backend analysis engines return stub/default data.

**What works today:**
- Full frontend with all seven visualization views
- Dark/light theme toggle with system preference detection
- Demo mode with pre-generated analysis data
- Python bytecode disassembly via `python3` (sandboxed)
- x86-64 and CPython instruction cycle cost tables
- Tree-sitter parsing infrastructure with all language grammars wired up
- Input validation and language enum at the API boundary
- Linux sandbox with namespace isolation for subprocess execution
- Graceful fallback to timeout-and-kill wrapper on non-Linux / unprivileged
- Security headers, rate limiting, CORS, request timeouts
- Error sanitization (no internal details leaked)
- 232 unit/integration tests

**What is stubbed:**
- Most analysis engine logic (cost estimation, memory modeling, concurrency detection, etc.)
- Rust/C/Go disassembly output parsing
- AI chat panel backend
- Parser extraction logic beyond basic tree-sitter setup

---

## License

Licensed under the [GNU Affero General Public License v3.0](LICENSE).

This means you can use, modify, and distribute this software freely, but if you run a modified version as a network service (e.g., host your own version of Anatomizer), you must make your source code available to users of that service. See the [AGPL-3.0 FAQ](https://www.gnu.org/licenses/agpl-3.0.en.html) for details.
