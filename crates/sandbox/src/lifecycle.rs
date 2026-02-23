use std::time::{Duration, Instant};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::config::SandboxConfig;
use crate::container::{Command, Container};
use crate::error::{SandboxError, Result};

// ── State machine ─────────────────────────────────────────────────────────

/// Lifecycle states the sandbox transitions through.
///
/// ```text
///  Created -> Ready -> Running -> Completed -> Destroyed
///                |                      |
///                +----------------------+  (on error)
/// ```
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum State {
    Created,
    Ready,
    Running,
    Completed,
    Destroyed,
}

impl std::fmt::Display for State {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            State::Created => write!(f, "created"),
            State::Ready => write!(f, "ready"),
            State::Running => write!(f, "running"),
            State::Completed => write!(f, "completed"),
            State::Destroyed => write!(f, "destroyed"),
        }
    }
}

/// Result returned to the caller after execution.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExecResult {
    pub exit_code: i32,
    pub stdout: String,
    pub stderr: String,
    pub wall_time: Duration,
    pub timed_out: bool,
    pub oom_killed: bool,
}

// ── Sandbox ───────────────────────────────────────────────────────────────

/// The top-level handle for sandbox lifecycle management.
pub struct Sandbox {
    pub id: String,
    state: State,
    config: SandboxConfig,
    container: Option<Container>,
    history: Vec<ExecResult>,
}

impl Sandbox {
    /// Create a new sandbox handle. Does not yet allocate OS resources.
    pub fn new(config: SandboxConfig) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            state: State::Created,
            config,
            container: None,
            history: Vec::new(),
        }
    }

    // ── Lifecycle transitions ─────────────────────────────────────────

    /// **Created -> Ready**: Allocate the container filesystem and namespaces.
    pub fn prepare(&mut self) -> Result<&mut Self> {
        self.require_state(State::Created)?;
        tracing::info!(id = %self.id, "preparing sandbox");
        let container = Container::prepare(self.config.clone())?;
        self.container = Some(container);
        self.state = State::Ready;
        Ok(self)
    }

    /// **Ready -> Running -> Completed**: Run a command inside the sandbox.
    pub fn exec(
        &mut self,
        program: &str,
        args: &[&str],
        stdin: Option<&[u8]>,
    ) -> Result<&ExecResult> {
        self.require_state(State::Ready)?;
        self.state = State::Running;

        let container = self
            .container
            .as_ref()
            .ok_or_else(|| SandboxError::BadState("container not initialized".into()))?;

        let mut cmd = Command::new(program);
        cmd = cmd.args(args.iter().map(|s| s.to_string()));
        if let Some(data) = stdin {
            cmd = cmd.stdin(data.to_vec());
        }

        let start = Instant::now();
        let result = container.run(&cmd);
        let wall_time = start.elapsed();

        let exec_result = match result {
            Ok(raw) => ExecResult {
                exit_code: raw.status,
                stdout: String::from_utf8_lossy(&raw.stdout).into_owned(),
                stderr: String::from_utf8_lossy(&raw.stderr).into_owned(),
                wall_time,
                timed_out: false,
                oom_killed: false,
            },
            Err(SandboxError::Timeout(s)) => ExecResult {
                exit_code: -1,
                stdout: String::new(),
                stderr: format!("timeout after {s}s"),
                wall_time,
                timed_out: true,
                oom_killed: false,
            },
            Err(SandboxError::Signal(sig)) if sig == libc::SIGKILL => ExecResult {
                exit_code: -1,
                stdout: String::new(),
                stderr: "killed (likely OOM)".into(),
                wall_time,
                timed_out: false,
                oom_killed: true,
            },
            Err(e) => {
                self.state = State::Completed;
                return Err(e);
            }
        };

        self.history.push(exec_result);
        self.state = State::Completed;
        Ok(self.history.last().unwrap())
    }

    /// **Completed -> Ready**: Reset so you can exec again without re-creating.
    pub fn reset(&mut self) -> Result<&mut Self> {
        self.require_state(State::Completed)?;
        tracing::debug!(id = %self.id, "resetting sandbox for reuse");
        self.state = State::Ready;
        Ok(self)
    }

    /// **Any -> Destroyed**: Tear down all OS resources.
    pub fn destroy(&mut self) -> Result<()> {
        if self.state == State::Destroyed {
            return Ok(());
        }
        tracing::info!(id = %self.id, "destroying sandbox");
        if let Some(container) = self.container.take() {
            container.destroy()?;
        }
        self.state = State::Destroyed;
        Ok(())
    }

    // ── Accessors ─────────────────────────────────────────────────────

    pub fn state(&self) -> State { self.state }
    pub fn config(&self) -> &SandboxConfig { &self.config }
    pub fn history(&self) -> &[ExecResult] { &self.history }
    pub fn last_result(&self) -> Option<&ExecResult> { self.history.last() }

    // ── Convenience ───────────────────────────────────────────────────

    /// One-shot: prepare -> exec -> destroy. Returns the result.
    pub fn run_once(
        config: SandboxConfig,
        program: &str,
        args: &[&str],
        stdin: Option<&[u8]>,
    ) -> Result<ExecResult> {
        let mut sb = Self::new(config);
        sb.prepare()?;
        sb.exec(program, args, stdin)?;
        let result = sb.last_result().unwrap().clone();
        sb.destroy()?;
        Ok(result)
    }

    // ── Internal ──────────────────────────────────────────────────────

    fn require_state(&self, expected: State) -> Result<()> {
        if self.state != expected {
            Err(SandboxError::BadState(format!(
                "expected `{expected}`, got `{}`",
                self.state
            )))
        } else {
            Ok(())
        }
    }
}

