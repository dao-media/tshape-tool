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
  /**
   * Each specialization is tied to a design category for related accent colors.
   */
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
  /** @type {Record<string, number | null>} score 1..10 or unset */
  assignments: {},
};

const MAX_BY_TYPE = {
  generalist: 12,
  specialist: 6,
};

const categorySet = new Set(DATA.categories);

/**
 * @returns {Record<number, number>} score -> max count for this selection size
 */
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

/**
 * How many of each score are used, optionally ignoring one skill (being reassigned).
 * @param {string | null} [excludeSkill]
 */
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

/**
 * @param {string} skill
 * @param {number} requested
 * @param {Record<string, number | null>} assignments
 * @param {Record<number, number>} maxPer
 */
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

// Golden-angle hues so adjacent categories are visually distinct
function categoryHue(index) {
  return (index * 137.508) % 360;
}

function getCategoryIndex(name) {
  return DATA.categories.indexOf(name);
}

/**
 * @returns {{ css: string, fill: string, stroke: string, hue: number }}
 */
function getItemColor(name) {
  const isCat = categorySet.has(name);
  if (isCat) {
    const i = getCategoryIndex(name);
    const h = i >= 0 ? categoryHue(i) : 220;
    return {
      hue: h,
      css: `hsl(${h} 70% 46%)`,
      fill: `hsla(${h}, 60%, 48%, 0.55)`,
      stroke: `hsl(${h} 60% 58%)`,
    };
  }
  const parent = DATA.specParentByName[name] || "Graphic Design";
  const pi = getCategoryIndex(parent);
  const h = pi >= 0 ? categoryHue(pi) : 200;
  const hShift = (h + 6) % 360;
  return {
    hue: h,
    css: `hsl(${h} 50% 42%)`,
    fill: `hsla(${hShift}, 45%, 44%, 0.5)`,
    stroke: `hsl(${h} 48% 52%)`,
  };
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

  if (state.step === 3) {
    renderSelectionLists();
  } else if (state.step === 4) {
    renderRatingStep();
  } else if (state.step === 5) {
    renderVisualization();
  }
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
      setStep(4);
      break;
    }
    case "to-step-5": {
      const missing = state.selectedItems.filter(
        (name) => state.assignments[name] == null
      );
      if (missing.length) {
        alert("Set a score for every selected item (use the sliders or tap a rank on the track).");
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
    if (rem <= 0) line.classList.add("quota-line--exhausted");
    line.textContent = `${score}/10 — ${rem} of ${max} left`;
    rows.appendChild(line);
  }
  return rows;
}

/**
 * @param {HTMLInputElement} range
 * @param {string} skill
 * @param {Record<number, number>} maxPer
 */
function bindSliderRow(range, skill, maxPer) {
  const row = range.closest(".skill-rate-row");
  const fill = row.querySelector(".skill-rate-fill");
  const valueEl = row.querySelector(".skill-rate-value");
  const barWrap = row.querySelector(".skill-bar-wrap");

  const updateVisual = (val) => {
    if (val == null) {
      if (fill) fill.style.width = "0%";
      if (valueEl) valueEl.textContent = "—";
      if (barWrap) {
        barWrap.setAttribute("aria-valuenow", "0");
        barWrap.removeAttribute("aria-valuetext");
      }
      range.value = "5";
      return;
    }
    if (fill) fill.style.width = `${val * 10}%`;
    if (valueEl) valueEl.textContent = `${val}/10`;
    if (barWrap) {
      barWrap.setAttribute("aria-valuenow", String(val));
      barWrap.setAttribute("aria-valuetext", `Score ${val} of 10`);
    }
  };

  const refreshKeyAndAllTicks = () => {
    const keyHost = document.querySelector("#ranking-key-host");
    if (keyHost) {
      keyHost.innerHTML = "";
      keyHost.appendChild(renderQuotaKeyEl(maxPer, state.assignments));
    }
    updateTickAvailability(state.assignments, maxPer);
  };

  const applyValue = (requested) => {
    const rounded = Math.min(10, Math.max(1, Math.round(requested)));
    state.assignments[skill] = null;
    const resolved = resolveRankForSkill(rounded, skill, state.assignments, maxPer);
    state.assignments[skill] = resolved;

    if (resolved !== rounded) {
      range.classList.add("range-snapped");
      setTimeout(() => range.classList.remove("range-snapped"), 500);
    }

    range.value = String(resolved);
    updateVisual(resolved);
    refreshKeyAndAllTicks();
  };

  if (state.assignments[skill] == null) {
    range.value = "5";
    updateVisual(null);
  } else {
    range.value = String(state.assignments[skill]);
    updateVisual(state.assignments[skill]);
  }

  const onVal = (e) => {
    const req = Number(e.target.value);
    applyValue(req);
  };
  range.addEventListener("input", onVal);
  range.addEventListener("change", onVal);

  const track = row.querySelector(".range-ticks");
  if (track) {
    track.querySelectorAll("button").forEach((btn) => {
      btn.addEventListener("click", () => {
        const v = Number(btn.dataset.rank);
        applyValue(v);
      });
    });
  }
}

