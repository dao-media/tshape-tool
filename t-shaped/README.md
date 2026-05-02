# T-Shaped (Vite app)

Designer profile mapper (Solid + Vite + `appRuntime.js`). **Full setup, stack, Windows vs Mac, and Netlify** are documented in the [repository root `README.md`](../README.md#install-and-run).

## Local dev (quick)

From this directory:

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually [http://localhost:5173](http://localhost:5173)).

- **macOS:** use **Terminal**; `cd` to this `t-shaped` folder, then the commands above.
- **Windows:** use **PowerShell** or **Command Prompt**; `cd` to this `t-shaped` folder (use quotes if the path has spaces), then the same commands.

`npm run build` compiles CSS and production assets to `dist/`. `npm run preview` serves that build locally.

## Shape guide · tool pills

On the results step, **Tools to know** and **New & promising** render as **two separate cards**. Each category row in the **New & promising** column gets a **`min-height` synced at runtime** to the matching row in **Tools to know**, so headings line up horizontally without forcing a single shared grid shell (implemented with **`ResizeObserver`** on the know column, wide viewports only).

**Accessibility:** curated tools with URLs are focusable links with an **`aria-label`** that names the tool and indicates **opens in a new tab**, plus the category tooltip (`data-tippy-content`). Tools missing a mapped URL render as **`button type="button"`** with a descriptive **`aria-label`** (categories + clarification that there is no external link in the guide). Tippy defaults include **keyboard focus** and **touch-friendly** triggering so tooltip text is not hover-only.

**Automated checks** (needs Playwright Chromium once per machine/arch):

```bash
npm run test:e2e:install   # one-time browsers
npm run test:e2e           # builds, serves preview, runs axe + keyboard checks on guide pills
npm run test:e2e:ui        # interactive runner (same tests)
```

Specs live under `tests/e2e/` (fixtures seed step 5 via `localStorage` so the guide is already on screen).
