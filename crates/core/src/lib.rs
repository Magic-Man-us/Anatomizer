use serde::{Deserialize, Serialize};
use std::collections::HashMap;

// --- Request / Response ---

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct AnalysisRequest {
    pub code: String,
    pub language: Option<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct AnalysisResponse {
    pub language: String,
    pub execution: ExecutionAnalysis,
    pub cost: CostAnalysis,
    pub memory: MemoryAnalysis,
    pub concurrency: ConcurrencyAnalysis,
    pub assembly: AssemblyAnalysis,
    pub debugger: DebuggerAnalysis,
    pub compare: CompareAnalysis,
}

// --- Execution View ---

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct ExecutionAnalysis {
    pub instructions: Vec<Instruction>,
    pub max_cycles: u32,
    pub summary: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Instruction {
    pub op: String,
    pub detail: String,
    pub cycles: u32,
}

// --- Cost View ---

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct CostAnalysis {
    pub lines: Vec<LineCost>,
    pub max_cost: u32,
    pub insights: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct LineCost {
    pub line: usize,
    pub cost: u32,
    pub label: String,
}

// --- Memory View ---

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct MemoryAnalysis {
    pub allocations: Vec<Allocation>,
    pub stack_total: String,
    pub heap_total: String,
    pub alloc_count: usize,
    pub notes: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Allocation {
    #[serde(rename = "type")]
    pub alloc_type: String,
    pub name: String,
    pub detail: String,
    pub size: String,
}

// --- Concurrency View ---

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct ConcurrencyAnalysis {
    pub threads: Vec<ThreadLane>,
    pub warnings: Vec<String>,
    pub analysis: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct ThreadLane {
    pub name: String,
    pub events: Vec<ThreadEvent>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct ThreadEvent {
    #[serde(rename = "type")]
    pub event_type: String,
    pub label: String,
}

// --- Assembly View ---

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct AssemblyAnalysis {
    pub arch: String,
    pub blocks: Vec<AsmBlock>,
    pub notes: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct AsmBlock {
    pub label: String,
    pub instructions: Vec<AsmInstruction>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct AsmInstruction {
    pub addr: String,
    pub op: String,
    pub operands: String,
    pub comment: String,
}

// --- Debugger View ---

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct DebuggerAnalysis {
    pub steps: Vec<DebugStep>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct DebugStep {
    pub line: usize,
    pub description: String,
    pub registers: HashMap<String, String>,
    pub stack: Vec<String>,
}

// --- Compare View ---

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct CompareAnalysis {
    pub comparisons: Vec<Comparison>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Comparison {
    pub title: String,
    pub patterns: Vec<Pattern>,
    pub winner: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Pattern {
    pub label: String,
    pub code: String,
    pub cycles: String,
    pub memory: String,
    pub notes: String,
}

// --- Stub constructor for empty/default responses ---

impl AnalysisResponse {
    pub fn stub(language: &str) -> Self {
        Self {
            language: language.to_string(),
            execution: ExecutionAnalysis {
                instructions: vec![],
                max_cycles: 0,
                summary: "No analysis available yet.".into(),
            },
            cost: CostAnalysis {
                lines: vec![],
                max_cost: 0,
                insights: "No cost analysis available yet.".into(),
            },
            memory: MemoryAnalysis {
                allocations: vec![],
                stack_total: "0 B".into(),
                heap_total: "0 B".into(),
                alloc_count: 0,
                notes: "No memory analysis available yet.".into(),
            },
            concurrency: ConcurrencyAnalysis {
                threads: vec![],
                warnings: vec![],
                analysis: "No concurrency analysis available yet.".into(),
            },
            assembly: AssemblyAnalysis {
                arch: "unknown".into(),
                blocks: vec![],
                notes: "No assembly analysis available yet.".into(),
            },
            debugger: DebuggerAnalysis { steps: vec![] },
            compare: CompareAnalysis {
                comparisons: vec![],
            },
        }
    }
}
