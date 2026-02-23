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
