use std::ffi::CString;
use std::fs;
use std::os::unix::io::{FromRawFd, IntoRawFd};
use std::path::{Path, PathBuf};

use nix::mount::{mount, umount2, MntFlags, MsFlags};
use nix::sched::{clone, CloneFlags};
use nix::sys::signal::Signal;
use nix::sys::wait::{waitpid, WaitStatus};
use nix::unistd::{chdir, chroot, close, dup2, execvpe, pipe, sethostname, Pid};

use crate::config::SandboxConfig;
use crate::error::{SandboxError, Result};
use crate::rlimits;

/// Low-level Linux container built on namespaces.
///
/// Responsibilities:
/// - Set up mount namespace with tmpfs root
/// - Bind-mount required paths read-only
/// - Apply rlimits
/// - Fork into isolated PID/NET/USER namespace
/// - Execute the target command
pub struct Container {
    pub(crate) root_dir: PathBuf,
    pub(crate) config: SandboxConfig,
}

/// What the child should run.
pub struct Command {
    pub program: String,
    pub args: Vec<String>,
    pub stdin_data: Option<Vec<u8>>,
}

impl Command {
    pub fn new(program: impl Into<String>) -> Self {
        Self {
            program: program.into(),
            args: vec![],
            stdin_data: None,
        }
    }

    pub fn arg(mut self, a: impl Into<String>) -> Self {
        self.args.push(a.into());
        self
    }

    pub fn args(mut self, a: impl IntoIterator<Item = impl Into<String>>) -> Self {
        self.args.extend(a.into_iter().map(Into::into));
        self
    }

    pub fn stdin(mut self, data: impl Into<Vec<u8>>) -> Self {
        self.stdin_data = Some(data.into());
        self
    }
}

/// Raw output captured from the sandboxed process.
pub struct RawOutput {
    pub status: i32,
    pub stdout: Vec<u8>,
    pub stderr: Vec<u8>,
}

impl Container {
    // ── Setup ─────────────────────────────────────────────────────────

    /// Prepare the container filesystem under a new tmpdir.
    pub fn prepare(config: SandboxConfig) -> Result<Self> {
        let root_dir = tempfile::tempdir()
            .map_err(|e| SandboxError::Spawn(format!("tmpdir: {e}")))?
            .keep();

        tracing::debug!(root = %root_dir.display(), "preparing container root");

        // Minimal directory skeleton
        for dir in &["proc", "tmp", "dev", "usr/bin", "usr/lib", "lib", "lib64", "etc", "bin"] {
            fs::create_dir_all(root_dir.join(dir))?;
        }

        // Mount tmpfs on /tmp inside root
        mount(
            Some("tmpfs"),
            &root_dir.join("tmp"),
            Some("tmpfs"),
            MsFlags::MS_NOSUID | MsFlags::MS_NODEV,
            Some("size=16m"),
        )?;

        // Bind-mount host paths read-only
        let default_binds: Vec<(&str, &str)> = vec![
            ("/usr/bin", "usr/bin"),
            ("/usr/lib", "usr/lib"),
            ("/lib", "lib"),
            ("/bin", "bin"),
            ("/etc/ld.so.cache", "etc/ld.so.cache"),
        ];

        // /lib64 might not exist on all distros
        if Path::new("/lib64").exists() {
            bind_ro(&root_dir, "/lib64", "lib64")?;
        }

        for (host, guest) in &default_binds {
            if Path::new(host).exists() {
                bind_ro(&root_dir, host, guest)?;
            }
        }

        // User-specified extra mounts
        for (host, guest) in &config.bind_mounts {
            let guest_rel = guest.strip_prefix("/").unwrap_or(guest);
            let target = root_dir.join(guest_rel);
            fs::create_dir_all(&target)?;
            bind_ro(&root_dir, host.to_str().unwrap(), guest_rel.to_str().unwrap())?;
        }

        Ok(Self { root_dir, config })
    }

    // ── Spawn ─────────────────────────────────────────────────────────

