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
4. Drag-and-drop rating assignment
5. T-shape plotting and export

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
- Ratings are assigned via drag-and-drop score chips.
- Visualization places highest scores toward the center, with remaining items distributed around the T-shape.

## Exports

- **PNG**: transparent background
- **JPEG**: solid white background
- **SVG**: transparent vector output

## Next Suggested Enhancements

- Save/load profile state (local storage or backend)
- Improve mobile interaction for drag-and-drop
- Add share link / export metadata
- Add accessibility refinements (keyboard DnD, ARIA feedback)
- Add tests and CI checks
