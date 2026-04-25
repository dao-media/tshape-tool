# T-Shaped Prototype

Preliminary prototype for a web app called **T-Shaped** that helps designers:

- choose skills/specialties
- assign strength ratings
- generate a visual "T-shaped" profile
- export results as PNG, JPEG, or SVG

## Current Status

This is a front-end prototype (HTML/CSS/JavaScript) with no backend required.

Implemented flow:

1. Start prompt (`Yes/No`)
2. Profile type (`Generalist` or `Specialist`)
3. Skill/specialty selection
4. One combined 0–10 scale per item (0 = unset); constrained scores + live availability key; scrollable lists; reset controls
5. T-shape plotting, per-item color encoding, and export

## Project Structure

```text
.
├── t-shaped/
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

## Behavior Notes

- **Generalist**: up to 12 selected items.
- **Specialist**: up to 6 selected items.
- Ratings use a single scale per row (fill + thumb share one track). **0** means unset until the
  user sets a score. Each `n/10` can only be used as many times as the pool allows; choosing a full
  score snaps the thumb to the nearest free rank.
- A live key shows how many of each `n/10` are left. The reset control clears all scores.
- Long lists scroll inside the card so the layout stays on-screen.
- On the selection step, **⟲** clears all checked skills/specialties.
- Design categories have distinct hues; each specialization tints a related hue to its “parent”
  category. Rate rows and the final plot both use the same colors; rows show a fill bar at the
  matching percentage; export cards add a small bar for quick comparison.
- Visualization places highest scores toward the center, with remaining items distributed around
  the T-shape.

Optional: append `?selftest=1` to the URL to re-run a small in-browser self-check (see console).

## Exports

- **PNG**: transparent background
- **JPEG**: solid white background
- **SVG**: transparent vector output

## Next Suggested Enhancements

- Save/load profile state (local storage or backend)
- Improve mobile interaction for the sliders
- Add share link / export metadata
- Add broader accessibility (keyboard and screen reader polish)
- Add tests and CI checks