    /// Run `cmd` inside the namespace-isolated container.
    /// Returns captured stdout/stderr and exit code.
    pub fn run(&self, cmd: &Command) -> Result<RawOutput> {
        // Pipes for stdout / stderr capture
        let (stdout_r, stdout_w) = pipe()?;
        let (stderr_r, stderr_w) = pipe()?;
        // Pipe for stdin delivery
        let (stdin_r, stdin_w) = pipe()?;

        // Convert OwnedFd to raw fds so we can share them across the clone boundary.
        // The child gets the write ends + stdin read end; the parent gets the read ends + stdin write end.
        let stdout_r_fd = stdout_r.into_raw_fd();
        let stdout_w_fd = stdout_w.into_raw_fd();
        let stderr_r_fd = stderr_r.into_raw_fd();
        let stderr_w_fd = stderr_w.into_raw_fd();
        let stdin_r_fd = stdin_r.into_raw_fd();
        let stdin_w_fd = stdin_w.into_raw_fd();

        let clone_flags = CloneFlags::CLONE_NEWNS
            | CloneFlags::CLONE_NEWPID
            | CloneFlags::CLONE_NEWUTS
            | if !self.config.enable_network {
                CloneFlags::CLONE_NEWNET
            } else {
                CloneFlags::empty()
            };

        // Build C strings before clone (no allocator guarantees post-clone)
        let c_program = CString::new(cmd.program.as_str())
            .map_err(|e| SandboxError::Spawn(format!("bad program name: {e}")))?;

        let mut c_argv_storage: Vec<CString> = Vec::with_capacity(cmd.args.len() + 1);
        c_argv_storage.push(c_program.clone());
        for a in &cmd.args {
            c_argv_storage.push(
                CString::new(a.as_str())
                    .map_err(|e| SandboxError::Spawn(format!("bad arg: {e}")))?,
            );
        }

        let c_env: Vec<CString> = self
            .config
            .env
            .iter()
            .map(|(k, v)| CString::new(format!("{k}={v}")).unwrap())
            .collect();

        let root_dir = self.root_dir.clone();
        let cfg = self.config.clone();

        // 64 KB child stack
        let mut stack = vec![0u8; 1 << 16];

        let child_pid = unsafe {
            clone(
                Box::new(move || {
                    // ── Inside the child ──────────────────────────
                    let _ = child_setup(
                        &root_dir,
                        &cfg,
                        &c_program,
                        &c_argv_storage,
                        &c_env,
                        stdout_w_fd,
                        stderr_w_fd,
                        stdin_r_fd,
                    );
                    // If we get here, exec failed
                    255
                }),
                &mut stack,
                clone_flags,
                Some(Signal::SIGCHLD as i32),
            )
        }
        .map_err(|e| SandboxError::Spawn(format!("clone: {e}")))?;

        // Parent: close child's ends of the pipes
        close(stdout_w_fd)?;
        close(stderr_w_fd)?;
        close(stdin_r_fd)?;

        // Write stdin data if any
        if let Some(ref data) = cmd.stdin_data {
            use std::io::Write;
            // Safety: we own this fd and will close it via the File drop
            let mut stdin_file = unsafe { std::fs::File::from_raw_fd(stdin_w_fd) };
            let _ = stdin_file.write_all(data);
            // drop closes the fd
        } else {
            close(stdin_w_fd)?;
        }

        // Read stdout/stderr with size cap
        let stdout = read_capped(stdout_r_fd, self.config.max_output_bytes)?;
        let stderr = read_capped(stderr_r_fd, self.config.max_output_bytes)?;

        // Wait with timeout
        let status = wait_with_timeout(child_pid, self.config.max_cpu_secs)?;

        Ok(RawOutput { status, stdout, stderr })
    }

    // ── Teardown ──────────────────────────────────────────────────────

    /// Clean up the container filesystem.
    pub fn destroy(self) -> Result<()> {
        // Best-effort unmount everything under root
        let _ = unmount_recursive(&self.root_dir);
        fs::remove_dir_all(&self.root_dir)?;
        tracing::debug!(root = %self.root_dir.display(), "container destroyed");
        Ok(())
    }
}

// ══════════════════════════════════════════════════════════════════════════
// Child-side setup (runs after clone, in new namespaces)
// ══════════════════════════════════════════════════════════════════════════

