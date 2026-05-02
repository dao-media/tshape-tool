import { createSignal, onMount } from "solid-js";
import { attachAppShellElements, bootstrapTShapedApp } from "./appRuntime";
import PreloaderSplash from "./PreloaderSplash";

/**
 * App shell: layout, stepper, and #view. Step templates live in index.html; runtime clones them.
 */
export default function App() {
  const [showPreloader, setShowPreloader] = createSignal(false);

  const PRELOADER_SESSION_KEY = "tshaped-preloader-seen-v1";
  const THEME_STORAGE_KEY = "tshaped-theme";

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const applyInitialThemeClass = () => {
    const h = (window.location.hash || "").toLowerCase();
    const fromHash = h === "#light" ? "light" : h === "#dark" ? "dark" : "";
    let stored = "dark";
    try {
      stored = localStorage.getItem(THEME_STORAGE_KEY) || "dark";
    } catch {}
    const mode = fromHash || (stored === "light" ? "light" : "dark");
    document.body.classList.toggle("light", mode === "light");
    document.body.classList.toggle("dark", mode !== "light");
  };

  onMount(async () => {
    applyInitialThemeClass();
    let shouldShowLoader = false;
    try {
      shouldShowLoader = sessionStorage.getItem(PRELOADER_SESSION_KEY) !== "1";
      if (shouldShowLoader) sessionStorage.setItem(PRELOADER_SESSION_KEY, "1");
    } catch {
      shouldShowLoader = true;
    }

    if (shouldShowLoader) setShowPreloader(true);
    attachAppShellElements();
    if (shouldShowLoader) {
      await Promise.all([bootstrapTShapedApp(), sleep(900)]);
      setShowPreloader(false);
      return;
    }
    await bootstrapTShapedApp();
  });

  return (
    <>
      <PreloaderSplash visible={showPreloader()} />

      <main class="app-shell font-sans">
        <header class="app-header">
          <div class="app-header-inner">
            <div class="app-header-copy">
              <h1>T-Shaped</h1>
              <p>Map your strengths, plot your design profile, and export it.</p>
            </div>
            <div class="app-header-theme" id="theme-toggle-host" />
          </div>
        </header>

        <section class="stepper" aria-label="Progress">
          <div class="step-pill active" data-step="1">
            Start
          </div>
          <div class="step-pill" data-step="2">
            Step 1: Profile
          </div>
          <div class="step-pill" data-step="3">
            Step 2: Skills
          </div>
          <div class="step-pill" data-step="4">
            Step 3: Rate
          </div>
          <div class="step-pill" data-step="5">
            Your Shape
          </div>
        </section>

        <section class="app-layout" id="app-layout">
          <aside class="card side-info-card" id="side-info-card">
            <h2 class="side-info-title">What's Your Designer Shape?</h2>
            <p class="muted side-info-desc">
              Map your strongest design capabilities, visualize your profile shape, and export the result.
            </p>

            <div class="side-demo-block">
              <div class="side-demos-row">
                <div class="mini-graph-wrap">
                  <span class="mini-graph-label">
                    <strong>T SHAPE</strong> (DEMO)
                  </span>
                  <div
                    class="mini-graph"
                    id="mini-graph-t"
                    role="img"
                    aria-label="Random T-shaped demo graph"
                  />
                </div>
                <div class="mini-graph-wrap">
                  <span class="mini-graph-label">
                    <strong>M SHAPE</strong> (DEMO)
                  </span>
                  <div
                    class="mini-graph"
                    id="mini-graph-m"
                    role="img"
                    aria-label="Random M-shaped demo graph"
                  />
                </div>
              </div>
            </div>

            <section class="tips-disclosure" aria-label="How to use this tool">
              <h2 class="tips-title">How to Use This Tool</h2>
              <details class="tips-step" open>
                <summary>
                  <h3 class="tips-step-heading">1. Choose a designer type</h3>
                </summary>
                <p class="tips-step-body">Do you consider yourself more of a generalist or specialist?</p>
              </details>
              <details class="tips-step">
                <summary>
                  <h3 class="tips-step-heading">2. Select your skills/competencies</h3>
                </summary>
                <p class="tips-step-body">Which best represent you as a designer?</p>
              </details>
              <details class="tips-step">
                <summary>
                  <h3 class="tips-step-heading">3. Rate each of your skills</h3>
                </summary>
                <p class="tips-step-body">Using a 1-to-10 scale, assess the strength of each skill.</p>
              </details>
              <details class="tips-step">
                <summary>
                  <h3 class="tips-step-heading">4. Review and export your shape</h3>
                </summary>
                <p class="tips-step-body">
                  Toggle between labeled and label-key views and save to your device.
                </p>
              </details>
            </section>

            <div class="actions side-actions">
              <button data-action="start-over" class="secondary btn-with-icon" type="button">
                <svg class="btn-with-icon__svg" viewBox="0 0 256 256" aria-hidden="true">
                  <path
                    fill="currentColor"
                    fill-rule="evenodd"
                    d="M135.1 31c3.9 3.9 3.8 10.3 0 14.1l-14.8 14.7h7.8c46.8 0 85 37.5 85 84.1s-38.2 84.1-85 84.1-85-37.5-85-84.1 4.5-10 10-10 10 4.5 10 10c0 35.3 29 64.1 65 64.1s65-28.8 65-64.1-29-64.1-65-64.1h-7.8l14.8 14.7c3.9 3.9 4 10.2 0 14.1-3.9 3.9-10.2 4-14.1 0l-32.1-31.8c-1.9-1.9-3-4.4-3-7.1s1.1-5.2 3-7.1l32.1-31.8c3.9-3.9 10.3-3.8 14.1 0Z"
                  />
                </svg>
                Start Over
              </button>
            </div>
          </aside>

          <section class="card tool-card">
            <div id="view" class="view" aria-live="polite" />
          </section>
        </section>

        <div class="app-corner-group app-corner-group--left" aria-label="Release info">
          <div class="app-corner-badge">Beta | v 0.15</div>
          <a
            href="https://github.com/dao-media/tshape-tool"
            class="app-corner-icon-btn"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View source repository on GitHub"
          >
            <svg class="app-corner-icon-btn__svg" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="currentColor"
                d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.694.825.574C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
              />
            </svg>
          </a>
        </div>
        <div class="app-corner-badge app-corner-badge--right">
          Made to 🤯 by{" "}
          <a
            href="https://linkedin.com/in/daneoleary"
            target="_blank"
            rel="noopener noreferrer"
          >
            Dane O'Leary
          </a>
        </div>
      </main>
    </>
  );
}
