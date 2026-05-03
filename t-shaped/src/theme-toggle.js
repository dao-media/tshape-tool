const THEME_STORAGE_KEY = "tshaped-theme";

/** After initial paint — avoids animating theme on cold load via startViewTransition. */
let themeCrossfadeReady = false;

function syncToggleVisualMode(isLight) {
  const root = document.getElementById("theme-toggle");
  if (!root) return;
  root.classList.toggle("is-dark", !isLight);
  root.classList.toggle("is-light", isLight);
}

function forceRetargetCurrentHash() {
  const h = (location.hash || "").toLowerCase();
  if (h !== "#light" && h !== "#dark") return;
  const url = new URL(window.location.href);
  const base = `${url.pathname}${url.search}`;
  // Re-emit the same hash after toggle markup exists so CSS :target resolves correctly.
  history.replaceState(null, "", base);
  history.replaceState(null, "", `${base}${h}`);
}

function syncBodyFromHash() {
  const h = (location.hash || "").toLowerCase();
  if (h !== "#light" && h !== "#dark") return;
  const isLight = h === "#light";
  document.body.classList.toggle("dark", !isLight);
  document.body.classList.toggle("light", isLight);
  document.documentElement.style.colorScheme = isLight ? "light" : "dark";
  syncToggleVisualMode(isLight);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, isLight ? "light" : "dark");
  } catch (e) {}
  /** `replaceState` does not fire `hashchange` — listeners refresh step-5 chart label ink + SVG-dependent UI. */
  document.dispatchEvent(
    new CustomEvent("tshaped-theme-change", {
      bubbles: true,
      detail: { mode: isLight ? "light" : "dark" },
    }),
  );
}

/**
 * Applies theme from `location.hash`; uses View Transitions when supported (after first paint).
 */
function flushBodyThemeWithOptionalCrossfade() {
  const run = () => syncBodyFromHash();
  try {
    if (themeCrossfadeReady && typeof document.startViewTransition === "function") {
      document.startViewTransition(run);
      return;
    }
  } catch {
    /* Some builds expose the API but reject; fall through to sync. */
  }
  run();
}

/**
 * Set #light / #dark for :target CSS without changing scroll.
 */
function setThemeHashNoScroll(nextHash) {
  const want = nextHash.startsWith("#") ? nextHash : `#${nextHash}`;
  const cur = (location.hash || "").toLowerCase();
  if (cur === want.toLowerCase()) {
    syncBodyFromHash();
    return;
  }
  const sx = window.scrollX;
  const sy = window.scrollY;
  /** replaceState updates the fragment (and :target) without firing hashchange — avoids double syncBodyFromHash + style thrash. */
  const url = new URL(window.location.href);
  url.hash = want;
  history.replaceState(history.state, "", url.toString());
  flushBodyThemeWithOptionalCrossfade();
  const restore = () => {
    if (window.scrollX !== sx || window.scrollY !== sy) {
      window.scrollTo(sx, sy);
    }
  };
  restore();
  queueMicrotask(restore);
  requestAnimationFrame(restore);
  requestAnimationFrame(() => {
    requestAnimationFrame(restore);
  });
  setTimeout(restore, 0);
}

function applyTheme(mode) {
  const next = mode === "light" ? "#light" : "#dark";
  setThemeHashNoScroll(next);
}

/**
 * Loads the theme toggle and binds all toggle behavior.
 * This keeps all light/dark logic isolated in one file.
 */
export async function initThemeToggle() {
  const host = document.getElementById("theme-toggle-host");
  if (!host) return;
  const url = new URL("theme-toggle.html", document.baseURI);
  const res = await fetch(url, { cache: "no-cache" });
  if (!res.ok) {
    console.error("Failed to load theme-toggle.html", res.status, res.statusText);
    return;
  }
  host.innerHTML = await res.text();
  forceRetargetCurrentHash();

  queueMicrotask(() => {
    themeCrossfadeReady = true;
  });

  let stored = "dark";
  try {
    stored = localStorage.getItem(THEME_STORAGE_KEY) || "dark";
  } catch (e) {}
  if (stored !== "dark" && stored !== "light") stored = "dark";
  const h = (location.hash || "").toLowerCase();
  if (h === "#light" || h === "#dark") {
    syncBodyFromHash();
  } else {
    applyTheme(stored);
    syncToggleVisualMode(stored === "light");
  }

  const root = document.getElementById("theme-toggle");
  if (!root) return;
  if (root.dataset.hashBound === "1") return;
  root.dataset.hashBound = "1";
  window.addEventListener("hashchange", flushBodyThemeWithOptionalCrossfade, false);
  root.addEventListener(
    "click",
    (e) => {
      const a = e.target && e.target.closest ? e.target.closest("a[href]") : null;
      if (!a || !root.contains(a)) return;
      const href = (a.getAttribute("href") || "").toLowerCase();
      if (href !== "#light" && href !== "#dark") return;
      e.preventDefault();
      applyTheme(href === "#light" ? "light" : "dark");
    },
    true
  );
}
