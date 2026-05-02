import { render } from "solid-js/web";
import { injectSpeedInsights } from "@vercel/speed-insights";
import "../styles.out.css";
import "../theme-toggle.css";
import App from "./App";
import "./gsap-animations.js";
import "./tippy-tooltips.js";

/* Vite + Solid: use `injectSpeedInsights` from the root package. The Next.js component
 * (`@vercel/speed-insights/next` / `SpeedInsights`) only applies to Next.js App Router. */
injectSpeedInsights({ framework: "solid" });

/* eslint-disable @typescript-eslint/no-non-null-assertion */
const root = document.getElementById("root")!;

render(() => <App />, root);
