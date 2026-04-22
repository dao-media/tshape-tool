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
  rankingTokens: [],
  assignments: {},
};

const MAX_BY_TYPE = {
  generalist: 12,
  specialist: 6,
};

function createGeneralistTokenValues(count) {
  const base = [10, 9, 8, 7, 6, 5, 4, 3, 2, 2, 1, 1];
  return base.slice(0, count);
}

function createSpecialistTokenValues(count) {
  const pool = [10, 9, 8, 8, 7, 7, 6, 6, 5, 5, 4, 4, 3, 3, 2, 2, 1, 1];
  return pool.slice(0, count);
}

function createTokens(profileType, count) {
  const scores =
    profileType === "generalist"
      ? createGeneralistTokenValues(count)
      : createSpecialistTokenValues(count);

  return scores.map((value, idx) => ({
    id: `score-${value}-${idx}-${crypto.randomUUID().slice(0, 8)}`,
    value,
  }));
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
      state.rankingTokens = [];
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
      state.rankingTokens = createTokens(state.profileType, state.selectedItems.length);
      state.assignments = {};
      setStep(4);
      break;
    }
    case "to-step-5": {
      const assignedCount = Object.keys(state.assignments).length;
      if (assignedCount !== state.selectedItems.length) {
        alert("Assign one ranking chip to every selected item before plotting.");
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

function renderRatingStep() {
  const selectedItemsEl = document.querySelector("#selected-items");
  const bankEl = document.querySelector("#ranking-bank");

  bankEl.addEventListener("dragover", (e) => {
    e.preventDefault();
    bankEl.classList.add("drag-over");
  });
  bankEl.addEventListener("dragleave", () => bankEl.classList.remove("drag-over"));
  bankEl.addEventListener("drop", (e) => {
    e.preventDefault();
    bankEl.classList.remove("drag-over");
    const tokenId = e.dataTransfer.getData("text/plain");
    const assignedSkill = Object.keys(state.assignments).find((skill) => state.assignments[skill] === tokenId);
    if (assignedSkill) {
      delete state.assignments[assignedSkill];
      renderRatingStep();
    }
  });

  state.selectedItems.forEach((skill) => {
    const row = document.createElement("div");
    row.className = "skill-drop drop-target";
    row.dataset.skill = skill;
    row.innerHTML = `<strong>${skill}</strong><span class="slot">Drop score here</span>`;

    const assignedTokenId = state.assignments[skill];
    if (assignedTokenId) {
      const token = state.rankingTokens.find((t) => t.id === assignedTokenId);
      row.querySelector(".slot").innerHTML = `<span class="score-assigned">${token.value}/10</span>`;
    }

    row.addEventListener("dragover", (e) => {
      e.preventDefault();
      row.classList.add("drag-over");
    });
    row.addEventListener("dragleave", () => row.classList.remove("drag-over"));
    row.addEventListener("drop", (e) => {
      e.preventDefault();
      row.classList.remove("drag-over");
      const tokenId = e.dataTransfer.getData("text/plain");

      const previousSkill = Object.keys(state.assignments).find((s) => state.assignments[s] === tokenId);
      if (previousSkill) {
        delete state.assignments[previousSkill];
      }
      state.assignments[skill] = tokenId;
      renderRatingStep();
    });

    selectedItemsEl.appendChild(row);
  });

  state.rankingTokens.forEach((token) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "score-chip";
    chip.draggable = true;
    chip.dataset.tokenId = token.id;
    chip.textContent = `${token.value}/10`;

    const used = Object.values(state.assignments).includes(token.id);
    chip.classList.toggle("used", used);
    if (used) {
      chip.setAttribute("aria-disabled", "true");
    }

    chip.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", token.id);
    });

    bankEl.appendChild(chip);
  });
}

function renderVisualization() {
  const svg = document.querySelector("#t-shape-svg");
  svg.innerHTML = "";

  const mapped = state.selectedItems.map((name) => {
    const tokenId = state.assignments[name];
    const token = state.rankingTokens.find((t) => t.id === tokenId);
    return { name, value: token.value };
  });
  mapped.sort((a, b) => b.value - a.value);

  const points = generatePoints(mapped.length, state.profileType);
  const sortedCenter = [0, 1, 2];
  const edgeIndexes = points.map((_, i) => i).filter((i) => !sortedCenter.includes(i));
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

    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");

    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", x.toString());
    rect.setAttribute("y", y.toString());
    rect.setAttribute("rx", "12");
    rect.setAttribute("width", cardW.toString());
    rect.setAttribute("height", cardH.toString());
    rect.setAttribute("fill", "rgba(138, 125, 255, 0.20)");
    rect.setAttribute("stroke", "#8a7dff");
    rect.setAttribute("stroke-width", "1.5");

    const scoreText = document.createElementNS("http://www.w3.org/2000/svg", "text");
    scoreText.setAttribute("x", (x + 10).toString());
    scoreText.setAttribute("y", (y + 20).toString());
    scoreText.setAttribute("fill", "#d9dcff");
    scoreText.setAttribute("font-size", "13");
    scoreText.textContent = `${item.value}/10`;

    const skillText = document.createElementNS("http://www.w3.org/2000/svg", "text");
    skillText.setAttribute("x", (x + 10).toString());
    skillText.setAttribute("y", (y + 43).toString());
    skillText.setAttribute("fill", "#f4f6ff");
    skillText.setAttribute("font-size", "13");
    skillText.textContent = truncate(item.name, 28);

    group.appendChild(rect);
    group.appendChild(scoreText);
    group.appendChild(skillText);
    svg.appendChild(group);
  });
}

function generatePoints(count, profileType) {
  const base = profileType === "generalist"
    ? [
        [0, 0], [0, -100], [0, 100], [-180, 0], [180, 0], [0, -200],
        [0, 200], [-280, 0], [280, 0], [-360, 0], [360, 0], [0, 280],
      ]
    : [[0, 0], [0, -100], [0, 100], [-180, 0], [180, 0], [0, -200]];

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

function downloadSvg() {
  const svg = document.querySelector("#t-shape-svg");
  const content = svg.outerHTML;
  const blob = new Blob([content], { type: "image/svg+xml;charset=utf-8" });
  triggerDownload(URL.createObjectURL(blob), "t-shaped-profile.svg");
}

function downloadFromSvg(type) {
  const svg = document.querySelector("#t-shape-svg");
  const serializer = new XMLSerializer();
  const svgBlob = new Blob([serializer.serializeToString(svg)], { type: "image/svg+xml;charset=utf-8" });
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
        const mime = type === "jpeg" ? "image/jpeg" : "image/png";
        const filename = type === "jpeg" ? "t-shaped-profile.jpg" : "t-shaped-profile.png";
        triggerDownload(URL.createObjectURL(blob), filename, mime);
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

render();
