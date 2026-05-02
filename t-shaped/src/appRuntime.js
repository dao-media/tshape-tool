import { initThemeToggle } from "./theme-toggle.js";
import { createExportManager } from "./exportRuntime.js";
import {
  NEW_PROMISING_BY_SKILL,
  TOOLS_TO_KNOW_BY_SKILL,
  buildToolSectionsByFirstSkill,
} from "./guideToolsData.js";
import { resolveToolWebsiteUrl } from "./guideToolUrls.js";

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
const LOCAL_STATE_KEY = "tshaped-local-state-v1";
const LOCAL_STATE_COOKIE_KEY = "tshaped_local_state_v1";

const MAX_BY_TYPE = {
  generalist: 12,
  specialist: 6,
};

const categorySet = new Set(DATA.categories);

/** @type {Record<number, { r: number; g: number; b: number; hex: string }>} */
let rankColors = {};

/** Shown only on file exports, below the chart. */
const EXPORT_ATTRIBUTION = "Dane O'Leary | /in/daneoleary";
const EXPORT_SIZE_PX = 1440;
const VIZ_SVG_W = 900;
const VIZ_SVG_H = 560;
const EXPORT_FOOTER_H = 36;

/** Labels: clear space from bottom of label ink to top of bar stack. */
const LABEL_BAR_GAP_PX = 32;
/** Desktop Labels: height of the bar area for a 10/10 bar (user space px). */
const LABELS_BAR_STACK_HEIGHT_DESKTOP = 540;
/** Mobile Labels: bar stack height (10/10) on small viewports. */
const LABELS_BAR_STACK_HEIGHT_MOBILE = 110;
/** Labels: minimum px reserved for bar ink below baseline when ratings are very low (layout stability before viewBox fit). */
const LABELS_BAR_AREA_MIN_DESKTOP = 96;
const LABELS_BAR_AREA_MIN_MOBILE = 52;
/** User-space px: minimum Y for top of label-layer bbox from SVG y=0 — clearance inside card above rotated labels. */
const LABEL_SVG_TOP_MARGIN_PX = 40;
/** Labels: wrap unrotated text to lines no wider than this (user px). After -90°, one line maps to ~vertical span. */
const CHART_SKILL_LABEL_WRAP_MAX_RUN_PX = 160;
/** Minimum vertical extent (SVG user px) reserved for rotated label ink between top margin and bar gap. */
const CHART_LABEL_SLOT_MIN_H_PX = 160;
/** Extra clearance (SVG user px) kept between label ink bottom and bar top, beyond label↔bar gap. */
const CHART_LABEL_ABOVE_BAR_SLACK_PX = 2;
/** Labels mode: minimum gap between bars before shrinking bar width. */
const BAR_GAP_MIN_PX = 6;
/** Tighter wrap on phones so columns stay narrower. */
const CHART_SKILL_LABEL_WRAP_MAX_RUN_MOBILE_PX = 120;

/**
 * Unrotated line length in px (Inter 620 + 0.01em letter-spacing, same as `.tbar-label-vertical` in CSS).
 * After -90° rotation this ≈ vertical space the label needs.
 * @param {string} text
 * @param {number} fontSizePx
 */
function measureChartSkillLabelRunPx(text, fontSizePx) {
  if (!text || !Number.isFinite(fontSizePx) || fontSizePx <= 0) return 0;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return Math.ceil(fontSizePx * text.length * 0.52);
  ctx.font = `620 ${fontSizePx}px Inter, system-ui, -apple-system, "Segoe UI", sans-serif`;
  const w = ctx.measureText(text).width;
  const tracking = fontSizePx * 0.01;
  const tracked = text.length > 1 ? w + tracking * (text.length - 1) : w;
  return Math.ceil(tracked);
}

/**
 * Word-wrap skill name to approximate max horizontal run (user-space px).
 * @param {string} text
 * @param {number} maxRunPx
 * @param {number} fontSizePx
 * @returns {string[]}
 */
function wrapSkillLabelLines(text, maxRunPx, fontSizePx) {
  const m = typeof text === "string" ? text.trim() : "";
  if (!m) return [""];
  const measure = (s) => measureChartSkillLabelRunPx(s, fontSizePx);
  if (!Number.isFinite(maxRunPx) || maxRunPx < 36) return [m];
  if (measure(m) <= maxRunPx) return [m];

  /**
   * @param {string} tok
   */
  function breakLongToken(tok) {
    const out = [];
    let rest = tok;
    while (rest.length) {
      let lo = 0;
      let hi = rest.length;
      while (lo < hi) {
        const mid = Math.floor((lo + hi + 1) / 2);
        const seg = rest.slice(0, mid);
        if (measure(seg) <= maxRunPx) lo = mid;
        else hi = mid - 1;
      }
      let take = lo;
      if (take === 0) take = Math.min(rest.length, 1);
      out.push(rest.slice(0, take));
      rest = rest.slice(take);
    }
    return out;
  }

  const rawWords = m.split(/\s+/);
  /** @type {string[]} */
  const lines = [];
  let cur = "";

  const flushCur = () => {
    if (cur) lines.push(cur);
    cur = "";
  };

  for (const raw of rawWords) {
    const pieces = measure(raw) <= maxRunPx ? [raw] : breakLongToken(raw);
    for (const piece of pieces) {
      const trial = cur ? `${cur} ${piece}` : piece;
      if (measure(trial) <= maxRunPx) {
        cur = trial;
      } else {
        flushCur();
        cur = piece;
      }
    }
  }
  flushCur();

  return lines.length ? lines : [m];
}

/** Line gap as a fraction of font size for stacked tspans inside rotated labels */
function chartLabelLeadingEm() {
  return 1.22;
}

/**
 * Canvas can under-estimate vs real SVG (weight, tracking, kerning). After labels exist, shift the
 * plot down so the label layer’s top edge is at least `minInkY` in SVG user space.
 * @param {SVGSVGElement} svg
 * @param {SVGGElement} plotGroup
 * @param {SVGRectElement} bg
 * @param {number} plotW
 * @param {number} plotH
 * @param {number} minInkY
 * @returns {number} new plot height
 */
function applyShapeChartLabelTopReserve(svg, plotGroup, bg, plotW, plotH, minInkY) {
  const layer = plotGroup.querySelector(".shape-chart-label-layer");
  if (!layer) return plotH;
  let b;
  try {
    b = layer.getBBox();
  } catch {
    return plotH;
  }
  if (!Number.isFinite(b.y)) return plotH;
  const need = Math.ceil(Math.max(0, minInkY - b.y));
  if (need <= 0) return plotH;
  const tr = `translate(0, ${need})`;
  const prev = plotGroup.getAttribute("transform");
  plotGroup.setAttribute("transform", prev ? `${prev} ${tr}` : tr);
  const newH = plotH + need;
  bg.setAttribute("height", String(newH));
  svg.setAttribute("viewBox", `0 0 ${plotW} ${newH}`);
  return newH;
}

function getCurrentShapeSvgHeight() {
  const el = document.querySelector("#t-shape-svg");
  if (!el) return VIZ_SVG_H;
  const vba = el.getAttribute("viewBox");
  if (vba) {
    const p = vba.trim().split(/\s+/);
    const h = Number(p[3]);
    if (Number.isFinite(h) && h > 0) return h;
  }
  const h0 = el.viewBox?.baseVal?.height;
  return typeof h0 === "number" && h0 > 0 ? h0 : VIZ_SVG_H;
}
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

/** Public default art lives under `public/shape-guide/sections/`. Override per-shape via `guideCardImages` on a guide entry. */
const GUIDE_SECTION_FILES = /** @type {const} */ ({
  meaning: "meaning",
  roles: "roles",
  strengths: "strengths",
  weaknesses: "watchouts",
  toolsKnow: "tools-know",
  newPromising: "new-promising",
});

/**
 * Hero image URL for a shape-guide interior card (`248px`-tall media strip).
 * @param {keyof typeof SHAPE_GUIDE} shape
 * @param {keyof typeof GUIDE_SECTION_FILES} section
 */
function guideFeatureImageSrc(shape, section) {
  const guide = SHAPE_GUIDE[shape] || SHAPE_GUIDE.T;
  const overrides = guide.guideCardImages;
  const o = overrides?.[section];
  if (typeof o === "string" && o.trim()) return o.trim();
  const baseUrl = import.meta.env.BASE_URL ?? "/";
  const base = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  const file = GUIDE_SECTION_FILES[section];
  return `${base}shape-guide/sections/${file}.svg`;
}

