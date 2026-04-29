# T-Shaped Prototype (v0.15)

T-Shaped is a designer self-assessment web app for mapping skill depth, classifying profile shape, and exporting results.

## Current App Specs

### Stack

- **UI shell:** [SolidJS](https://www.solidjs.com/) + [Vite](https://vitejs.dev/) (`t-shaped/src/main.tsx`, `t-shaped/src/App.tsx`)
- **Runtime logic:** DOM-driven flow in `t-shaped/src/appRuntime.js` with templates in `t-shaped/index.html`
- **Export pipeline:** Dedicated export module in `t-shaped/src/exportRuntime.js` (SVG + raster export composition)
- **Styling:** Tailwind pipeline (`t-shaped/styles.css` -> `t-shaped/styles.out.css`)
- **Optional backend:** Netlify function email endpoint at `/.netlify/functions/send-shape-email` (`netlify/functions/send-shape-email.js`)

### Tools and Libraries Used

- **Framework/runtime:** SolidJS
- **Build/dev server:** Vite
- **Styling:** Tailwind CSS (+ PostCSS + Autoprefixer)
- **Animation:** GSAP (`t-shaped/src/gsap-animations.js`)
- **Tooltips:** Tippy.js (`t-shaped/src/tippy-tooltips.js`)
- **Email backend:** Netlify Functions + Nodemailer
- **Image/render helpers (frontend + backend):** `html-to-image` (frontend DOM snapshot export), `@resvg/resvg-js`, `pngjs`, `jpeg-js`, `archiver`

### User Flow (5 Steps)

1. **Start**
   - Optional Name + Email inputs
   - Condensed demo T-chart preview (hover labels on desktop, tap-to-toggle labels on touch)
2. **Profile**
   - Choose `Generalist` (up to 12 items) or `Specialist` (up to 6 items)
3. **Select**
   - Pick categories/specializations
   - Helpers: `Random`, reset (`⟲`)
4. **Rank**
   - Horizontal thermometer control per selected item (0-10)
   - `8`, `9`, and `10` are globally unique (quota panel shown beside ranking list)
   - Helpers: `Rate All` presets (`balanced`, `top-heavy`, `random-valid`) and reset (`⟲`)
5. **Shape**
   - Auto-detects `I`, `T`, `Pi`, `M`, or `X`
   - Labels/Key toggle for visualization mode
   - Export: PNG, JPEG, SVG (Labels-mode PNG/JPEG are rendered from the on-screen frontend chart+labels snapshot)
   - Optional email delivery (ZIP with PNG/JPG/SVG) through Netlify function
   - Accessibility note: Step 5 subtitle action is DOM-separated (`#shape-result-sub` text + sibling action row) for cleaner screen-reader reading order

## Project Structure

```text
.
├── netlify/
│   └── functions/
│       └── send-shape-email.js
├── netlify.toml
├── t-shaped/                 # Vite + Solid app
│   ├── public/               # Static assets (icons, theme toggle HTML, …)
│   ├── src/
│   │   ├── main.tsx          # Solid entry, imports CSS + app bootstrap
│   │   ├── App.tsx           # Page shell (header, stepper, view)
│   │   ├── appRuntime.js     # Step logic, exports, rank/shape behavior
│   │   ├── exportRuntime.js  # Export assembly and download/email export helpers
│   │   ├── gsap-animations.js
│   │   ├── tippy-tooltips.js
│   │   └── theme-toggle.js
│   ├── index.html
│   ├── styles.css            # Tailwind source
│   ├── styles.out.css        # Generated (commit or regenerate in CI)
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── tshape-tool/              # Separate/legacy package snapshot
└── README.md
```

## Install and Run

### Prerequisites (macOS and Windows)

- **Node.js** LTS (e.g. 20.x or newer) and **npm** — install from [https://nodejs.org](https://nodejs.org) and confirm in a terminal:
  - `node -v`
  - `npm -v`
- This repo: **clone** with Git, or **download and unpack** the project ZIP so you have a folder that contains `t-shaped/` and `package.json` at the repo root.

All commands below assume your **current directory is the repository root** (the folder that contains `t-shaped/`). Replace `path/to/...` with your actual project path.

### T-Shaped app (Vite) — macOS (Terminal)

1. Open **Terminal** (e.g. **Spotlight** → “Terminal”, or **iTerm2** if you use it).
2. Go to the repo:
   ```bash
   cd /path/to/Claude\ Code
   ```
   (Or drag the folder onto the Terminal window after typing `cd ` to paste the path.)
3. Install dependencies **inside the app folder** (required once, or after dependency changes):
   ```bash
   cd t-shaped
   npm install
   ```
4. Start the dev server:
   ```bash
   npm run dev
   ```
5. Open the URL Vite prints — typically **[http://localhost:5173](http://localhost:5173)**.

To stop the server, press **Ctrl+C** in that terminal window.

After `t-shaped/node_modules` exists, you can start the dev server **from the repo root** without typing `cd t-shaped` again:

```bash
npm run dev:shape
```

(that script runs `cd t-shaped && npm run dev`; see root `package.json`.)

### T-Shaped app (Vite) — Windows (Command Prompt / PowerShell)

Use **Command Prompt**, **PowerShell**, or **Windows Terminal**. Steps match macOS; only the way you open the shell and `cd` paths differ.

1. Open **PowerShell** or **Command Prompt** (or **Windows Terminal** → choose a PowerShell or Cmd tab).
2. Change to the repo root (adapt the drive and folder — examples):
   ```powershell
   cd C:\Users\YourName\Documents\Projects\Claude Code
   ```
   Paths with spaces must be quoted:
   ```powershell
   cd "C:\Users\YourName\My Projects\Claude Code"
   ```
3. Install and run the app (from **repo root**):
   ```powershell
   cd t-shaped
   npm install
   npm run dev
   ```
4. When Vite is ready, open **[http://localhost:5173](http://localhost:5173)** in your browser.

To stop the server, focus the same window and press **Ctrl+C**. If Windows asks about the firewall for Node.js on first run, allow access for **private networks** if prompted.

**Tip:** On Windows, `cd t-shaped` works the same as on macOS. You can also use forward slashes in `cd` under PowerShell, e.g. `cd C:/Users/.../t-shaped`.

### Build / serve production output

From the **repository root** (after you have run `npm install` in `t-shaped/` at least once):

```bash
npm run build:shape
npm run serve
```

`build:shape` runs the Vite + CSS build for `t-shaped/`; `serve` serves `t-shaped/dist` (uses `npx serve` via the root `package.json` script). If the `serve` command is not found, run `npx serve t-shaped/dist` from the repo root.

You can also build from inside the app:

```bash
cd t-shaped
npm run build
npm run preview
```

`preview` serves the production build (Vite’s static preview, not the root `serve` script).

### CSS-only build (Tailwind)

From the **repository root**:

```bash
npm run build:css
```

This compiles `t-shaped/styles.css` → `t-shaped/styles.out.css`. Or, from `t-shaped/`:

```bash
cd t-shaped
npm run build:css
```

> **Note:** Opening `t-shaped/index.html` as a `file://` URL is not supported; the app expects the Vite dev server or a built `dist` tree served over HTTP.

### Full stack: Netlify dev (frontend + functions)

From the **repository root** (installs root + function dependencies):

```bash
npm install
npx netlify dev
```

Open the URL Netlify prints (often [http://localhost:8888](http://localhost:8888)).

For local email testing, run an SMTP sink such as [Mailpit](https://github.com/axllent/mailpit) and configure env vars.

## Native Email Setup (Netlify + localhost)

The app sends ZIP attachments via `/.netlify/functions/send-shape-email`.

Required environment variables (copy from `.env.example`):

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE` (`true`/`false`)
- `SMTP_USER` (optional for local SMTP without auth)
- `SMTP_PASS` (optional for local SMTP without auth)
- `SMTP_FROM`

On Netlify, add these under **Site settings → Environment variables**.

## Deploy (Netlify)

- Build command: `cd t-shaped && npm ci && npm run build`
- Publish directory: `t-shaped/dist`
- Functions directory: `netlify/functions`

All are already configured in `netlify.toml`.

## Notes

- Theme toggle is hash-driven (`#light` / `#dark`) with scroll-preserving logic in `appRuntime.js`.
- Shape chart hover pill uses viewport-clamped positioning (desktop hover + mobile tap behavior).
- You can run a small in-browser logic self-check with `?selftest=1` in the URL.

## Next Suggested Enhancements

- Deeper migration of step UI from DOM templates to Solid components and shared state
- Save/load profile state (local storage or backend)
- Improve mobile interaction for the rank toggles
- Add share link / export metadata
- Add broader accessibility (keyboard and screen reader polish)
- Add tests and CI checks
