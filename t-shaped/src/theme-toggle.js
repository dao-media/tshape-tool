const THEME_STORAGE_KEY = "tshaped-theme";

function syncBodyFromHash() {
  const h = (location.hash || "").toLowerCase();
  if (h !== "#light" && h !== "#dark") return;
  const isLight = h === "#light";
  document.body.classList.toggle("dark", !isLight);
  document.body.classList.toggle("light", isLight);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, isLight ? "light" : "dark");
  } catch (e) {}
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
  location.hash = want;
  syncBodyFromHash();
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
  }

  const root = document.getElementById("theme-toggle");
  if (!root) return;
  if (root.dataset.hashBound === "1") return;
  root.dataset.hashBound = "1";
  window.addEventListener("hashchange", syncBodyFromHash, false);
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
