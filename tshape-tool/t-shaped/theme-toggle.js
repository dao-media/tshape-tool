/**
 * Loads the light/dark toggle markup from theme-toggle.html into #theme-toggle-host.
 * Resolves to undefined on success, or on missing host. Logs on fetch/parse errors.
 */
async function loadThemeToggleFragment() {
  const host = document.getElementById("theme-toggle-host");
  if (!host) return;
  const url = new URL("theme-toggle.html", document.baseURI);
  const res = await fetch(url, { cache: "no-cache" });
  if (!res.ok) {
    console.error("Failed to load theme-toggle.html", res.status, res.statusText);
    return;
  }
  host.innerHTML = await res.text();
}
