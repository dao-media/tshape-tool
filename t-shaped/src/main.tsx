import { render } from "solid-js/web";
import "../styles.out.css";
import "../theme-toggle.css";
import App from "./App";
import "./gsap-animations.js";
import "./tippy-tooltips.js";

/* eslint-disable @typescript-eslint/no-non-null-assertion */
const root = document.getElementById("root")!;

render(() => <App />, root);
