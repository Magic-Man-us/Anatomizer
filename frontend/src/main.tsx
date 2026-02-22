import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { applyTheme, getSavedOrSystemTheme } from "./theme";
import App from "./App";

// Apply full theme (all CSS vars) before first render.
// The inline script in index.html already set --color-bg to prevent flash;
// this call fills in the remaining custom properties.
applyTheme(getSavedOrSystemTheme());

const root = document.getElementById("root");
if (!root) throw new Error("Root element not found");

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
