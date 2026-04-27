# T-shape-tool (subfolder)

This directory is a **self-contained** package used for **Netlify Functions** and a **static** `t-shaped/` app tree.

For the main developer workflow (Solid, Vite, and the current Netlify build from the repository root), see the **[../README.md](../README.md)** at the repository root.

## What is different here

- **Publish** path in this folder’s `netlify.toml` is `t-shaped` (static assets), not `t-shaped/dist` like the root config.
- **Scripts** in `package.json` target this tree (`build:css`, `serve` → `npx serve t-shaped`, `netlify dev` from this folder’s root if you work only here).
- **Environment:** copy `tshape-tool/.env.example` when running functions from this package.

## Quick start (this folder only)

```bash
cd tshape-tool
npm install
npm run build:css
npx netlify dev
```

Use an SMTP test sink and env vars for email; see the root **README** for the same `SMTP_*` variable list.
