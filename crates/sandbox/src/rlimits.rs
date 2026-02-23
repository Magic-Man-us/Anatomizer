use nix::sys::resource::{setrlimit, Resource};
use crate::{SandboxConfig, Result};

/// Apply rlimits inside the child process.
/// Called *after* clone, *before* exec.
pub fn apply(cfg: &SandboxConfig) -> Result<()> {
    let mem = cfg.max_memory_mb * 1024 * 1024;

    // Virtual memory
    setrlimit(Resource::RLIMIT_AS, mem, mem)?;
    // Resident set
    setrlimit(Resource::RLIMIT_RSS, mem, mem)?;
    // CPU time (seconds)
    setrlimit(Resource::RLIMIT_CPU, cfg.max_cpu_secs, cfg.max_cpu_secs)?;
    // Max open FDs
    setrlimit(Resource::RLIMIT_NOFILE, cfg.max_fds, cfg.max_fds)?;
    // Max child processes
    setrlimit(Resource::RLIMIT_NPROC, cfg.max_pids, cfg.max_pids)?;
    // Max file size
    setrlimit(Resource::RLIMIT_FSIZE, cfg.max_file_size_bytes, cfg.max_file_size_bytes)?;
    // No core dumps
    setrlimit(Resource::RLIMIT_CORE, 0, 0)?;

    Ok(())
}
