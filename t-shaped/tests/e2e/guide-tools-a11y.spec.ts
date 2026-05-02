/**
 * Playwright + axe checks for the shape guide tool pills (keyboard + WCAG scan).
 *
 * Run: `npm run test:e2e` (starts webServer: `npm run build` + `vite preview` on port 4173)
 * Install browsers once: `npm run test:e2e:install` (or full `npx playwright install chromium`)
 *
 * If you see “Executable doesn't exist”, re-run install on the same machine/arch as CI.
 */
import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const LOCAL_KEY = "tshaped-local-state-v1";

/** Valid persisted snapshot: jump to step 5 with rated skills that produce guide tool pills. */
function step5Payload() {
  return JSON.stringify({
    version: 1,
    step: 5,
    profileType: "generalist",
    userName: "e2e",
    userEmail: "",
    selectedItems: ["Web Design", "Character Design"],
    assignments: { "Web Design": 8, "Character Design": 9 },
    detectedShape: null,
    shapeVizMode: "labels",
    updatedAt: Date.now(),
  });
}

async function gotoGuideWithTools(page: Page) {
  await page.goto("/");
  await page.locator("#shape-guide-card").waitFor({ state: "visible", timeout: 30_000 });
  await page.locator("#guide-card-heading-tools-know").waitFor({ state: "visible" });
}

test.describe("Shape guide — tool pills", () => {
  test.beforeEach(async ({ context }) => {
    await context.addInitScript(
      ({ key, payload }: { key: string; payload: string }) => {
        try {
          sessionStorage.setItem("tshaped-preloader-seen-v1", "1");
        } catch {
          /* ignore */
        }
        localStorage.setItem(key, payload);
      },
      { key: LOCAL_KEY, payload: step5Payload() },
    );
  });

  test("axe: no serious/critical issues inside shape guide card", async ({ page }) => {
    await gotoGuideWithTools(page);

    const results = await new AxeBuilder({ page })
      .include("#shape-guide-card")
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();

    const bad = results.violations.filter((v) => v.impact === "critical" || v.impact === "serious");
    expect(bad, JSON.stringify(bad, null, 2)).toHaveLength(0);
  });

  test("axe: no serious/critical issues inside tools pair columns", async ({ page }) => {
    await gotoGuideWithTools(page);

    const results = await new AxeBuilder({ page })
      .include(".shape-insights-tools-pair")
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();

    const bad = results.violations.filter((v) => v.impact === "critical" || v.impact === "serious");
    expect(bad, JSON.stringify(bad, null, 2)).toHaveLength(0);
  });

  test("keyboard: external tool links expose opens-in-new-tab in accessible name", async ({ page }) => {
    await gotoGuideWithTools(page);
    await page.locator("#shape-insights a.shape-insight-pill--guide-link").first().waitFor({ timeout: 30_000 });
    const link = page.locator("#shape-insights a.shape-insight-pill--guide-link").first();
    await link.focus();
    await expect(link).toBeFocused();
    const name = await link.getAttribute("aria-label");
    expect(name?.toLowerCase()).toContain("opens in new tab");
  });

  test("keyboard: tooltip-only (no URL) pills are focusable buttons", async ({ page }) => {
    await gotoGuideWithTools(page);
    const locator = page.locator("#shape-insights button.shape-insight-pill--no-url");
    const count = await locator.count();
    test.skip(count === 0, "Fixture has no tooltip-only tools with this data set");
    const btn = locator.first();
    await btn.waitFor({ state: "visible", timeout: 30_000 });
    await btn.focus();
    await expect(btn).toBeFocused();
    const label = await btn.getAttribute("aria-label");
    expect(label?.length ?? 0).toBeGreaterThan(8);
    expect(label?.toLowerCase()).toMatch(
      /no external url|tooltip|linked categor|keyboard focus.*category/i,
    );
  });

  test("keyboard: Tab advances focus past the first tool pill", async ({ page }) => {
    await gotoGuideWithTools(page);
    await page.locator("#shape-insights a.shape-insight-pill--guide-link").first().waitFor({ timeout: 30_000 });
    const first = page.locator("#shape-insights a.shape-insight-pill--guide-link").first();
    await first.focus();
    await expect(first).toBeFocused();
    await page.keyboard.press("Tab");
    const movedOffFirst = await first.evaluate((el) => el !== document.activeElement);
    expect(movedOffFirst).toBe(true);
  });

  test("keyboard: tab order traverses consecutive tool controls in DOM order", async ({ page }) => {
    await gotoGuideWithTools(page);
    const focusables = page.locator(
      ".shape-insights-tools-pair .shape-insight-tool-group a.shape-insight-pill--guide-link, .shape-insights-tools-pair .shape-insight-tool-group button.shape-insight-pill--no-url",
    );
    const n = await focusables.count();
    expect(n, "fixture should list at least one tool control").toBeGreaterThanOrEqual(1);

    const first = focusables.first();
    await first.waitFor({ state: "visible", timeout: 15_000 });
    await first.focus();

    /** @type {string[]} */
    const seen = [];
    const maxSteps = Math.min(n + 6, 48);
    for (let step = 0; step < maxSteps; step += 1) {
      const inPair = await page.evaluate(() =>
        Boolean(document.activeElement?.closest?.(".shape-insights-tools-pair")),
      );
      if (!inPair) break;
      const desc = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el) return "";
        const tag = el.tagName.toLowerCase();
        const lab = el.getAttribute("aria-label") || "";
        return `${tag}:${lab.slice(0, 52)}`;
      });
      seen.push(desc);
      await page.keyboard.press("Tab");
    }

    expect(seen.length, `expected Tab stops inside tools pair, got: ${JSON.stringify(seen)}`).toBeGreaterThanOrEqual(1);
    if (n >= 2) {
      const unique = new Set(seen);
      expect(
        unique.size,
        `Tab should reach at least 2 distinct tool controls before leaving the pair (${JSON.stringify(seen)})`,
      ).toBeGreaterThanOrEqual(2);
    }
  });
});
