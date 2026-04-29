import { onMount } from "solid-js";
import { attachAppShellElements, bootstrapTShapedApp } from "./appRuntime";

/**
 * App shell: layout, stepper, and #view. Step templates live in index.html; runtime clones them.
 */
export default function App() {
  onMount(async () => {
    attachAppShellElements();
    await bootstrapTShapedApp();
  });

  return (
    <main class="app-shell">
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
          1. Start
        </div>
        <div class="step-pill" data-step="2">
          2. Profile
        </div>
        <div class="step-pill" data-step="3">
          3. Select
        </div>
        <div class="step-pill" data-step="4">
          4. Rank
        </div>
        <div class="step-pill" data-step="5">
          5. Shape
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

      <div class="app-corner-badge app-corner-badge--left">Beta | v 0.15</div>
      <div class="app-corner-badge app-corner-badge--right">
        Created with ❤️ by{" "}
        <a
          href="https://linkedin.com/in/daneoleary"
          target="_blank"
          rel="noopener noreferrer"
        >
          Dane O'Leary
        </a>
      </div>
    </main>
  );
}
