// TypeScript interfaces mirroring crates/core/src/lib.rs
// All field names use camelCase to match serde(rename_all = "camelCase")

// --- Request / Response ---

export interface AnalysisRequest {
  code: string;
  language?: string;
}

export interface AnalysisResponse {
  language: string;
  execution: ExecutionAnalysis;
  cost: CostAnalysis;
  memory: MemoryAnalysis;
  concurrency: ConcurrencyAnalysis;
  assembly: AssemblyAnalysis;
  debugger: DebuggerAnalysis;
  compare: CompareAnalysis;
}

// --- Execution View ---

export interface ExecutionAnalysis {
  instructions: Instruction[];
  maxCycles: number;
  summary: string;
}

export interface Instruction {
  op: string;
  detail: string;
  cycles: number;
}

// --- Cost View ---

export interface CostAnalysis {
  lines: LineCost[];
  maxCost: number;
  insights: string;
}

export interface LineCost {
  line: number;
  cost: number;
  label: string;
}

// --- Memory View ---

export interface MemoryAnalysis {
  allocations: Allocation[];
  stackTotal: string;
  heapTotal: string;
  allocCount: number;
  notes: string;
}

export interface Allocation {
  /** Serialized as "type" via serde rename */
  type: string;
  name: string;
  detail: string;
  size: string;
}

// --- Concurrency View ---

export interface ConcurrencyAnalysis {
  threads: ThreadLane[];
  warnings: string[];
  analysis: string;
}

export interface ThreadLane {
  name: string;
  events: ThreadEvent[];
}

export interface ThreadEvent {
  /** Serialized as "type" via serde rename */
  type: string;
  label: string;
}

// --- Assembly View ---

export interface AssemblyAnalysis {
  arch: string;
  blocks: AsmBlock[];
  notes: string;
}

export interface AsmBlock {
  label: string;
  instructions: AsmInstruction[];
}

export interface AsmInstruction {
  addr: string;
  op: string;
  operands: string;
  comment: string;
}

// --- Debugger View ---

export interface DebuggerAnalysis {
  steps: DebugStep[];
}

export interface DebugStep {
  line: number;
  description: string;
  registers: Record<string, string>;
  stack: string[];
}

// --- Compare View ---

export interface CompareAnalysis {
  comparisons: Comparison[];
}

export interface Comparison {
  title: string;
  patterns: Pattern[];
  winner: string;
}

export interface Pattern {
  label: string;
  code: string;
  cycles: string;
  memory: string;
  notes: string;
}

// --- Health / Languages ---

export interface HealthResponse {
  status: string;
  version: string;
}

export interface LanguageInfo {
  id: string;
  name: string;
  extensions: string[];
}

export interface LanguagesResponse {
  languages: LanguageInfo[];
}
