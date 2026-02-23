use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SandboxConfig {
    pub max_memory_mb: u64,
    pub max_cpu_secs: u64,
    pub max_output_bytes: usize,
    pub max_pids: u64,
    pub max_fds: u64,
    pub max_file_size_bytes: u64,
    pub enable_network: bool,
    pub rootfs: Option<PathBuf>,
    pub bind_mounts: Vec<(PathBuf, PathBuf)>,
    pub env: Vec<(String, String)>,
    pub uid: u32,
    pub gid: u32,
}

impl Default for SandboxConfig {
    fn default() -> Self {
        Self {
            max_memory_mb: 128,
            max_cpu_secs: 5,
            max_output_bytes: 1 << 20, // 1 MB
            max_pids: 16,
            max_fds: 32,
            max_file_size_bytes: 1 << 20,
            enable_network: false,
            rootfs: None,
            bind_mounts: vec![],
            env: vec![
                ("PATH".into(), "/usr/bin:/bin".into()),
                ("HOME".into(), "/tmp".into()),
            ],
            uid: 65534,
            gid: 65534,
        }
    }
}

/// Builder — every setter returns Self for chaining.
impl SandboxConfig {
    pub fn memory(mut self, mb: u64) -> Self { self.max_memory_mb = mb; self }
    pub fn cpu(mut self, s: u64) -> Self { self.max_cpu_secs = s; self }
    pub fn output(mut self, b: usize) -> Self { self.max_output_bytes = b; self }
    pub fn pids(mut self, n: u64) -> Self { self.max_pids = n; self }
    pub fn fds(mut self, n: u64) -> Self { self.max_fds = n; self }
    pub fn network(mut self, on: bool) -> Self { self.enable_network = on; self }
    pub fn rootfs(mut self, p: impl Into<PathBuf>) -> Self { self.rootfs = Some(p.into()); self }

    pub fn bind(mut self, host: impl Into<PathBuf>, guest: impl Into<PathBuf>) -> Self {
        self.bind_mounts.push((host.into(), guest.into()));
        self
    }

    pub fn env_var(mut self, k: impl Into<String>, v: impl Into<String>) -> Self {
        self.env.push((k.into(), v.into()));
        self
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn default_config_has_safe_defaults() {
        let cfg = SandboxConfig::default();
        assert_eq!(cfg.max_memory_mb, 128);
        assert_eq!(cfg.max_cpu_secs, 5);
        assert_eq!(cfg.max_output_bytes, 1 << 20);
        assert_eq!(cfg.max_pids, 16);
        assert_eq!(cfg.max_fds, 32);
        assert_eq!(cfg.max_file_size_bytes, 1 << 20);
        assert!(!cfg.enable_network, "network should be disabled by default");
        assert!(cfg.rootfs.is_none());
        assert!(cfg.bind_mounts.is_empty());
        assert_eq!(cfg.uid, 65534, "should use nobody uid");
        assert_eq!(cfg.gid, 65534, "should use nobody gid");
    }

    #[test]
    fn default_config_has_minimal_env() {
        let cfg = SandboxConfig::default();
        assert_eq!(cfg.env.len(), 2);
        assert!(cfg.env.iter().any(|(k, _)| k == "PATH"));
        assert!(cfg.env.iter().any(|(k, _)| k == "HOME"));
    }

    #[test]
    fn builder_chain_overrides_all_fields() {
        let cfg = SandboxConfig::default()
            .memory(64)
            .cpu(10)
            .output(2048)
            .pids(32)
            .fds(64)
            .network(true)
            .rootfs("/custom/root");

        assert_eq!(cfg.max_memory_mb, 64);
        assert_eq!(cfg.max_cpu_secs, 10);
        assert_eq!(cfg.max_output_bytes, 2048);
        assert_eq!(cfg.max_pids, 32);
        assert_eq!(cfg.max_fds, 64);
        assert!(cfg.enable_network);
        assert_eq!(cfg.rootfs, Some(PathBuf::from("/custom/root")));
    }

    #[test]
    fn builder_bind_accumulates() {
        let cfg = SandboxConfig::default()
            .bind("/host/a", "/guest/a")
            .bind("/host/b", "/guest/b");

        assert_eq!(cfg.bind_mounts.len(), 2);
        assert_eq!(cfg.bind_mounts[0], (PathBuf::from("/host/a"), PathBuf::from("/guest/a")));
        assert_eq!(cfg.bind_mounts[1], (PathBuf::from("/host/b"), PathBuf::from("/guest/b")));
    }

    #[test]
    fn builder_env_var_accumulates() {
        let cfg = SandboxConfig::default()
            .env_var("FOO", "bar")
            .env_var("BAZ", "qux");

        // 2 defaults + 2 added
        assert_eq!(cfg.env.len(), 4);
        assert!(cfg.env.iter().any(|(k, v)| k == "FOO" && v == "bar"));
        assert!(cfg.env.iter().any(|(k, v)| k == "BAZ" && v == "qux"));
    }

    #[test]
    fn config_serialization_roundtrip() {
        let cfg = SandboxConfig::default().memory(64).cpu(10);
        let json = serde_json::to_string(&cfg).unwrap();
        let deserialized: SandboxConfig = serde_json::from_str(&json).unwrap();
        assert_eq!(deserialized.max_memory_mb, 64);
        assert_eq!(deserialized.max_cpu_secs, 10);
    }
}
