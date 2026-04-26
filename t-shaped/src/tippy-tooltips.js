/* global tippy */
(function () {
  const g = typeof window !== "undefined" && typeof window.tippy === "function";
  if (!g) {
    window.TShapedTippy = {
      initIn() {},
      initThemeToggle() {},
      updateThermo() {},
    };
    return;
  }

  tippy.setDefaultProps({
    theme: "tshaped",
    maxWidth: 300,
    delay: [120, 0],
    duration: [200, 160],
    animation: "shift-away",
    zIndex: 3000,
    touch: false,
    appendTo: () => document.body,
    allowHTML: false,
  });

  function initIn(root) {
    if (!root) return;
    const nodes = root.querySelectorAll("[data-tippy-content]");
    nodes.forEach((el) => {
      if (el._tippy) return;
      const c = el.getAttribute("data-tippy-content");
      if (c == null || String(c).trim() === "") return;
      tippy(el, { content: c });
    });
  }

  function initThemeToggle() {
    const host = document.getElementById("theme-toggle-host");
    if (host) initIn(host);
  }

  /**
   * Sync Tippy for thermometer slot buttons (dynamic content, no native title).
   * @param {Element | null} thermo
   */
  function updateThermo(thermo) {
    if (!thermo) return;
    const slots = thermo.querySelectorAll(".thermo-slot");
    slots.forEach((s) => {
      const t = s.getAttribute("data-tippy-content");
      if (t == null || t === "") {
        if (s._tippy) s._tippy.destroy();
        s.removeAttribute("data-tippy-content");
        return;
      }
      if (s._tippy) {
        s._tippy.setContent(t);
      } else {
        tippy(s, { content: t });
      }
    });
  }

  window.TShapedTippy = {
    initIn,
    initThemeToggle,
    updateThermo,
  };
})();
