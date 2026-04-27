# T-Shaped Prototype (v0.15)

T-Shaped is a designer self-assessment web app for mapping skill depth, classifying profile shape, and exporting results.

## Current App Specs

### Stack

- **UI shell:** [SolidJS](https://www.solidjs.com/) + [Vite](https://vitejs.dev/) (`t-shaped/src/main.tsx`, `t-shaped/src/App.tsx`)
- **Runtime logic:** DOM-driven flow in `t-shaped/src/appRuntime.js` with templates in `t-shaped/index.html`
- **Styling:** Tailwind pipeline (`t-shaped/styles.css` -> `t-shaped/styles.out.css`)
- **Optional backend:** Netlify function email endpoint at `/.netlify/functions/send-shape-email` (`netlify/functions/send-shape-email.js`)

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
   - Export: PNG, JPEG, SVG
   - Optional email delivery (ZIP with PNG/JPG/SVG) through Netlify function

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
├── tshape-tool/              # Separate/legacy package snapshot
└── README.md
```

## Install and Run

### Recommended: Vite app only

From repository root:

```bash
cd t-shaped
npm install
npm run dev
```

Open the URL Vite prints (typically [http://localhost:5173](http://localhost:5173)).

### Build / serve production output

```bash
# from repository root
npm run build:shape
npm run serve
```

`serve` hosts `t-shaped/dist`.

### CSS-only build (Tailwind)

```bash
npm run build:css
```

Run from repository root (targets `t-shaped/styles.css`), or from `t-shaped/` run `npm run build:css`.

> **Note:** Opening `t-shaped/index.html` as a `file://` URL is not supported; the app expects the Vite dev server or a built `dist` tree served over HTTP.

### Full stack: Netlify dev (frontend + functions)

From repository root:

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
