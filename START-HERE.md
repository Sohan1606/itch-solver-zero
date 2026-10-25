# START HERE — run it, check it, push it

Everything below is copy-paste. Each line is one command. Nothing is chained with `&&`, so it works in **macOS Terminal, Linux bash, and Windows PowerShell / VS Code terminal**.

You need **Node.js 18 or newer** and **git**. Check:

```
node -v
npm -v
git --version
```

If `node -v` prints 18 or higher, you're ready. If not, install the LTS from <https://nodejs.org>.

---

## 1 · Extract and open

Extract the zip, then open the folder **`boomerang-itch-solver-zero`** in VS Code:

- VS Code → **File → Open Folder…** → pick `boomerang-itch-solver-zero`
- Then open the terminal inside VS Code: **Terminal → New Terminal** (or <kbd>Ctrl</kbd>+<kbd>`</kbd>)

Confirm you are in the right place — this must print `README.md web docs`:

```
ls
```

---

## 2 · Install

```
cd web
npm install
```

Takes 20–60 seconds. You should see:

```
added 135 packages, and audited 136 packages in 2s
5 vulnerabilities (4 moderate, 1 high)
```

That warning is expected and it is **not in your website**. All five come from build-time tooling (`esbuild` inside Vite's dev server, and a PostCSS parser inside Tailwind). None of it is part of the built output — `site/` is plain HTML, CSS and JS with no server. Patching them requires jumping to Vite 8 and Tailwind 4, which would break this codebase.

> ⚠️ **Do not run `npm audit fix --force`.** It will upgrade Vite and Tailwind past this project's major versions and the build will stop working. `npm audit fix` without `--force` is harmless (it will do nothing here).

> **Windows only**, if PowerShell blocks npm with *"npm.ps1 cannot be loaded because running scripts is disabled"*, run this once in the same terminal and start over:
> ```
> Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
> ```

---

## 3 · Run it

```
npm run dev
```

Vite prints something like:

```
  VITE v5.4.21  ready in 312 ms
  ➜  Local:   http://localhost:3000/
  ➜  Network: http://192.168.1.x:3000/
```

Open **http://localhost:3000** in your browser.

Leave this terminal running. If port 3000 is already busy, Vite prints a different number (`3001`) — use whichever URL it prints.

---

## 4 · Check it actually works

**Page 1 — the landing page** at <http://localhost:3000>

- "Build lasting relationships." in a serif face
- A video of a building playing behind it, then an animated version takes over
- The panel at the bottom with `01 / Conversational`, `02 / Connected`, `03 / Compliant`

**Page 2 — the engine** at <http://localhost:3000/app.html>

1. Click **API key** (top right)
2. Turn on **Demo mode (no key)** — the toggle
3. Click **Save**
4. Paste any problem, e.g. `Tier-2 hospital OPD queues waste half a day for every patient.`
5. Click **Run the 4-agent pipeline**

Watch the four agents turn green, then hit **Download boilerplate ZIP**. You should get a `.zip` with **14 files** (`package.json`, `server/index.js`, `db/schema.sql`, `api/openapi.yaml`, …).

That whole path uses **no API key and no internet**. If it works, the project works.

**Now test the real thing.** Click **API key** again → turn demo mode **off** → pick a provider → paste your own key → **Save** → **Test connection** → run again. That is the bring-your-own-key path.

> Paste a real key only into your own browser. Never commit it. There is no key in this repo.

---

## 5 · Stop the server

Click into the terminal and press:

<kbd>Ctrl</kbd> + <kbd>C</kbd>

---

## 6 · Build the production version

```
npm run build
```

Expected output ends with:

```
../site/app.html    1.69 kB
../site/index.html  1.85 kB
✓ built in ~3s
```

The built site lands in `site/` (one level up from `web/`). Preview it with:

```
npm run preview
```

---

## 7 · Create your GitHub repo

First go to <https://github.com/new> and create an **empty** repo named `itch-solver-zero`.
**Do not** tick "Add a README", ".gitignore" or "license" — an empty repo makes the first push conflict-free.

Then, in the VS Code terminal:

```
cd ..
```

```
git init
```

```
git add .
```

```
git commit -m "feat: Boomerang landing page + ITCH-SOLVER ZERO engine"
```

```
git branch -M main
```

```
git remote add origin https://github.com/YOUR-USERNAME/itch-solver-zero.git
```

> Replace `YOUR-USERNAME` with your GitHub username. The repo in this example is `https://github.com/Sohan1606/itch-solver-zero.git`.

```
git push -u origin main
```

GitHub will ask you to authenticate. Use a **Personal Access Token** as the password, not your account password: <https://github.com/settings/tokens> → *Generate new token (classic)* → tick `repo` → copy it → paste it when it asks for a password.

---

## 8 · Verify what you pushed

Open your repo page and check:

- `web/`, `README.md`, `LICENSE`, `START-HERE.md` are there
- **`node_modules/` is NOT there** — if it is, your `.gitignore` did not apply; run `git rm -r --cached node_modules` then commit again
- **`site/` is NOT there**
- there is **no** `index.html` at the repo root

---

## Common problems

| Symptom | Fix |
|---|---|
| `npm: command not found` | Node.js is not installed, or the terminal needs restarting after install |
| `npm.ps1 cannot be loaded` (Windows) | `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` |
| `EADDRINUSE` | Port 3000 is busy — Vite auto-picks 3001; use the URL it prints. Or stop the other app. |
| Blank white page | Hard refresh: <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>R</kbd> (<kbd>Cmd</kbd>+<kbd>Shift</kbd>+<kbd>R</kbd> on Mac) |
| Hero video does not play | Needs internet for the CloudFront clip; offline it falls back to the bundled `web/public/assets/hero.mp4` |
| Engine says *network blocked* | That provider refuses browser calls — run `npm run proxy` in a second terminal and switch Route to **Local proxy** in Settings |
| `git push` rejected | You created the repo with a README. Run `git pull origin main --allow-unrelated-histories` then push again |

---

## What is in this folder

```
boomerang-itch-solver-zero/
├── START-HERE.md   ← you are here
├── README.md       full documentation
├── LICENSE         MIT — fork it, ship it
└── web/            the entire site
    ├── index.html  landing page
    ├── app.html    the engine
    ├── server/     optional CORS proxy
    ├── public/     fonts + hero video fallback
    └── src/        React + TypeScript source
```

That is everything. There are no build artifacts, no dependencies and no secrets in this folder — `npm install` recreates the dependencies and `npm run build` recreates `site/`.

There is deliberately **no `index.html` at the root** — if there were, GitHub Pages would serve that instead of the real site.