function renderRatingStep() {
  const n = state.selectedItems.length;
  const maxPer = getMaxPerScore(state.profileType, n);
  const listEl = document.querySelector("#selected-items");
  const keyHost = document.querySelector("#ranking-key-host");
  if (!listEl) return;
  listEl.innerHTML = "";

  state.selectedItems.forEach((skill) => {
    const colors = getItemColor(skill);
    const isSpec = !categorySet.has(skill);
    const parent = isSpec
      ? ` · links to ${DATA.specParentByName[skill] || "a category"}`
      : "";
    const row = document.createElement("div");
    row.className = "skill-rate-row";
    row.dataset.skill = skill;
    row.style.setProperty("--skill-accent", colors.css);
    row.style.setProperty("--skill-fill", colors.fill);
    row.style.setProperty("--skill-stroke", colors.stroke);

    row.innerHTML = `
      <div class="skill-rate-head">
        <div>
          <div class="skill-title">${escapeHtml(skill)}</div>
          <div class="skill-meta muted">${isSpec ? "Specialization" : "Design category"}${escapeHtml(
      parent
    )}</div>
        </div>
        <div class="skill-rate-value" aria-live="polite">—</div>
      </div>
      <div class="skill-bar-wrap" role="progressbar" aria-valuemin="0" aria-valuemax="10" aria-valuenow="0">
        <div class="skill-rate-fill" style="width:0%"></div>
      </div>
      <div class="range-wrap">
        <input class="skill-rank-range" type="range" min="1" max="10" step="1" value="5" aria-label="Score for ${escapeHtml(
      skill
    )}" />
        <div class="range-ticks" role="group" aria-label="Select rank 1 to 10"></div>
      </div>
    `;

    const ticks = row.querySelector(".range-ticks");
    for (let r = 1; r <= 10; r += 1) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "range-tick";
      b.dataset.rank = String(r);
      b.textContent = String(r);
      ticks.appendChild(b);
    }

    listEl.appendChild(row);
    const range = row.querySelector(".skill-rank-range");
    bindSliderRow(range, skill, maxPer);
  });

  if (keyHost) {
    keyHost.innerHTML = "";
    keyHost.appendChild(renderQuotaKeyEl(maxPer, state.assignments));
  }
  updateTickAvailability(state.assignments, maxPer);
  runSelfTestIfQuery();
}

function updateTickAvailability(assignments, maxPer) {
  const usage = getUsageCounts(assignments, null);
  document.querySelectorAll(".range-tick").forEach((btn) => {
    const rank = Number(btn.dataset.rank);
    const max = maxPer[rank] || 0;
    const used = usage[rank] || 0;
    const rem = max - used;
    const row = btn.closest(".skill-rate-row");
    const skill = row && row.dataset.skill;
    const holds = skill != null && assignments[skill] === rank;
    const unavailable = rem <= 0 && !holds;
    btn.classList.toggle("range-tick--unavailable", unavailable);
  });
}

