#!/usr/bin/env node
// Headless-Chrome driver for the EVINFO Next.js website.
// No npm deps — shells out to Chrome/Edge and uses node:http.
//
//   node driver.mjs shot  <url> <outfile.png>      screenshot a page
//   node driver.mjs smoke <baseUrl> [routes...]    HTTP-check routes (exit 1 on any failure)
//
// Chrome is auto-located; override with CHROME_PATH=/path/to/chrome.exe
import { execFileSync } from "node:child_process";
import http from "node:http";
import https from "node:https";
import fs from "node:fs";
import path from "node:path";

const CHROME_CANDIDATES = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
];

function findChrome() {
  const env = process.env.CHROME_PATH;
  if (env && fs.existsSync(env)) return env;
  for (const p of CHROME_CANDIDATES) if (fs.existsSync(p)) return p;
  throw new Error("No Chrome/Edge found. Set CHROME_PATH to the browser executable.");
}

function shot(url, out) {
  if (!url || !out) throw new Error("usage: driver.mjs shot <url> <outfile.png>");
  const chrome = findChrome();
  // Chrome (Windows exe) needs an ABSOLUTE path or it writes relative to its own cwd.
  const abs = path.resolve(out);
  execFileSync(chrome, [
    "--headless=new", "--disable-gpu", "--hide-scrollbars",
    "--virtual-time-budget=9000", "--window-size=1440,1000",
    `--screenshot=${abs}`, url,
  ], { stdio: "ignore" });
  if (!fs.existsSync(abs) || fs.statSync(abs).size < 1000)
    throw new Error(`screenshot not produced (or blank): ${abs}`);
  console.log(`screenshot ok: ${abs} (${fs.statSync(abs).size} bytes)`);
}

function check(url) {
  const mod = url.startsWith("https") ? https : http;
  return new Promise((res) => {
    const req = mod.get(url, (r) => { r.resume(); res(r.statusCode || 0); });
    req.on("error", () => res(0));
    req.setTimeout(10000, () => { req.destroy(); res(0); });
  });
}

async function smoke(base, routes) {
  if (!base) throw new Error("usage: driver.mjs smoke <baseUrl> [routes...]");
  const list = routes.length ? routes : [""];
  let ok = true;
  for (const rt of list) {
    // Accept "cars", "/cars", or "" (home). One clean leading slash, no MSYS mangling needed.
    const clean = "/" + String(rt).replace(/^\/+/, "");
    const url = base.replace(/\/$/, "") + (clean === "/" ? "/" : clean);
    const code = await check(url);
    const good = code >= 200 && code < 400;
    if (!good) ok = false;
    console.log(`${good ? "OK  " : "FAIL"} ${code}  ${url}`);
  }
  process.exit(ok ? 0 : 1);
}

const [cmd, ...rest] = process.argv.slice(2);
try {
  if (cmd === "shot") shot(rest[0], rest[1]);
  else if (cmd === "smoke") await smoke(rest[0], rest.slice(1));
  else { console.error("usage: driver.mjs shot <url> <out> | smoke <base> <routes...>"); process.exit(2); }
} catch (e) {
  console.error("ERROR:", e.message);
  process.exit(1);
}
