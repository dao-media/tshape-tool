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
  /** Optional display name from step 1; first word used for export title when set. */
  userName: "",
  /** Optional email from step 1 used for draft/send flow. */
  userEmail: "",
  profileType: null,
  selectedItems: [],
  /** @type {Record<string, number | null>} */
  assignments: {},
  /** @type {Record<number, number> | null} */
  maxPerCurrent: null,
  /** @type {{ shape: string, label: string, detail: string } | null} */
  detectedShape: null,
  /** Step 5: category names on-chart vs side legend. */
  shapeVizMode: "labels",
};

const MAX_BY_TYPE = {
  generalist: 12,
  specialist: 6,
};

const categorySet = new Set(DATA.categories);

/** @type {Record<number, { r: number; g: number; b: number; hex: string }>} */
let rankColors = {};

/** Shown only on file exports, below the chart. */
const EXPORT_ATTRIBUTION = "Dane O'Leary | /in/daneoleary";
const VIZ_SVG_W = 900;
const VIZ_SVG_H = 560;
const EXPORT_FOOTER_H = 36;
const SHAPE_GUIDE = {
  I: {
    meaning:
      "An I-shaped designer goes very deep in one domain. This shape usually forms when someone has expert-level capability in one specialty and only light coverage in adjacent skills.",
    roles: [
      "Senior Specialist",
      "Lead Product Designer (domain-heavy)",
      "Motion Specialist",
      "Design Systems Specialist",
      "Accessibility Specialist",
      "Visual Design Specialist on larger teams",
    ],
    strengths: [
      "Highest depth and craft quality in one lane",
      "Faster complex execution in that lane",
      "Strong pattern recognition",
      "High credibility for specialist reviews",
    ],
    weaknesses: [
      "Can get bottlenecked outside core expertise",
      "Lower flexibility in smaller teams",
      "May need stronger collaboration rituals with cross-functional partners",
    ],
  },
  T: {
    meaning:
      "A T-shaped designer combines one strong depth area with broad working knowledge across neighboring disciplines. It is the most common high-performing shape in product teams.",
    roles: [
      "Product Designer",
      "UX Designer",
      "End-to-End Designer",
      "Design Lead in cross-functional squads",
      "Startup teams where one designer covers discovery through delivery",
    ],
    strengths: [
      "Strong balance of quality and adaptability",
      "Can translate across functions",
      "Makes better trade-offs",
      "Keeps delivery moving when context shifts",
    ],
    weaknesses: [
      "Depth can plateau if spread too thin",
      "Broad responsibilities can create overload",
      "Specialist-level craft may lag in highly technical edge cases",
    ],
  },
  Pi: {
    meaning:
      "A Pi-shaped designer has two deep strengths supported by broader capability. This shape is powerful when work requires fluency across two heavy domains.",
    roles: [
      "Staff Product Designer",
      "UX + Research Hybrid",
      "UI + Design Systems Lead",
      "Product + Brand Crossover",
      "Design Manager supporting multi-track execution",
    ],
    strengths: [
      "Can bridge disciplines with fewer handoffs",
      "High leverage across multiple problem types",
      "Strong systems thinking between strategy and execution",
    ],
    weaknesses: [
      "Prioritization can get difficult",
      "Context switching cost is higher",
      "Sustained growth needs intentional focus to avoid being spread across too many tracks",
    ],
  },
  M: {
    meaning:
      "An M-shaped designer develops three or more deep peaks with strong breadth. This shape often appears in experienced designers who have built multiple expert chapters.",
    roles: [
      "Principal Designer",
      "Design Director in hands-on environments",
      "Cross-Product Design Lead",
      "Innovation/Concept Lead",
      "Consultancy-style problem solver",
    ],
    strengths: [
      "Excellent for complex ambiguous programs",
      "Can mentor across disciplines",
      "Strong pattern transfer between domains",
      "Resilient during organizational change",
    ],
    weaknesses: [
      "Can be overutilized",
      "Hard to maintain depth in every peak simultaneously",
      "Role clarity may blur without clear ownership boundaries",
    ],
  },
  X: {
    meaning:
      "An X-shaped designer shows balanced high capability across many areas, often with leadership and integration ability across product, brand, and delivery.",
    roles: [
      "Design Lead",
      "Head of Design in lean orgs",
      "Product Design Manager",
      "Fractional Design Partner",
      "Strategic IC roles connecting business and user outcomes",
    ],
    strengths: [
      "Strong cross-functional leadership",
      "Broad decision quality",
      "High adaptability",
      "Reliable execution across the full product lifecycle",
    ],
    weaknesses: [
      "May lack signature specialist differentiation",
      "Broad accountability can create fatigue",
      "Impact depends on clear prioritization and delegation",
    ],
  },
};

function getCurrentShapeSvgWidth() {
  const svg = document.querySelector("#t-shape-svg");
  if (!svg) return VIZ_SVG_W;
  const vb = svg.getAttribute("viewBox");
  if (!vb) return VIZ_SVG_W;
  const p = vb.trim().split(/\s+/);
  const w = Number(p[2]);
  return Number.isFinite(w) && w > 0 ? w : VIZ_SVG_W;
}

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
    fill: `rgba(${r}, ${g}, ${b}, 0.72)`,
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

function mixTowardWhite(hex, t) {
  const o = hexToRgb(hex);
  const f = (c) => Math.round(c + (255 - c) * t);
  return `rgb(${f(o.r)},${f(o.g)},${f(o.b)})`;
}

function mixTowardBlack(hex, t) {
  const o = hexToRgb(hex);
  const f = (c) => Math.round(c * (1 - t));
  return `rgb(${f(o.r)},${f(o.g)},${f(o.b)})`;
}

