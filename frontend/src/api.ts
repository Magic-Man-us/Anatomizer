import type { AnalysisResponse, HealthResponse, LanguagesResponse } from "./types";
import { MOCK_RESPONSE } from "./mock";

const BASE = "/api";

/** Simulated network delay for demo mode (ms). */
const DEMO_DELAY_MS = 800;

/** Whether the backend is available. Cached after first check. */
let backendAvailable: boolean | null = null;

/** Check if the Rust backend is reachable. */
async function isBackendUp(): Promise<boolean> {
  if (backendAvailable !== null) return backendAvailable;
  try {
    const res = await fetch(`${BASE}/health`, { signal: AbortSignal.timeout(2000) });
    backendAvailable = res.ok;
  } catch {
    backendAvailable = false;
  }
  return backendAvailable;
}

/**
 * POST /api/analyze — Send code to the Rust backend for full analysis.
 * Falls back to pre-generated mock data if backend is unreachable.
 */
export async function analyze(
  code: string,
  language?: string,
): Promise<{ data: AnalysisResponse; demo: boolean }> {
  const live = await isBackendUp();

  if (!live) {
    // Demo mode: return pre-generated data after a brief delay
    await new Promise((r) => setTimeout(r, DEMO_DELAY_MS));
    return { data: MOCK_RESPONSE, demo: true };
  }

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

/** GET /api/health — Check backend health. */
export async function getHealth(): Promise<HealthResponse> {
  const res = await fetch(`${BASE}/health`);
  if (!res.ok) throw new Error(`Health check failed (${res.status})`);
  return res.json() as Promise<HealthResponse>;
}

/** GET /api/languages — List supported languages. */
export async function getLanguages(): Promise<LanguagesResponse> {
  const res = await fetch(`${BASE}/languages`);
  if (!res.ok) throw new Error(`Languages fetch failed (${res.status})`);
  return res.json() as Promise<LanguagesResponse>;
}

/** Force re-check backend availability (e.g. after user starts server). */
export function resetBackendCheck(): void {
  backendAvailable = null;
}
