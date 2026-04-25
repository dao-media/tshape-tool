const DATA = {
  categories: [
    "Web Design",
    "Mobile App Design",
    "UX/Product Design (UXD)",
    "Interaction Design (IxD)",
    "Branding",
    "Print Design",
    "Editorial Design",
    "Packaging Design",
    "Signage Design",
    "Exhibition & Trade Show Design",
    "Animation",
    "3D Design & Modeling",
    "Video Post-Production",
    "Graphic Design",
    "Illustration",
    "Character Design",
    "Social Media Design",
    "Email Design",
    "Presentation Design",
    "Game Design",
    "AR/VR/XR Design",
  ],
  specParentByName: {
    "UI & Dashboard Design (UID)": "Web Design",
    "Brand Identity": "Branding",
    "Motion Graphics": "Animation",
    "Photo Editing & Retouching": "Graphic Design",
    "Concept Art": "Illustration",
    "Icon Design": "Graphic Design",
    "Typography": "Editorial Design",
    "Infographics": "Graphic Design",
    "Data Visualization": "Graphic Design",
    "Accessibility & Ethical Design": "UX/Product Design (UXD)",
    "Design Systems & Governance": "Web Design",
    "Information Architecture (IA)": "UX/Product Design (UXD)",
    "User Research & Testing": "UX/Product Design (UXD)",
    "Prototyping & Wireframing": "UX/Product Design (UXD)",
    "Micro-Interactions & UI Animation": "Interaction Design (IxD)",
    "Component Architecture": "Web Design",
    "DesignOps": "UX/Product Design (UXD)",
    "Conversion Rate Optimization (CRO)": "Web Design",
    "Brand Strategy": "Branding",
    "Color Theory & Systems": "Branding",
    "Visual Hierarchy & Design": "Graphic Design",
    "AI-Augmented Design Workflows": "UX/Product Design (UXD)",
  },
  specializations: [
    "UI & Dashboard Design (UID)",
    "Brand Identity",
    "Motion Graphics",
    "Photo Editing & Retouching",
    "Concept Art",
    "Icon Design",
    "Typography",
    "Infographics",
    "Data Visualization",
    "Accessibility & Ethical Design",
    "Design Systems & Governance",
    "Information Architecture (IA)",
    "User Research & Testing",
    "Prototyping & Wireframing",
    "Micro-Interactions & UI Animation",
    "Component Architecture",
    "DesignOps",
    "Conversion Rate Optimization (CRO)",
    "Brand Strategy",
    "Color Theory & Systems",
    "Visual Hierarchy & Design",
    "AI-Augmented Design Workflows",
  ],
};

const state = {
  step: 1,
  profileType: null,
  selectedItems: [],
  /** @type {Record<string, number | null>} */
  assignments: {},
  /** @type {Record<number, number> | null} */
  maxPerCurrent: null,
  /** @type {{ shape: string, label: string, detail: string } | null} */
  detectedShape: null,
};

const MAX_BY_TYPE = {
  generalist: 12,
  specialist: 6,
};

const categorySet = new Set(DATA.categories);

/** @type {Record<number, { r: number; g: number; b: number; hex: string }>} */
let rankColors = {};

/** Shown in bottom-left of exported SVG/PNG/JPEG. */
const EXPORT_ATTRIBUTION = "Dane O'Leary | /in/daneoleary";

const FALLBACK_RANK_HEX = {
  1: "#5a6d8f",
  2: "#4d7a9c",
  3: "#4a8f8a",
  4: "#5a9a6a",
  5: "#8a9a4a",
  6: "#b89a3a",
  7: "#c98a35",
  8: "#d07050",
  9: "#c05070",
  10: "#a060c8",
};

/**
 * Resolves so icons work when the page is opened as file://, from any CWD, or with querystrings.
 */
function tShapedAppBase() {
  const el =
    document.currentScript && document.currentScript.src
      ? document.currentScript
      : document.querySelector('script[src$="script.js"]');
  if (el && el.src) {
    return new URL(".", el.src);
  }
  return new URL(".", document.baseURI);
}

function rankIconPath(n) {
  return new URL(`icons/Rating%20icon_${n}-10.png`, tShapedAppBase()).href;
}