function barFillGradientStopsForRank(rank) {
  const h = getRankTheme(rank).hex;
  return { top: mixTowardWhite(h, 0.08), bottom: mixTowardBlack(h, 0.12) };
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

function getMaxPerScore(_profileType, _n) {
  const max = {};
  for (let s = 1; s <= 7; s += 1) max[s] = 1_000_000;
  max[8] = 1;
  max[9] = 1;
  max[10] = 1;
  return max;
}

/** How many *other* skills (not `skill`) currently have this rank. */
function countRankUsedByOthers(assignments, rank, skill) {
  let n = 0;
  for (const [k, v] of Object.entries(assignments)) {
    if (k === skill) continue;
    if (v === rank) n += 1;
  }
  return n;
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

const view = document.querySelector("#view");
const appLayout = document.querySelector("#app-layout");
const sideInfoCard = document.querySelector("#side-info-card");
const THEME_STORAGE_KEY = "tshaped-theme";

const SHAPE_ANALYZE_MS = 2000;
const SHAPE_ANALYZE_LINES = [
  "Analyzing your skillset…",
  "Comparing depth and breadth…",
  "Locking in your bar chart…",
];

function runShapeAnalysisInterstitial(onDone) {
  if (!view) {
    onDone();
    return;
  }
  view.innerHTML = "";
  const card = document.createElement("div");
  card.className = "card card--analyzing";
  card.setAttribute("role", "status");
  card.setAttribute("aria-live", "polite");
  card.innerHTML = `
    <h2>🧩 Almost there</h2>
    <p class="analyzing-lead" id="analyzing-line">${SHAPE_ANALYZE_LINES[0]}</p>
    <div class="analyze-progress" id="analyzing-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" aria-label="Analysis progress">
      <div class="analyze-progress__fill" id="analyzing-fill"></div>
    </div>
    <p class="muted small">This only takes a moment.</p>
  `;
  view.appendChild(card);
  const fill = card.querySelector("#analyzing-fill");
  const bar = card.querySelector("#analyzing-bar");
  const line = card.querySelector("#analyzing-line");
  const t0 = performance.now();
  const tick = (now) => {
    const t = Math.min(1, (now - t0) / SHAPE_ANALYZE_MS);
    const pct = Math.min(100, Math.round(t * 100));
    if (fill) fill.style.width = `${pct}%`;
    if (bar) bar.setAttribute("aria-valuenow", String(pct));
    if (line) {
      const i = t < 0.34 ? 0 : t < 0.68 ? 1 : 2;
      line.textContent = SHAPE_ANALYZE_LINES[i];
    }
    if (t < 1) {
      requestAnimationFrame(tick);
    } else {
      setTimeout(onDone, 160);
    }
  };
  requestAnimationFrame(tick);
}

let rankLimitToastT = 0;
function showRankLimitToast(rank) {
  const label = { 8: "8/10", 9: "9/10", 10: "10/10" }[rank];
  if (!label) return;
  let el = document.getElementById("rank-limit-toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "rank-limit-toast";
    el.className = "rank-limit-toast";
    el.setAttribute("role", "status");
    document.body.appendChild(el);
  }
  el.textContent = `You can only rank one skill a ${label}`;
  el.classList.add("is-visible");
  if (rankLimitToastT) clearTimeout(rankLimitToastT);
  rankLimitToastT = window.setTimeout(() => {
    el.classList.remove("is-visible");
  }, 2600);
}

function setStep(step) {
  state.step = step;
  render();
}

function resetAllToStart() {
  state.step = 1;
  state.userName = "";
  state.userEmail = "";
  state.profileType = null;
  state.selectedItems = [];
  state.assignments = {};
  state.maxPerCurrent = null;
  state.detectedShape = null;
  state.shapeVizMode = "labels";
  render();
}

function bindCardInteractionEffects() {
  const cards = document.querySelectorAll(".card");
  cards.forEach((card) => {
    if (card.dataset.cardFxBound === "1") return;
    card.dataset.cardFxBound = "1";
    card.addEventListener("click", () => {
      if (!window.matchMedia("(pointer: coarse)").matches) return;
      cards.forEach((c) => {
        if (c !== card) c.classList.remove("active");
      });
      card.classList.toggle("active");
    });
  });
}

function wireStaticPanelHandlers() {
  const root = document.querySelector("#side-info-card");
  if (!root) return;
  root.querySelectorAll("[data-action]").forEach((el) => {
    if (el.dataset.bound === "1") return;
    el.dataset.bound = "1";
    el.addEventListener("click", (event) => {
      const action = event.currentTarget.dataset.action;
      handleAction(action);
    });
  });
}

function randBetween(min, max) {
  return min + Math.random() * (max - min);
}

function buildMiniBars(values) {
  return values
    .map((value, i) => {
      const rank = Math.max(1, Math.min(10, Math.round(value * 10)));
      const { top, bottom } = barFillGradientStopsForRank(rank);
      return `<span class="mini-bar" style="--h:${Math.round(value * 100)}%;--d:${(i * 0.04).toFixed(
        2
      )}s;background:linear-gradient(180deg,${top},${bottom})"></span>`;
    })
    .join("");
}

function renderMiniDemoGraphs() {
  const tHost = document.querySelector("#mini-graph-t");
  const mHost = document.querySelector("#mini-graph-m");
  if (!tHost || !mHost) return;
  const tValues = [
    randBetween(0.36, 0.56),
    randBetween(0.28, 0.5),
    randBetween(0.78, 0.98),
    randBetween(0.3, 0.54),
    randBetween(0.24, 0.46),
  ];
  const mValues = [
    randBetween(0.56, 0.88),
    randBetween(0.24, 0.44),
    randBetween(0.58, 0.92),
    randBetween(0.26, 0.46),
    randBetween(0.6, 0.9),
  ];
  tHost.innerHTML = buildMiniBars(tValues);
  mHost.innerHTML = buildMiniBars(mValues);
}

function render() {
  document.querySelectorAll(".step-pill").forEach((pill) => {
    const isActive = Number(pill.dataset.step) === state.step;
    pill.classList.toggle("active", isActive);
  });

  const template = document.querySelector(`#step${state.step}-template`);
  view.innerHTML = "";
  view.appendChild(template.content.cloneNode(true));
  bindCardInteractionEffects();
  wireStaticPanelHandlers();
  wireStepHandlers();

  if (appLayout && sideInfoCard) {
    const shapeMode = state.step === 5;
    appLayout.classList.toggle("app-layout--shape-mode", shapeMode);
    sideInfoCard.hidden = shapeMode;
  }

  if (state.step === 1) {
    const nameInput = document.getElementById("start-name");
    if (nameInput) nameInput.value = state.userName;
    const emailInput = document.getElementById("start-email");
    if (emailInput) emailInput.value = state.userEmail;
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
  root.querySelectorAll(".demo-t-bar").forEach((bar) => {
    const r = bar.dataset.demoRank;
    if (r == null) return;
    const col = bar.querySelector(".demo-t-col");
    if (col) {
      const n = Number(r);
      const { top, bottom } = barFillGradientStopsForRank(n);
      col.style.background = `linear-gradient(180deg, ${top}, ${bottom})`;
    }
  });
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

function syncSelectionInputsFromState() {
  view.querySelectorAll('#categories-list input[type="checkbox"], #specializations-list input[type="checkbox"]').forEach((input) => {
    const labelText = input.closest("label")?.querySelector("span")?.textContent?.trim();
    if (!labelText) return;
    input.checked = state.selectedItems.includes(labelText);
  });
}

function shuffleArray(input) {
  const arr = [...input];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function buildAutoRatings(items, preset = "balanced") {
  const out = {};
  const ordered = preset === "random-valid" ? shuffleArray(items) : [...items];
  const seededByPreset = {
    balanced: [10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
    "top-heavy": [10, 9, 8, 7, 7, 6, 6, 5, 5, 4],
    "random-valid": [10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
  };
  const seeded = seededByPreset[preset] || seededByPreset.balanced;
  ordered.forEach((name, i) => {
    if (i < seeded.length) {
      out[name] = seeded[i];
      return;
    }
    if (preset === "top-heavy") {
      const cycleTopHeavy = [7, 7, 6, 6, 5, 5, 4, 4, 3, 3, 2, 1];
      out[name] = cycleTopHeavy[(i - seeded.length) % cycleTopHeavy.length];
      return;
    }
    if (preset === "random-valid") {
      out[name] = 1 + Math.floor(Math.random() * 7);
      return;
    }
    const cycleBalanced = [7, 6, 5, 4, 3, 2, 1];
    out[name] = cycleBalanced[(i - seeded.length) % cycleBalanced.length];
  });
  return out;
}

/** @param {string} shapeKey */
function articleForShapeLabel(shapeKey) {
  if (shapeKey === "I" || shapeKey === "M" || shapeKey === "X") return "an";
  return "a";
}

/**
 * @param {string} raw
 * @returns {string} First name only, e.g. "JANE doe" -> "Jane"; empty if no usable name.
 */
function parseFirstName(raw) {
  if (raw == null || typeof raw !== "string") return "";
  const trimmed = raw.trim();
  if (!trimmed) return "";
  const first = trimmed.split(/\s+/)[0];
  if (!first) return "";
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
}

/**
 * @param {string} shapeKey e.g. T, Pi, M, I, X
 * @param {string} rawName
 */
function getShapeGraphicHeadline(shapeKey, rawName) {
  const first = parseFirstName(rawName);
  if (first) return `The Shape of ${first}`;
  const art = articleForShapeLabel(shapeKey);
  return `You're ${art} ${shapeKey}-Shaped Designer`;
}

function escapeForEmailLine(text) {
  return String(text || "").replace(/\s+/g, " ").trim();
}

function isLikelyEmail(value) {
  if (!value) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function getDetectedShapeKey() {
  if (state.detectedShape?.shape) return state.detectedShape.shape;
  const mapped = state.selectedItems
    .map((name) => ({ name, value: state.assignments[name] }))
    .filter((x) => x.value != null);
  const d = detectDesignerShape(mapped);
  state.detectedShape = d;
  return d.shape;
}

function buildEmailSubject(shapeKey) {
  return `Your ${shapeKey}-shaped skill map`;
}

function buildEmailBody(shapeKey) {
  const first = parseFirstName(state.userName);
  const greeting = first ? `Hi ${first},` : "Hello,";
  const guide = SHAPE_GUIDE[shapeKey] || SHAPE_GUIDE.T;
  const feedbackUrl =
    "https://docs.google.com/forms/d/e/1FAIpQLSeXdR-MvBi27FW1wgWyVv-dp7XgWqyS6I495NGsp_C4PuRoYA/viewform?usp=header";
  return [
    greeting,
    "",
    "Thanks for testing T-Shaped, a tool I've recently begun building to give designers a high-level, big-picture view of their skills and competencies.",
    "",
    `Since you're a ${shapeKey}-shaped designer, here's some info you may find interesting:`,
    "",
    `What is this shape? ${escapeForEmailLine(guide.meaning)}`,
    `Where this shape thrives: ${escapeForEmailLine(guide.roles.join("; "))}`,
    `Strengths: ${escapeForEmailLine(guide.strengths.join("; "))}`,
    `Blind spots: ${escapeForEmailLine(guide.weaknesses.join("; "))}`,
    "",
    "Again, thanks for using T-Shaped. Your files are attached to this email as a zip file.",
    "",
    `If you have any questions or issues, reach out to Dane at hello@daneoleary.com. Want to provide feedback? Click here: ${feedbackUrl}`,
    "",
    "Warmly,",
    "Dane O'Leary",
    "https://linkedin.com/in/daneoleary",
    "https://daneoleary.com",
    "hello@daneoleary.com",
  ].join("\n");
}

function handleAction(action) {
  switch (action) {
    case "start": {
      const nameInput = document.getElementById("start-name");
      const emailInput = document.getElementById("start-email");
      state.userName = nameInput && "value" in nameInput ? String(nameInput.value) : "";
      state.userEmail = emailInput && "value" in emailInput ? String(emailInput.value).trim() : "";
      state.profileType = null;
      setStep(2);
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
    case "selection-random": {
      if (!state.profileType) {
        alert("Profile type is missing. Go back and choose generalist or specialist.");
        return;
      }
      const capR = MAX_BY_TYPE[state.profileType];
      const pool = [...DATA.categories, ...DATA.specializations];
      for (let i = pool.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
      state.selectedItems = pool.slice(0, capR);
      syncSelectionInputsFromState();
      renderSelectedSummary();
      break;
    }
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
    case "rate-all":
      state.assignments = buildAutoRatings(
        state.selectedItems,
        document.getElementById("rate-all-preset")?.value || "balanced"
      );
      renderRatingStep(true);
      break;
    case "to-step-5": {
      const missing = state.selectedItems.filter((name) => state.assignments[name] == null);
      if (missing.length) {
        alert("Pick a ranking icon for every item.");
        return;
      }
      runShapeAnalysisInterstitial(() => setStep(5));
      break;
    }
    case "start-over":
      resetAllToStart();
      break;
    case "shape-viz-labels":
      state.shapeVizMode = "labels";
      renderVisualization();
      break;
    case "shape-viz-key":
      state.shapeVizMode = "key";
      renderVisualization();
      break;
    case "shape-viz-toggle": {
      const toggle = document.getElementById("shape-viz-toggle");
      state.shapeVizMode = toggle?.checked ? "key" : "labels";
      renderVisualization();
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
    case "email-files":
      emailShapeFiles();
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
  for (const score of [10, 9, 8]) {
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

function updateTickAvailability(assignments, _maxPer) {
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

    if (rank >= 1 && rank <= 7) {
      btn.classList.remove("rank-btn--unavailable");
      btn.classList.toggle("rank-btn--selected", cur === rank);
      return;
    }

    if (rank >= 8 && rank <= 10) {
      const othersHave = countRankUsedByOthers(assignments, rank, skill) >= 1;
      const holds = cur === rank;
      btn.classList.toggle("rank-btn--unavailable", othersHave);
      btn.classList.toggle("rank-btn--selected", Boolean(holds));
    }
  });
}

function applyRankThemeToRow(row, rank) {
  const t = getRankTheme(rank);
  row.style.setProperty("--rank-accent", t.accent);
  row.style.setProperty("--rank-fill", t.fill);
  if (rank != null && rank >= 1 && rank <= 10) {
    row.style.setProperty("--rank-stroke", t.stroke);
    const c = rankColors[rank] || { r: 120, g: 130, b: 160 };
    row.style.setProperty("--rank-glow", `0 0 34px rgba(${c.r}, ${c.g}, ${c.b}, 0.58)`);
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
  if (!state.maxPerCurrent) return;

  const desired = normalizeRankValue(requestedRaw);
  if (desired == null) {
    state.assignments[skill] = null;
    updateRowUI(skill);
    refreshQuotaHost();
    updateAllTickAvailability();
    return;
  }
  if (desired >= 8 && desired <= 10) {
    if (countRankUsedByOthers(state.assignments, desired, skill) >= 1) {
      showRankLimitToast(desired);
      return;
    }
  }
  state.assignments[skill] = desired;

  const row = findRowBySkill(skill);
  if (row) {
    applyRankThemeToRow(row, desired);
    setThermometerUI(row, desired, { animate: true, snapFlash: false });
  }
  updateRowUI(skill, { refreshTicks: true });
  refreshQuotaHost();
  updateAllTickAvailability();
}

function handleThermoKeydown(e, skill, rank) {
  const key = e.key;
  if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(key)) return;
  e.preventDefault();
  const current = normalizeRankValue(state.assignments[skill]) ?? 1;
  if (key === "Home") {
    applyRank(skill, 1);
    return;
  }
  if (key === "End") {
    applyRank(skill, 10);
    return;
  }
  const delta = key === "ArrowLeft" || key === "ArrowDown" ? -1 : 1;
  const next = Math.max(1, Math.min(10, current + delta));
  applyRank(skill, next);
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
          b.setAttribute("aria-keyshortcuts", "ArrowLeft ArrowRight ArrowUp ArrowDown Home End");
        b.addEventListener("click", () => applyRank(skill, r));
          b.addEventListener("keydown", (e) => handleThermoKeydown(e, skill, r));
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

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function peakSummary(scores, threshold = 6) {
  const peaks = [];
  for (let i = 0; i < scores.length; i += 1) {
    const v = scores[i];
    if (v < threshold) continue;
    const l = i > 0 ? scores[i - 1] : v - 0.25;
    const r = i < scores.length - 1 ? scores[i + 1] : v - 0.25;
    if (v < l || v < r) continue;
    const prom = v - Math.max(l, r);
    if (prom < 0.5) continue;
    peaks.push({ idx: i, value: v, prominence: prom });
  }
  return peaks;
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
  const fourth = sorted[3] ?? 0;
  const mean = scores.reduce((a, b) => a + b, 0) / Math.max(1, n);
  const spread = max - (sorted[sorted.length - 1] ?? max);
  const deep = scores.filter((s) => s >= 8).length;
  const high = scores.filter((s) => s >= 7).length;
  const peaks7 = peakSummary(scores, 7);
  const peaks6 = peakSummary(scores, 6);
  const strongPeakCount = peaks7.filter((p) => p.prominence >= 1).length;
  const mediumPeakCount = peaks6.filter((p) => p.prominence >= 1).length;
  const top3Avg = (max + second + third) / 3;
  const top4Avg = (max + second + third + fourth) / 4;
  const nearFlat = spread <= 2 && mean >= 6.6;

  const S = { I: 0, T: 0, Pi: 0, M: 0, X: 0 };

  if (max >= 9 && max - second >= 2.5) S.I += 48;
  if (max >= 8 && max - second >= 3) S.I += 24;
  if (n <= 4 && deep <= 1) S.I += 12;

  if (n >= 5 && deep <= 2 && max >= 8.5 && second <= 8 && spread >= 3.2) S.T += 34;
  if (deep === 1 && high >= 3) S.T += 14;
  if (strongPeakCount <= 2) S.T += 8;

  if (deep >= 2 && n >= 4) S.Pi += 24;
  if (top2AreSeparated(scores) && second >= 8) S.Pi += 26;
  if (strongPeakCount === 2) S.Pi += 18;
  if (strongPeakCount >= 3) S.Pi -= 10;

  if (strongPeakCount >= 3) S.M += 52;
  if (mediumPeakCount >= 3 && top3Avg >= 7.1) S.M += 24;
  if (deep >= 3) S.M += 12;
  if (strongPeakCount <= 2) S.M -= 14;

  const highRatio = high / Math.max(1, n);
  if (highRatio >= 0.65 && nearFlat) S.X += 38;
  if (n >= 5 && scores.every((s) => s >= 6) && top4Avg >= 6.9) S.X += 20;
  if (strongPeakCount >= 3) S.X -= 6;

  // Deterministic tie-break nudges so M isn't mislabeled as Pi when triple peaks exist.
  if (strongPeakCount >= 3) {
    S.M += 8;
    S.Pi -= 4;
  }

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
    detail: `Scores: ${scores.join(", ")} · strong peaks≥7: ${strongPeakCount} · peaks≥6: ${mediumPeakCount}`,
  };
}

function top2AreSeparated(scores) {
  if (scores.length < 2) return false;
  const pairs = scores.map((v, i) => ({ i, v })).sort((a, b) => b.v - a.v);
  const a = pairs[0];
  const b = pairs[1];
  if (!a || !b) return false;
  return Math.abs(a.i - b.i) >= 2;
}

/**
 * @param {readonly string[]} parts
 */
function renderShapeGuidePillsHtml(parts) {
  const lis = parts
    .map((t) => t.trim())
    .filter(Boolean)
    .map((text) => `<li><span class="shape-insight-pill">${escapeHtml(text)}</span></li>`)
    .join("");
  return `<ul class="shape-insight-card__pill-list">${lis}</ul>`;
}

function renderShapeInsights(shape) {
  const host = document.getElementById("shape-insights");
  if (!host) return;
  const guide = SHAPE_GUIDE[shape] || SHAPE_GUIDE.T;
  host.innerHTML = `
    <h2 class="shape-insights-heading">What does being ${shape}-shaped mean?</h2>
    <p class="body-normal shape-insights-subtitle">Insight into what the shape of your skills means.</p>
    <div class="shape-insights-grid stagger-group">
      <article class="shape-insight-card">
        <div class="shape-insight-card__inner">
          <h3 class="guide-card-title">What is this shape?</h3>
          <p class="body-normal">${escapeHtml(guide.meaning)}</p>
        </div>
      </article>
      <article class="shape-insight-card">
        <div class="shape-insight-card__inner">
          <h3 class="guide-card-title">Where this shape thrives</h3>
          ${renderShapeGuidePillsHtml(guide.roles)}
        </div>
      </article>
      <article class="shape-insight-card">
        <div class="shape-insight-card__inner">
          <h3 class="guide-card-title">Strengths</h3>
          ${renderShapeGuidePillsHtml(guide.strengths)}
        </div>
      </article>
      <article class="shape-insight-card">
        <div class="shape-insight-card__inner">
          <h3 class="guide-card-title">Blind spots</h3>
          ${renderShapeGuidePillsHtml(guide.weaknesses)}
        </div>
      </article>
    </div>
  `;
}

function fillShapeKeyCard(mapped, keyMode) {
  const card = document.getElementById("shape-key-card");
  const outer = document.getElementById("shape-viz-outer");
  if (!card) return;
  if (!keyMode) {
    card.hidden = true;
    card.innerHTML = "";
    if (outer) outer.classList.remove("shape-viz-outer--key");
    return;
  }
  card.hidden = false;
  if (outer) outer.classList.add("shape-viz-outer--key");
  card.innerHTML = mapped
    .map((item, i) => {
      const theme = getRankTheme(item.value);
      const { top, bottom } = barFillGradientStopsForRank(item.value);
      return `<div class="shape-key-row" style="--shape-key-d:${(i * 0.04).toFixed(2)}s">
      <span class="shape-key-swatch" style="background:linear-gradient(180deg,${top},${bottom});box-shadow:inset 0 0 0 1.5px ${theme.stroke}"></span>
      <span class="shape-key-name">${escapeHtml(item.name)}</span>
      <span class="shape-key-val">${item.value}/10</span>
    </div>`;
    })
    .join("");
}

function syncShapeVizToggle() {
  const toggle = document.getElementById("shape-viz-toggle");
  if (!toggle) return;
  const keyMode = state.shapeVizMode === "key";
  toggle.checked = keyMode;
  toggle.setAttribute("aria-checked", keyMode ? "true" : "false");
}

function renderVisualization() {
  const svg = document.querySelector("#t-shape-svg");
  const titleEl = document.querySelector("#shape-result-title");
  const subEl = document.querySelector("#shape-result-sub");
  const step5EmailInput = document.getElementById("shape-email");
  if (!svg) return;

  const mapped = state.selectedItems
    .map((name) => ({ name, value: state.assignments[name] }))
    .filter((x) => x.value != null);

  const keyMode = state.shapeVizMode === "key";
  const darkMode = document.body.classList.contains("dark");
  const chartTitleColor = darkMode ? "#e8ecff" : "#22314f";
  const chartLabelColor = darkMode ? "#b8c4e8" : "#33456b";
  const isMobileViz =
    typeof window.matchMedia === "function" && window.matchMedia("(max-width: 720px)").matches;
  const targetBarW = isMobileViz ? 65 : 80;

  const detection = detectDesignerShape(mapped);
  state.detectedShape = detection;
  const headline = getShapeGraphicHeadline(detection.shape, state.userName);
  if (titleEl) {
    titleEl.textContent = headline;
  }
  if (subEl) {
    subEl.textContent = detection.label;
  }
  if (step5EmailInput && "value" in step5EmailInput) {
    step5EmailInput.value = state.userEmail || "";
    if (step5EmailInput.dataset.bound !== "1") {
      step5EmailInput.dataset.bound = "1";
      step5EmailInput.addEventListener("input", () => {
        state.userEmail = String(step5EmailInput.value || "").trim();
      });
    }
  }
  renderShapeInsights(detection.shape);

  svg.innerHTML = "";
  const plotW = keyMode ? Math.round(VIZ_SVG_W * 0.8) : VIZ_SVG_W;
  const H = VIZ_SVG_H;
  const padL = keyMode ? 44 : 56;
  const padR = keyMode ? 44 : 56;
  const titleY = 40;
  const titleH = 26;
  const longestLabelChars = mapped.reduce((m, item) => Math.max(m, item.name.length), 0);
  const labelBand = keyMode
    ? 0
    : clamp(
        Math.round(longestLabelChars * (isMobileViz ? 5.6 : 6.5) + (isMobileViz ? 42 : 56)),
        isMobileViz ? 120 : 145,
        isMobileViz ? 260 : 320
      );
  let padT = titleY + titleH + labelBand;
  let padB = keyMode ? 30 : 42;
  if (isMobileViz) {
    padT -= keyMode ? 8 : 10;
    padB = keyMode ? 24 : 34;
  }
  const chartTop = padT;
  let chartH = H - padT - padB;
  if (chartH < 190) {
    const need = 190 - chartH;
    const trimmedLabelBand = keyMode ? 0 : Math.min(need, Math.max(0, labelBand - 52));
    padT -= trimmedLabelBand;
    chartH = H - padT - padB;
  }
  const n = mapped.length;
  const gap = 10;
  const innerW = plotW - padL - padR;

  let barW = targetBarW;
  if (n > 0) {
    const required = n * barW + (n - 1) * gap;
    if (required > innerW) {
      barW = Math.max(4, (innerW - (n - 1) * gap) / n);
    }
  } else {
    barW = 40;
  }
  const totalContentW = n > 0 ? n * barW + (n - 1) * gap : 0;
  const startX = padL + (innerW - totalContentW) / 2;

  const ns = "http://www.w3.org/2000/svg";
  const bg = document.createElementNS(ns, "rect");
  bg.setAttribute("width", String(plotW));
  bg.setAttribute("height", String(H));
  bg.setAttribute("fill", "transparent");
  bg.setAttribute("pointer-events", "none");
  svg.setAttribute("viewBox", `0 0 ${plotW} ${H}`);
  svg.setAttribute("aria-label", headline);
  svg.appendChild(bg);

  const defs = document.createElementNS(ns, "defs");
  mapped.forEach((item, i) => {
    const g = document.createElementNS(ns, "linearGradient");
    g.setAttribute("id", `tbar-grad-${i}`);
    g.setAttribute("gradientUnits", "objectBoundingBox");
    g.setAttribute("x1", "0");
    g.setAttribute("y1", "0");
    g.setAttribute("x2", "0");
    g.setAttribute("y2", "1");
    const { top, bottom } = barFillGradientStopsForRank(item.value);
    const s0 = document.createElementNS(ns, "stop");
    s0.setAttribute("offset", "0%");
    s0.setAttribute("stop-color", top);
    const s1 = document.createElementNS(ns, "stop");
    s1.setAttribute("offset", "100%");
    s1.setAttribute("stop-color", bottom);
    g.appendChild(s0);
    g.appendChild(s1);
    defs.appendChild(g);
  });
  svg.appendChild(defs);

  const title = document.createElementNS(ns, "text");
  title.setAttribute("x", String(padL));
  title.setAttribute("y", String(titleY));
  title.setAttribute("fill", chartTitleColor);
  title.setAttribute("font-size", "19");
  title.setAttribute("font-weight", "700");
  title.setAttribute("pointer-events", "none");
  title.textContent = headline;
  svg.appendChild(title);

  mapped.forEach((item, i) => {
    const slotX = startX + i * (barW + gap);
    const x = slotX;
    const h = (item.value / 10) * chartH;
    const y = chartTop;
    const theme = getRankTheme(item.value);
    const rect = document.createElementNS(ns, "rect");
    rect.setAttribute("x", String(x));
    rect.setAttribute("y", String(y));
    rect.setAttribute("width", String(barW));
    rect.setAttribute("height", String(Math.max(2, h)));
    rect.setAttribute("rx", "0");
    rect.setAttribute("ry", "0");
    rect.setAttribute("fill", `url(#tbar-grad-${i})`);
    rect.setAttribute("stroke", theme.stroke);
    rect.setAttribute("stroke-width", "1.5");
    rect.setAttribute("class", "tbar");
    rect.style.setProperty("--tbar-d", `${i * 0.04}s`);
    rect.dataset.name = item.name;
    rect.dataset.value = String(item.value);
    svg.appendChild(rect);

    if (!keyMode) {
      const label = document.createElementNS(ns, "text");
      const lx = slotX + barW / 2;
      const labelGap = isMobileViz ? 12 : 16;
      let ly = chartTop - labelGap;
      label.setAttribute("x", String(lx));
      label.setAttribute("y", String(ly));
      label.setAttribute("fill", chartLabelColor);
      label.setAttribute("font-size", String(isMobileViz ? 11 : 12));
      label.setAttribute("font-weight", "600");
      // Anchor at the bar axis and run text away/up from the bar.
      label.setAttribute("text-anchor", "start");
      label.setAttribute("class", "tbar-label-vertical");
      label.setAttribute("transform", `rotate(-90 ${lx} ${ly})`);
      label.setAttribute("pointer-events", "none");
      label.setAttribute("dominant-baseline", "hanging");
      label.style.setProperty("--tbar-d", `${i * 0.04 + 0.08}s`);
      label.textContent = item.name;
      svg.appendChild(label);

      // Hard guarantee: keep label bottom above bar top.
      const maxBottom = chartTop - labelGap;
      const box = label.getBBox();
      const overlap = box.y + box.height - maxBottom;
      if (overlap > 0) {
        ly -= overlap + 2;
        label.setAttribute("y", String(ly));
        label.setAttribute("transform", `rotate(-90 ${lx} ${ly})`);
      }
    }
  });

  fillShapeKeyCard(mapped, keyMode);
  syncShapeVizToggle();
  svg.classList.toggle("is-key-mode", keyMode);

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
    tip.style.left = `${clientX}px`;
    tip.style.top = `${clientY}px`;
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

const EXPORT_KEY_GAP = 20;

function getShapeMappedForExport() {
  return state.selectedItems
    .map((name) => ({ name, value: state.assignments[name] }))
    .filter((x) => x.value != null);
}

/**
 * Layout for chart-only or chart+key export (key matches on-screen 80/20 width intent).
 * @returns {{ totalW: number, totalH: number, bodyH: number, chartW: number, keyW: number, keyX: number, keyContentH: number, hasKey: boolean, padT: number, rowH: number, rowGap: number, padB: number, mapped: Array<{ name: string, value: number }> }}
 */
function getExportLayout() {
  const chartW = getCurrentShapeSvgWidth();
  const mapped = getShapeMappedForExport();
  const keyMode = state.shapeVizMode === "key" && mapped.length > 0;
  const padT = 12;
  const padB = 12;
  const rowH = 19;
  const rowGap = 5;
  if (!keyMode) {
    return {
      totalW: chartW,
      totalH: VIZ_SVG_H + EXPORT_FOOTER_H,
      bodyH: VIZ_SVG_H,
      chartW,
      keyW: 0,
      keyX: 0,
      keyContentH: 0,
      hasKey: false,
      padT,
      rowH,
      rowGap,
      padB,
      mapped,
    };
  }
  const n = mapped.length;
  const keyW = Math.max(225, Math.round(chartW * 0.25));
  const keyContentH = padT + n * rowH + (n - 1) * rowGap + padB;
  const bodyH = Math.max(VIZ_SVG_H, keyContentH);
  return {
    totalW: chartW + EXPORT_KEY_GAP + keyW,
    totalH: bodyH + EXPORT_FOOTER_H,
    bodyH,
    chartW,
    keyW,
    keyX: chartW + EXPORT_KEY_GAP,
    keyContentH,
    hasKey: true,
    padT,
    rowH,
    rowGap,
    padB,
    mapped,
  };
}

/**
 * @param {string} ns
 * @param {SVGSVGElement} parent
 * @param {ReturnType<typeof getExportLayout> & { hasKey: true }} layout
 */
function appendExportKeyGroup(ns, parent, layout) {
  const g0 = document.createElementNS(ns, "g");
  g0.setAttribute("transform", `translate(${layout.keyX},0)`);
  g0.setAttribute("pointer-events", "none");

  const panel = document.createElementNS(ns, "rect");
  panel.setAttribute("x", "0");
  panel.setAttribute("y", "0");
  panel.setAttribute("width", String(layout.keyW));
  panel.setAttribute("height", String(layout.keyContentH));
  panel.setAttribute("rx", "8");
  panel.setAttribute("fill", "#161616");
  panel.setAttribute("stroke", "#2a3552");
  panel.setAttribute("stroke-width", "1");
  g0.appendChild(panel);

  const padL = 10;
  const nameMax = 26;
  const valRight = layout.keyW - padL;
  layout.mapped.forEach((item, i) => {
    const rowTop = layout.padT + i * (layout.rowH + layout.rowGap);
    const theme = getRankTheme(item.value);
    const sw = document.createElementNS(ns, "rect");
    sw.setAttribute("x", String(padL));
    sw.setAttribute("y", String(rowTop));
    sw.setAttribute("width", "8");
    sw.setAttribute("height", "12");
    sw.setAttribute("fill", `url(#tbar-grad-${i})`);
    sw.setAttribute("stroke", theme.stroke);
    sw.setAttribute("stroke-width", "1.1");
    g0.appendChild(sw);
    const tName = document.createElementNS(ns, "text");
    tName.setAttribute("x", String(padL + 12));
    tName.setAttribute("y", String(rowTop + 10));
    tName.setAttribute("fill", "#b8c4e8");
    tName.setAttribute("font-size", "9.5");
    tName.setAttribute("font-family", "Inter, ui-sans-serif, system-ui, -apple-system, sans-serif");
    tName.textContent = truncate(item.name, nameMax);
    g0.appendChild(tName);
    const tVal = document.createElementNS(ns, "text");
    tVal.setAttribute("x", String(valRight));
    tVal.setAttribute("y", String(rowTop + 10));
    tVal.setAttribute("text-anchor", "end");
    tVal.setAttribute("fill", "#e8ecff");
    tVal.setAttribute("font-size", "9.5");
    tVal.setAttribute("font-weight", "600");
    tVal.setAttribute("font-family", "Inter, ui-sans-serif, system-ui, -apple-system, sans-serif");
    tVal.textContent = `${item.value}/10`;
    g0.appendChild(tVal);
  });
  parent.appendChild(g0);
}

function appendAttributionText(ns, parent, y) {
  const t = document.createElementNS(ns, "text");
  t.setAttribute("x", "20");
  t.setAttribute("y", String(y));
  t.setAttribute("fill", "rgba(160, 172, 210, 0.92)");
  t.setAttribute("font-size", "12");
  t.setAttribute("font-family", "Inter, ui-sans-serif, system-ui, -apple-system, sans-serif");
  t.setAttribute("pointer-events", "none");
  t.textContent = EXPORT_ATTRIBUTION;
  parent.appendChild(t);
}

function buildExportSvgString() {
  const svg = document.querySelector("#t-shape-svg");
  if (!svg) return "";
  const layout = getExportLayout();
  const ns = "http://www.w3.org/2000/svg";

  if (!layout.hasKey) {
    const clone = /** @type {SVGSVGElement} */ (svg.cloneNode(true));
    clone.setAttribute("viewBox", `0 0 ${layout.totalW} ${layout.totalH}`);
    clone.setAttribute("height", String(layout.totalH));
    appendAttributionText(ns, clone, layout.bodyH + 22);
    return new XMLSerializer().serializeToString(clone);
  }

  const outer = document.createElementNS(ns, "svg");
  outer.setAttribute("xmlns", ns);
  outer.setAttribute("viewBox", `0 0 ${layout.totalW} ${layout.totalH}`);
  outer.setAttribute("width", String(layout.totalW));
  outer.setAttribute("height", String(layout.totalH));
  const chartClone = /** @type {SVGSVGElement} */ (svg.cloneNode(true));
  chartClone.removeAttribute("id");
  const defEl = chartClone.querySelector("defs");
  if (defEl) {
    outer.appendChild(defEl);
  }
  chartClone.setAttribute("x", "0");
  chartClone.setAttribute("y", "0");
  chartClone.setAttribute("width", String(layout.chartW));
  chartClone.setAttribute("height", String(VIZ_SVG_H));
  outer.appendChild(chartClone);
  /** @type {any} */
  const keyLayout = layout;
  appendExportKeyGroup(ns, outer, keyLayout);
  appendAttributionText(ns, outer, layout.bodyH + 22);
  return new XMLSerializer().serializeToString(outer);
}

function getExportBaseName(shapeKey) {
  const first = parseFirstName(state.userName);
  const safeFirst = first ? first.toLowerCase().replace(/[^a-z0-9_-]/g, "-") : "designer";
  const mode = state.shapeVizMode === "key" ? "key" : "labels";
  return `t-shaped-${shapeKey.toLowerCase()}-${safeFirst}-${mode}`;
}

function buildExportFilename(type, shapeKey) {
  const base = getExportBaseName(shapeKey);
  if (type === "jpeg") return `${base}.jpg`;
  return `${base}.${type}`;
}

function svgStringToBlob(svgStr) {
  return new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
}

function renderRasterBlobFromSvgString(type, svgStr, width, height) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(svgStringToBlob(svgStr));
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          URL.revokeObjectURL(url);
          reject(new Error("Canvas context unavailable."));
          return;
        }
        if (type === "jpeg") {
          ctx.fillStyle = "white";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(url);
            if (!blob) {
              reject(new Error(`Failed to render ${type} blob.`));
              return;
            }
            resolve(blob);
          },
          type === "jpeg" ? "image/jpeg" : "image/png",
          0.95
        );
      } catch (err) {
        URL.revokeObjectURL(url);
        reject(err);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Failed to load export SVG for ${type}.`));
    };
    img.src = url;
  });
}

async function createExportFileBundle() {
  const svgStr = buildExportSvgString();
  if (!svgStr) throw new Error("Could not build export SVG.");
  const layout = getExportLayout();
  const shapeKey = getDetectedShapeKey();
  const [pngBlob, jpegBlob] = await Promise.all([
    renderRasterBlobFromSvgString("png", svgStr, layout.totalW, layout.totalH),
    renderRasterBlobFromSvgString("jpeg", svgStr, layout.totalW, layout.totalH),
  ]);
  return {
    shapeKey,
    svgStr,
    files: [
      { name: buildExportFilename("png", shapeKey), blob: pngBlob },
      { name: buildExportFilename("jpeg", shapeKey), blob: jpegBlob },
      { name: buildExportFilename("svg", shapeKey), blob: svgStringToBlob(svgStr) },
    ],
  };
}

async function sendEmailViaBackend({ toEmail, userName, shapeKey, svgString, baseName }) {
  const resp = await fetch("/.netlify/functions/send-shape-email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      toEmail,
      userName,
      shapeKey,
      svgString,
      baseName,
    }),
  });
  if (!resp.ok) {
    const raw = await resp.text();
    const unsupportedLocalServer =
      (resp.status === 404 || resp.status === 501) &&
      (raw.includes("Unsupported method ('POST')") ||
        raw.includes("Error response") ||
        raw.includes("<!DOCTYPE HTML>"));
    if (unsupportedLocalServer) {
      throw new Error(
        "Email backend endpoint is unavailable on this server. Run the app with `npx netlify dev` and open http://localhost:8888 to use native email sending."
      );
    }
    let detail = raw;
    try {
      const data = JSON.parse(raw);
      detail = data?.error || raw;
    } catch {}
    throw new Error(detail || `Email request failed (${resp.status}).`);
  }
}

async function emailShapeFiles() {
  const step5EmailInput = document.getElementById("shape-email");
  if (step5EmailInput && "value" in step5EmailInput) {
    state.userEmail = String(step5EmailInput.value || "").trim();
  }
  if (!state.userEmail || !isLikelyEmail(state.userEmail)) {
    alert("Add a valid email in Step 1 or Step 5 to send files.");
    return;
  }
  try {
    const { shapeKey, svgStr } = await createExportFileBundle();
    await sendEmailViaBackend({
      toEmail: state.userEmail,
      userName: state.userName,
      shapeKey,
      svgString: svgStr,
      baseName: getExportBaseName(shapeKey),
    });
    alert("Email sent. Check your inbox in a moment.");
  } catch (err) {
    console.error(err);
    const detail = err instanceof Error ? err.message : String(err);
    alert(`Could not prepare your email package. Please try again.\n\nDetails: ${detail}`);
  }
}

function downloadSvg() {
  try {
    const str = buildExportSvgString();
    if (!str) return;
    const shapeKey = getDetectedShapeKey();
    const blob = svgStringToBlob(str);
    triggerDownload(URL.createObjectURL(blob), buildExportFilename("svg", shapeKey));
  } catch (err) {
    console.error(err);
  }
}

function downloadFromSvg(type) {
  const str = buildExportSvgString();
  if (!str) return;
  const { totalW, totalH } = getExportLayout();
  renderRasterBlobFromSvgString(type, str, totalW, totalH)
    .then((blob) => {
      const shapeKey = getDetectedShapeKey();
      triggerDownload(URL.createObjectURL(blob), buildExportFilename(type, shapeKey));
    })
    .catch((err) => {
      console.error(err);
      alert("Could not render export file.");
    });
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
  const max = getMaxPerScore("generalist", 12);
  if (max[10] !== 1 || max[9] !== 1 || max[8] !== 1) throw new Error("selfTest: unique 8–10");
  if (max[1] < 2) throw new Error("selfTest: low ranks unbounded");
  if (countRankUsedByOthers({ a: 10, b: 9 }, 10, "c") !== 1) throw new Error("selfTest: count 10");
  if (countRankUsedByOthers({ a: 10 }, 10, "a") !== 0) throw new Error("selfTest: exclude self");
}

function runSelfTestIfQuery() {
  if (!window.location.search.includes("selftest=1")) return;
  try {
    selfTestRankingLogic();
  } catch (e) {
    console.error(e);
  }
}

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

function applyTheme(mode) {
  const next = mode === "light" ? "#light" : "#dark";
  if ((location.hash || "").toLowerCase() !== next) {
    location.hash = next;
  }
  /* hashchange is not guaranteed before paint; keep body in sync for :target + class */
  syncBodyFromHash();
}

function initThemeToggle() {
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
}

try {
  selfTestRankingLogic();
} catch (e) {
  console.error("T-Shaped selfTest failed", e);
}

void (async function bootApp() {
  await loadThemeToggleFragment();
  document.documentElement.style.setProperty("--global-pulse-scale", "1");
  ensureGlobalPulseLoop();
  initThemeToggle();
  wireStaticPanelHandlers();
  renderMiniDemoGraphs();

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
})();
