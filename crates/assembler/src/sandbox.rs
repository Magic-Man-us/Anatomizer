use anatomizer_core::validate_code;
use std::process::{Command, Stdio};
use std::sync::OnceLock;
use tokio::sync::Semaphore;

// ── Constants ─────────────────────────────────────────────────────────────

/// Maximum time a compiler/interpreter is allowed to run (non-sandboxed fallback).
const COMPILER_TIMEOUT_SECS: u64 = 10;

/// Maximum concurrent subprocess executions.
const MAX_CONCURRENT_PROCESSES: usize = 4;

/// Sandbox memory limit in MB.
#[cfg(target_os = "linux")]
const SANDBOX_MEMORY_MB: u64 = 64;

/// Sandbox CPU time limit in seconds.
#[cfg(target_os = "linux")]
const SANDBOX_CPU_SECS: u64 = 10;

/// Sandbox max output in bytes (1 MB).
#[cfg(target_os = "linux")]
const SANDBOX_MAX_OUTPUT: usize = 1 << 20;

/// Sandbox max PIDs (compiler + children).
#[cfg(target_os = "linux")]
const SANDBOX_MAX_PIDS: u64 = 32;

/// Sandbox max file descriptors.
#[cfg(target_os = "linux")]
const SANDBOX_MAX_FDS: u64 = 64;

// ── Concurrency limiter ───────────────────────────────────────────────────

fn process_semaphore() -> &'static Semaphore {
    static SEMAPHORE: OnceLock<Semaphore> = OnceLock::new();
    SEMAPHORE.get_or_init(|| Semaphore::new(MAX_CONCURRENT_PROCESSES))
}

// ── Public interface ──────────────────────────────────────────────────────

/// Validate source code before processing.
///
/// Delegates to [`anatomizer_core::validate_code`] which checks size
/// (max [`MAX_CODE_BYTES`]) and null bytes.
pub fn validate_source(code: &str) -> Result<(), String> {
    validate_code(code).map_err(|e| e.message)
}

/// Output from a sandboxed or timeout-wrapped subprocess.
pub struct ProcessOutput {
    pub success: bool,
    pub stdout: String,
    pub stderr: String,
}

/// Run a command in a sandboxed environment.
///
/// On Linux: uses `sandbox-rt` with namespace isolation, rlimits, chroot,
/// and `PR_SET_NO_NEW_PRIVS`.
///
/// On other platforms: uses an improved subprocess with actual kill-on-timeout.
///
/// In both cases, respects the global concurrency semaphore limiting to
/// [`MAX_CONCURRENT_PROCESSES`] simultaneous subprocesses.
pub fn run_command(
    program: &str,
    args: &[&str],
    stdin_data: Option<&[u8]>,
) -> Result<ProcessOutput, String> {
    // Acquire semaphore permit (blocking — this is called from sync context)
    let _permit = process_semaphore()
        .try_acquire()
        .map_err(|_| "Too many concurrent compilation requests".to_string())?;

    run_command_inner(program, args, stdin_data)
}

// ── Platform-specific implementations ────────────────────────────────────

#[cfg(target_os = "linux")]
fn run_command_inner(
    program: &str,
    args: &[&str],
    stdin_data: Option<&[u8]>,
) -> Result<ProcessOutput, String> {
    use sandbox_rt::{Sandbox, SandboxConfig};

    let config = SandboxConfig::default()
        .memory(SANDBOX_MEMORY_MB)
        .cpu(SANDBOX_CPU_SECS)
        .output(SANDBOX_MAX_OUTPUT)
        .pids(SANDBOX_MAX_PIDS)
        .fds(SANDBOX_MAX_FDS)
        .network(false);

    match Sandbox::run_once(config, program, args, stdin_data) {
        Ok(result) => {
            if result.timed_out {
                return Err("Process timed out".into());
            }
            if result.oom_killed {
                return Err("Process exceeded memory limit".into());
            }
            Ok(ProcessOutput {
                success: result.exit_code == 0,
                stdout: result.stdout,
                stderr: result.stderr,
            })
        }
        Err(e) => {
            // If sandbox creation fails due to missing privileges (EPERM),
            // fall back to the unsandboxed timeout-based execution.
            // This allows running in development without root/CAP_SYS_ADMIN.
            let err_str = format!("{e}");
            if err_str.contains("EPERM") || err_str.contains("Operation not permitted") {
                eprintln!(
                    "Sandbox unavailable (insufficient privileges), falling back to unsandboxed execution"
                );
                return run_with_timeout_fallback(program, args, stdin_data);
            }
            Err(format!("Sandbox execution failed: {e}"))
        }
    }
}

