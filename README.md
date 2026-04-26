# T-Shaped Prototype

Preliminary prototype for a web app called **T-Shaped** that helps designers:

- choose skills/specialties
- assign strength ratings
- generate a bar-chart **designer shape** (T, Pi, M, I, or X) from ratings
- export results as PNG, JPEG, or SVG

## Current Status

**Front end:** [Solid](https://www.solidjs.com/) (app shell) and [Vite](https://vitejs.dev/) with TypeScript, plus the existing **DOM-driven step flow** in `t-shaped/src/appRuntime.js` and step templates in `t-shaped/index.html`. Styles use **Tailwind** (source `styles.css`, built to `styles.out.css`).

**Back end (optional):** Netlify function `send-shape-email` in `netlify/functions/` for server-side email from the app.

**Deploy:** Netlify builds with `cd t-shaped && npm ci && npm run build` and publishes `t-shaped/dist` (see `netlify.toml`).

Implemented user flow:

1. Start (`Yes/No`) + condensed **demo T-chart** (hover bars on desktop; tap to toggle labels on touch)
2. Profile type (`Generalist` or `Specialist`)
3. Skill/specialty selection
4. **Rank** with `public/icons/Rating icon_*-10.png`: tap a rank → hero icon **spin-zoom** (ease-out-back) then joins a **shared global pulse** (`requestAnimationFrame` → `--global-pulse-scale`). Row colors come from **sampled icon pixels** per rank (fallback palette if sampling fails).
5. **Shape plot**: top-aligned bars (like the reference infographic), auto **T / Pi / M / I / X** classification from scores, export PNG/JPEG/SVG

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
│   │   ├── gsap-animations.js
│   │   ├── tippy-tooltips.js
│   │   └── theme-toggle.js
│   ├── index.html
│   ├── styles.css            # Tailwind source
│   ├── styles.out.css        # Generated (commit or regenerate in CI)
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── tshape-tool/              # Alternate package: Netlify + static `t-shaped` (email tooling)
└── README.md
```

## Run Locally

### T-shaped app (Vite) — recommended

From the repository root:

```bash
cd t-shaped
npm install
npm run dev
```

Open the URL Vite prints (usually [http://localhost:5173](http://localhost:5173)).

Production build and local preview of the static output:

```bash
# from repo root
npm run build:shape
npm run serve
```

(`serve` points at `t-shaped/dist`.)

**Tailwind only** (if you are editing `t-shaped/styles.css` without a full Vite build):

```bash
npm run build:css
```

at the **repository** root, or from `t-shaped/` run `npm run build:css` (same pipeline as the full `build` script).

> **Note:** Opening `t-shaped/index.html` as a `file://` URL is not supported; the app expects the Vite dev server or a built `dist` tree served over HTTP.

### Full stack: Netlify dev (site + serverless functions)

From the **repository** root, install root dependencies, then (with the [Netlify CLI](https://docs.netlify.com/cli/get-started/) available, e.g. `npm i -g netlify-cli` or `npx`):

```bash
npm install
npx netlify dev
```

Then open the URL Netlify prints (often [http://localhost:8888](http://localhost:8888)).

For local email testing, use an SMTP sink such as [Mailpit](https://github.com/axllent/mailpit) and set env vars to match.

## Native Email Setup (Netlify + localhost)

The app can send email through `/.netlify/functions/send-shape-email`.

Required environment variables (copy from **`.env.example`**, or set in the Netlify UI):

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE` (`true`/`false`)
- `SMTP_USER` (optional for local SMTP without auth)
- `SMTP_PASS` (optional for local SMTP without auth)
- `SMTP_FROM` (sender display and email)

On Netlify, add these under **Site settings → Environment variables**.

## Behavior Notes

- **Generalist**: up to 12 selected items. **Specialist**: up to 6.
- **Ranking**: tap a rank icon (1–10). Pool limits still apply; if a rank is exhausted, the choice
  snaps to the nearest available value.
- **Colors**: driven by the **rank** (sampled from the matching PNG), not by skill name.
- **Pulse**: one global sine cycle updates `--global-pulse-scale` every frame; every hero icon
  that has finished its entrance animation uses that same value so pulses stay in phase.
- Scrollable selection/rank panels; **⟲** clears selections on step 3 or scores on step 4.
- **Shape** step: bar chart (top baseline), heuristic best match among **I, T, Pi, M, X**.

Optional: append `?selftest=1` to the URL to re-run a small in-browser self-check (see console).

## Exports

- **PNG**: transparent background
- **JPEG**: solid white background
- **SVG**: transparent vector output

## Next Suggested Enhancements

- Deeper migration of step UI from DOM templates to Solid components and shared state
- Save/load profile state (local storage or backend)
- Improve mobile interaction for the rank toggles
- Add share link / export metadata
- Add broader accessibility (keyboard and screen reader polish)
- Add tests and CI checks