function getCurrentShapeSvgWidth() {
  const svg = document.querySelector("#t-shape-svg");
  if (!svg) return VIZ_SVG_W;
  const vb = svg.getAttribute("viewBox");
  if (!vb) return VIZ_SVG_W;
  const p = vb.trim().split(/\s+/);
  const w = Number(p[2]);
  return Number.isFinite(w) && w > 0 ? w : VIZ_SVG_W;
}

/**
 * Fit the viewBox in Y to label + bar ink (vertical padding) while keeping X fixed at `0 .. plotW`.
 * Rotated label bboxes must not drive horizontal viewBox changes — that skewed `meet` scaling and
 * caused uneven side padding. Labels mode sets root SVG overflow visible so glyphs are not clipped.
 * @param {SVGSVGElement} svg
 * @param {number} plotW
 * @param {boolean} [forLabels] Labels mode: top-align in the viewport and a touch more y-padding so
 *   scaling matches how Key mode reads (even fill) without vertical centering oddities.
 */
function applyTShapeChartViewBoxFit(svg, plotW, forLabels) {
  if (!svg || !Number.isFinite(plotW) || plotW <= 0) return;
  /** Extra slack above/below bbox so stroke/halo stays inside parent when ancestors clip (SVG overflow visible). */
  const padTop = forLabels ? 140 : 12;
  const padBottom = forLabels ? 40 : 12;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const el of svg.querySelectorAll("text, rect.tbar")) {
    let b;
    try {
      b = el.getBBox();
    } catch (e) {
      continue;
    }
    if (!Number.isFinite(b.width) || !Number.isFinite(b.height)) continue;
    if (b.width <= 0 && b.height <= 0) continue;
    minY = Math.min(minY, b.y);
    maxY = Math.max(maxY, b.y + b.height);
  }
  if (!Number.isFinite(minY) || !Number.isFinite(maxY)) return;
  const r = (n) => Math.round(n * 1000) / 1000;
  const vbY = r(minY - padTop);
  const vbH = r(maxY - minY + padTop + padBottom);
  if (vbH < 4) return;

  const vbX = 0;
  const vbW = r(plotW);

  svg.setAttribute("viewBox", `${vbX} ${vbY} ${vbW} ${vbH}`);
  svg.setAttribute("preserveAspectRatio", forLabels ? "xMinYMin meet" : "xMidYMid meet");
  svg.setAttribute("overflow", forLabels ? "visible" : "hidden");
  const bg = svg.querySelector("rect[fill='transparent']");
  if (bg) {
    bg.setAttribute("x", String(vbX));
    bg.setAttribute("y", String(vbY));
    bg.setAttribute("width", String(vbW));
    bg.setAttribute("height", String(vbH));
  }
}

/**
 * Nudge label so axis-aligned bbox center X matches the bar column center (after rotation).
 * Rotation must be `rotate(-90 pivotX pivotY)` so the painted center stays on the bar column.
 * @param {SVGTextElement} label
 * @param {number} slotCenterX
 * @param {number} pivotY
 */
function alignTbarLabelCenterXToSlot(label, slotCenterX, pivotY) {
  if (!label || !Number.isFinite(slotCenterX) || !Number.isFinite(pivotY)) return;
  let box;
  try {
    box = label.getBBox();
  } catch {
    return;
  }
  if (!Number.isFinite(box.width) || !Number.isFinite(box.x) || box.width < 0.5) return;
  const midX = box.x + box.width / 2;
  const dx = slotCenterX - midX;
  if (Math.abs(dx) < 0.2) return;
  const curX = Number.parseFloat(label.getAttribute("x") || "0");
  const nextX = curX + dx;
  label.setAttribute("x", String(nextX));
  label.querySelectorAll("tspan").forEach((tsp) => {
    tsp.setAttribute("x", String(nextX));
  });
  label.setAttribute("transform", `rotate(-90 ${nextX} ${pivotY})`);
}

/**
 * With no transform on `<text>`: move x/y so bbox bottom aligns to `targetBottomY`.
 * @param {SVGTextElement} label
 */
