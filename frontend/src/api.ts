import type { AnalysisResponse } from "./types";
import { EXAMPLES } from "./examples";

const BASE = "/api";

/** Simulated network delay for demo mode (ms). */
const DEMO_DELAY_MS = 600;

/** Health-check timeout (ms). */
const HEALTH_TIMEOUT_MS = 2000;

/** Whether the backend is available. Cached after first check. */
let backendAvailable: boolean | null = null;

/** Check if the Rust backend is reachable. */
async function isBackendUp(): Promise<boolean> {
  if (backendAvailable !== null) return backendAvailable;
  try {
    const res = await fetch(`${BASE}/health`, {
      signal: AbortSignal.timeout(HEALTH_TIMEOUT_MS),
    });
    backendAvailable = res.ok;
  } catch {
    backendAvailable = false;
  }
  return backendAvailable;
}

/**
 * Find pre-generated analysis for the given code.
 * Matches by exact code content against the examples library.
 */
function findPregenerated(code: string): AnalysisResponse | null {
  const match = EXAMPLES.find((ex) => ex.code === code);
  return match?.analysis ?? null;
}

/**
 * Analyze code — tries live backend first, falls back to pre-generated
 * example data in demo mode (GitHub Pages / no backend).
 *
 * Returns `{ data, demo }` where `demo` is true when using pre-generated data.
 */
export async function analyze(
  code: string,
  language?: string,
): Promise<{ data: AnalysisResponse; demo: boolean }> {
  const live = await isBackendUp();

  if (live) {
    const body: Record<string, string> = { code };
    if (language) body["language"] = language;

    const res = await fetch(`${BASE}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Analysis failed (${res.status}): ${text.slice(0, 200)}`);
    }

    const data = (await res.json()) as AnalysisResponse;
    return { data, demo: false };
  }

  // Demo mode — serve from pre-generated examples
  const mock = findPregenerated(code);
  if (mock) {
    await new Promise((r) => setTimeout(r, DEMO_DELAY_MS));
    return { data: mock, demo: true };
  }

  throw new Error(
    "No pre-generated analysis for custom code. Pick an example or run the backend locally for live analysis.",
  );
}

/** Force re-check backend availability (e.g. after user starts server). */
export function resetBackendCheck(): void {
  backendAvailable = null;
}