function renderVisualization() {
  const svg = document.querySelector("#t-shape-svg");
  svg.innerHTML = "";

  const mapped = state.selectedItems
    .map((name) => {
      const v = state.assignments[name];
      return { name, value: v };
    })
    .filter((x) => x.value != null);
  mapped.sort((a, b) => b.value - a.value);

  const points = generatePoints(mapped.length, state.profileType);
  const sortedCenter = [0, 1, 2];
  const edgeIndexes = points
    .map((_, i) => i)
    .filter((i) => !sortedCenter.includes(i));
  shuffle(edgeIndexes);

  const order = [];
  for (let i = 0; i < mapped.length; i += 1) {
    if (i < sortedCenter.length) {
      order.push(sortedCenter[i]);
    } else {
      order.push(edgeIndexes[i - sortedCenter.length]);
    }
  }

  const centerX = 450;
  const centerY = 350;
  const cardW = window.innerWidth < 740 ? 170 : 190;
  const cardH = 64;

  const bg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  bg.setAttribute("x", "0");
  bg.setAttribute("y", "0");
  bg.setAttribute("width", "900");
  bg.setAttribute("height", "700");
  bg.setAttribute("fill", "transparent");
  svg.appendChild(bg);

  mapped.forEach((item, i) => {
    const point = points[order[i]] || points[i];
    const x = centerX + point[0] - cardW / 2;
    const y = centerY + point[1] - cardH / 2;
    const col = getItemColor(item.name);

    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");

    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", x.toString());
    rect.setAttribute("y", y.toString());
    rect.setAttribute("rx", "12");
    rect.setAttribute("width", cardW.toString());
    rect.setAttribute("height", cardH.toString());
    rect.setAttribute("fill", col.fill);
    rect.setAttribute("stroke", col.stroke);
    rect.setAttribute("stroke-width", "1.5");

    const barTrack = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    const pad = 8;
    const trackW = cardW - pad * 2;
    const trackH = 4;
    barTrack.setAttribute("x", (x + pad).toString());
    barTrack.setAttribute("y", (y + cardH - 10).toString());
    barTrack.setAttribute("width", String(trackW));
    barTrack.setAttribute("height", String(trackH));
    barTrack.setAttribute("rx", "2");
    barTrack.setAttribute("fill", "rgba(255,255,255,0.1)");

    const barFill = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    const fillW = (item.value / 10) * trackW;
    barFill.setAttribute("x", (x + pad).toString());
    barFill.setAttribute("y", (y + cardH - 10).toString());
    barFill.setAttribute("width", String(Math.max(0, fillW)));
    barFill.setAttribute("height", String(trackH));
    barFill.setAttribute("rx", "2");
    barFill.setAttribute("fill", col.stroke);

    const scoreText = document.createElementNS("http://www.w3.org/2000/svg", "text");
    scoreText.setAttribute("x", (x + 10).toString());
    scoreText.setAttribute("y", (y + 18).toString());
    scoreText.setAttribute("fill", "#d9dcff");
    scoreText.setAttribute("font-size", "12");
    scoreText.textContent = `${item.value}/10`;

    const skillText = document.createElementNS("http://www.w3.org/2000/svg", "text");
    skillText.setAttribute("x", (x + 10).toString());
    skillText.setAttribute("y", (y + 43).toString());
    skillText.setAttribute("fill", "#f4f6ff");
    skillText.setAttribute("font-size", "13");
    skillText.textContent = truncate(item.name, 28);

    group.appendChild(rect);
    group.appendChild(barTrack);
    group.appendChild(barFill);
    group.appendChild(scoreText);
    group.appendChild(skillText);
    svg.appendChild(group);
  });
}

function generatePoints(count, profileType) {
  const base =
    profileType === "generalist"
      ? [
          [0, 0], [0, -100], [0, 100], [-180, 0], [180, 0], [0, -200],
          [0, 200], [-280, 0], [280, 0], [-360, 0], [360, 0], [0, 280],
        ]
      : [
          [0, 0], [0, -100], [0, 100], [-180, 0], [180, 0], [0, -200],
        ];

  return base.slice(0, count);
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function truncate(str, max) {
  return str.length <= max ? str : `${str.slice(0, max - 1)}...`;
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
  triggerDownload(URL.createObjectURL(blob), "t-shaped-profile.svg");
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
    canvas.width = 900;
    canvas.height = 700;
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
        const filename = type === "jpeg" ? "t-shaped-profile.jpg" : "t-shaped-profile.png";
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

// --- Invariants (stress test) ------------------------------------------------

function selfTestRankingLogic() {
  const max12 = getMaxPerScore("generalist", 12);
  let sum = 0;
  for (let s = 1; s <= 10; s += 1) sum += max12[s] || 0;
  if (sum !== 12) {
    throw new Error("selfTest: generalist pool should count 12 assignments");
  }
  if (getUsageCounts({}, null)[10] !== 0) {
    throw new Error("selfTest: empty usage");
  }
  const spec1 = getMaxPerScore("specialist", 1);
  if (spec1[10] !== 1) {
    throw new Error("selfTest: specialist 1 should allow one 10/10 only");
  }
  if (resolveRankForSkill(3, "x", {}, spec1) !== 10) {
    throw new Error("selfTest: only available bar is 10 for specialist with one pick");
  }
  const max6 = getMaxPerScore("specialist", 6);
  const full = { a: 10, b: 9, c: 8, d: 8, e: 7, f: 7 };
  const g = resolveRankForSkill(10, "g", full, max6);
  if (g !== 6) {
    throw new Error(`selfTest: expected 6, got ${g} when 10-7 are consumed`);
  }
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

render();
runSelfTestIfQuery();
