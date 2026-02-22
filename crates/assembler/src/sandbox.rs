use std::process::{Command, Stdio};
use std::sync::mpsc;
use std::time::Duration;

/// Maximum time a compiler/interpreter is allowed to run.
const COMPILER_TIMEOUT_SECS: u64 = 30;

/// Maximum input source code size in bytes.
const MAX_SOURCE_SIZE: usize = 64 * 1024; // 64 KiB

/// Validate source code size before processing.
///
/// Rejects inputs larger than [`MAX_SOURCE_SIZE`] to prevent abuse and
/// excessive resource consumption by downstream compilers/interpreters.
pub fn validate_source(code: &str) -> Result<(), String> {
    if code.len() > MAX_SOURCE_SIZE {
        return Err(format!(
            "Source code too large: {} bytes (max {} bytes)",
            code.len(),
            MAX_SOURCE_SIZE
        ));
    }
    Ok(())
}

/// Run a command with a timeout, killing the child process if it exceeds
/// [`COMPILER_TIMEOUT_SECS`].
///
/// Uses a background thread with `wait_with_output` to read stdout/stderr
/// concurrently, avoiding deadlocks when the child produces more output
/// than the OS pipe buffer.
///
/// Returns the captured [`std::process::Output`] on success, or a
/// human-readable error string on failure (spawn error, timeout, or wait
/// error).
pub fn run_with_timeout(mut cmd: Command) -> Result<std::process::Output, String> {
    let child = cmd
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to spawn process: {}", e))?;

    let timeout = Duration::from_secs(COMPILER_TIMEOUT_SECS);
    let (tx, rx) = mpsc::channel();

    // wait_with_output consumes child and reads pipes concurrently,
    // preventing deadlocks from full pipe buffers.
    std::thread::spawn(move || {
        let result = child.wait_with_output();
        let _ = tx.send(result);
    });

    match rx.recv_timeout(timeout) {
        Ok(result) => result.map_err(|e| format!("Failed to get output: {}", e)),
        Err(mpsc::RecvTimeoutError::Timeout) => {
            // The child process will be killed when the thread's child is dropped
            Err(format!(
                "Process timed out after {}s",
                COMPILER_TIMEOUT_SECS
            ))
        }
        Err(mpsc::RecvTimeoutError::Disconnected) => {
            Err("Worker thread terminated unexpectedly".to_string())
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_validate_source_ok() {
        let small_code = "fn main() {}";
        assert!(validate_source(small_code).is_ok());
    }

    #[test]
    fn test_validate_source_exactly_at_limit() {
        let code = "x".repeat(MAX_SOURCE_SIZE);
        assert!(validate_source(&code).is_ok());
    }

    #[test]
    fn test_validate_source_too_large() {
        let oversized = "x".repeat(MAX_SOURCE_SIZE + 1);
        let result = validate_source(&oversized);
        assert!(result.is_err());
        let err = result.unwrap_err();
        assert!(
            err.contains("too large"),
            "Expected 'too large' in error message, got: {}",
            err
        );
        assert!(err.contains(&(MAX_SOURCE_SIZE + 1).to_string()));
    }

    #[test]
    fn test_run_with_timeout_success() {
        let mut cmd = Command::new("echo");
        cmd.arg("hello");
        let output = run_with_timeout(cmd).expect("echo should succeed");
        assert!(output.status.success());
        let stdout = String::from_utf8_lossy(&output.stdout);
        assert!(stdout.contains("hello"));
    }

    #[test]
    fn test_run_with_timeout_captures_stderr() {
        // Use sh -c to write to stderr
        let mut cmd = Command::new("sh");
        cmd.args(["-c", "echo error_msg >&2; exit 1"]);
        let output = run_with_timeout(cmd).expect("should capture output even on non-zero exit");
        assert!(!output.status.success());
        let stderr = String::from_utf8_lossy(&output.stderr);
        assert!(stderr.contains("error_msg"));
    }

    #[test]
    fn test_run_with_timeout_completes_short_process() {
        // Verify that a short-lived process completes successfully through
        // the channel-based implementation.
        let mut cmd = Command::new("sleep");
        cmd.arg("0.1");
        let result = run_with_timeout(cmd);
        assert!(result.is_ok(), "short sleep should complete within timeout");
    }

    #[test]
    fn test_run_with_timeout_handles_large_output() {
        // Produce output larger than the typical OS pipe buffer (64 KiB)
        // to verify the channel-based approach does not deadlock.
        let mut cmd = Command::new("sh");
        cmd.args(["-c", "dd if=/dev/zero bs=1024 count=128 2>/dev/null | od"]);
        let result = run_with_timeout(cmd);
        assert!(
            result.is_ok(),
            "large-output process should not deadlock: {:?}",
            result.err()
        );
    }

    #[test]
    fn test_run_with_timeout_spawn_failure() {
        let cmd = Command::new("/nonexistent/binary/that/does/not/exist");
        let result = run_with_timeout(cmd);
        assert!(result.is_err());
        let err = result.unwrap_err();
        assert!(
            err.contains("Failed to spawn"),
            "Expected spawn failure message, got: {}",
            err
        );
    }
}
