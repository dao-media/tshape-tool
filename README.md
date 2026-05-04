# T-Shaped Prototype (v0.15)

T-Shaped is a designer self-assessment web app for mapping skill depth, classifying profile shape (I / T / Pi / M / X), and exporting results.

The **canonical app** lives in **`t-shaped/`**: [SolidJS](https://www.solidjs.com/) shell + [Vite](https://vitejs.dev/), step flow in **`appRuntime.js`**, templates in **`index.html`**.

Netlify configuration at the **repo root** builds and publishes **`t-shaped/dist`**.

## Stack

- **UI shell:** SolidJS + Vite (`t-shaped/src/main.tsx`, `t-shaped/src/App.tsx`)
- **Runtime logic:** DOM-driven steps in `t-shaped/src/appRuntime.js` with templates in `t-shaped/index.html`
- **Export pipeline:** `t-shaped/src/exportRuntime.js` (SVG + raster export)
- **Styling:** Tailwind v4 CLI — source `t-shaped/styles.css`, output `t-shaped/styles.out.css` (generated; commit or regenerate in CI)
- **Animation / UX:** GSAP (`t-shaped/src/gsap-animations.js`), Tippy.js (`t-shaped/src/tippy-tooltips.js`)
- **Optional backend:** Netlify function `/.netlify/functions/send-shape-email` (`netlify/functions/send-shape-email.js`)

### Tools and libraries

- **Build:** Vite, TypeScript, Tailwind CSS (+ PostCSS + Autoprefixer)
- **Email (functions):** Netlify Functions + Nodemailer
- **Image / export helpers:** `html-to-image` (frontend), `@resvg/resvg-js`, `pngjs`, `jpeg-js`, `archiver`
- **E2E (optional):** Playwright (`t-shaped` — `npm run test:e2e` after `npm run test:e2e:install`)

## User flow (5 steps)

1. **Start** — Optional name + email; condensed demo T-chart (hover on desktop, tap on touch).
2. **Profile** — Generalist (**8–12** skills) or Specialist (**5–6** skills).
3. **Select** — Categories and specializations; **Random** and clear (**⟲**).
4. **Rank** — Thermometer per skill (0–10); **8**, **9**, and **10** are globally unique (quota panel). **Rate All** presets and reset.
5. **Shape** — Auto-detected archetype; Labels/Key visualization toggle; export PNG / JPEG / SVG; optional email ZIP via Netlify function. Step 5 blurb (`#shape-result-sub`) is newline-split into stacked paragraphs for spacing; **Learn More** sits in a sibling row for screen-reader order.

## Project structure

```text
.
├── netlify.toml              # Publish t-shaped/dist, functions netlify/functions
├── netlify/functions/
│   └── send-shape-email.js
├── package.json              # Root: scripts (dev:shape, build:shape, build:css), function + Tailwind deps
├── t-shaped/                 # Vite + Solid app
│   ├── public/
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── appRuntime.js
│   │   ├── exportRuntime.js
│   │   ├── gsap-animations.js
│   │   ├── tippy-tooltips.js
│   │   └── theme-toggle.js
│   ├── index.html
│   ├── styles.css            # Tailwind source
│   ├── styles.out.css        # Built CSS (run build:css or npm run build)
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

## Run locally

### Prerequisites

- **Node.js** LTS (20.x or newer) and **npm** — [nodejs.org](https://nodejs.org); confirm `node -v` and `npm -v`.
- Clone or download this repo so you have the folders above.

Commands below use **repository root** as `.` unless noted. Replace paths with yours.

---

### Development (Solid + Vite)

From **repository root**:

```bash
cd t-shaped
npm install
npm run dev
```

Open the URL Vite prints (usually **http://localhost:5173**). Stop with **Ctrl+C**.

**Shortcut from repo root** (after `t-shaped/node_modules` exists):

```bash
npm run dev:shape
```

(`dev:shape` runs `cd t-shaped && npm run dev` — see root `package.json`.)

**Production build + preview:**

```bash
cd t-shaped
npm run build          # runs build:css then vite build
npm run preview        # serves t-shaped/dist via Vite preview
```

**Or from repo root:**

```bash
npm run build:shape
npm run serve          # npx serve t-shaped/dist
```

**CSS only** (when editing `t-shaped/styles.css` without a full Vite build):

```bash
npm run build:css      # from repo root → t-shaped/styles.out.css
# or
cd t-shaped && npm run build:css
```

> **Note:** Do not open `t-shaped/index.html` as `file://`; use the dev server or a built `dist` served over HTTP.

**Optional E2E** (from `t-shaped/`):

```bash
npm run test:e2e:install   # once
npm run test:e2e
```

---

### Full stack (Netlify dev + functions)

Install **root** dependencies (functions + Tailwind CLI used by root scripts), then install **t-shaped** and start Netlify dev (serves per root `netlify.toml`; build output is `t-shaped/dist`):

```bash
npm install
cd t-shaped && npm install && cd ..
npx netlify dev
```

Use the URL Netlify prints (often **http://localhost:8888**). For local SMTP, use something like [Mailpit](https://github.com/axllent/mailpit) and set env vars below.

---

### Windows

Same commands in **PowerShell** or **Command Prompt**; quote paths with spaces, e.g. `cd "C:\Users\You\Projects\Claude Code"`. Allow Node through the firewall if prompted on first `netlify dev`.

## Native email setup (Netlify + localhost)

The app calls `/.netlify/functions/send-shape-email`. Copy **`.env.example`** (repo root) and set:

- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE` (`true` / `false`)
- `SMTP_USER`, `SMTP_PASS` (optional for local sinks without auth)
- `SMTP_FROM`

On Netlify: **Site settings → Environment variables**.

## Lockfiles (Vercel / Netlify / `npm ci`)

**Never** add `package-lock.json`, `yarn.lock`, or `pnpm-lock.yaml` to `.gitignore`. Install steps need the lockfile beside each `package.json`.

This repo **tracks**:

- **`package-lock.json`** at the repo root (Netlify Functions + root scripts).
- **`t-shaped/package-lock.json`** next to the Vite app (what Vercel uses when **Root Directory** is `t-shaped`).

Confirm on GitHub that both files appear in the file tree on `main`.

## Deploy (Netlify)

From **`netlify.toml`** at repo root:

- **Build command:** `npm ci && cd t-shaped && npm ci && npm run build`
- **Publish directory:** `t-shaped/dist`
- **Functions directory:** `netlify/functions`

## Notes

- Theme toggle uses hash routing (`#light` / `#dark`) with scroll-preserving logic in `appRuntime.js`.
- Shape chart hover pill uses viewport-clamped positioning (desktop hover + mobile tap).
- In-browser logic self-check: add **`?selftest=1`** to the URL.

## Possible next steps

- Deeper migration of step UI from DOM templates to Solid + shared state
- Save/load profile (storage or backend)
- Mobile polish for rank toggles
- Share links / export metadata
- Broader accessibility and automated tests in CI