function snapSvgTextBottomHorizontal(label, targetBottomY) {
  let ly = Number.parseFloat(label.getAttribute("y") || "0");
  for (let pass = 0; pass < 32; pass += 1) {
    let box;
    try {
      box = label.getBBox();
    } catch {
      return ly;
    }
    const bottom = box.y + box.height;
    const err = targetBottomY - bottom;
    if (Math.abs(err) < 0.35) break;
    ly += err;
    label.setAttribute("y", String(ly));
  }
  return ly;
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
function rankIconPath(n) {
  const base = import.meta.env?.BASE_URL ?? "/";
  const root = new URL(base, window.location.origin);
  return new URL(`icons/Rating%20icon_${n}-10.png`, root).href;
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

/** Push each channel from mid-gray to match the boldest, most vibrant on-screen version of the icon art. */
function vividMeterChannels(r, g, b, factor = 1.28) {
  const push = (c) => Math.min(255, Math.max(0, 128 + (c - 128) * factor));
  return { r: Math.round(push(r)), g: Math.round(push(g)), b: Math.round(push(b)) };
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

let view = null;
let appLayout = null;
let sideInfoCard = null;

/**
 * Binds the legacy DOM to module scope (call once after the Solid app mounts).
 */
export function attachAppShellElements() {
  view = document.querySelector("#view");
  appLayout = document.querySelector("#app-layout");
  sideInfoCard = document.querySelector("#side-info-card");
  if (!view || !appLayout || !sideInfoCard) {
    throw new Error("T-Shaped: #view, #app-layout, and #side-info-card must be in the DOM");
  }
}

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
  if (window.TShapedAnim) {
    TShapedAnim.runInterstitial({
      fill,
      bar,
      line,
      totalMs: SHAPE_ANALYZE_MS,
      lines: SHAPE_ANALYZE_LINES,
      onDone,
    });
  } else {
    onDone();
  }
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

function clearPersistedLocalState() {
  try {
    localStorage.removeItem(LOCAL_STATE_KEY);
  } catch (e) {}
  try {
    document.cookie = `${LOCAL_STATE_COOKIE_KEY}=; Path=/; Max-Age=0; SameSite=Lax`;
  } catch (e) {}
}

function normalizeStoredRank(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  const r = Math.round(n);
  if (r < 1 || r > 10) return null;
  return r;
}

function isStoredProfileType(value) {
  return value === "generalist" || value === "specialist";
}

function buildPersistableState() {
  return {
    version: 1,
    step: state.step,
    userName: state.userName,
    userEmail: state.userEmail,
    profileType: state.profileType,
    selectedItems: [...state.selectedItems],
    assignments: { ...state.assignments },
    detectedShape: state.detectedShape ? { ...state.detectedShape } : null,
    shapeVizMode: state.shapeVizMode,
    updatedAt: Date.now(),
  };
}

function saveLocalState() {
  const payload = buildPersistableState();
  try {
    localStorage.setItem(LOCAL_STATE_KEY, JSON.stringify(payload));
  } catch (e) {}
  try {
    const encoded = encodeURIComponent(JSON.stringify(payload));
    // Keep in cookie too, so data survives storage restrictions in some contexts.
    document.cookie = `${LOCAL_STATE_COOKIE_KEY}=${encoded}; Path=/; Max-Age=${60 * 60 * 24 * 30}; SameSite=Lax`;
  } catch (e) {}
}

function loadPersistedLocalState() {
  try {
    const raw = localStorage.getItem(LOCAL_STATE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    // Fall through to cookie restore.
  }
  try {
    const cookies = document.cookie ? document.cookie.split("; ") : [];
    const found = cookies.find((c) => c.startsWith(`${LOCAL_STATE_COOKIE_KEY}=`));
    if (!found) return null;
    const encoded = found.slice(LOCAL_STATE_COOKIE_KEY.length + 1);
    if (!encoded) return null;
    return JSON.parse(decodeURIComponent(encoded));
  } catch (e) {
    return null;
  }
}

function canRestoreDirectToStep5(payload) {
  if (!payload || !isStoredProfileType(payload.profileType)) return false;
  if (!Array.isArray(payload.selectedItems) || payload.selectedItems.length === 0) return false;
  if (!payload.assignments || typeof payload.assignments !== "object") return false;
  for (const item of payload.selectedItems) {
    if (typeof item !== "string" || !item.trim()) return false;
    const rank = normalizeStoredRank(payload.assignments[item]);
    if (rank == null) return false;
  }
  return true;
}

function restoreStateFromLocalStorageIfAvailable() {
  const payload = loadPersistedLocalState();
  if (payload && typeof payload === "object") {
    state.shapeVizMode = payload.shapeVizMode === "key" ? "key" : "labels";
  }
  if (!canRestoreDirectToStep5(payload)) return false;
  const restoredAssignments = {};
  payload.selectedItems.forEach((item) => {
    restoredAssignments[item] = normalizeStoredRank(payload.assignments[item]);
  });
  state.userName = typeof payload.userName === "string" ? payload.userName : "";
  state.userEmail = typeof payload.userEmail === "string" ? payload.userEmail : "";
  state.profileType = payload.profileType;
  state.selectedItems = [...payload.selectedItems];
  state.assignments = restoredAssignments;
  state.detectedShape = payload.detectedShape && typeof payload.detectedShape === "object"
    ? payload.detectedShape
    : null;
  state.step = 5;
  return true;
}

function resetAllToStart() {
  clearPersistedLocalState();
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
  if (window.TShapedAnim) TShapedAnim.bindCardRainbow();
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
  if (window.TShapedAnim) {
    TShapedAnim.animMiniGraph(tHost);
    TShapedAnim.animMiniGraph(mHost);
  }
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
  if (window.TShapedAnim) {
    TShapedAnim.afterRender({ view, sideInfo: sideInfoCard });
  }
  if (window.TShapedTippy) TShapedTippy.initIn(view);
  saveLocalState();
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
    const action = el.dataset.action;
    if (!action) return;
    /** Checkboxes: native Enter does not toggle; Space/mouse do. Drive state from `change` + Enter → click(). */
    if (el instanceof HTMLInputElement && el.type === "checkbox") {
      el.addEventListener("change", () => handleAction(action));
      el.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          el.click();
        }
      });
      return;
    }
    el.addEventListener("click", () => handleAction(action));
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
 * Prefer "First Last" if available; otherwise first token only.
 * @param {string} raw
 * @returns {string}
 */
function parseDisplayName(raw) {
  if (raw == null || typeof raw !== "string") return "";
  const tokens = raw.trim().split(/\s+/).filter(Boolean);
  if (!tokens.length) return "";
  if (tokens.length === 1) {
    const t = tokens[0];
    return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
  }
  const first = tokens[0];
  const last = tokens[tokens.length - 1];
  const fmt = (t) => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
  return `${fmt(first)} ${fmt(last)}`;
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

function showEmailComingSoon() {
  const btn = document.querySelector('[data-action="email-files"]');
  if (!btn) return;
  btn.classList.remove("btn-shudder");
  // restart animation
  // eslint-disable-next-line no-unused-expressions
  btn.offsetWidth;
  btn.classList.add("btn-shudder");
  btn.setAttribute("data-tippy-content", "Coming soon");
  if (window.TShapedTippy) {
    TShapedTippy.initIn(document);
    if (btn._tippy) {
      btn._tippy.show();
      setTimeout(() => {
        btn._tippy?.hide();
      }, 3000);
    }
  }
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
        const preview = missing.slice(0, 8).join(", ");
        const more = missing.length > 8 ? `, +${missing.length - 8} more` : "";
        alert(`Rate all selected skills before continuing.\n\nUnrated: ${preview}${more}`);
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
      showEmailComingSoon();
      break;
    case "learn-more-shape": {
      const guide = document.getElementById("shape-guide-card");
      if (guide) {
        guide.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      break;
    }
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
    row.setAttribute("data-rated", "1");
    row.style.setProperty("--rank-stroke", t.stroke);
    row.style.setProperty("--rank-glow", "none");
    const c = rankColors[rank] || hexToRgb(FALLBACK_RANK_HEX[rank]);
    const v = vividMeterChannels(c.r, c.g, c.b);
    row.style.setProperty("--rank-meter-fill", `rgb(${v.r}, ${v.g}, ${v.b})`);
  } else {
    row.removeAttribute("data-rated");
    row.style.removeProperty("--rank-stroke");
    row.style.removeProperty("--rank-meter-fill");
    row.style.setProperty("--rank-glow", "none");
  }
}

function playHeroEnter(row) {
  if (window.TShapedAnim) TShapedAnim.playHeroEnter(row);
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
  const animateIcon = opts.animate === true;
  const animateFill = Boolean(opts.animateFill);
  const snapFlash = Boolean(opts.snapFlash);
  const t = row.querySelector(".thermo");
  if (!t) return;

  const slots = [...t.querySelectorAll(".thermo-slot")];
  const selectedRank = rank == null ? 0 : rank;
  t.style.setProperty("--thermo-fill-ratio", String(selectedRank / 10));
  slots.forEach((s) => {
    s.classList.remove("rank-btn--selected", "thermo-slot--in-fill");
    const r = Number(s.dataset.rank);
    s.style.setProperty("--fill-idx", String(r));
    if (r <= selectedRank) s.classList.add("thermo-slot--in-fill");
  });
  const selectedSlot = slots.find((s) => Number(s.dataset.rank) === selectedRank);
  selectedSlot?.classList.add("rank-btn--selected");

  slots.forEach((s) => {
    const r = Number(s.dataset.rank);
    if (r === 0) {
      s.setAttribute("aria-label", "Clear rating");
      s.removeAttribute("data-tippy-content");
      return;
    }
    const selected = rank != null && rank === r;
    s.setAttribute("aria-label", selected ? `Rank ${r} of 10 — press again to clear` : `Set rank ${r} of 10`);
    s.setAttribute(
      "data-tippy-content",
      selected ? `Rank ${r}/10 — tap again to clear` : `Set rank ${r} of 10`
    );
  });

  if (window.TShapedTippy) TShapedTippy.updateThermo(t);

  const icon = ensureThermometerIcon(row);
  if (!icon) return;

  if (rank == null) {
    icon.classList.add("hidden");
    icon.removeAttribute("src");
    icon.style.removeProperty("--slot-idx");
    if (window.TShapedAnim) TShapedAnim.thermoApply(row, null, { animate: false, animateFill: false, snapFlash: false });
    return;
  }

  icon.src = rankIconPath(rank);
  icon.alt = `Rank ${rank} of 10`;
  icon.classList.remove("hidden");
  icon.style.setProperty("--slot-idx", String(rank));

  if (window.TShapedAnim) {
    TShapedAnim.thermoApply(row, rank, { animate: animateIcon, animateFill, snapFlash });
  }
}

/**
 * @param {{ refreshTicks?: boolean, animateIcon?: boolean, animateFill?: boolean }} [opts]
 */
function updateRowUI(skill, opts = {}) {
  const refreshTicks = opts.refreshTicks !== false;
  const row = findRowBySkill(skill);
  if (!row) return;
  const rank = state.assignments[skill];
  const valueEl = row.querySelector(".skill-rate-value");
  applyRankThemeToRow(row, rank);
  setThermometerUI(row, rank, {
    animate: opts.animateIcon === true,
    animateFill: Boolean(opts.animateFill),
  });

  if (rank == null) {
    if (valueEl) valueEl.textContent = "—";
  } else {
    if (valueEl) valueEl.textContent = `${rank}/10`;
  }
  if (refreshTicks) updateAllTickAvailability();
}

function applyRank(skill, requestedRaw, actionOpts = {}) {
  if (!state.maxPerCurrent) return;

  const allowRepeatClear = Boolean(actionOpts.allowRepeatClear);
  const desired = normalizeRankValue(requestedRaw);
  const currentRaw = state.assignments[skill];
  const current = currentRaw == null ? null : normalizeRankValue(currentRaw);

  if (allowRepeatClear && desired != null && current != null && desired === current) {
    state.assignments[skill] = null;
    updateRowUI(skill, { refreshTicks: true, animateIcon: false, animateFill: false });
    refreshQuotaHost();
    updateAllTickAvailability();
    return;
  }

  if (desired == null) {
    state.assignments[skill] = null;
    updateRowUI(skill, { refreshTicks: true, animateIcon: false, animateFill: false });
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
  updateRowUI(skill, { refreshTicks: true, animateIcon: true, animateFill: true });
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
        b.addEventListener("click", () => applyRank(skill, r, { allowRepeatClear: true }));
          b.addEventListener("keydown", (e) => handleThermoKeydown(e, skill, r));
        thermo.appendChild(b);
      }
      ensureThermometerIcon(row);
      setThermometerUI(row, rank, { animate: false, animateFill: false });

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
 * Render pill list for Roles / Strengths / Blind spots guide cards (`14px` pill text vs `16px` body).
 * @param {readonly string[]} parts
 * @param {string} [pillModifierClass] e.g. `shape-insight-pill--tools-know`
 */
function renderShapeGuidePillsHtml(parts, pillModifierClass = "") {
  const mod = pillModifierClass.trim();
  const spanClass = mod ? `shape-insight-pill ${mod}` : "shape-insight-pill";
  const lis = parts
    .map((t) => t.trim())
    .filter(Boolean)
    .map((text) => `<li><span class="${spanClass}">${escapeHtml(text)}</span></li>`)
    .join("");
  return `<ul class="shape-insight-card__pill-list">${lis}</ul>`;
}

/**
 * Northeast open-external glyph: separate segments so each stroke traces on (dashoffset ↓).
 * pathLength normalized to 100 for CSS stroke-dasharray.
 */
const GUIDE_TOOL_EXTERNAL_ARROW_SVG = `<svg class="shape-insight-pill__arrow-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path class="shape-insight-pill__arrow-seg shape-insight-pill__arrow-seg--shaft" pathLength="100" d="M4 16 L16 4"/><path class="shape-insight-pill__arrow-seg shape-insight-pill__arrow-seg--head-h" pathLength="100" d="M16 4 L9 4"/><path class="shape-insight-pill__arrow-seg shape-insight-pill__arrow-seg--head-v" pathLength="100" d="M16 4 L16 11"/></svg>`;

/** Escape ampersands for inclusion in quoted HTML attributes (href). */
function escapeHrefAmp(url) {
  return String(url).replace(/&/g, "&amp;");
}

const GUIDE_ARROW_EXIT_SEQ_MQ =
  typeof window.matchMedia === "function"
    ? window.matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)")
    : null;

const GUIDE_ARROW_EXIT_PHASE_CLASS = "shape-insight-pill__arrow-svg--exit-phase";

/**
 * Plays `shape-guide-arrow-exit` on mouseleave (full arrow UR escape → snap stash); `:hover`-off snaps without it.
 */
function bindGuideArrowExitSequence(scope) {
  if (!scope || !GUIDE_ARROW_EXIT_SEQ_MQ?.matches) return;

  scope.querySelectorAll("a.shape-insight-pill--guide-link").forEach((pill) => {
    if (pill.dataset.guideArrowExitSeqBound === "1") return;
    pill.dataset.guideArrowExitSeqBound = "1";
    /** @type {((ev: AnimationEvent) => void) | null} */
    let onExitEnd = null;

    pill.addEventListener("mouseenter", () => {
      const svg = pill.querySelector(".shape-insight-pill__arrow-svg");
      if (!svg) return;
      svg.classList.remove(GUIDE_ARROW_EXIT_PHASE_CLASS);
      svg.style.removeProperty("animation");
      if (onExitEnd) {
        svg.removeEventListener("animationend", onExitEnd);
        onExitEnd = null;
      }
    });

    pill.addEventListener("mouseleave", () => {
      if (!GUIDE_ARROW_EXIT_SEQ_MQ.matches) return;
      const svg = pill.querySelector(".shape-insight-pill__arrow-svg");
      if (!svg) return;
      if (onExitEnd) {
        svg.removeEventListener("animationend", onExitEnd);
        onExitEnd = null;
      }
      /*
       * Do NOT briefly remove `--exit-phase` here: without :hover that instantly applies the
       * stashed SVG rule (opacity 0) → visible “blink”. Keep the class on and replay keyframes instead.
       */
      svg.classList.add(GUIDE_ARROW_EXIT_PHASE_CLASS);
      svg.style.animation = "none";
      void svg.offsetWidth;
      svg.style.removeProperty("animation");

      onExitEnd = (ev) => {
        if (ev.target !== svg || ev.animationName !== "shape-guide-arrow-exit") return;
        svg.removeEventListener("animationend", onExitEnd);
        onExitEnd = null;
        svg.classList.remove(GUIDE_ARROW_EXIT_PHASE_CLASS);
      };
      svg.addEventListener("animationend", onExitEnd);
    });
  });
}

/** Mini notification count when a tool is listed under more than one selected category. */
function shapeInsightDupCountBadge(sources) {
  const n = Array.isArray(sources) ? sources.length : 0;
  if (n <= 1) return "";
  return `<span class="shape-insight-pill__dup-count" aria-hidden="true">${String(n)}</span>`;
}

/** Max length for `data-tippy-content` and similar (avoids huge attribute / layout edge cases). */
const GUIDE_TOOL_TIP_MAX_CHARS = 4000;
/** Keep computed `aria-label` strings from growing without bound. */
const GUIDE_TOOL_ARIA_MAX_CHARS = 500;

function clampGuideTooltipText(text, max = GUIDE_TOOL_TIP_MAX_CHARS) {
  const t = String(text).replace(/\s+/g, " ").trim();
  if (!t) return "";
  return t.length <= max ? t : `${t.slice(0, max - 1)}…`;
}

function clampAriaLabelText(text, max = GUIDE_TOOL_ARIA_MAX_CHARS) {
  const t = String(text).replace(/\s+/g, " ").trim();
  if (!t) return "";
  return t.length <= max ? t : `${t.slice(0, max - 1)}…`;
}

/**
 * @param {{ label: string, sources: string[] }} tool
 */
function toolLinkAccessibleName(tool) {
  const name = String(tool.label || "").trim() || "Tool";
  const n = Array.isArray(tool.sources) ? tool.sources.length : 0;
  let s = `${name} website (opens in new tab)`;
  if (n > 1) s += `. Listed in ${n} of your selected categories.`;
  return clampAriaLabelText(s);
}

/**
 * @param {{ label: string, sources: string[] }} tool
 * @param {string} tipPlain clamped category string
 */
function toolNoUrlAccessibleName(tool, tipPlain) {
  const name = String(tool.label || "").trim() || "Tool";
  const n = Array.isArray(tool.sources) ? tool.sources.length : 0;
  const cats = clampGuideTooltipText(tipPlain, 360);
  let s = `${name}. Linked categories: ${cats}.`;
  if (n > 1) s += ` Listed in ${n} of your selected categories.`;
  s += " No external URL in this guide; keyboard focus shows category details in a tooltip.";
  return clampAriaLabelText(s);
}

function buildGuideToolSectionMap(sections) {
  /** @type {Map<string, { skill: string, tools: { label: string, sources: string[] }[] }>} */
  const m = new Map();
  for (const s of sections) {
    if (s && typeof s.skill === "string") m.set(s.skill, s);
  }
  return m;
}

/**
 * One skill column: label + pills (or empty placeholder).
 * @param {{ pairCell?: boolean, idSuffix?: string }} [opts]
 */
function renderInsightToolSkillCell(
  sec,
  skillTitle,
  pillModifierClass,
  groupIdPrefix,
  idx,
  cellEmptyNote,
  opts = {},
) {
  const safePrefix = /^[a-z0-9-]+$/i.test(groupIdPrefix) ? groupIdPrefix : "tools";
  const mod = pillModifierClass.trim();
  const spanClass = mod ? `shape-insight-pill ${mod}` : "shape-insight-pill";
  const idSuffix = typeof opts.idSuffix === "string" ? opts.idSuffix : "";
  const headingId = `shape-tool-${safePrefix}-${idx}${idSuffix}`;
  const title = sec?.skill || skillTitle;
  const pairCell = opts.pairCell !== false;
  const pairCls = pairCell ? " shape-insights-tools-pair__skill" : "";

  if (!sec?.tools?.length) {
    return `
      <section
        class="shape-insight-tool-group${pairCls}"
        aria-labelledby="${headingId}"
      >
        <hr class="shape-insight-tool-group__rule" aria-hidden="true" />
        <div class="shape-insight-tool-group__body">
          <div class="shape-insight-tool-group__label" id="${headingId}">${escapeHtml(title)}</div>
          <p class="body-normal muted shape-insights-tools-pair__skill-empty">${escapeHtml(cellEmptyNote)}</p>
        </div>
      </section>`;
  }

  return `
    <section class="shape-insight-tool-group${pairCls}" aria-labelledby="${headingId}">
      <hr class="shape-insight-tool-group__rule" aria-hidden="true" />
      <div class="shape-insight-tool-group__body">
        <div class="shape-insight-tool-group__label" id="${headingId}">${escapeHtml(title)}</div>
        <ul class="shape-insight-card__pill-list">
        ${sec.tools
          .map((tool) => {
            const tipPlain = clampGuideTooltipText(tool.sources.join(" · "));
            const tipEsc = escapeHtml(tipPlain);
            const dupBadge = shapeInsightDupCountBadge(tool.sources);
            const url = resolveToolWebsiteUrl(tool.label);
            const labelVis = escapeHtml(String(tool.label || "").trim() || "Unknown tool");
            if (url) {
              const aName = escapeHtml(toolLinkAccessibleName(tool));
              return `<li><a class="${spanClass} shape-insight-pill--guide-link" href="${escapeHrefAmp(url)}" target="_blank" rel="noopener noreferrer" data-tippy-content="${tipEsc}" aria-label="${aName}">${dupBadge}<span class="shape-insight-pill__guide-row" aria-hidden="true"><span class="shape-insight-pill__label">${labelVis}</span><span class="shape-insight-pill__arrow" aria-hidden="true">${GUIDE_TOOL_EXTERNAL_ARROW_SVG}</span></span></a></li>`;
            }
            const btnName = escapeHtml(toolNoUrlAccessibleName(tool, tipPlain));
            return `<li><button type="button" class="${spanClass} shape-insight-pill--no-url" data-tippy-content="${tipEsc}" aria-label="${btnName}">${dupBadge}<span class="shape-insight-pill__label" aria-hidden="true">${labelVis}</span></button></li>`;
          })
          .join("")}
        </ul>
      </div>
    </section>`;
}

/**
 * Paired “Tools to know” + “New & promising”: two separate cards side by side (wide) or stacked (narrow).
 */
function renderShapeInsightsToolsPair(
  shape,
  sectionsToolsKnow,
  sectionsNewPromising,
  orderedSkills,
  emptyFallbackKnow,
  emptyFallbackNew,
) {
  const knowMap = buildGuideToolSectionMap(sectionsToolsKnow);
  const newMap = buildGuideToolSectionMap(sectionsNewPromising);
  const skills = orderedSkills.filter((s) => knowMap.has(s) || newMap.has(s));
  const n = skills.length;

  const cellEmptyKnow = "No tools listed here for this category.";
  const cellEmptyNew = "No emerging picks listed for this category.";

  let knowGroupsHtml = "";
  let newGroupsHtml = "";
  if (n === 0) {
    knowGroupsHtml = `<p class="body-normal muted shape-insight-tools-empty">${escapeHtml(emptyFallbackKnow)}</p>`;
    newGroupsHtml = `<p class="body-normal muted shape-insight-tools-empty">${escapeHtml(emptyFallbackNew)}</p>`;
  } else {
    for (let i = 0; i < n; i += 1) {
      const sk = skills[i];
      knowGroupsHtml += renderInsightToolSkillCell(
        knowMap.get(sk) || null,
        sk,
        "shape-insight-pill--tools-know",
        "know",
        i,
        cellEmptyKnow,
      );
      newGroupsHtml += renderInsightToolSkillCell(
        newMap.get(sk) || null,
        sk,
        "shape-insight-pill--new-promising",
        "new",
        i,
        cellEmptyNew,
      );
    }
  }

  return `
    <div class="shape-insights-tools-pair">
      <div class="shape-insights-tools-pair__columns">
        <article class="shape-insight-card shape-insights-tools-pair__column shape-insights-tools-pair__column--know" aria-labelledby="guide-card-heading-tools-know">
          <div class="shape-insight-card__media">
            <img
              class="shape-insight-card__img"
              src="${escapeHtml(guideFeatureImageSrc(shape, "toolsKnow"))}"
              alt=""
              width="800"
              height="248"
              decoding="async"
              loading="lazy"
            />
          </div>
          <div class="shape-insight-card__inner shape-insight-card__inner--guide-tools">
            <div class="shape-insights-tools-pair__intro">
              <div class="shape-insight-card__title-box">
                <h3 class="guide-card-title" id="guide-card-heading-tools-know">Tools to know</h3>
                <p class="body-normal muted shape-guide-tools-note">Solid picks linked to categories and specialties you selected.</p>
              </div>
            </div>
            <div class="shape-insight-card__tool-categories shape-insight-tool-groups">
              ${knowGroupsHtml}
            </div>
          </div>
        </article>
        <article class="shape-insight-card shape-insights-tools-pair__column shape-insights-tools-pair__column--new" aria-labelledby="guide-card-heading-new-promising">
          <div class="shape-insight-card__media">
            <img
              class="shape-insight-card__img"
              src="${escapeHtml(guideFeatureImageSrc(shape, "newPromising"))}"
              alt=""
              width="800"
              height="248"
              decoding="async"
              loading="lazy"
            />
          </div>
          <div class="shape-insight-card__inner shape-insight-card__inner--guide-tools">
            <div class="shape-insights-tools-pair__intro">
              <div class="shape-insight-card__title-box">
                <h3 class="guide-card-title" id="guide-card-heading-new-promising">New &amp; promising</h3>
                <p class="body-normal muted shape-guide-tools-note">Emerging tools for the same areas—worth tracking as the space evolves.</p>
              </div>
            </div>
            <div class="shape-insight-card__tool-categories shape-insight-tool-groups">
              ${newGroupsHtml}
            </div>
          </div>
        </article>
      </div>
    </div>`;
}

/**
 * Sectioned guide tool pills: one placement per label; tooltip lists all linked skills among selections.
 */
function renderInsightToolSections(sections, pillModifierClass, emptyFallback, groupIdPrefix) {
  let count = 0;
  sections.forEach((s) => {
    count += s.tools.length;
  });
  if (count === 0) {
    return `<p class="body-normal muted shape-insight-tools-empty">${escapeHtml(emptyFallback)}</p>`;
  }

  let html = `<div class="shape-insight-tool-groups">`;
  sections.forEach((sec, idx) => {
    html += renderInsightToolSkillCell(sec, sec.skill, pillModifierClass, groupIdPrefix, idx, "", {
      pairCell: false,
    });
  });
  html += `</div>`;
  return html;
}

/**
 * Order skills for the shape guide tool lists: highest rating first, then lower, then unrated.
 * Ties keep the user’s original selection order.
 */
function sortSelectedSkillsByRankDesc(selectedItems, assignments) {
  if (!Array.isArray(selectedItems) || selectedItems.length === 0) return [];
  return selectedItems
    .map((name, idx) => ({
      name,
      idx,
      rank: normalizeRankValue(assignments[name]),
    }))
    .sort((a, b) => {
      if (a.rank == null && b.rank == null) return a.idx - b.idx;
      if (a.rank == null) return 1;
      if (b.rank == null) return -1;
      if (b.rank !== a.rank) return b.rank - a.rank;
      return a.idx - b.idx;
    })
    .map((x) => x.name);
}

/** Sync each “New & promising” skill block height to the matching “Tools to know” row (desktop only). */
function syncShapeToolsPairRowHeights(pairEl) {
  if (!pairEl) return;
  const wide =
    typeof window.matchMedia !== "function" || window.matchMedia("(min-width: 721px)").matches;
  const knowCol = pairEl.querySelector(".shape-insights-tools-pair__column--know");
  const newCol = pairEl.querySelector(".shape-insights-tools-pair__column--new");
  if (!knowCol || !newCol) return;
  const knowGroups = knowCol.querySelectorAll(".shape-insight-tool-group");
  const newGroups = newCol.querySelectorAll(".shape-insight-tool-group");
  if (!wide) {
    newGroups.forEach((el) => {
      el.style.minHeight = "";
    });
    return;
  }
  const n = Math.min(knowGroups.length, newGroups.length);
  for (let i = 0; i < n; i += 1) {
    const h = knowGroups[i].getBoundingClientRect().height;
    newGroups[i].style.minHeight = `${Math.ceil(h)}px`;
  }
  for (let i = n; i < newGroups.length; i += 1) {
    newGroups[i].style.minHeight = "";
  }
}

/**
 * Keep paired skill rows aligned while both columns stay independent cards.
 * Re-run when the know column layout changes or the viewport crosses the paired breakpoint.
 */
function bindShapeToolsPairRowHeightSync(pairEl) {
  if (!pairEl) return () => {};
  const sync = () => syncShapeToolsPairRowHeights(pairEl);
  let ro = null;
  if (typeof ResizeObserver !== "undefined") {
    ro = new ResizeObserver(sync);
    const knowCol = pairEl.querySelector(".shape-insights-tools-pair__column--know");
    if (knowCol) ro.observe(knowCol);
  }
  const mq = window.matchMedia("(min-width: 721px)");
  const onMq = () => sync();
  mq.addEventListener("change", onMq);
  window.addEventListener("resize", sync);
  requestAnimationFrame(() => {
    requestAnimationFrame(sync);
  });
  sync();
  return () => {
    if (ro) ro.disconnect();
    mq.removeEventListener("change", onMq);
    window.removeEventListener("resize", sync);
  };
}

function renderShapeInsights(shape, selectedSkills = []) {
  const host = document.getElementById("shape-insights");
  if (!host) return;
  const prevPair = host.querySelector(".shape-insights-tools-pair");
  if (prevPair && typeof prevPair._toolsPairRowSyncCleanup === "function") {
    prevPair._toolsPairRowSyncCleanup();
  }
  const guide = SHAPE_GUIDE[shape] || SHAPE_GUIDE.T;
  const sectionsToolsKnow = buildToolSectionsByFirstSkill(selectedSkills, TOOLS_TO_KNOW_BY_SKILL);
  const sectionsNewPromising = buildToolSectionsByFirstSkill(selectedSkills, NEW_PROMISING_BY_SKILL);
  host.innerHTML = `
    <h2 class="shape-insights-heading">What does being ${shape}-shaped mean?</h2>
    <p class="body-normal shape-insights-subtitle">Insight into what the shape of your skills means.</p>
    <div class="shape-insights-grid stagger-group">
      <article class="shape-insight-card">
        <div class="shape-insight-card__media">
          <img
            class="shape-insight-card__img"
            src="${escapeHtml(guideFeatureImageSrc(shape, "meaning"))}"
            alt=""
            width="800"
            height="248"
            decoding="async"
            loading="lazy"
          />
        </div>
        <div class="shape-insight-card__inner">
          <div class="shape-insight-card__title-box">
            <h3 class="guide-card-title">What is this shape?</h3>
          </div>
          <p class="body-normal">${escapeHtml(guide.meaning)}</p>
        </div>
      </article>
      <article class="shape-insight-card">
        <div class="shape-insight-card__media">
          <img
            class="shape-insight-card__img"
            src="${escapeHtml(guideFeatureImageSrc(shape, "roles"))}"
            alt=""
            width="800"
            height="248"
            decoding="async"
            loading="lazy"
          />
        </div>
        <div class="shape-insight-card__inner">
          <div class="shape-insight-card__title-box">
            <h3 class="guide-card-title">Where this shape thrives</h3>
          </div>
          ${renderShapeGuidePillsHtml(guide.roles)}
        </div>
      </article>
      <article class="shape-insight-card">
        <div class="shape-insight-card__media">
          <img
            class="shape-insight-card__img"
            src="${escapeHtml(guideFeatureImageSrc(shape, "strengths"))}"
            alt=""
            width="800"
            height="248"
            decoding="async"
            loading="lazy"
          />
        </div>
        <div class="shape-insight-card__inner">
          <div class="shape-insight-card__title-box">
            <h3 class="guide-card-title">Strengths</h3>
          </div>
          ${renderShapeGuidePillsHtml(guide.strengths)}
        </div>
      </article>
      <article class="shape-insight-card">
        <div class="shape-insight-card__media">
          <img
            class="shape-insight-card__img"
            src="${escapeHtml(guideFeatureImageSrc(shape, "weaknesses"))}"
            alt=""
            width="800"
            height="248"
            decoding="async"
            loading="lazy"
          />
        </div>
        <div class="shape-insight-card__inner">
          <div class="shape-insight-card__title-box">
            <h3 class="guide-card-title">Blind spots</h3>
          </div>
          ${renderShapeGuidePillsHtml(guide.weaknesses)}
        </div>
      </article>
      ${renderShapeInsightsToolsPair(
        shape,
        sectionsToolsKnow,
        sectionsNewPromising,
        selectedSkills,
        "No curated tools mapped to your current selections.",
        "Nothing listed yet for these selections.",
      )}
    </div>
  `;
  const pair = host.querySelector(".shape-insights-tools-pair");
  if (pair) {
    pair._toolsPairRowSyncCleanup = bindShapeToolsPairRowHeightSync(pair);
  }
}

function fillShapeKeyCard(mapped, keyMode) {
  const card = document.getElementById("shape-key-card");
  const outer = document.getElementById("shape-chart-container");
  if (!card) return;
  if (!keyMode) {
    card.hidden = true;
    card.innerHTML = "";
    if (outer) outer.classList.remove("chart-container--key");
    return;
  }
  card.hidden = false;
  if (outer) outer.classList.add("chart-container--key");
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
  if (window.TShapedAnim) TShapedAnim.shapeKeyAnimate(card);
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
  /** Readable over saturated bar gradients: light ink + faint halo inside dark charts; dark ink + light halo inside light charts. */
  const chartLabelInk = document.body.classList.contains("dark")
    ? { fill: "#f3f7ff", stroke: "rgba(4, 8, 22, 0.5)", strokeWidth: "2.25" }
    : { fill: "#0b1326", stroke: "rgba(255, 255, 255, 0.9)", strokeWidth: "2" };
  const isMobileViz =
    typeof window.matchMedia === "function" && window.matchMedia("(max-width: 720px)").matches;
  const isTouchViz =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(hover: none), (pointer: coarse)").matches;
  const targetBarW = isMobileViz ? 65 : 80;

  const detection = detectDesignerShape(mapped);
  state.detectedShape = detection;
  const article = articleForShapeLabel(detection.shape);
  const shapeHeadline = `You're ${article} ${detection.shape}-Shaped Designer`;
  const guide = SHAPE_GUIDE[detection.shape] || SHAPE_GUIDE.T;
  if (titleEl) {
    titleEl.textContent = shapeHeadline;
  }
  if (subEl) {
    subEl.textContent = guide.meaning;
    const learnBtn = document.querySelector('.shape-result-sub-actions [data-action="learn-more-shape"]');
    if (learnBtn && learnBtn.dataset.bound !== "1") {
      learnBtn.dataset.bound = "1";
      learnBtn.addEventListener("click", () => {
        const guideCard = document.getElementById("shape-guide-card");
        if (guideCard) guideCard.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
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
  renderShapeInsights(
    detection.shape,
    sortSelectedSkillsByRankDesc(state.selectedItems, state.assignments),
  );
  const guideCardRoot = document.getElementById("shape-guide-card");
  if (guideCardRoot && window.TShapedTippy) window.TShapedTippy.initIn(guideCardRoot);
  bindGuideArrowExitSequence(guideCardRoot);
  const toolsPairAfterTippy = document.querySelector("#shape-insights .shape-insights-tools-pair");
  if (toolsPairAfterTippy) syncShapeToolsPairRowHeights(toolsPairAfterTippy);

  const displayName = parseDisplayName(state.userName);
  const plotTitleText = displayName
    ? `${displayName} | ${detection.shape}-Shaped Designer`
    : `${detection.shape}-Shaped Designer`;
  const plotTitleEl = document.getElementById("shape-chart-plot-title");
  if (plotTitleEl) {
    plotTitleEl.textContent = plotTitleText;
  }

  svg.innerHTML = "";
  const plotW = keyMode ? Math.round(VIZ_SVG_W * 0.8) : VIZ_SVG_W;
  const padL = keyMode ? 44 : 56;
  const padR = keyMode ? 44 : 56;
  /** Labels mode: 14px on small viewports or touch; 13px on desktop w/ fine pointer. */
  const chartLabelPx = isMobileViz || isTouchViz ? 14 : 13;
  const chartLabelFontSize = chartLabelPx;
  const labelWrapMaxPx = 150;
  /** Gap between bottom of rotated labels and top of bars — matches LABEL_BAR_GAP_PX in Labels mode. */
  const labelToBarGapPx = keyMode ? 12 : LABEL_BAR_GAP_PX;

  let longestRunPx = 0;
  if (mapped.length > 0) {
    const stackLeadPx = chartLabelFontSize * chartLabelLeadingEm();
    for (const it of mapped) {
      const lines = wrapSkillLabelLines(it.name, labelWrapMaxPx, chartLabelFontSize);
      const maxLineW = Math.max(
        0,
        ...lines.map((ln) => measureChartSkillLabelRunPx(ln, chartLabelFontSize))
      );
      const stacked = Math.max(0, lines.length - 1) * stackLeadPx;
      const extent = maxLineW + stacked;
      if (extent > longestRunPx) longestRunPx = extent;
    }
  }

  let padT;
  let chartTop;
  let chartH;
  let H;
  /** Labels mode only — bar stack height in SVG units (constant across bars). */
  let barAreaH = 0;

  let padB = keyMode ? 30 : 42;
  if (isMobileViz) {
    padB = keyMode ? 24 : 32;
  }

  const n = mapped.length;
  const maxRating =
    n === 0 ? 0 : Math.max(...mapped.map((it) => (Number.isFinite(it.value) ? it.value : 0)));

  let layoutChartTop = 0;

  if (keyMode) {
    padT = isMobileViz ? 22 : 28;
    chartTop = padT;
    H = VIZ_SVG_H;
    chartH = H - padT - padB;
  } else {
    /* Labels are rendered in a dedicated HTML row above SVG bars (separate layout track). */
    layoutChartTop = isMobileViz ? 14 : 18;
    chartTop = layoutChartTop;
    padT = chartTop;
    let baseStackH = isMobileViz ? LABELS_BAR_STACK_HEIGHT_MOBILE : LABELS_BAR_STACK_HEIGHT_DESKTOP;
    /* Wider .chart → larger 10/10 bar stack in user space; matches card width responsively. */
    if (!isMobileViz) {
      const wrap = document.querySelector("#shape-chart-container .chart.shape-chart-plot-wrap");
      const cw = wrap?.clientWidth ?? 0;
      if (cw > 320) {
        const s = Math.min(1.12, Math.max(0.48, cw / VIZ_SVG_W));
        baseStackH = Math.round(LABELS_BAR_STACK_HEIGHT_DESKTOP * s);
      }
    }
    chartH = baseStackH;
    /** Pixels from baseline (chartTop) to bottom of the tallest bar — scales with highest rating. */
    const tallestBarPx =
      maxRating > 0 ? (maxRating / 10) * chartH : Math.round(chartH * (n === 0 ? 0.22 : 0.18));
    const barFloorPx = isMobileViz ? LABELS_BAR_AREA_MIN_MOBILE : LABELS_BAR_AREA_MIN_DESKTOP;
    barAreaH = Math.max(barFloorPx, tallestBarPx);
    H = chartTop + barAreaH + padB;
  }
  /** Horizontal space between bar columns — in Labels mode, flexes to fill inner width. */
  const innerW = plotW - padL - padR;
  let gap = 10;
  let barW = targetBarW;

  if (!keyMode && n > 1) {
    if (n * barW + (n - 1) * BAR_GAP_MIN_PX > innerW) {
      barW = Math.max(4, (innerW - (n - 1) * BAR_GAP_MIN_PX) / n);
    }
    gap = (innerW - n * barW) / (n - 1);
  } else if (!keyMode && n === 1) {
    barW = Math.max(4, innerW);
    gap = 0;
  } else if (n > 0) {
    const fixedGap = 10;
    gap = fixedGap;
    const required = n * barW + (n - 1) * gap;
    if (required > innerW) {
      barW = Math.max(4, (innerW - (n - 1) * gap) / n);
    }
  } else {
    barW = 40;
  }

  const totalContentW = n > 0 ? n * barW + Math.max(0, n - 1) * gap : 0;
  const startX =
    !keyMode && n > 1
      ? padL
      : !keyMode && n === 1
        ? padL
        : padL + (innerW - totalContentW) / 2;

  const ns = "http://www.w3.org/2000/svg";
  const bg = document.createElementNS(ns, "rect");
  bg.setAttribute("width", String(plotW));
  bg.setAttribute("height", String(H));
  bg.setAttribute("fill", "transparent");
  bg.setAttribute("pointer-events", "none");
  svg.setAttribute("viewBox", `0 0 ${plotW} ${H}`);
  svg.setAttribute("aria-label", shapeHeadline);
  svg.appendChild(bg);

  const defs = document.createElementNS(ns, "defs");
  const texturePatternByIndex = new Map();
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

    const p = document.createElementNS(ns, "pattern");
    p.setAttribute("id", `tbar-diag-${i}`);
    p.setAttribute("patternUnits", "userSpaceOnUse");
    p.setAttribute("width", "14");
    p.setAttribute("height", "14");
    p.setAttribute("patternTransform", "translate(0 0)");
    const path = document.createElementNS(ns, "path");
    path.setAttribute("d", "M-4 4 L4 -4 M0 14 L14 0 M10 18 L18 10");
    path.setAttribute("stroke", "rgba(255,255,255,0.28)");
    path.setAttribute("stroke-width", "1.35");
    path.setAttribute("fill", "none");
    p.appendChild(path);
    defs.appendChild(p);
    texturePatternByIndex.set(i, p);
  });
  svg.appendChild(defs);

  const plotGroup = document.createElementNS(ns, "g");
  plotGroup.setAttribute("class", "shape-chart-plot");
  svg.appendChild(plotGroup);

  const barsGroup = document.createElementNS(ns, "g");
  barsGroup.setAttribute("class", "shape-chart-bars");

  const appendBarRectsAt = (barYBase) => {
    mapped.forEach((item, i) => {
      const slotX = startX + i * (barW + gap);
      const x = slotX;
      const h = (item.value / 10) * chartH;
      const y = barYBase;
      const theme = getRankTheme(item.value);
      const rect = document.createElementNS(ns, "rect");
      rect.setAttribute("x", String(x));
      rect.setAttribute("y", String(y));
      rect.setAttribute("width", String(barW));
      rect.setAttribute("height", String(Math.max(2, h)));
      rect.setAttribute("rx", "6");
      rect.setAttribute("ry", "6");
      rect.setAttribute("fill", `url(#tbar-grad-${i})`);
      rect.setAttribute("stroke", theme.stroke);
      rect.setAttribute("stroke-width", "1.5");
      rect.setAttribute("class", "tbar");
      rect.style.setProperty("--tbar-d", `${i * 0.04}s`);
      rect.dataset.name = item.name;
      rect.dataset.value = String(item.value);
      rect.dataset.barIndex = String(i);
      barsGroup.appendChild(rect);

      const texture = document.createElementNS(ns, "rect");
      texture.setAttribute("x", String(x));
      texture.setAttribute("y", String(y));
      texture.setAttribute("width", String(barW));
      texture.setAttribute("height", String(Math.max(2, h)));
      texture.setAttribute("rx", "6");
      texture.setAttribute("ry", "6");
      texture.setAttribute("fill", `url(#tbar-diag-${i})`);
      texture.setAttribute("class", "tbar-texture");
      texture.setAttribute("pointer-events", "none");
      barsGroup.appendChild(texture);
    });
  };

  if (keyMode) {
    appendBarRectsAt(chartTop);
    plotGroup.appendChild(barsGroup);
  } else {
    appendBarRectsAt(chartTop);
    plotGroup.appendChild(barsGroup);
  }

  const plotWrap = document.querySelector("#shape-chart-container .shape-chart-plot-wrap");
  if (plotWrap) {
    const stale = plotWrap.querySelector(".shape-label-row");
    if (stale) stale.remove();
    if (!keyMode) {
      plotWrap.classList.add("has-html-label-row");
      const row = document.createElement("div");
      row.className = "shape-label-row";
      row.style.setProperty("--shape-label-h", `${CHART_LABEL_SLOT_MIN_H_PX}px`);
      row.style.setProperty("--shape-label-text-color", chartLabelInk.fill);
      row.style.setProperty("--shape-label-font-size", `${chartLabelFontSize}px`);
      mapped.forEach((item, i) => {
        const cell = document.createElement("div");
        cell.className = "shape-label-cell";
        cell.style.setProperty("--tbar-d", `${i * 0.04 + 0.08}s`);
        const cellLeftPct = ((startX + i * (barW + gap)) / plotW) * 100;
        const cellWPct = (barW / plotW) * 100;
        cell.style.left = `${cellLeftPct}%`;
        cell.style.width = `${cellWPct}%`;
        const txt = document.createElement("div");
        txt.className = "shape-label-text";
        txt.textContent = item.name;
        cell.appendChild(txt);
        row.appendChild(cell);
      });
      plotWrap.prepend(row);
    } else {
      plotWrap.classList.remove("has-html-label-row");
    }
  }

  const chartOuter = document.getElementById("shape-chart-container");
  if (chartOuter) {
    if (!keyMode) {
      chartOuter.style.setProperty("--shape-chart-label-max-run", `${Math.round(longestRunPx)}px`);
      chartOuter.style.setProperty("--shape-chart-label-band", `${Math.round(chartTop)}px`);
      chartOuter.style.setProperty("--shape-chart-label-slot-min-h", `${CHART_LABEL_SLOT_MIN_H_PX}px`);
      const tallestBarUserPx =
        maxRating > 0
          ? Math.round((maxRating / 10) * chartH)
          : Math.round(chartH * (n === 0 ? 0.22 : 0.18));
      chartOuter.style.setProperty("--shape-chart-tallest-bar-px", `${tallestBarUserPx}px`);
      chartOuter.style.setProperty("--shape-chart-bar-stack-ref", `${Math.round(chartH)}px`);
    } else {
      chartOuter.style.removeProperty("--shape-chart-label-max-run");
      chartOuter.style.removeProperty("--shape-chart-label-band");
      chartOuter.style.removeProperty("--shape-chart-label-slot-min-h");
      chartOuter.style.removeProperty("--shape-chart-tallest-bar-px");
      chartOuter.style.removeProperty("--shape-chart-bar-stack-ref");
    }
  }

  if (keyMode) {
    applyTShapeChartViewBoxFit(svg, plotW, false);
  } else {
    svg.setAttribute("preserveAspectRatio", "xMinYMin meet");
    svg.setAttribute("overflow", "visible");
  }

  fillShapeKeyCard(mapped, keyMode);
  syncShapeVizToggle();
  svg.classList.toggle("is-key-mode", keyMode);
  if (window.TShapedAnim) TShapedAnim.shapeChartIn(svg);

  // Tooltip pill (desktop hover follows cursor; mobile tap toggles)
  // Keep the pill on <body> (not inside transformed/scrollable chart wrappers),
  // otherwise "fixed" positioning can become container-relative and cause jitter/scroll.
  let tip = document.getElementById("viz-pill-global");
  if (!tip) {
    tip = document.createElement("div");
    tip.id = "viz-pill-global";
    tip.className = "viz-pill hidden";
    tip.setAttribute("role", "status");
    document.body.appendChild(tip);
  }

  const isCoarse = window.matchMedia && window.matchMedia("(hover: none), (pointer: coarse)").matches;
  let mobileOn = false;
  let activeTextureIdx = -1;
  let activeTextureOffset = 0;
  let textureRaf = 0;
  let textureSpeedCurrent = 0;
  let textureSpeedTarget = 0;
  let textureLastTs = 0;
  const TEXTURE_SPEED_MAX = 43.5; // px/s equivalent to prior 0.725/frame @60fps
  const TEXTURE_EASE_SECONDS = 0.1;
  const animateTexture = (ts) => {
    const dt = textureLastTs > 0 ? Math.max(0.001, (ts - textureLastTs) / 1000) : 1 / 60;
    textureLastTs = ts;
    const ramp = Math.min(1, dt / TEXTURE_EASE_SECONDS);
    textureSpeedCurrent += (textureSpeedTarget - textureSpeedCurrent) * ramp;

    const pat = activeTextureIdx >= 0 ? texturePatternByIndex.get(activeTextureIdx) : null;
    if (pat && textureSpeedCurrent > 0.02) {
      activeTextureOffset = (activeTextureOffset + textureSpeedCurrent * dt) % 14;
      pat.setAttribute("patternTransform", `translate(0 ${activeTextureOffset.toFixed(2)})`);
    }

    if (textureSpeedCurrent <= 0.02 && textureSpeedTarget <= 0) {
      textureSpeedCurrent = 0;
      textureRaf = 0;
      textureLastTs = 0;
      return;
    }
    textureRaf = requestAnimationFrame(animateTexture);
  };
  const setActiveTexture = (idx) => {
    if (activeTextureIdx === idx && ((idx >= 0 && textureSpeedTarget > 0) || (idx < 0 && textureSpeedTarget <= 0))) {
      return;
    }
    activeTextureIdx = idx;
    textureSpeedTarget = idx >= 0 ? TEXTURE_SPEED_MAX : 0;
    if (!textureRaf) textureRaf = requestAnimationFrame(animateTexture);
  };
  const setTip = (text, clientX, clientY) => {
    tip.textContent = text;
    tip.classList.remove("hidden");
    tip.style.position = "fixed";
    tip.style.transform = "none";
    const gap = 12;
    const vw = window.innerWidth || document.documentElement.clientWidth;
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const w = tip.offsetWidth || 120;
    const h = tip.offsetHeight || 32;
    const cx = Number.isFinite(clientX) ? clientX : 0;
    const cy = Number.isFinite(clientY) ? clientY : 0;
    let x = cx + gap;
    let y = cy - h - gap;
    if (x + w > vw - 8) x = cx - w - gap;
    if (x < 8) x = 8;
    if (y < 8) y = cy + gap;
    if (y + h > vh - 8) y = Math.max(8, vh - h - 8);
    tip.style.left = `${Math.round(x)}px`;
    tip.style.top = `${Math.round(y)}px`;
  };

  svg.onpointermove = (e) => {
    if (isCoarse) return;
    const t = e.target;
    if (!(t instanceof SVGRectElement) || !t.classList.contains("tbar")) {
      tip.classList.add("hidden");
      setActiveTexture(-1);
      return;
    }
    const idx = Number.parseInt(t.dataset.barIndex || "-1", 10);
    setActiveTexture(Number.isFinite(idx) ? idx : -1);
    setTip(`${t.dataset.name} · ${t.dataset.value}/10`, e.clientX, e.clientY);
  };
  svg.onpointerleave = () => {
    if (isCoarse) return;
    mobileOn = false;
    tip.classList.add("hidden");
    setActiveTexture(-1);
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

const exportManager = createExportManager({
  state,
  constants: {
    EXPORT_ATTRIBUTION,
    EXPORT_SIZE_PX,
    EXPORT_FOOTER_H,
    CHART_LABEL_SLOT_MIN_H_PX,
    LABEL_BAR_GAP_PX,
  },
  fns: {
    getCurrentShapeSvgHeight,
    getCurrentShapeSvgWidth,
    getDetectedShapeKey,
    getRankTheme,
    parseDisplayName,
    parseFirstName,
    truncate,
    triggerDownload,
  },
});

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
    const { shapeKey, svgStr } = await exportManager.createExportFileBundle();
    await sendEmailViaBackend({
      toEmail: state.userEmail,
      userName: state.userName,
      shapeKey,
      svgString: svgStr,
      baseName: exportManager.getExportBaseName(shapeKey),
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
    exportManager.downloadSvg();
  } catch (err) {
    console.error(err);
  }
}

function downloadFromSvg(type) {
  exportManager.downloadRaster(type)
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


try {
  selfTestRankingLogic();
} catch (e) {
  console.error("T-Shaped selfTest failed", e);
}

export async function bootstrapTShapedApp() {
  await initThemeToggle();
  window.addEventListener("hashchange", () => {
    const h = (location.hash || "").toLowerCase();
    if ((h === "#light" || h === "#dark") && state.step === 5) {
      renderVisualization();
    }
  });
  if (window.TShapedTippy) TShapedTippy.initThemeToggle();
  document.documentElement.style.setProperty("--global-pulse-scale", "1");
  if (window.TShapedAnim) TShapedAnim.startGlobalPulse();
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

  restoreStateFromLocalStorageIfAvailable();
  render();
  runSelfTestIfQuery();
}
