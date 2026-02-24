// Theme initialization -- runs before React to prevent flash of wrong theme.
// Loaded as an external script to comply with Content-Security-Policy script-src 'self'.
(function() {
  var DARK_BG = "#0a0e17";
  var LIGHT_BG = "#f8fafc";
  var theme = "dark";
  try { theme = localStorage.getItem("anatomizer-theme") || "dark"; } catch(e) {}
  if (theme !== "light" && theme !== "dark") {
    theme = window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  }
  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.style.setProperty("--color-bg", theme === "light" ? LIGHT_BG : DARK_BG);
  document.body && (document.body.style.background = theme === "light" ? LIGHT_BG : DARK_BG);
})();