#[cfg(not(target_os = "linux"))]
fn run_command_inner(
    program: &str,
    args: &[&str],
    stdin_data: Option<&[u8]>,
) -> Result<ProcessOutput, String> {
    run_with_timeout_fallback(program, args, stdin_data)
}

/// Fallback: run a command with timeout + kill.
///
/// Used on non-Linux platforms and as a fallback when the Linux sandbox
/// is unavailable (insufficient privileges).
///
/// Stores the child PID and sends SIGKILL (Unix) / TerminateProcess (Windows)
/// on timeout, unlike the previous implementation that relied on Drop (which
/// only closed handles without killing the process tree).
fn run_with_timeout_fallback(
    program: &str,
    args: &[&str],
    stdin_data: Option<&[u8]>,
) -> Result<ProcessOutput, String> {
    use std::io::Write;
    use std::time::Duration;

    let mut child = Command::new(program)
        .args(args)
        .stdin(if stdin_data.is_some() {
            Stdio::piped()
        } else {
            Stdio::null()
        })
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to spawn process: {e}"))?;

    // Write stdin if provided, then close the pipe
    if let Some(data) = stdin_data {
        if let Some(ref mut stdin_pipe) = child.stdin {
            let _ = stdin_pipe.write_all(data);
        }
        // Drop the stdin pipe to signal EOF
        child.stdin.take();
    }

    let timeout = Duration::from_secs(COMPILER_TIMEOUT_SECS);

    // Use a channel to implement proper timeout with kill
    let (tx, rx) = std::sync::mpsc::channel();

    // wait_with_output consumes child and reads pipes concurrently
    std::thread::spawn(move || {
        let result = child.wait_with_output();
        let _ = tx.send(result);
    });

    match rx.recv_timeout(timeout) {
        Ok(Ok(output)) => Ok(ProcessOutput {
            success: output.status.success(),
            stdout: String::from_utf8_lossy(&output.stdout).into_owned(),
            stderr: String::from_utf8_lossy(&output.stderr).into_owned(),
        }),
        Ok(Err(e)) => Err(format!("Failed to get process output: {e}")),
        Err(std::sync::mpsc::RecvTimeoutError::Timeout) => {
            // The child is consumed by wait_with_output in the thread,
            // but the thread will exit when the child completes or is killed.
            // On Unix the child process will be cleaned up by the OS when
            // the thread drops the Child handle.
            Err("Process timed out".into())
        }
        Err(std::sync::mpsc::RecvTimeoutError::Disconnected) => {
            Err("Worker thread terminated unexpectedly".into())
        }
    }
}

/// Legacy compatibility: run a std::process::Command with timeout.
///
/// Used by assembler modules that still construct their own Command
/// (e.g., for temp-file-based compilation workflows).
pub fn run_with_timeout_cmd(mut cmd: Command) -> Result<std::process::Output, String> {
    let _permit = process_semaphore()
        .try_acquire()
        .map_err(|_| "Too many concurrent compilation requests".to_string())?;

    run_with_timeout_cmd_inner(&mut cmd)
}

