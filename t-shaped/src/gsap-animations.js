/* global gsap */
(function () {
  const g = typeof window !== "undefined" && window.gsap;
  if (!g) {
    console.error("GSAP is required. Load gsap before gsap-animations.js.");
  }

  const noop = () => {};

  function reduced() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  let globalPulseTween = null;
  const GLOBAL_PULSE_S = 4.2;

  function startGlobalPulse() {
    if (!g) {
      document.documentElement.style.setProperty("--global-pulse-scale", "1");
      return;
    }
    if (globalPulseTween) return;
    if (reduced()) {
      document.documentElement.style.setProperty("--global-pulse-scale", "1");
      return;
    }
    const o = { u: 0 };
    globalPulseTween = g.to(o, {
      u: 1,
      duration: GLOBAL_PULSE_S,
      repeat: -1,
      ease: "none",
      onUpdate() {
        const s = 1 + 0.024 * Math.sin(o.u * Math.PI * 2);
        document.documentElement.style.setProperty("--global-pulse-scale", s.toFixed(5));
      },
    });
  }

  const cardRainbow = new WeakMap();
  const thermoTweens = new WeakMap();

  function recordTween(el, key, tween) {
    if (!el) return;
    let o = thermoTweens.get(el);
    if (!o) {
      o = {};
      thermoTweens.set(el, o);
    }
    if (o[key]) o[key].kill();
    o[key] = tween;
  }

  function killField(el, key) {
    const o = thermoTweens.get(el);
    if (o && o[key]) {
      o[key].kill();
      o[key] = null;
    }
  }

  function runInterstitialRaf({ fill, bar, line, totalMs, lines, onDone }) {
    const t0 = performance.now();
    function tick(now) {
      const t = Math.min(1, (now - t0) / totalMs);
      const pct = Math.min(100, Math.round(t * 100));
      if (fill) fill.style.width = `${pct}%`;
      if (bar) bar.setAttribute("aria-valuenow", String(pct));
      if (line) {
        const i = t < 0.34 ? 0 : t < 0.68 ? 1 : 2;
        line.textContent = lines[i];
      }
      if (t < 1) {
        requestAnimationFrame(tick);
      } else {
        setTimeout(onDone, 160);
      }
    }
    requestAnimationFrame(tick);
  }

  function runInterstitial({ fill, bar, line, totalMs, lines, onDone }) {
    if (!g) {
      runInterstitialRaf({ fill, bar, line, totalMs, lines, onDone });
      return;
    }
    if (reduced() && fill) {
      fill.style.width = "100%";
      if (bar) bar.setAttribute("aria-valuenow", "100");
      if (line && lines[2]) line.textContent = lines[2];
      setTimeout(onDone, 80);
      return;
    }
    const state = { t: 0 };
    g.to(state, {
      t: 1,
      duration: totalMs / 1000,
      ease: "none",
      onUpdate() {
        const t = state.t;
        const pct = Math.min(100, Math.round(t * 100));
        if (fill) fill.style.width = `${pct}%`;
        if (bar) bar.setAttribute("aria-valuenow", String(pct));
        if (line) {
          const i = t < 0.34 ? 0 : t < 0.68 ? 1 : 2;
          line.textContent = lines[i];
        }
      },
      onComplete: () => {
        setTimeout(onDone, 160);
      },
    });
  }

  function bindCardRainbow() {
    if (!g) return;
    document.querySelectorAll(".card:not(.tool-card)").forEach((card) => {
      if (card.dataset.gsapRainbow === "1") return;
      card.dataset.gsapRainbow = "1";
      card.style.setProperty("--card-rainbow-bp", "0%");
      const run = (active) => {
        if (reduced()) return;
        const prev = cardRainbow.get(card);
        if (prev) prev.kill();
        if (!active) {
          cardRainbow.delete(card);
          card.style.setProperty("--card-rainbow-bp", "0%");
          return;
        }
        const tw = g.to(card, {
          "--card-rainbow-bp": "100%",
          duration: 1.6,
          ease: "none",
          repeat: -1,
          yoyo: true,
        });
        cardRainbow.set(card, tw);
      };
      card.addEventListener("mouseenter", () => run(true));
      card.addEventListener("mouseleave", () => run(false));
      const mo = new MutationObserver(() => {
        if (card.classList.contains("active")) run(true);
        else if (!card.matches(":hover")) run(false);
      });
      mo.observe(card, { attributes: true, attributeFilter: ["class"] });
    });
  }

  function afterRender({ view, sideInfo }) {
    if (!g) return;
    if (reduced()) {
      return;
    }
    if (view) {
      g.from(view.querySelectorAll(".card"), {
        opacity: 0,
        y: -10,
        duration: 0.2,
        ease: "back.out(1.25)",
        stagger: 0.04,
        clearProps: "all",
      });
      g.from(view.querySelectorAll(".entry-subtle"), {
        opacity: 0,
        y: -10,
        duration: 0.2,
        ease: "back.out(1.25)",
        stagger: 0.04,
        clearProps: "all",
      });
      g.from(
        view.querySelectorAll(
          ".stagger-in > *, .stagger-group > *"
        ),
        {
          opacity: 0,
          y: -30,
          duration: 0.55,
          ease: "back.out(1.2)",
          stagger: 0.1,
          clearProps: "all",
        }
      );
    }
    if (sideInfo && !sideInfo.dataset.gsapIn) {
      sideInfo.dataset.gsapIn = "1";
      g.from(sideInfo, {
        opacity: 0,
        y: -10,
        duration: 0.2,
        ease: "back.out(1.25)",
        clearProps: "all",
      });
    }
  }

  function animMiniGraph(host) {
    if (!g || !host) return;
    const bars = host.querySelectorAll(".mini-bar");
    if (reduced() || !bars.length) return;
    bars.forEach((bar) => {
      const d = bar.style.getPropertyValue("--d") || "0s";
      const sec = parseFloat(d) || 0;
      g.fromTo(
        bar,
        { opacity: 0, scaleY: 0.82, transformOrigin: "top center" },
        {
          opacity: 1,
          scaleY: 1,
          duration: 0.35,
          ease: "back.out(1.2)",
          delay: sec,
          clearProps: "transform,opacity",
        }
      );
    });
  }

  function playHeroEnter(row) {
    if (!g) return;
    const inner = row.querySelector(".skill-rank-hero-inner");
    if (!inner) return;
    if (reduced()) {
      inner.classList.add("is-pulsing");
      return;
    }
    inner.classList.remove("is-pulsing");
    g
      .timeline({
        onComplete: () => {
          inner.classList.add("is-pulsing");
        },
      })
      .fromTo(
        inner,
        { opacity: 0, scale: 0.12, rotation: -32 },
        { opacity: 1, scale: 1.12, rotation: 10, duration: 0.406, ease: "power2.out" }
      )
      .to(inner, { scale: 1, rotation: 0, duration: 0.174, ease: "back.out(1.2)" });
  }

  function killIconAnims(icon) {
    g.killTweensOf(icon);
    icon.style.removeProperty("--thermo-ico-s");
    icon.style.removeProperty("filter");
  }

  /** After pop-in, icons idle on shared :root `--global-pulse-scale` (see .thermo-icon CSS). */
  function startIconPulse(icon) {
    if (!icon) return;
    if (g) g.killTweensOf(icon);
    icon.style.removeProperty("--thermo-ico-s");
  }

  function runThermoFill(thermo) {
    if (!g || !thermo) return;
    if (reduced()) return;
    killField(thermo, "fill");
    const filled = [...thermo.querySelectorAll(".thermo-slot.thermo-slot--in-fill")];
    if (!filled.length) return;
    const tw = g.fromTo(
      filled,
      { opacity: 0.25, filter: "brightness(0.6) saturate(0.75)" },
      {
        opacity: 1,
        filter: "none",
        duration: 0.36,
        ease: "cubic-bezier(0.22, 1, 0.36, 1)",
        stagger: 0.03,
        onComplete: () => {
          g.set(filled, { clearProps: "opacity,filter" });
        },
      }
    );
    recordTween(thermo, "fill", tw);
  }

  function runIconPop(icon) {
    if (!g || !icon) return;
    killIconAnims(icon);
    if (reduced()) {
      startIconPulse(icon);
      return;
    }
    icon.style.setProperty("--thermo-ico-s", "1");
    g
      .timeline({
        onComplete: () => {
          g.set(icon, { clearProps: "transform" });
          startIconPulse(icon);
        },
      })
      .fromTo(
        icon,
        { opacity: 0, xPercent: -50, yPercent: -50, scale: 0.2, rotation: -20 },
        { opacity: 1, xPercent: -50, yPercent: -50, scale: 1.1, rotation: 8, duration: 0.33, ease: "power2.out" }
      )
      .to(icon, { xPercent: -50, yPercent: -50, scale: 1, rotation: 0, duration: 0.22, ease: "back.out(1.2)" });
  }

  function runIconSnapFlash(icon) {
    if (!g || !icon) return;
    if (reduced()) return;
    g.fromTo(
      icon,
      { filter: "brightness(1.35) drop-shadow(0 0 10px rgba(255, 216, 160, 0.65))" },
      {
        filter: "drop-shadow(0 8px 20px rgba(0,0,0,0.5))",
        duration: 0.42,
        ease: "power1.out",
        onComplete: () => {
          g.set(icon, { clearProps: "filter" });
        },
      }
    );
  }

  function thermoApply(row, rank, opts) {
    if (!g) return;
    const t = row.querySelector(".thermo");
    if (!t) return;
    const { animate, animateFill, snapFlash } = opts;
    const icon = t.querySelector(".thermo-icon");

    if (rank == null) {
      if (icon) killIconAnims(icon);
      killField(t, "fill");
      if (t.dataset.fillAnimT) {
        clearTimeout(Number(t.dataset.fillAnimT));
        delete t.dataset.fillAnimT;
      }
      return;
    }

    if (animateFill) {
      killField(t, "fill");
      if (t.dataset.fillAnimT) {
        clearTimeout(Number(t.dataset.fillAnimT));
        delete t.dataset.fillAnimT;
      }
      const tid = window.setTimeout(() => {
        runThermoFill(t);
        delete t.dataset.fillAnimT;
      }, 0);
      t.dataset.fillAnimT = String(tid);
    }

    if (!icon) return;
    if (animate) {
      runIconPop(icon);
    } else {
      startIconPulse(icon);
    }
    if (snapFlash) {
      g.delayedCall(0, () => runIconSnapFlash(icon));
    }
  }

  function shapeKeyAnimate(card) {
    if (!g || !card || card.hidden) return;
    if (reduced()) return;
    g.fromTo(
      card,
      { opacity: 0, y: 8 },
      { opacity: 1, y: 0, duration: 0.28, ease: "power2.out", clearProps: "opacity,transform" }
    );
    const rows = card.querySelectorAll(".shape-key-row");
    rows.forEach((row) => {
      const d = row.style.getPropertyValue("--shape-key-d") || "0s";
      const sec = parseFloat(d) || 0;
      g.fromTo(
        row,
        { opacity: 0, y: 6 },
        {
          opacity: 1,
          y: 0,
          duration: 0.32,
          delay: sec,
          ease: "back.out(1.2)",
          clearProps: "opacity,transform",
        }
      );
    });
  }

  function shapeChartIn(svg) {
    if (!g || !svg) return;
    if (reduced()) return;
    const bars = svg.querySelectorAll(".tbar");
    const labels = document.querySelectorAll(
      "#t-shape-svg .tbar-label-vertical, #shape-chart-container .shape-label-text"
    );
    bars.forEach((rect) => {
      const d = rect.style.getPropertyValue("--tbar-d") || "0s";
      const sec = parseFloat(d) || 0;
      const fullH = Number.parseFloat(rect.getAttribute("height") || "0");
      if (!Number.isFinite(fullH) || fullH <= 0) return;
      g.fromTo(
        rect,
        { autoAlpha: 0, attr: { height: 0 } },
        {
          autoAlpha: 1,
          attr: { height: fullH },
          duration: 0.34,
          delay: sec,
          ease: "cubic-bezier(0.22, 1, 0.36, 1)",
        }
      );
    });
    labels.forEach((el) => {
      const d =
        el.style.getPropertyValue("--tbar-d") ||
        el.closest(".shape-label-cell")?.style.getPropertyValue("--tbar-d") ||
        "0s";
      const sec = parseFloat(d) || 0;
      g.fromTo(
        el,
        { opacity: 0, y: 4 },
        {
          opacity: 1,
          y: 0,
          duration: 0.34,
          delay: sec,
          ease: "back.out(1.2)",
          clearProps: "opacity,transform",
        }
      );
    });
  }

  const api = g
    ? {
        reduced,
        startGlobalPulse,
        runInterstitial,
        bindCardRainbow,
        afterRender,
        animMiniGraph,
        playHeroEnter,
        thermoApply,
        shapeKeyAnimate,
        shapeChartIn,
      }
    : {
        reduced: () => true,
        startGlobalPulse: noop,
        runInterstitial: (opts) => runInterstitialRaf(opts),
        bindCardRainbow: noop,
        afterRender: noop,
        animMiniGraph: noop,
        playHeroEnter: noop,
        thermoApply: noop,
        shapeKeyAnimate: noop,
        shapeChartIn: noop,
      };

  window.TShapedAnim = api;
})();