impl Drop for Sandbox {
    fn drop(&mut self) {
        if self.state != State::Destroyed {
            let _ = self.destroy();
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn state_display() {
        assert_eq!(format!("{}", State::Created), "created");
        assert_eq!(format!("{}", State::Ready), "ready");
        assert_eq!(format!("{}", State::Running), "running");
        assert_eq!(format!("{}", State::Completed), "completed");
        assert_eq!(format!("{}", State::Destroyed), "destroyed");
    }

    #[test]
    fn state_serialization_roundtrip() {
        let state = State::Ready;
        let json = serde_json::to_string(&state).unwrap();
        let deserialized: State = serde_json::from_str(&json).unwrap();
        assert_eq!(deserialized, State::Ready);
    }

    #[test]
    fn sandbox_new_starts_in_created_state() {
        let sb = Sandbox::new(SandboxConfig::default());
        assert_eq!(sb.state(), State::Created);
        assert!(sb.history().is_empty());
        assert!(sb.last_result().is_none());
        assert!(!sb.id.is_empty(), "should have a UUID");
    }

    #[test]
    fn sandbox_new_generates_unique_ids() {
        let sb1 = Sandbox::new(SandboxConfig::default());
        let sb2 = Sandbox::new(SandboxConfig::default());
        assert_ne!(sb1.id, sb2.id);
    }

    #[test]
    fn sandbox_config_accessor() {
        let cfg = SandboxConfig::default().memory(64).cpu(10);
        let sb = Sandbox::new(cfg);
        assert_eq!(sb.config().max_memory_mb, 64);
        assert_eq!(sb.config().max_cpu_secs, 10);
    }

    #[test]
    fn sandbox_exec_requires_ready_state() {
        let mut sb = Sandbox::new(SandboxConfig::default());
        // In Created state, exec should fail
        let result = sb.exec("echo", &["hi"], None);
        assert!(result.is_err());
        let err = format!("{}", result.unwrap_err());
        assert!(err.contains("expected `ready`"));
        assert!(err.contains("created"));
    }

    #[test]
    fn sandbox_reset_requires_completed_state() {
        let mut sb = Sandbox::new(SandboxConfig::default());
        // In Created state, reset should fail
        let result = sb.reset();
        assert!(result.is_err());
    }

    #[test]
    fn sandbox_destroy_is_idempotent() {
        let mut sb = Sandbox::new(SandboxConfig::default());
        // Destroying from Created state should work
        assert!(sb.destroy().is_ok());
        assert_eq!(sb.state(), State::Destroyed);
        // Destroying again should be a no-op
        assert!(sb.destroy().is_ok());
        assert_eq!(sb.state(), State::Destroyed);
    }

    #[test]
    fn exec_result_serialization() {
        let result = ExecResult {
            exit_code: 0,
            stdout: "hello\n".into(),
            stderr: String::new(),
            wall_time: Duration::from_millis(42),
            timed_out: false,
            oom_killed: false,
        };
        let json = serde_json::to_string(&result).unwrap();
        let deserialized: ExecResult = serde_json::from_str(&json).unwrap();
        assert_eq!(deserialized.exit_code, 0);
        assert_eq!(deserialized.stdout, "hello\n");
        assert!(!deserialized.timed_out);
        assert!(!deserialized.oom_killed);
    }
}
