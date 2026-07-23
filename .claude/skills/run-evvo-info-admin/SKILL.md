---
name: run-evvo-info-admin
description: Build, launch, and drive the EVINFO admin panel (evvo-info-admin). Use when asked to run, start, serve, screenshot, smoke-test, or verify a change in the admin/CMS React app — login, brands, models, variants, sub-variants (vehicles), gallery, dealers, blogs, banners, reviews.
---

# Run the EVINFO admin panel (Create React App / react-scripts 5)

Internal CMS for managing brands → models → variants → sub-variants, plus gallery,
dealers, blogs, banners, and reviews. **CRA (react-scripts 5.0.1)**, React 18,
react-bootstrap, Redux Toolkit, react-router v6, axios → backend API. Driven headlessly
with **Chrome** via the committed driver:
[.claude/skills/run-evvo-info-admin/driver.mjs](.claude/skills/run-evvo-info-admin/driver.mjs)
(no Playwright/npm deps — shells out to Chrome, uses `node:http`).

> Paths below are relative to the unit root `D:\Prakash\evinfo\evvo-info-admin`.
> Commands are Git-Bash (the Bash tool). Deps are already installed.

## Prerequisites

- Node 20.x, npm 10.x (verified: `node -v` → v20.17.0).
- Google Chrome — auto-located at `C:/Program Files/Google/Chrome/Application/chrome.exe`
  (Edge fallback). Override with `CHROME_PATH=...`.
- Backend API on **http://localhost:3007** — required to log in and load any data.
  Config: [.env](.env) → `REACT_APP_BASE_URL`. Without it you get the login page only.

## Setup (only if node_modules is missing)

```bash
npm install
```

## Run (agent path) — start server, then drive with the driver

The `start` script pins nothing useful (`react-scripts start PORT=3003` — that trailing token
is an ignored arg). Control the port with the **`PORT` env var**, and set `BROWSER=none` so CRA
doesn't try to open a window, `CI=false` so lint warnings don't fail the build. Use **3003**
because the website usually owns 3000:

```bash
PORT=3003 BROWSER=none CI=false npm start > /tmp/evinfo-admin-dev.log 2>&1 &
```

CRA's first webpack compile is slow — **wait ~25–35s**:

```bash
for i in $(seq 1 60); do curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3003 | grep -q 200 && { echo ready; break; }; sleep 3; done
tail -5 /tmp/evinfo-admin-dev.log   # expect "Compiled successfully!"
```

**Smoke-check** (it's a SPA — every route serves index.html, so `/` is the meaningful check):

```bash
node .claude/skills/run-evvo-info-admin/driver.mjs smoke http://localhost:3003 ""
```

**Screenshot** (output path may be relative; the driver resolves it to absolute for Chrome):

```bash
node .claude/skills/run-evvo-info-admin/driver.mjs shot http://localhost:3003 .claude/skills/run-evvo-info-admin/example-login.png
```

Then open the PNG. Unauthenticated, you land on the **login page** ("Welcome Back") — that's the
committed reference shot `example-login.png`. To reach an authenticated page (e.g. the
sub-variants table at `/#/...`), the backend must be up and you must drive a login; the screenshot
step is the same, just point it at the route after auth.

## Run (human path)

```bash
PORT=3003 npm start     # opens http://localhost:3003 in a browser, hot reload; Ctrl-C to stop
```
Useless for automated verification (opens a real browser window) — use the driver above.

## Build / test

Not exercised in the session that authored this skill (dev + driver were). From
[package.json](package.json): `npm run build:dev` (`cross-env NODE_ENV=dev react-scripts build`)
for a build, `npm test` for the watch-mode test runner (`npm run test:ci` for one-shot with
`CI=true`).

## Gotchas

- **The `start` script's `PORT=3003` token is a no-op.** react-scripts reads the port from the
  `PORT` env var, not from that positional arg. Always launch with `PORT=3003 …`, or CRA defaults
  to 3000 and collides with the website.
- **Set `BROWSER=none`.** Otherwise CRA tries to spawn a desktop browser on start, which hangs /
  errors in a headless context.
- **First compile is slow (~25–35s)** and prints deprecation warnings for
  `onAfterSetupMiddleware` — those are harmless CRA/webpack-dev-server noise, not failures. Wait
  for `Compiled successfully!` in the log before driving.
- **SPA routing:** the app uses client-side routes, so `curl`-ing any path returns the same 200
  index.html. Route correctness can only be confirmed by a screenshot, not by HTTP status.
- **Git-Bash mangles bare `/route` args** → pass route names without a leading slash to `smoke`
  (the driver adds it); or prefix with `MSYS_NO_PATHCONV=1`.
- **Chrome needs an absolute screenshot path** — the driver resolves it for you; if calling Chrome
  directly, pass a full `D:\...` path.

## Troubleshooting

| Symptom | Fix |
|---|---|
| Stuck with no 200 after 60s | Still compiling or crashed — read `/tmp/evinfo-admin-dev.log`. |
| Port 3003 in use | Another admin instance is running; either reuse it or pick another `PORT`. |
| `ERROR: No Chrome/Edge found` | `export CHROME_PATH=/c/Program\ Files/Google/Chrome/Application/chrome.exe`. |
| Login fails / tables empty | Backend API not on :3007. Start it (see the API's own run skill). |
| `screenshot not produced (or blank)` | Use the driver (resolves path); check the dev-server log for a compile error. |