function getRankTheme(rank) {
  if (rank == null || rank < 1 || rank > 10) {
    return {
      hex: "#6c7698",
      accent: "hsl(226 18% 52%)",
      fill: "rgba(255, 255, 255, 0.04)",
      stroke: "hsl(226 18% 58%)",
    };
  }
  const c = rankColors[rank];
  const hex = c?.hex || FALLBACK_RANK_HEX[rank];
  const r = c?.r ?? 108;
  const g = c?.g ?? 118;
  const b = c?.b ?? 152;
  return {
    hex,
    accent: hex,
    fill: `rgba(${r}, ${g}, ${b}, 0.5)`,
    stroke: hex,
  };
}

function loadRankColorsFromIcons() {
  const jobs = [];
  for (let rank = 1; rank <= 10; rank += 1) {
    jobs.push(
      new Promise((resolve) => {
        if (rank === 10) {
          rankColors[10] = hexToRgb(FALLBACK_RANK_HEX[10]);
          resolve();
          return;
        }
        const img = new Image();
        img.onload = () => {
          try {
            const canvas = document.createElement("canvas");
            const w = 32;
            const h = 32;
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext("2d");
            if (!ctx) {
              resolve();
              return;
            }
            ctx.drawImage(img, 0, 0, w, h);
            let data;
            try {
              data = ctx.getImageData(10, 10, 12, 12).data;
            } catch {
              rankColors[rank] = hexToRgb(FALLBACK_RANK_HEX[rank]);
              resolve();
              return;
            }
            let r = 0;
            let g = 0;
            let b = 0;
            let n = 0;
            for (let i = 0; i < data.length; i += 4) {
              const a = data[i + 3];
              if (a < 20) continue;
              r += data[i];
              g += data[i + 1];
              b += data[i + 2];
              n += 1;
            }
            if (n === 0) n = 1;
            r = Math.round(r / n);
            g = Math.round(g / n);
            b = Math.round(b / n);
            const hex = `#${[r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
            rankColors[rank] = { r, g, b, hex };
          } catch {
            rankColors[rank] = hexToRgb(FALLBACK_RANK_HEX[rank]);
          }
          resolve();
        };
        img.onerror = () => {
          rankColors[rank] = hexToRgb(FALLBACK_RANK_HEX[rank]);
          resolve();
        };
        img.src = rankIconPath(rank);
      })
    );
  }
  return Promise.all(jobs);
}

function hexToRgb(hex) {
  const m = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(hex);
  if (!m) return { r: 100, g: 110, b: 140, hex: "#64708c" };
  const r = parseInt(m[1], 16);
  const g = parseInt(m[2], 16);
  const b = parseInt(m[3], 16);
  return { r, g, b, hex: `#${m[1]}${m[2]}${m[3]}`.toLowerCase() };
}

let globalPulseRaf = null;
let globalPulseT0 = performance.now();
const GLOBAL_PULSE_MS = 4200;

function ensureGlobalPulseLoop() {
  if (globalPulseRaf != null) return;
  function frame(now) {
    const u = ((now - globalPulseT0) % GLOBAL_PULSE_MS) / GLOBAL_PULSE_MS;
    const s = 1 + 0.024 * Math.sin(u * Math.PI * 2);
    document.documentElement.style.setProperty("--global-pulse-scale", s.toFixed(5));
    globalPulseRaf = requestAnimationFrame(frame);
  }
  globalPulseRaf = requestAnimationFrame(frame);
}

function getMaxPerScore(profileType, n) {
  const sequence =
    profileType === "generalist"
      ? [10, 9, 8, 7, 6, 5, 4, 3, 2, 2, 1, 1]
      : [10, 9, 8, 8, 7, 7, 6, 6, 5, 5, 4, 4, 3, 3, 2, 2, 1, 1];
  const used = sequence.slice(0, n);
  const max = {};
  for (let s = 1; s <= 10; s += 1) max[s] = 0;
  used.forEach((v) => {
    max[v] += 1;
  });
  return max;
}

function getUsageCounts(assignments, excludeSkill) {
  const counts = {};
  for (let s = 1; s <= 10; s += 1) counts[s] = 0;
  for (const [skill, v] of Object.entries(assignments)) {
    if (v == null) continue;
    if (excludeSkill && skill === excludeSkill) continue;
    counts[v] += 1;
  }
  return counts;
}

function resolveRankForSkill(requested, skill, assignments, maxPer) {
  const r = Math.min(10, Math.max(1, Math.round(requested)));
  const usage = getUsageCounts(assignments, skill);
  if (maxPer[r] - usage[r] > 0) return r;

  for (let d = 1; d <= 9; d += 1) {
    const up = r + d;
    const down = r - d;
    if (up <= 10 && maxPer[up] - usage[up] > 0) return up;
    if (down >= 1 && maxPer[down] - usage[down] > 0) return down;
  }
  return r;
}

const view = document.querySelector("#view");

function setStep(step) {
  state.step = step;
  render();
}

function render() {
  document.querySelectorAll(".step-pill").forEach((pill) => {
    const isActive = Number(pill.dataset.step) === state.step;
    pill.classList.toggle("active", isActive);
  });

  const template = document.querySelector(`#step${state.step}-template`);
  view.innerHTML = "";
  view.appendChild(template.content.cloneNode(true));
  wireStepHandlers();

  if (state.step === 1) {
    mountDemoTChart();
  } else if (state.step === 2) {
    syncProfileRadios();
  } else if (state.step === 3) {
    renderSelectionLists();
  } else if (state.step === 4) {
    renderRatingStep(true);
  } else if (state.step === 5) {
    renderVisualization();
  }
}

function mountDemoTChart() {
  const root = document.querySelector("#demo-t-chart");
  if (!root) return;
  const mqHover = window.matchMedia("(hover: hover) and (pointer: fine)");
  const setHoverMode = () => {
    root.dataset.mode = mqHover.matches ? "hover" : "tap";
  };
  setHoverMode();
  mqHover.addEventListener("change", setHoverMode);
  root.addEventListener("click", () => {
    if (mqHover.matches) return;
    root.classList.toggle("demo-t-chart--active");
  });
}

function syncProfileRadios() {
  if (!state.profileType) return;
  const input = document.querySelector(
    `input[name="profileType"][value="${state.profileType}"]`
  );
  if (input) input.checked = true;
}

function wireStepHandlers() {
  view.querySelectorAll("[data-action]").forEach((el) => {
    el.addEventListener("click", (event) => {
      const action = event.currentTarget.dataset.action;
      handleAction(action);
    });
  });
}

function handleAction(action) {
  switch (action) {
    case "start-yes":
      state.profileType = null;
      setStep(2);
      break;
    case "start-no": {
      const feedback = document.querySelector("#start-no-feedback");
      feedback.classList.remove("hidden");
      break;
    }
    case "to-step-1":
      setStep(1);
      break;
    case "to-step-2":
      setStep(2);
      break;
    case "selection-reset":
      state.selectedItems = [];
      setStep(3);
      break;
    case "to-step-3": {
      const selected = document.querySelector('input[name="profileType"]:checked');
      if (!selected) {
        alert("Choose generalist or specialist first.");
        return;
      }
      state.profileType = selected.value;
      state.selectedItems = [];
      state.assignments = {};
      setStep(3);
      break;
    }
    case "to-step-4": {
      const cap = MAX_BY_TYPE[state.profileType];
      if (!state.selectedItems.length) {
        alert("Select at least one skill/specialty.");
        return;
      }
      if (state.selectedItems.length > cap) {
        alert(`You can select up to ${cap} items for ${state.profileType}.`);
        return;
      }
      const next = {};
      state.selectedItems.forEach((name) => {
        next[name] = null;
      });
      state.assignments = next;
      setStep(4);
      break;
    }
    case "rate-start-over": {
      const cleared = {};
      state.selectedItems.forEach((name) => {
        cleared[name] = null;
      });
      state.assignments = cleared;
      renderRatingStep(true);
      break;
    }
    case "to-step-5": {
      const missing = state.selectedItems.filter((name) => state.assignments[name] == null);
      if (missing.length) {
        alert("Pick a ranking icon for every item.");
        return;
      }
      setStep(5);
      break;
    }
    case "download-png":
      downloadFromSvg("png");
      break;
    case "download-jpeg":
      downloadFromSvg("jpeg");
      break;
    case "download-svg":
      downloadSvg();
      break;
    default:
      break;
  }
}

function renderSelectionLists() {
  const categoriesList = document.querySelector("#categories-list");
  const specsList = document.querySelector("#specializations-list");
  const cap = MAX_BY_TYPE[state.profileType];
  const capEl = document.querySelector("#selection-cap");
  capEl.textContent = `You can select up to ${cap} items as a ${state.profileType}.`;

  const addOptions = (container, source, prefix) => {
    source.forEach((name, idx) => {
      const id = `${prefix}-${idx}`;
      const label = document.createElement("label");
      label.className = "option-item";
      label.innerHTML = `<input type="checkbox" id="${id}" /> <span>${name}</span>`;
      const input = label.querySelector("input");
      input.checked = state.selectedItems.includes(name);
      input.addEventListener("change", () => {
        if (input.checked) {
          if (state.selectedItems.length >= cap) {
            input.checked = false;
            alert(`Selection cap reached (${cap}).`);
            return;
          }
          state.selectedItems.push(name);
        } else {
          state.selectedItems = state.selectedItems.filter((item) => item !== name);
        }
        renderSelectedSummary();
      });
      container.appendChild(label);
    });
  };

  addOptions(categoriesList, DATA.categories, "cat");
  addOptions(specsList, DATA.specializations, "spec");
  renderSelectedSummary();
}

function renderSelectedSummary() {
  const summary = document.querySelector("#selected-summary");
  const cap = MAX_BY_TYPE[state.profileType];
  const selected = state.selectedItems.length;
  summary.textContent =
    selected === 0
      ? "No items selected yet."
      : `${selected}/${cap} selected: ${state.selectedItems.join(", ")}`;
}

function renderQuotaKeyEl(maxPer, assignments) {
  const usage = getUsageCounts(assignments, null);
  const rows = document.createElement("div");
  rows.className = "quota-key";
  for (let score = 10; score >= 1; score -= 1) {
    const max = maxPer[score] || 0;
    if (max === 0) continue;
    const used = usage[score] || 0;
    const rem = max - used;
    const line = document.createElement("div");
    line.className = "quota-line";
    if (rem <= 0) line.classList.add("quota-line--depleted");
    const group = document.createElement("div");
    group.className = "quota-line-icons";
    group.setAttribute("aria-label", `Rank ${score}: ${rem} of ${max} available`);
    for (let k = 0; k < max; k += 1) {
      const im = document.createElement("img");
      im.className = "quota-line-icon";
      if (k < used) im.classList.add("quota-line-icon--exhausted");
      im.src = rankIconPath(score);
      im.alt = "";
      im.draggable = false;
      group.appendChild(im);
    }
    line.appendChild(group);
    rows.appendChild(line);
  }
  return rows;
}

function refreshQuotaHost() {
  const keyHost = document.querySelector("#ranking-key-host");
  if (!keyHost || !state.maxPerCurrent) return;
  keyHost.innerHTML = "";
  keyHost.appendChild(renderQuotaKeyEl(state.maxPerCurrent, state.assignments));
}

function updateAllTickAvailability() {
  if (!state.maxPerCurrent) return;
  updateTickAvailability(state.assignments, state.maxPerCurrent);
}

function updateTickAvailability(assignments, maxPer) {
  const usage = getUsageCounts(assignments, null);
  document.querySelectorAll("[data-rank-btn]").forEach((btn) => {
    const rank = Number(btn.dataset.rank);
    const row = btn.closest(".skill-rate-row");
    const skill = row && row.dataset.skill;
    const cur = skill != null ? assignments[skill] : null;

    if (rank === 0) {
      btn.classList.remove("rank-btn--unavailable");
      btn.classList.toggle("rank-btn--selected", cur == null);
      return;
    }

    const max = maxPer[rank] || 0;
    const used = usage[rank] || 0;
    const rem = max - used;
    const holds = skill != null && cur === rank;
    const unavailable = rem <= 0 && !holds;
    btn.classList.toggle("rank-btn--unavailable", unavailable);
    btn.classList.toggle("rank-btn--selected", Boolean(holds));
  });
}

function applyRankThemeToRow(row, rank) {
  const t = getRankTheme(rank);
  row.style.setProperty("--rank-accent", t.accent);
  row.style.setProperty("--rank-fill", t.fill);
  if (rank != null && rank >= 1 && rank <= 10) {
    row.style.setProperty("--rank-stroke", t.stroke);
    const c = rankColors[rank] || { r: 120, g: 130, b: 160 };
    row.style.setProperty("--rank-glow", `0 0 28px rgba(${c.r}, ${c.g}, ${c.b}, 0.4)`);
  } else {
    row.style.removeProperty("--rank-stroke");
    row.style.setProperty("--rank-glow", "none");
  }
}

function playHeroEnter(row) {
  const inner = row.querySelector(".skill-rank-hero-inner");
  if (!inner) return;
  inner.classList.remove("is-pulsing");
  inner.classList.remove("is-entering");
  void inner.offsetWidth;
  inner.classList.add("is-entering");
  const onEnd = (e) => {
    if (!e.animationName || !e.animationName.includes("rankIconEnter")) return;
    inner.removeEventListener("animationend", onEnd);
    inner.classList.remove("is-entering");
    inner.classList.add("is-pulsing");
  };
  inner.addEventListener("animationend", onEnd);
}

function findRowBySkill(skill) {
  return [...document.querySelectorAll(".skill-rate-row")].find((r) => r.dataset.skill === skill);
}

function normalizeRankValue(v) {
  const n = Math.round(Number(v));
  if (!Number.isFinite(n)) return null;
  if (n === 0) return null;
  if (n < 1 || n > 10) return null;
  return n;
}

function ensureThermometerIcon(row) {
  const t = row.querySelector(".thermo");
  if (!t) return null;
  let icon = t.querySelector(".thermo-icon");
  if (icon) return icon;
  icon = document.createElement("img");
  icon.className = "thermo-icon hidden";
  icon.alt = "";
  icon.draggable = false;
  t.appendChild(icon);
  return icon;
}

function setThermometerUI(row, rank, opts = {}) {
  const animate = opts.animate !== false;
  const snapFlash = Boolean(opts.snapFlash);
  const t = row.querySelector(".thermo");
  if (!t) return;

  const slots = [...t.querySelectorAll(".thermo-slot")];
  slots.forEach((s) => s.classList.remove("rank-btn--selected"));
  const selectedRank = rank == null ? 0 : rank;
  const selectedSlot = slots.find((s) => Number(s.dataset.rank) === selectedRank);
  selectedSlot?.classList.add("rank-btn--selected");

  t.style.setProperty("--thermo-fill-frac", String(selectedRank / 10));

  const icon = ensureThermometerIcon(row);
  if (!icon) return;

  if (rank == null) {
    icon.classList.add("hidden");
    icon.classList.remove("thermo-icon--pulsing");
    icon.removeAttribute("src");
    icon.style.removeProperty("--slot-idx");
    return;
  }

  icon.src = rankIconPath(rank);
  icon.alt = `Rank ${rank} of 10`;
  icon.classList.remove("hidden");
  icon.classList.add("thermo-icon--pulsing");
  icon.style.setProperty("--slot-idx", String(rank));

  if (animate) {
    icon.classList.remove("thermo-icon--animate");
    void icon.offsetWidth;
    icon.classList.add("thermo-icon--animate");
  }

  if (snapFlash) {
    icon.classList.remove("thermo-icon--snapflash");
    void icon.offsetWidth;
    icon.classList.add("thermo-icon--snapflash");
    setTimeout(() => icon.classList.remove("thermo-icon--snapflash"), 450);
  }
}

/**
 * @param {{ refreshTicks?: boolean }} [opts]
 */
function updateRowUI(skill, opts = {}) {
  const refreshTicks = opts.refreshTicks !== false;
  const row = findRowBySkill(skill);
  if (!row) return;
  const rank = state.assignments[skill];
  const valueEl = row.querySelector(".skill-rate-value");
  applyRankThemeToRow(row, rank);
  setThermometerUI(row, rank, { animate: false });

  if (rank == null) {
    if (valueEl) valueEl.textContent = "—";
  } else {
    if (valueEl) valueEl.textContent = `${rank}/10`;
  }
  if (refreshTicks) updateAllTickAvailability();
}

function applyRank(skill, requestedRaw) {
  const maxPer = state.maxPerCurrent;
  if (!maxPer) return;

  const desired = normalizeRankValue(requestedRaw);
  if (desired == null) {
    state.assignments[skill] = null;
    updateRowUI(skill);
    refreshQuotaHost();
    updateAllTickAvailability();
    return;
  }
  const resolved = resolveRankForSkill(desired, skill, state.assignments, maxPer);
  const snapped = resolved !== desired;
  state.assignments[skill] = resolved;

  const row = findRowBySkill(skill);
  if (row) {
    applyRankThemeToRow(row, resolved);
    setThermometerUI(row, resolved, { animate: true, snapFlash: snapped });
  }
  updateRowUI(skill, { refreshTicks: true });
  refreshQuotaHost();
  updateAllTickAvailability();
}

function renderRatingStep(fullRebuild) {
  const n = state.selectedItems.length;
  const maxPer = getMaxPerScore(state.profileType, n);
  state.maxPerCurrent = maxPer;

  const listEl = document.querySelector("#selected-items");
  const keyHost = document.querySelector("#ranking-key-host");
  if (!listEl) return;

  if (fullRebuild) {
    listEl.innerHTML = "";
    state.selectedItems.forEach((skill, idx) => {
      const isSpec = !categorySet.has(skill);
      const parent = isSpec
        ? ` · ${DATA.specParentByName[skill] || "category"}`
        : "";
      const row = document.createElement("div");
      row.className = "skill-rate-row";
      row.dataset.skill = skill;
      row.dataset.skillIdx = String(idx);

      const rank = state.assignments[skill];
      applyRankThemeToRow(row, rank);

      row.innerHTML = `
        <div class="skill-rate-head">
          <div>
            <div class="skill-title">${escapeHtml(skill)}</div>
            <div class="skill-meta muted">${isSpec ? "Specialization" : "Design category"}${escapeHtml(
        parent
      )}</div>
          </div>
          <div class="skill-rate-value" aria-live="polite">${rank == null ? "—" : `${rank}/10`}</div>
        </div>
        <div class="skill-rate-rating">
          <div class="thermo" role="group" aria-label="Horizontal thermometer rank 0 to 10"></div>
        </div>
      `;

      const thermo = row.querySelector(".thermo");
      for (let r = 0; r <= 10; r += 1) {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "thermo-slot";
        b.dataset.rank = String(r);
        b.dataset.rankBtn = "1";
        b.setAttribute("aria-label", r === 0 ? "Clear rating" : `Set rank ${r} of 10`);
        b.addEventListener("click", () => applyRank(skill, r));
        thermo.appendChild(b);
      }
      ensureThermometerIcon(row);
      setThermometerUI(row, rank, { animate: false });

      listEl.appendChild(row);
    });
  }

  if (keyHost) {
    keyHost.innerHTML = "";
    keyHost.appendChild(renderQuotaKeyEl(maxPer, state.assignments));
  }
  state.selectedItems.forEach((skill) => updateRowUI(skill, { refreshTicks: false }));
  updateAllTickAvailability();
  runSelfTestIfQuery();
}

function localMaximaIndices(arr, minVal) {
  const out = [];
  for (let i = 0; i < arr.length; i += 1) {
    const v = arr[i];
    if (v < minVal) continue;
    const left = i > 0 ? arr[i - 1] : v;
    const right = i < arr.length - 1 ? arr[i + 1] : v;
    if (v >= left && v >= right) out.push(i);
  }
  return out;
}

/**
 * Classify designer profile shape from ordered items (selection order).
 * @param {{ name: string, value: number }[]} items
 */
function detectDesignerShape(items) {
  const n = items.length;
  const scores = items.map((x) => x.value);
  const sorted = [...scores].sort((a, b) => b - a);
  const max = sorted[0] ?? 0;
  const second = sorted[1] ?? 0;
  const third = sorted[2] ?? 0;
  const mean = scores.reduce((a, b) => a + b, 0) / Math.max(1, n);
  const spread = max - (sorted[sorted.length - 1] ?? max);
  const deep = scores.filter((s) => s >= 8).length;
  const high = scores.filter((s) => s >= 7).length;
  const ord = scores;
  const peaks = localMaximaIndices(ord, 7);

  const S = { I: 0, T: 0, Pi: 0, M: 0, X: 0 };

  if (max >= 8 && max - second >= 3) S.I += 38;
  if (n <= 4 && max >= 9 && deep <= 1) S.I += 22;

  if (n >= 5 && deep === 1 && max >= 9 && second <= 7) S.T += 42;
  if (n >= 6 && spread >= 4 && deep <= 2 && mean < 7) S.T += 18;

  if (deep >= 2 && n >= 4) S.Pi += 40;
  if (deep === 2 && max >= 8 && second >= 8) S.Pi += 22;

  if (peaks.length >= 3) S.M += 48;
  if (deep >= 3) S.M += 20;

  const highRatio = high / Math.max(1, n);
  if (highRatio >= 0.65 && spread <= 3 && max >= 7) S.X += 42;
  if (n >= 5 && scores.every((s) => s >= 6) && spread <= 4) S.X += 18;

  const order = ["I", "T", "Pi", "M", "X"];
  let best = "T";
  let bestS = -1;
  order.forEach((k) => {
    if (S[k] > bestS) {
      bestS = S[k];
      best = k;
    }
  });
  if (bestS <= 0) best = "T";

  const labels = {
    I: "I-shaped (deep specialist)",
    T: "T-shaped (broad + one deep stem)",
    Pi: "Pi-shaped (two deep stems)",
    M: "M-shaped (three peaks of depth)",
    X: "X-shaped (balanced strength across areas)",
  };
  return {
    shape: best,
    label: labels[best],
    detail: `Scores: ${scores.join(", ")} · peaks≥7 in order: ${peaks.length}`,
  };
}

function renderVisualization() {
  const svg = document.querySelector("#t-shape-svg");
  const titleEl = document.querySelector("#shape-result-title");
  const subEl = document.querySelector("#shape-result-sub");
  if (!svg) return;

  const mapped = state.selectedItems
    .map((name) => ({ name, value: state.assignments[name] }))
    .filter((x) => x.value != null);

  const detection = detectDesignerShape(mapped);
  state.detectedShape = detection;
  if (titleEl) {
    titleEl.textContent = `Your profile: ${detection.shape}-shaped designer`;
  }
  if (subEl) {
    subEl.textContent = detection.label;
  }

  svg.innerHTML = "";
  const W = 900;
  const H = 560;
  const padL = 48;
  const padR = 48;
  const padT = 86;
  const padB = 86;
  const chartTop = padT;
  const chartH = H - padT - padB;
  const n = mapped.length;
  const gap = 10;
  const slotW = n > 0 ? (W - padL - padR - gap * (n - 1)) / n : 40;
  const barW = Math.max(6, Math.min(14, slotW * 0.22));

  const bg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  bg.setAttribute("width", String(W));
  bg.setAttribute("height", String(H));
  bg.setAttribute("fill", "transparent");
  bg.setAttribute("pointer-events", "none");
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.appendChild(bg);

  const title = document.createElementNS("http://www.w3.org/2000/svg", "text");
  title.setAttribute("x", String(padL));
  title.setAttribute("y", "36");
  title.setAttribute("fill", "#e8ecff");
  title.setAttribute("font-size", "18");
  title.setAttribute("font-weight", "700");
  title.setAttribute("pointer-events", "none");
  title.textContent = `${detection.shape}-shaped profile`;
  svg.appendChild(title);

  mapped.forEach((item, i) => {
    const slotX = padL + i * (slotW + gap);
    const x = slotX + (slotW - barW) / 2;
    const h = (item.value / 10) * chartH;
    const y = chartTop;
    const theme = getRankTheme(item.value);
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", String(x));
    rect.setAttribute("y", String(y));
    rect.setAttribute("width", String(barW));
    rect.setAttribute("height", String(Math.max(2, h)));
    rect.setAttribute("rx", "6");
    rect.setAttribute("fill", theme.fill);
    rect.setAttribute("stroke", theme.stroke);
    rect.setAttribute("stroke-width", "1.5");
    rect.setAttribute("class", "tbar");
    rect.style.setProperty("--tbar-d", `${i * 0.04}s`);
    rect.dataset.name = item.name;
    rect.dataset.value = String(item.value);
    svg.appendChild(rect);

    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("x", String(slotX + slotW / 2));
    label.setAttribute("y", String(H - 30));
    label.setAttribute("fill", "#b8c4e8");
    label.setAttribute("font-size", "10");
    label.setAttribute("text-anchor", "middle");
    label.setAttribute("pointer-events", "none");
    label.textContent = truncate(item.name, Math.max(8, Math.floor(slotW / 5)));
    svg.appendChild(label);
  });

  const credit = document.createElementNS("http://www.w3.org/2000/svg", "text");
  credit.setAttribute("x", "20");
  credit.setAttribute("y", "548");
  credit.setAttribute("fill", "rgba(180, 191, 224, 0.72)");
  credit.setAttribute("font-size", "12");
  credit.setAttribute("font-family", "Inter, ui-sans-serif, system-ui, -apple-system, sans-serif");
  credit.setAttribute("pointer-events", "none");
  credit.textContent = EXPORT_ATTRIBUTION;
  svg.appendChild(credit);

  // Tooltip pill (desktop hover follows cursor; mobile tap toggles)
  const wrap = svg.closest(".viz-wrap");
  if (!wrap) return;
  wrap.style.position = "relative";
  let tip = wrap.querySelector(".viz-pill");
  if (!tip) {
    tip = document.createElement("div");
    tip.className = "viz-pill hidden";
    tip.setAttribute("role", "status");
    wrap.appendChild(tip);
  }

  const isCoarse = window.matchMedia && window.matchMedia("(hover: none), (pointer: coarse)").matches;
  let mobileOn = false;
  const setTip = (text, clientX, clientY) => {
    tip.textContent = text;
    tip.classList.remove("hidden");
    const r = wrap.getBoundingClientRect();
    const x = clientX - r.left;
    const y = clientY - r.top;
    tip.style.left = `${x}px`;
    tip.style.top = `${y}px`;
  };

  svg.onpointermove = (e) => {
    if (isCoarse) return;
    const t = e.target;
    if (!(t instanceof SVGRectElement) || !t.classList.contains("tbar")) {
      tip.classList.add("hidden");
      return;
    }
    setTip(`${t.dataset.name} · ${t.dataset.value}/10`, e.clientX, e.clientY);
  };
  svg.onpointerleave = () => {
    if (isCoarse) return;
    mobileOn = false;
    tip.classList.add("hidden");
  };
  svg.onclick = (e) => {
    if (!isCoarse) return;
    const t = e.target;
    if (!(t instanceof SVGRectElement) || !t.classList.contains("tbar")) {
      mobileOn = false;
      tip.classList.add("hidden");
      return;
    }
    mobileOn = !mobileOn;
    if (mobileOn) setTip(`${t.dataset.name} · ${t.dataset.value}/10`, e.clientX, e.clientY);
    else tip.classList.add("hidden");
  };
}

function truncate(str, max) {
  return str.length <= max ? str : `${str.slice(0, max - 1)}…`;
}

function escapeHtml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function downloadSvg() {
  const svg = document.querySelector("#t-shape-svg");
  const content = svg.outerHTML;
  const blob = new Blob([content], { type: "image/svg+xml;charset=utf-8" });
  triggerDownload(URL.createObjectURL(blob), "designer-shape-profile.svg");
}

function downloadFromSvg(type) {
  const svg = document.querySelector("#t-shape-svg");
  const serializer = new XMLSerializer();
  const svgBlob = new Blob([serializer.serializeToString(svg)], {
    type: "image/svg+xml;charset=utf-8",
  });
  const url = URL.createObjectURL(svgBlob);
  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement("canvas");
    const W = 900;
    const H = 560;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (type === "jpeg") {
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    ctx.drawImage(img, 0, 0);
    canvas.toBlob(
      (blob) => {
        const filename = type === "jpeg" ? "designer-shape.jpg" : "designer-shape.png";
        triggerDownload(URL.createObjectURL(blob), filename);
      },
      type === "jpeg" ? "image/jpeg" : "image/png",
      0.95
    );
    URL.revokeObjectURL(url);
  };
  img.src = url;
}

function triggerDownload(url, filename) {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

function selfTestRankingLogic() {
  const max12 = getMaxPerScore("generalist", 12);
  let sum = 0;
  for (let s = 1; s <= 10; s += 1) sum += max12[s] || 0;
  if (sum !== 12) throw new Error("selfTest: generalist pool");
  const spec1 = getMaxPerScore("specialist", 1);
  if (resolveRankForSkill(3, "x", {}, spec1) !== 10) throw new Error("selfTest: spec1");
  const max6 = getMaxPerScore("specialist", 6);
  const full = { a: 10, b: 9, c: 8, d: 8, e: 7, f: 7 };
  if (resolveRankForSkill(10, "g", full, max6) !== 6) throw new Error("selfTest: spec6");
}

function runSelfTestIfQuery() {
  if (!window.location.search.includes("selftest=1")) return;
  try {
    selfTestRankingLogic();
  } catch (e) {
    console.error(e);
  }
}

try {
  selfTestRankingLogic();
} catch (e) {
  console.error("T-Shaped selfTest failed", e);
}

document.documentElement.style.setProperty("--global-pulse-scale", "1");
ensureGlobalPulseLoop();

for (let r = 1; r <= 10; r += 1) {
  if (!rankColors[r]) rankColors[r] = hexToRgb(FALLBACK_RANK_HEX[r]);
}
loadRankColorsFromIcons().then(() => {
  if (state.step === 4) {
    refreshQuotaHost();
    state.selectedItems.forEach((sk) => updateRowUI(sk, { refreshTicks: false }));
    updateAllTickAvailability();
  }
});

render();
runSelfTestIfQuery();
