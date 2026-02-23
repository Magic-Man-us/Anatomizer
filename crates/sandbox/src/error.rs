use thiserror::Error;

pub type Result<T> = std::result::Result<T, SandboxError>;

#[derive(Debug, Error)]
pub enum SandboxError {
    #[error("invalid state: sandbox is `{0}`, cannot do that")]
    BadState(String),

    #[error("timeout: killed after {0}s")]
    Timeout(u64),

    #[error("oom: exceeded {0} MB")]
    Oom(u64),

    #[error("output exceeded {0} bytes")]
    OutputOverflow(usize),

    #[error("killed by signal {0}")]
    Signal(i32),

    #[error("exited {0}")]
    Exit(i32),

    #[error("spawn failed: {0}")]
    Spawn(String),

    #[error("io: {0}")]
    Io(#[from] std::io::Error),

    #[error("nix: {0}")]
    Nix(#[from] nix::errno::Errno),
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn bad_state_display() {
        let err = SandboxError::BadState("expected `ready`, got `created`".into());
        let msg = format!("{err}");
        assert!(msg.contains("expected `ready`"));
        assert!(msg.contains("created"));
    }

    #[test]
    fn timeout_display() {
        let err = SandboxError::Timeout(10);
        assert!(format!("{err}").contains("10"));
    }

    #[test]
    fn output_overflow_display() {
        let err = SandboxError::OutputOverflow(1048576);
        assert!(format!("{err}").contains("1048576"));
    }

    #[test]
    fn signal_display() {
        let err = SandboxError::Signal(9);
        assert!(format!("{err}").contains("9"));
    }

    #[test]
    fn spawn_display() {
        let err = SandboxError::Spawn("clone: EPERM".into());
        assert!(format!("{err}").contains("clone: EPERM"));
    }

    #[test]
    fn io_error_conversion() {
        let io_err = std::io::Error::new(std::io::ErrorKind::NotFound, "file not found");
        let err: SandboxError = io_err.into();
        assert!(format!("{err}").contains("file not found"));
    }
}