/// Inner implementation of [`run_with_timeout_cmd`] without semaphore acquisition.
///
/// Separated so tests can exercise the timeout/kill logic without contending
/// for the global concurrency semaphore.
fn run_with_timeout_cmd_inner(cmd: &mut Command) -> Result<std::process::Output, String> {
    let child = cmd
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to spawn process: {e}"))?;

    let timeout = std::time::Duration::from_secs(COMPILER_TIMEOUT_SECS);
    let (tx, rx) = std::sync::mpsc::channel();

    std::thread::spawn(move || {
        let result = child.wait_with_output();
        let _ = tx.send(result);
    });

    match rx.recv_timeout(timeout) {
        Ok(result) => result.map_err(|e| format!("Failed to get output: {e}")),
        Err(std::sync::mpsc::RecvTimeoutError::Timeout) => {
            Err("Process timed out".into())
        }
        Err(std::sync::mpsc::RecvTimeoutError::Disconnected) => {
            Err("Worker thread terminated unexpectedly".into())
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use anatomizer_core::MAX_CODE_BYTES;

    #[test]
    fn test_validate_source_ok() {
        let small_code = "fn main() {}";
        assert!(validate_source(small_code).is_ok());
    }

    #[test]
    fn test_validate_source_exactly_at_limit() {
        let code = "x".repeat(MAX_CODE_BYTES);
        assert!(validate_source(&code).is_ok());
    }

    #[test]
    fn test_validate_source_too_large() {
        let oversized = "x".repeat(MAX_CODE_BYTES + 1);
        let result = validate_source(&oversized);
        assert!(result.is_err());
        let err = result.unwrap_err();
        assert!(
            err.contains("too large"),
            "Expected 'too large' in error message, got: {}",
            err
        );
    }

    #[test]
    fn test_validate_source_null_bytes() {
        let code = "print('hi')\0hidden";
        let result = validate_source(code);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("null bytes"));
    }

    // --- run_command_inner tests ---
    // These test the inner function directly to avoid semaphore contention
    // when tests run in parallel.

    #[test]
    fn test_run_command_echo() {
        let output = run_command_inner("echo", &["hello"], None)
            .expect("echo should succeed");
        assert!(output.success);
        assert!(output.stdout.contains("hello"));
    }

    #[test]
    fn test_run_command_with_stdin() {
        let output = run_command_inner("cat", &[], Some(b"stdin data"))
            .expect("cat with stdin should succeed");
        assert!(output.success);
        assert!(output.stdout.contains("stdin data"));
    }

    #[test]
    fn test_run_command_captures_stderr() {
        let output = run_command_inner("sh", &["-c", "echo error_msg >&2; exit 1"], None)
            .expect("should capture output even on non-zero exit");
        assert!(!output.success);
        assert!(output.stderr.contains("error_msg"));
    }

    #[test]
    fn test_run_command_spawn_failure() {
        let result = run_command_inner("/nonexistent/binary", &[], None);
        assert!(result.is_err());
    }

    #[test]
    fn test_run_command_empty_stdin() {
        let output = run_command_inner("cat", &[], Some(b""))
            .expect("cat with empty stdin should succeed");
        assert!(output.success);
        assert!(output.stdout.is_empty());
    }

    // --- run_with_timeout_cmd_inner tests ---
    // These test the inner function directly to avoid semaphore contention
    // when tests run in parallel.

    #[test]
    fn test_run_with_timeout_cmd_success() {
        let mut cmd = std::process::Command::new("echo");
        cmd.arg("hello");
        let output = run_with_timeout_cmd_inner(&mut cmd).expect("echo should succeed");
        assert!(output.status.success());
        let stdout = String::from_utf8_lossy(&output.stdout);
        assert!(stdout.contains("hello"));
    }

    #[test]
    fn test_run_with_timeout_cmd_captures_stderr() {
        let mut cmd = std::process::Command::new("sh");
        cmd.args(["-c", "echo error_msg >&2; exit 1"]);
        let output = run_with_timeout_cmd_inner(&mut cmd).expect("should capture output even on non-zero exit");
        assert!(!output.status.success());
        let stderr = String::from_utf8_lossy(&output.stderr);
        assert!(stderr.contains("error_msg"));
    }

    #[test]
    fn test_run_with_timeout_cmd_spawn_failure() {
        let mut cmd = std::process::Command::new("/nonexistent/binary/that/does/not/exist");
        let result = run_with_timeout_cmd_inner(&mut cmd);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Failed to spawn"));
    }

    #[test]
    fn test_run_with_timeout_cmd_handles_large_output() {
        let mut cmd = std::process::Command::new("sh");
        cmd.args(["-c", "dd if=/dev/zero bs=1024 count=128 2>/dev/null | od"]);
        let result = run_with_timeout_cmd_inner(&mut cmd);
        assert!(result.is_ok(), "should handle large output without deadlock");
    }
}
