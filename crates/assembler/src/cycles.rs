/// CPU cycle cost data for a single instruction.
#[derive(Debug, Clone)]
pub struct CycleCost {
    pub latency: u32,
    pub throughput: f32,
    pub uops: u32,
}

/// Estimate the cycle cost of an x86-64 instruction mnemonic.
///
/// Based on Agner Fog's instruction tables for modern x86-64 (Zen 4 / Raptor Lake).
/// Reference: <https://www.agner.org/optimize/instruction_tables.pdf>
///
/// Start with the most common ~100 instructions, expand over time.
pub fn estimate_cycles(op: &str) -> CycleCost {
    match op.to_lowercase().as_str() {
        // Data movement
        "mov" => CycleCost { latency: 1, throughput: 0.25, uops: 1 },
        "push" => CycleCost { latency: 3, throughput: 1.0, uops: 2 },
        "pop" => CycleCost { latency: 3, throughput: 1.0, uops: 2 },
        "lea" => CycleCost { latency: 1, throughput: 0.5, uops: 1 },
        "xchg" => CycleCost { latency: 2, throughput: 1.0, uops: 3 },

        // Arithmetic
        "add" | "sub" => CycleCost { latency: 1, throughput: 0.25, uops: 1 },
        "inc" | "dec" => CycleCost { latency: 1, throughput: 0.25, uops: 1 },
        "imul" => CycleCost { latency: 3, throughput: 1.0, uops: 1 },
        "mul" => CycleCost { latency: 3, throughput: 1.0, uops: 2 },
        "idiv" | "div" => CycleCost { latency: 35, throughput: 21.0, uops: 10 },
        "neg" | "not" => CycleCost { latency: 1, throughput: 0.25, uops: 1 },
        "cmp" => CycleCost { latency: 1, throughput: 0.25, uops: 1 },
        "test" => CycleCost { latency: 1, throughput: 0.25, uops: 1 },

        // Logical
        "and" | "or" | "xor" => CycleCost { latency: 1, throughput: 0.25, uops: 1 },
        "shl" | "shr" | "sar" | "sal" => CycleCost { latency: 1, throughput: 0.5, uops: 1 },
        "rol" | "ror" => CycleCost { latency: 1, throughput: 0.5, uops: 1 },

        // Control flow
        "jmp" => CycleCost { latency: 0, throughput: 0.5, uops: 1 },
        "je" | "jne" | "jz" | "jnz" | "jg" | "jge" | "jl" | "jle"
        | "ja" | "jae" | "jb" | "jbe" => CycleCost { latency: 0, throughput: 0.5, uops: 1 },
        "call" => CycleCost { latency: 3, throughput: 1.0, uops: 3 },
        "ret" => CycleCost { latency: 1, throughput: 1.0, uops: 2 },
        "nop" => CycleCost { latency: 0, throughput: 0.25, uops: 1 },

        // SSE/AVX (common subset)
        "movaps" | "movups" | "movdqa" | "movdqu" => CycleCost { latency: 1, throughput: 0.5, uops: 1 },
        "addss" | "addsd" | "addps" | "addpd" => CycleCost { latency: 4, throughput: 0.5, uops: 1 },
        "mulss" | "mulsd" | "mulps" | "mulpd" => CycleCost { latency: 4, throughput: 0.5, uops: 1 },
        "divss" => CycleCost { latency: 11, throughput: 3.0, uops: 1 },
        "divsd" => CycleCost { latency: 13, throughput: 4.0, uops: 1 },
        "sqrtss" => CycleCost { latency: 12, throughput: 3.0, uops: 1 },
        "sqrtsd" => CycleCost { latency: 15, throughput: 4.5, uops: 1 },

        // Python bytecode (CPython-specific estimates)
        "load_const" => CycleCost { latency: 1, throughput: 1.0, uops: 1 },
        "load_fast" | "load_name" | "load_global" => CycleCost { latency: 1, throughput: 1.0, uops: 1 },
        "store_fast" | "store_name" | "store_global" => CycleCost { latency: 1, throughput: 1.0, uops: 1 },
        "binary_add" | "binary_subtract" => CycleCost { latency: 5, throughput: 5.0, uops: 1 },
        "binary_multiply" => CycleCost { latency: 8, throughput: 8.0, uops: 1 },
        "binary_true_divide" => CycleCost { latency: 15, throughput: 15.0, uops: 1 },
        "call_function" => CycleCost { latency: 50, throughput: 50.0, uops: 1 },
        "return_value" => CycleCost { latency: 2, throughput: 2.0, uops: 1 },
        "compare_op" => CycleCost { latency: 5, throughput: 5.0, uops: 1 },
        "pop_jump_if_false" | "pop_jump_if_true" => CycleCost { latency: 2, throughput: 2.0, uops: 1 },
        "for_iter" => CycleCost { latency: 10, throughput: 10.0, uops: 1 },
        "get_iter" => CycleCost { latency: 8, throughput: 8.0, uops: 1 },
        "build_list" | "build_tuple" | "build_map" => CycleCost { latency: 20, throughput: 20.0, uops: 1 },

        // Default: unknown instruction
        _ => CycleCost { latency: 1, throughput: 1.0, uops: 1 },
    }
}