fn child_setup(
    root_dir: &Path,
    cfg: &SandboxConfig,
    program: &CString,
    argv: &[CString],
    env: &[CString],
    stdout_w_fd: i32,
    stderr_w_fd: i32,
    stdin_r_fd: i32,
) -> Result<()> {
    // Wire up stdio
    dup2(stdin_r_fd, 0)?;
    dup2(stdout_w_fd, 1)?;
    dup2(stderr_w_fd, 2)?;

    // Close originals (now duplicated to 0/1/2)
    close(stdin_r_fd)?;
    close(stdout_w_fd)?;
    close(stderr_w_fd)?;

    // Hostname
    let _ = sethostname("sandbox");

    // chroot into the prepared root
    chroot(root_dir)?;
    chdir("/")?;

    // Mount /proc inside new PID namespace
    let _ = fs::create_dir_all("/proc");
    mount(
        Some("proc"),
        "/proc",
        Some("proc"),
        MsFlags::MS_NOSUID | MsFlags::MS_NODEV | MsFlags::MS_NOEXEC,
        None::<&str>,
    )?;

    // Apply resource limits
    rlimits::apply(cfg)?;

    // No new privileges -- prevents execve from gaining caps via setuid binaries.
    // Safety: prctl(PR_SET_NO_NEW_PRIVS) is a simple flag-set syscall with no
    // memory safety implications.
    unsafe {
        libc::prctl(libc::PR_SET_NO_NEW_PRIVS, 1, 0, 0, 0);
    }

    // Exec
    execvpe(program, argv, env)?;

    Ok(()) // unreachable after exec
}

// ══════════════════════════════════════════════════════════════════════════
// Helpers
// ══════════════════════════════════════════════════════════════════════════

fn bind_ro(root: &Path, host_path: &str, guest_rel: &str) -> Result<()> {
    let target = root.join(guest_rel);
    // Ensure target exists
    if Path::new(host_path).is_dir() {
        fs::create_dir_all(&target)?;
    } else {
        if let Some(parent) = target.parent() {
            fs::create_dir_all(parent)?;
        }
        fs::write(&target, b"")?;
    }

    mount(
        Some(host_path),
        &target,
        None::<&str>,
        MsFlags::MS_BIND | MsFlags::MS_REC,
        None::<&str>,
    )?;

    // Remount read-only
    mount(
        None::<&str>,
        &target,
        None::<&str>,
        MsFlags::MS_BIND | MsFlags::MS_REMOUNT | MsFlags::MS_RDONLY | MsFlags::MS_REC,
        None::<&str>,
    )?;

    Ok(())
}

fn read_capped(fd: i32, max: usize) -> Result<Vec<u8>> {
    use std::io::Read;
    // Safety: we own this fd from pipe() and it hasn't been closed
    let mut file = unsafe { std::fs::File::from_raw_fd(fd) };
    let mut buf = Vec::with_capacity(4096);
    let mut total = 0usize;
    let mut chunk = [0u8; 4096];

    loop {
        match file.read(&mut chunk) {
            Ok(0) => break,
            Ok(n) => {
                total += n;
                if total > max {
                    return Err(SandboxError::OutputOverflow(max));
                }
                buf.extend_from_slice(&chunk[..n]);
            }
            Err(e) if e.kind() == std::io::ErrorKind::Interrupted => continue,
            Err(e) => return Err(e.into()),
        }
    }
    Ok(buf)
}

fn wait_with_timeout(pid: Pid, timeout_secs: u64) -> Result<i32> {
    use std::time::{Duration, Instant};
    let deadline = Instant::now() + Duration::from_secs(timeout_secs + 1); // +1 grace over rlimit CPU

    loop {
        match waitpid(pid, Some(nix::sys::wait::WaitPidFlag::WNOHANG))? {
            WaitStatus::Exited(_, code) => return Ok(code),
            WaitStatus::Signaled(_, sig, _) => {
                return Err(SandboxError::Signal(sig as i32));
            }
            WaitStatus::StillAlive => {
                if Instant::now() >= deadline {
                    let _ = nix::sys::signal::kill(pid, Signal::SIGKILL);
                    let _ = waitpid(pid, None);
                    return Err(SandboxError::Timeout(timeout_secs));
                }
                std::thread::sleep(Duration::from_millis(50));
            }
            _ => continue,
        }
    }
}

fn unmount_recursive(path: &Path) -> Result<()> {
    // Read /proc/mounts and unmount in reverse order
    if let Ok(mounts) = fs::read_to_string("/proc/mounts") {
        let mut mount_points: Vec<&str> = mounts
            .lines()
            .filter_map(|line| {
                let mp = line.split_whitespace().nth(1)?;
                if mp.starts_with(path.to_str()?) {
                    Some(mp)
                } else {
                    None
                }
            })
            .collect();

        // Unmount deepest first
        mount_points.sort_by(|a, b| b.len().cmp(&a.len()));

        for mp in mount_points {
            let _ = umount2(mp, MntFlags::MNT_DETACH);
        }
    }
    Ok(())
}
