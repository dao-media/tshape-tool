import { toJpeg, toPng } from "html-to-image";

/**
 * @typedef {{ name: string, value: number }} MappedItem
 */

/**
 * @param {{
 *   state: { userName: string, selectedItems: string[], assignments: Record<string, number | null>, shapeVizMode: "labels" | "key" },
 *   constants: {
 *     EXPORT_ATTRIBUTION: string,
 *     EXPORT_SIZE_PX: number,
 *     EXPORT_FOOTER_H: number,
 *     CHART_LABEL_SLOT_MIN_H_PX: number,
 *     LABEL_BAR_GAP_PX: number,
 *   },
 *   fns: {
 *     getCurrentShapeSvgHeight: () => number,
 *     getCurrentShapeSvgWidth: () => number,
 *     getDetectedShapeKey: () => string,
 *     getRankTheme: (rank: number) => { stroke: string },
 *     parseDisplayName: (raw: string) => string,
 *     parseFirstName: (raw: string) => string,
 *     truncate: (str: string, max: number) => string,
 *     triggerDownload: (url: string, filename: string) => void,
 *   },
 * }} deps
 */
export function createExportManager(deps) {
  const { state, constants, fns } = deps;
  const { EXPORT_ATTRIBUTION, EXPORT_SIZE_PX, EXPORT_FOOTER_H, CHART_LABEL_SLOT_MIN_H_PX, LABEL_BAR_GAP_PX } =
    constants;
  const {
    getCurrentShapeSvgHeight,
    getCurrentShapeSvgWidth,
    getDetectedShapeKey,
    getRankTheme,
    parseDisplayName,
    parseFirstName,
    truncate,
    triggerDownload,
  } = fns;

  const EXPORT_KEY_GAP = 20;

  /** @returns {MappedItem[]} */
  function getShapeMappedForExport() {
    return state.selectedItems
      .map((name) => ({ name, value: state.assignments[name] }))
      .filter((x) => x.value != null);
  }

  function getExportLayout() {
    const chartW = getCurrentShapeSvgWidth();
    const mapped = getShapeMappedForExport();
    const keyMode = state.shapeVizMode === "key" && mapped.length > 0;
    const padT = 12;
    const padB = 12;
    const rowH = 19;
    const rowGap = 5;
    if (!keyMode) {
      const bodyH = getCurrentShapeSvgHeight();
      return {
        totalW: chartW,
        totalH: bodyH + EXPORT_FOOTER_H,
        bodyH,
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
    const bodyH = Math.max(getCurrentShapeSvgHeight(), keyContentH);
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
    panel.setAttribute("fill", "#ffffff");
    panel.setAttribute("stroke", "#d8e0f2");
    panel.setAttribute("stroke-width", "1");
    g0.appendChild(panel);

    const padL = 10;
    const nameMax = 26;
    const valRight = layout.keyW - padL;
    layout.mapped.forEach((item, i) => {
      const rowTop = layout.padT + i * (layout.rowH + layout.rowGap);
      const theme = getRankTheme(item.value);
      const chip = 10;
      const sw = document.createElementNS(ns, "rect");
      sw.setAttribute("x", String(padL));
      sw.setAttribute("y", String(rowTop + 1));
      sw.setAttribute("width", String(chip));
      sw.setAttribute("height", String(chip));
      sw.setAttribute("fill", `url(#tbar-grad-${i})`);
      sw.setAttribute("stroke", theme.stroke);
      sw.setAttribute("stroke-width", "1");
      g0.appendChild(sw);
      const tName = document.createElementNS(ns, "text");
      tName.setAttribute("x", String(padL + chip + 5));
      tName.setAttribute("y", String(rowTop + 10));
      tName.setAttribute("fill", "#2a395e");
      tName.setAttribute("font-size", "9.5");
      tName.setAttribute("font-family", "Inter, ui-sans-serif, system-ui, -apple-system, sans-serif");
      tName.textContent = truncate(item.name, nameMax);
      g0.appendChild(tName);
      const tVal = document.createElementNS(ns, "text");
      tVal.setAttribute("x", String(valRight));
      tVal.setAttribute("y", String(rowTop + 10));
      tVal.setAttribute("text-anchor", "end");
      tVal.setAttribute("fill", "#141b2d");
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
    t.setAttribute(
      "font-family",
      "\"IBM Plex Mono\", \"JetBrains Mono\", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace"
    );
    t.setAttribute("pointer-events", "none");
    t.textContent = EXPORT_ATTRIBUTION;
    parent.appendChild(t);
  }

  function wrapExportIntoSquare(ns, content, sourceW, sourceH, opts = {}) {
    const transparentBg = opts.transparentBg === true;
    const showMainPanel = opts.showMainPanel !== false;
    const outer = document.createElementNS(ns, "svg");
    outer.setAttribute("xmlns", ns);
    outer.setAttribute("viewBox", `0 0 ${EXPORT_SIZE_PX} ${EXPORT_SIZE_PX}`);
    outer.setAttribute("width", String(EXPORT_SIZE_PX));
    outer.setAttribute("height", String(EXPORT_SIZE_PX));

    if (!transparentBg) {
      const bg = document.createElementNS(ns, "rect");
      bg.setAttribute("x", "0");
      bg.setAttribute("y", "0");
      bg.setAttribute("width", String(EXPORT_SIZE_PX));
      bg.setAttribute("height", String(EXPORT_SIZE_PX));
      bg.setAttribute("fill", "#eef2fb");
      outer.appendChild(bg);
    }

    if (showMainPanel) {
      const panel = document.createElementNS(ns, "rect");
      panel.setAttribute("x", "48");
      panel.setAttribute("y", "48");
      panel.setAttribute("width", String(EXPORT_SIZE_PX - 96));
      panel.setAttribute("height", String(EXPORT_SIZE_PX - 96));
      panel.setAttribute("rx", "18");
      panel.setAttribute("fill", "#ffffff");
      panel.setAttribute("stroke", "#d8e0f2");
      panel.setAttribute("stroke-width", "1.5");
      outer.appendChild(panel);
    }

    const availW = EXPORT_SIZE_PX - 128;
    const availH = EXPORT_SIZE_PX - 128;
    const s = Math.min(availW / Math.max(1, sourceW), availH / Math.max(1, sourceH));
    const fitW = sourceW * s;
    const fitH = sourceH * s;
    const tx = Math.round((EXPORT_SIZE_PX - fitW) / 2);
    const ty = Math.round((EXPORT_SIZE_PX - fitH) / 2);

    content.setAttribute("x", "0");
    content.setAttribute("y", "0");
    content.setAttribute("width", String(sourceW));
    content.setAttribute("height", String(sourceH));
    content.setAttribute("preserveAspectRatio", "xMinYMin meet");

    const g = document.createElementNS(ns, "g");
    g.setAttribute("transform", `translate(${tx} ${ty}) scale(${s})`);
    g.appendChild(content);
    outer.appendChild(g);

    return new XMLSerializer().serializeToString(outer);
  }

  function getExportPlotTitleText() {
    const shapeKey = getDetectedShapeKey();
    const displayName = parseDisplayName(state.userName);
    return displayName ? `${displayName} | ${shapeKey}-Shaped Designer` : `${shapeKey}-Shaped Designer`;
  }

  function appendExportCenteredTitle(ns, parent, chartW, y = 30) {
    const title = document.createElementNS(ns, "text");
    title.setAttribute("x", String(Math.round(chartW / 2)));
    title.setAttribute("y", String(y));
    title.setAttribute("text-anchor", "middle");
    title.setAttribute("fill", "#141b2d");
    title.setAttribute("font-size", "18");
    title.setAttribute("font-weight", "620");
    title.setAttribute("font-family", "Inter, ui-sans-serif, system-ui, -apple-system, sans-serif");
    title.textContent = getExportPlotTitleText();
    parent.appendChild(title);
  }

  function appendExportLabelsAndTitle(ns, parent, chartClone, chartW) {
    const bars = Array.from(chartClone.querySelectorAll("rect.tbar"));
    if (!bars.length) return;

    let minBarTop = Infinity;
    bars.forEach((b) => {
      const y = Number.parseFloat(b.getAttribute("y") || "0");
      if (Number.isFinite(y)) minBarTop = Math.min(minBarTop, y);
    });
    if (!Number.isFinite(minBarTop)) return;

    const titleY = 30;
    const labelBandTop = 54;
    const labelBandH = CHART_LABEL_SLOT_MIN_H_PX;
    const barTopTarget = labelBandTop + labelBandH + LABEL_BAR_GAP_PX;
    const chartShiftY = Math.max(0, Math.round(barTopTarget - minBarTop));
    if (chartShiftY > 0) {
      chartClone.setAttribute("y", String(chartShiftY));
    }

    chartClone.querySelectorAll(".tbar-label-vertical").forEach((n) => n.remove());
    appendExportCenteredTitle(ns, parent, chartW, titleY);

    const labelsLayer = document.createElementNS(ns, "g");
    labelsLayer.setAttribute("pointer-events", "none");

    bars.forEach((b) => {
      const x = Number.parseFloat(b.getAttribute("x") || "0");
      const w = Number.parseFloat(b.getAttribute("width") || "0");
      const name = b.dataset?.name || "";
      if (!Number.isFinite(x) || !Number.isFinite(w) || !name) return;
      const cx = x + w / 2;
      const labelBottom = labelBandTop + labelBandH;
      const txt = document.createElementNS(ns, "text");
      txt.setAttribute("x", String(cx));
      txt.setAttribute("y", String(labelBottom));
      txt.setAttribute("fill", "#141b2d");
      txt.setAttribute("font-size", "13");
      txt.setAttribute("font-weight", "620");
      txt.setAttribute("font-family", "Inter, ui-sans-serif, system-ui, -apple-system, sans-serif");
      txt.setAttribute("text-anchor", "middle");
      txt.setAttribute("dominant-baseline", "text-after-edge");
      txt.setAttribute("style", "writing-mode:vertical-rl;text-orientation:mixed;");
      txt.textContent = name;
      labelsLayer.appendChild(txt);
    });

    parent.appendChild(labelsLayer);
  }

  function buildExportSvgString(opts = {}) {
    const transparentPng = opts.transparentPng === true;
    const svg = document.querySelector("#t-shape-svg");
    if (!svg) return "";
    const layout = getExportLayout();
    const ns = "http://www.w3.org/2000/svg";

    if (!layout.hasKey) {
      const content = document.createElementNS(ns, "svg");
      content.setAttribute("xmlns", ns);
      content.setAttribute("viewBox", `0 0 ${layout.totalW} ${layout.totalH}`);
      content.setAttribute("width", String(layout.totalW));
      content.setAttribute("height", String(layout.totalH));
      const chartClone = /** @type {SVGSVGElement} */ (svg.cloneNode(true));
      chartClone.removeAttribute("id");
      chartClone.querySelectorAll(".tbar-texture").forEach((n) => n.remove());
      chartClone.setAttribute("x", "0");
      chartClone.setAttribute("y", "0");
      chartClone.setAttribute("width", String(layout.chartW));
      chartClone.setAttribute("height", String(getCurrentShapeSvgHeight()));
      content.appendChild(chartClone);
      appendExportLabelsAndTitle(ns, content, chartClone, layout.chartW);
      appendAttributionText(ns, content, layout.bodyH + 22);
      return wrapExportIntoSquare(ns, content, layout.totalW, layout.totalH, {
        transparentBg: transparentPng,
        showMainPanel: !transparentPng,
      });
    }

    const content = document.createElementNS(ns, "svg");
    content.setAttribute("xmlns", ns);
    content.setAttribute("viewBox", `0 0 ${layout.totalW} ${layout.totalH}`);
    content.setAttribute("width", String(layout.totalW));
    content.setAttribute("height", String(layout.totalH));
    const chartClone = /** @type {SVGSVGElement} */ (svg.cloneNode(true));
    chartClone.removeAttribute("id");
    chartClone.querySelectorAll(".tbar-texture").forEach((n) => n.remove());
    const defEl = chartClone.querySelector("defs");
    if (defEl) {
      content.appendChild(defEl);
    }
    chartClone.setAttribute("x", "0");
    chartClone.setAttribute("y", "0");
    chartClone.setAttribute("width", String(layout.chartW));
    chartClone.setAttribute("height", String(getCurrentShapeSvgHeight()));
    content.appendChild(chartClone);
    appendExportCenteredTitle(ns, content, layout.chartW, 30);
    chartClone.setAttribute("y", "40");
    const keyWrap = document.createElementNS(ns, "g");
    keyWrap.setAttribute("transform", "translate(0,40)");
    appendExportKeyGroup(ns, keyWrap, layout);
    content.appendChild(keyWrap);
    appendAttributionText(ns, content, layout.bodyH + 62);
    return wrapExportIntoSquare(ns, content, layout.totalW, layout.totalH + 40, {
      transparentBg: transparentPng,
      showMainPanel: !transparentPng,
    });
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

  async function renderLabelsRasterBlobFromDom(type) {
    const EXPORT_TITLE_Y_PX = 110;
    const EXPORT_DRAW_TOP_PX = 170;
    const EXPORT_SIDE_PAD_PX = 60;
    const EXPORT_BOTTOM_SAFE_PX = 80;
    const EXPORT_CONTENT_TOP_PAD_PX = 170;
    const EXPORT_CONTENT_BOTTOM_PAD_PX = 80;
    const plotWrap = document.querySelector("#shape-chart-container .shape-chart-plot-wrap.has-html-label-row");
    if (!plotWrap) throw new Error("Could not find labels plot for raster export.");
    if (document.fonts?.ready) {
      await document.fonts.ready;
    }
    const dataUrl = type === "jpeg"
      ? await toJpeg(plotWrap, {
        cacheBust: true,
        quality: 0.96,
        pixelRatio: 3,
        backgroundColor: "#ffffff",
      })
      : await toPng(plotWrap, {
        cacheBust: true,
        pixelRatio: 3,
        backgroundColor: "rgba(0,0,0,0)",
      });
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = EXPORT_SIZE_PX;
          canvas.height = EXPORT_SIZE_PX;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Canvas context unavailable."));
            return;
          }

          if (type === "jpeg") {
            ctx.fillStyle = "#eef2fb";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
          }

          const title = getExportPlotTitleText();
          ctx.fillStyle = "#141b2d";
          ctx.font = "620 38px Inter, ui-sans-serif, system-ui, -apple-system, sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(title, EXPORT_SIZE_PX / 2, EXPORT_TITLE_Y_PX);

          const bounds = plotWrap.getBoundingClientRect();
          const sourceW = Math.max(1, Math.round(bounds.width));
          const sourceH = Math.max(1, Math.round(bounds.height));
          const maxW = EXPORT_SIZE_PX - EXPORT_SIDE_PAD_PX * 2;
          const maxH = EXPORT_SIZE_PX - EXPORT_CONTENT_TOP_PAD_PX - EXPORT_CONTENT_BOTTOM_PAD_PX;
          const s = Math.min(maxW / sourceW, maxH / sourceH);
          const drawW = sourceW * s;
          const drawH = sourceH * s;
          const drawX = Math.round((EXPORT_SIZE_PX - drawW) / 2);
          const drawY = Math.min(EXPORT_DRAW_TOP_PX, EXPORT_SIZE_PX - EXPORT_BOTTOM_SAFE_PX - drawH);
          ctx.drawImage(img, drawX, drawY, drawW, drawH);

          ctx.fillStyle = "rgba(160, 172, 210, 0.92)";
          ctx.font =
            "500 20px \"IBM Plex Mono\", \"JetBrains Mono\", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace";
          ctx.textAlign = "left";
          ctx.textBaseline = "alphabetic";
          ctx.fillText(EXPORT_ATTRIBUTION, 40, EXPORT_SIZE_PX - 34);

          canvas.toBlob(
            (blob) => {
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
          reject(err);
        }
      };
      img.onerror = () => reject(new Error(`Failed to load DOM snapshot for ${type}.`));
      img.src = dataUrl;
    });
  }

  async function createExportFileBundle() {
    const svgStr = buildExportSvgString();
    const pngSvgStr = buildExportSvgString({ transparentPng: true });
    if (!svgStr || !pngSvgStr) throw new Error("Could not build export SVG.");
    const shapeKey = getDetectedShapeKey();
    const labelsMode = state.shapeVizMode === "labels";
    const [pngBlob, jpegBlob] = await Promise.all(
      labelsMode
        ? [renderLabelsRasterBlobFromDom("png"), renderLabelsRasterBlobFromDom("jpeg")]
        : [
          renderRasterBlobFromSvgString("png", pngSvgStr, EXPORT_SIZE_PX, EXPORT_SIZE_PX),
          renderRasterBlobFromSvgString("jpeg", svgStr, EXPORT_SIZE_PX, EXPORT_SIZE_PX),
        ]
    );
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

  function downloadSvg() {
    const str = buildExportSvgString();
    if (!str) return;
    const shapeKey = getDetectedShapeKey();
    const blob = svgStringToBlob(str);
    triggerDownload(URL.createObjectURL(blob), buildExportFilename("svg", shapeKey));
  }

  function downloadRaster(type) {
    const run = (type === "png" || type === "jpeg") && state.shapeVizMode === "labels"
      ? renderLabelsRasterBlobFromDom(type)
      : renderRasterBlobFromSvgString(
        type,
        buildExportSvgString({ transparentPng: type === "png" }),
        EXPORT_SIZE_PX,
        EXPORT_SIZE_PX
      );
    return run.then((blob) => {
      const shapeKey = getDetectedShapeKey();
      triggerDownload(URL.createObjectURL(blob), buildExportFilename(type, shapeKey));
    });
  }

  return {
    buildExportSvgString,
    createExportFileBundle,
    getExportBaseName,
    downloadSvg,
    downloadRaster,
  };
}
