# T-Shaped Prototype

Preliminary prototype for a web app called **T-Shaped** that helps designers:

- choose skills/specialties
- assign strength ratings
- generate a bar-chart **designer shape** (T, Pi, M, I, or X) from ratings
- export results as PNG, JPEG, or SVG

## Current Status

Front-end prototype (HTML/CSS/JavaScript) plus optional Netlify serverless email delivery.

Implemented flow:

1. Start (`Yes/No`) + condensed **demo T-chart** (hover bars on desktop; tap to toggle labels on touch)
2. Profile type (`Generalist` or `Specialist`)
3. Skill/specialty selection
4. **Rank** with `icons/Rating icon_*-10.png`: tap a rank → hero icon **spin-zoom** (ease-out-back) then joins a **shared global pulse** (`requestAnimationFrame` → `--global-pulse-scale`). Row colors come from **sampled icon pixels** per rank (fallback palette if sampling fails).
5. **Shape plot**: top-aligned bars (like the reference infographic), auto **T / Pi / M / I / X** classification from scores, export PNG/JPEG/SVG

## Project Structure

```text
.
├── t-shaped/
│   ├── icons/
│   │   ├── Rating icon_1-10.png … Rating icon_10-10.png
│   │   └── Rating icon.ai
│   ├── index.html
│   ├── script.js
│   └── styles.css
└── README.md
```

## Run Locally

### Option 1: Open directly

Open `t-shaped/index.html` in your browser.

### Option 2: Run a local server (recommended)

From the repository root:

```bash
cd "t-shaped"
python3 -m http.server 8080
```

Then open:

- [http://localhost:8080](http://localhost:8080)

Build CSS first (Tailwind):

```bash
npm run build:css
```

### Option 3: Full stack (native email send on localhost)

From the repository root:

```bash
npm install
npm run build:css
npx netlify dev
```

Then open:

- [http://localhost:8888](http://localhost:8888)

For local email testing, run an SMTP sink such as Mailpit and point env vars accordingly.

## Native Email Setup (Netlify + localhost)

The app sends email through `/.netlify/functions/send-shape-email`.

Required env vars (copy from `.env.example`):

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE` (`true`/`false`)
- `SMTP_USER` (optional for local SMTP without auth)
- `SMTP_PASS` (optional for local SMTP without auth)
- `SMTP_FROM` (sender display and email)

On Netlify, add these in **Site settings → Environment variables**.

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

- Save/load profile state (local storage or backend)
- Improve mobile interaction for the rank toggles
- Add share link / export metadata
- Add broader accessibility (keyboard and screen reader polish)
- Add tests and CI checks
