#!/usr/bin/env node
// run-jw3b driver — launch a headless browser against the running jw3b.dev Vite dev
// server and screenshot / inspect pages. Agent tooling: messier than product code
// on purpose. The repo's own e2e suite uses Playwright, so this reuses it.
//
// Usage (dev server must already be running — see SKILL.md):
//   node .claude/skills/run-jw3b/driver.mjs shoot /            out/landing.png
//   node .claude/skills/run-jw3b/driver.mjs shoot /hire-me out/hire-me.png
//   node .claude/skills/run-jw3b/driver.mjs check  /audit     # prints status + <title> + console errors
//
// BASE defaults to http://localhost:5173 (Vite default). Override
// with JW3B_BASE=http://localhost:PORT.

import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

const BASE = process.env.JW3B_BASE || "http://localhost:5173";
const [cmd, path = "/", outArg] = process.argv.slice(2);

if (!cmd || !["shoot", "check"].includes(cmd)) {
  console.error("usage: driver.mjs <shoot|check> <path> [outfile.png]");
  process.exit(2);
}

const browser = await chromium.launch({
  // swiftshader lets the three.js/WebGL hero render in a headless container.
  args: ["--enable-unsafe-swiftshader", "--use-gl=angle", "--use-angle=swiftshader"],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

const consoleErrors = [];
page.on("console", (m) => m.type() === "error" && consoleErrors.push(m.text()));
page.on("pageerror", (e) => consoleErrors.push(String(e)));

const resp = await page.goto(BASE + path, { waitUntil: "networkidle", timeout: 45000 });
// Let GSAP/Framer entrance animations settle before capture.
await page.waitForTimeout(2500);

const status = resp?.status();
const title = await page.title();

if (cmd === "check") {
  console.log(JSON.stringify({ path, status, title, consoleErrors: consoleErrors.slice(0, 8) }, null, 2));
} else {
  const out = outArg || `out/${path.replace(/\W+/g, "_") || "root"}.png`;
  mkdirSync(dirname(out), { recursive: true });
  await page.screenshot({ path: out, fullPage: true });
  console.log(JSON.stringify({ path, status, title, screenshot: out, consoleErrors: consoleErrors.slice(0, 5) }, null, 2));
}

await browser.close();
