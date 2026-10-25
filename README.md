# Boomerang × ITCH-SOLVER ZERO

**A real, working website.** Two pages, one idea: Razorpay catalogued India's itches — this is the scratch.

| Page | What it is |
|---|---|
| `/` | **Boomerang** — a conversational-AI marketing site for financial institutions. P22 Mackinac + Inter, white `#FFFFFF`, ink `#191919`, panel `#F4F3F3`. |
| `/app.html` | **ITCH-SOLVER ZERO** — a four-agent engine that takes one human frustration and returns a scored, architected, downloadable MVP scaffold. **Bring your own API key.** |

No mockups. No fake data paths. Clone it, add a key, and it works for you.

[![React 18](https://img.shields.io/badge/React-18-191919)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-191919)](https://www.typescriptlang.org)
[![Vite 5](https://img.shields.io/badge/Vite-5-191919)](https://vitejs.dev)
[![Tailwind 3](https://img.shields.io/badge/Tailwind-3-191919)](https://tailwindcss.com)
[![License MIT](https://img.shields.io/badge/License-MIT-191919)](./LICENSE)

---

## Quickstart

> **Got the zip?** Open [`START-HERE.md`](./START-HERE.md) instead — it is the same steps with exact copy-paste commands for macOS, Linux and Windows, plus the GitHub push.

```bash
cd web
npm install
npm run dev          # → http://localhost:3000
```

That's it. The landing page runs with zero configuration, and the engine page runs immediately in **demo mode** — a deterministic local engine, no key, no network, no cost.

```bash
npm run build        # typecheck + production build → ../site
npm run preview      # serve the built output on :3000
npm run proxy        # optional local CORS proxy on :8787
```

> **Node 18+** required (the proxy uses global `fetch`). Verified on Node 20.

---

## Bring your own API key

The engine has **no server and no database**. Your key lives in your browser's `localStorage` and is sent straight to the provider you picked. Nothing is proxied through a third party, nothing is committed, and there is no key in this repo — not even a placeholder one.

### 1. Pick a provider

Click **API key** in the app header → choose from:

| Provider | Default model | Browser-direct? |
|---|---|---|
| OpenRouter *(default)* | `openai/gpt-4o-mini` | ✅ |
| OpenAI | `gpt-4o-mini` | ✅ |
| Anthropic | `claude-sonnet-4-5` | ✅ sends its browser opt-in header |
| Google Gemini | `gemini-2.5-flash` | ✅ key goes in the query string, as Google requires |
| Groq | `llama-3.3-70b-versatile` | ✅ |
| DeepSeek | `deepseek-chat` | ⚠️ use the proxy if it blocks |
| Mistral | `mistral-large-latest` | ⚠️ use the proxy if it blocks |
| xAI | `grok-2-latest` | ⚠️ use the proxy if it blocks |
| Ollama *(local)* | `llama3.2` | ✅ `localhost:11434` |
| Custom | any OpenAI-compatible URL | ⚠️ depends on the server |

Each entry links to where you get the key and hints at the format.

### 2. Paste it in

**API key** → paste → **Save**. Use **Test connection** to confirm before you burn tokens on a run.

| Where the key goes | |
|---|---|
| Storage | `localStorage["itch-solver-zero.settings.v2"]`, your browser only |
| Sent to | the provider's own API, and nowhere else |
| In the repo | never — `.env` is git-ignored and no key is hardcoded anywhere |
| Clear it | Settings → erase the field → Save |

### 3. Or don't — use demo mode

Flip **Demo mode (no key)** in Settings. The four agents still run and still emit a real 14-file ZIP, using a deterministic local engine. It's the fastest way to see the whole pipeline, and it's what the trailer was filmed on.

### 4. If your provider blocks browsers (CORS)

Some endpoints refuse direct browser calls. If you see the red *network blocked* message, switch **Request route → Local proxy** and run:

```bash
npm run proxy        # http://localhost:8787/api/chat
```

The proxy is 126 lines of `node:http`. It forwards `{ url, headers, body }` to an allow-listed host, caps payloads at 4 MB, and stores nothing.

Configure it with environment variables — copy `web/.env.example` to `web/.env`:

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `8787` | Port to listen on |
| `PROXY_ORIGIN` | `*` | Restrict CORS to your deployed origin |
| `PROXY_TOKEN` | *(empty)* | Require a bearer token; paste the same value into the Settings dialog |

---

## How the engine works

Four agents, sequential, each one feeding the next. Every agent returns JSON only, and every response is normalised and clamped before it reaches the UI — a model that rambles or returns malformed JSON degrades instead of exploding.

| Agent | Job | Max tokens |
|---|---|---|
| **01 · Root cause & sentiment miner** | Strips emotional noise, isolates the systemic bottleneck, scores frustration / urgency / fatigue | 900 |
| **02 · Whitespace & TAM quantifier** | Severity index (0–100), frequency, market whitespace, TAM, willingness to pay, build/kill verdict | 1,100 |
| **03 · System architect** | Database schema, API contracts, stack, request flow, moat, risk register | 2,600 |
| **04 · Code scaffolder** | The actual boilerplate: files, contents, run commands | 3,000 |

You get back **`RunArtifacts`** — the root cause, the scorecard, the architecture, and a **ZIP of 14 files**:

```
package.json        server/index.js     db/schema.sql      db/seed.sql
api/openapi.yaml    web/index.html      docker-compose.yml Dockerfile
.env.example        .gitignore          LICENSE            README.md
ARCHITECTURE.md     itch.config.json
```

The model writes into a scaffold that already exists, so a lazy or truncated model call can never produce a worse file than the one we ship. A model file only wins if it is *strictly longer* than the scaffold version.

**Pipeline events** (`agent-start`, `agent-token`, `agent-done`, `agent-error`, `build-done`) drive the live UI. Streaming is used on the direct route; the proxy route returns whole bodies.

Press <kbd>⌘</kbd>+<kbd>↵</kbd> to run, **Stop** to abort via `AbortController`.

---

## Project structure

```
web/
├── index.html              landing entry
├── app.html                engine entry
├── server/proxy.mjs        optional CORS proxy (:8787)
├── public/
│   ├── assets/hero.mp4     local fallback for the hero video
│   └── fonts/              P22 Mackinac (woff2/ttf) + Inter variable
└── src/
    ├── main.tsx            landing bootstrap
    ├── App.tsx             landing page
    ├── components/         Navbar · Hero · Logo · BoomerangVideoBg
    ├── index.css           Tailwind layers, @font-face, reduced-motion guard
    └── app/
        ├── main.tsx        engine bootstrap
        ├── App.tsx         engine page
        ├── components/     SettingsDialog · Pipeline · Results
        └── lib/
            ├── types.ts    all shared contracts
            ├── providers.ts 10-provider registry, chat(), testConnection()
            ├── agents.ts   prompts A1–A4, parseJson, normalisers
            ├── engine.ts   runPipeline() — orchestration
            ├── generate.ts STORE ZIP writer + 14-file scaffold
            ├── demo.ts     deterministic engine
            └── storage.ts  guarded localStorage persistence
```

`npm run build` typechecks first (`tsc -b`), then emits to `../site`.

### Deploying

`web/` is a static site. After `npm run build`, upload `site/` anywhere — Cloudflare Pages, Netlify, Vercel, S3, nginx. No server, no runtime environment variables, no secrets.

- **Cloudflare Pages / Netlify:** build command `npm run build`, output directory `site`, root directory `web`.
- **Vercel:** framework *Vite*, root `web`, output `site`.
- **GitHub Pages:** push `site/` to `gh-pages`. Both pages are static, so clean URLs like `/app` work if your host rewrites extensions — plain `/app.html` works everywhere.

If you deploy the proxy too (only needed for CORS-blocked providers), set `PROXY_ORIGIN` to your site's origin and a `PROXY_TOKEN`.

---

## Tech stack

React 18 · TypeScript 5.6 (strict) · Vite 5 (multi-page) · Tailwind CSS 3 · `lucide-react` (`ArrowRight` is the only icon on the landing page). Fonts are **self-hosted** — no Google Fonts request, no FOUT, works offline. The hero video streams from CloudFront and falls back to `public/assets/hero.mp4` when the network is unavailable.

---

## Launch videos

A 15-second vertical Reel and a 31-second 16:9 trailer were produced for this launch. They are not part of the app — the site needs no video files beyond its own hero clip.

---

## Repo layout

```
.
├── START-HERE.md      step-by-step: run it, check it, push it
├── README.md          this file
├── LICENSE            MIT
└── web/               the entire site — landing page + engine
    ├── index.html     landing entry
    ├── app.html       engine entry
    ├── server/        optional CORS proxy (node, zero dependencies)
    ├── public/        self-hosted fonts + the local hero-video fallback
    └── src/           React + TypeScript source
```

`npm run build` writes to `site/` **next to** `web/`, never inside it. `site/` is git-ignored: it is a build artifact, not source.

There is deliberately no `index.html` at the repository root. If there were, GitHub Pages and most static hosts would serve that instead of the real site.

---

## License

MIT — see [LICENSE](./LICENSE). Fork it, ship it, sell it.

Built by [@Sohan1606](https://github.com/Sohan1606).
