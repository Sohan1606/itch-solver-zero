import type { Arch, Business, RootCause, Score } from './types'

export const AGENT_META = {
  1: {
    title: 'Root cause & sentiment miner',
    subtitle: 'Strips emotional noise, isolates the systemic bottleneck.',
    maxTokens: 900,
  },
  2: {
    title: 'Whitespace & TAM quantifier',
    subtitle: 'Scores severity, market size and willingness to pay.',
    maxTokens: 1100,
  },
  3: {
    title: 'System architect',
    subtitle: 'Schema, API contracts, stack and risks.',
    maxTokens: 2600,
  },
  4: {
    title: 'Code scaffolder',
    subtitle: 'Writes the production boilerplate.',
    maxTokens: 3000,
  },
} as const

const JSON_RULES = `Return ONLY a single valid JSON object. No markdown fences, no commentary before or after.
Use double quotes. No trailing commas. No ellipses or placeholders — every string must be real content.`

export const PROMPT_A1 = `You are Agent 01 — Root Cause & Sentiment Miner inside ITCH-SOLVER ZERO, a system that converts a real human frustration into a buildable product thesis.

Your job: strip the emotional noise from the complaint, find the SYSTEMIC bottleneck (a process or information failure, never "people are lazy"), and quantify the emotional drivers.

${JSON_RULES}

Schema:
{
  "bottleneck": "one sentence naming the systemic failure",
  "drivers": ["3 to 5 short bullet strings, each a concrete contributing cause"],
  "noise": "the emotional/venting part of the complaint, quoted or paraphrased",
  "signal": "what the complaint actually reveals once noise is removed",
  "sentiment": { "frustration": 0-100, "urgency": 0-100, "fatigue": 0-100 }
}`

export const PROMPT_A2 = `You are Agent 02 — Whitespace & TAM Quantifier inside ITCH-SOLVER ZERO.

You receive Agent 01's root-cause analysis. Score the opportunity like a skeptical early-stage investor, using realistic India-first market numbers.

${JSON_RULES}

Scoring rules:
- severity (0-100): how much pain per occurrence, weighted by cost and dignity.
- frequency (0-100): how often the affected person hits it.
- whitespace (0-100): how unprotected the space is by credible, affordable incumbents.
- wtp (0-100): willingness to pay, given who holds the budget.
- feasibility (0-100): how buildable a wedge MVP is by a team of 2 in 3 months.

Schema:
{
  "verdict": "BUILD — <short reason>" or "AVOID — <short reason>",
  "verdictText": "2-3 sentences of investor-grade reasoning",
  "severity": number, "frequency": number, "whitespace": number, "wtp": number, "feasibility": number,
  "tam": {
    "value": "₹X,XXX Cr",
    "market": "who and how many, e.g. 3.1L private clinics",
    "sam": "₹XXX Cr serviceable",
    "pen": "X% reachable in 24 months"
  },
  "wtpBand": "₹X–Y per <unit> / month",
  "ninety": "a number as string, e.g. \\"14\\"",
  "systemicLine": "one sentence restating the bottleneck as a market gap",
  "business": {
    "verdict": "one-line economic verdict",
    "rows": [{ "label": "Pricing", "value": "₹X / month" }, { "label": "ACV", "value": "₹X" }, { "label": "Gross margin", "value": "X%" }, { "label": "CAC", "value": "₹X" }, { "label": "Payback", "value": "X months" }, { "label": "Break-even", "value": "X accounts" }],
    "wedge": [{ "window": "Month 0–6", "move": "..." }, { "window": "Month 6–18", "move": "..." }, { "window": "Month 18–36", "move": "..." }],
    "whyNow": "2 sentences on the specific technology, regulation or behaviour that makes this possible today"
  }
}`

export const PROMPT_A3 = `You are Agent 03 — System Architect inside ITCH-SOLVER ZERO.

You receive the problem, the root cause and the market score. Design the smallest system that solves the bottleneck and can be built by two engineers in 12 weeks.

${JSON_RULES}

Hard rules:
- 4 to 6 tables. Every table needs a primary key. Foreign keys must reference a table that exists in your own output.
- 4 to 6 endpoints. Paths use :params (Express style). Include one POST /leads endpoint for pilot capture.
- Use boring, production-proven technology. No blockchain, no "AI agent swarm" unless the bottleneck genuinely needs it.
- Column types must be SQL types: uuid, text, integer, bigint, bigserial, numeric, boolean, timestamptz, date, time, jsonb.

Schema:
{
  "stack": [{ "layer": "Frontend", "choice": "Next.js 14 + Tailwind" }],
  "tables": [{ "name": "clinics", "purpose": "tenant root", "columns": [{ "name": "id", "type": "uuid", "key": "pk" }, { "name": "clinic_id", "type": "uuid", "key": "fk" }, { "name": "name", "type": "text" }] }],
  "endpoints": [{ "method": "POST", "path": "/v1/tokens", "description": "...", "sample": "{\\"id\\":\\"tkn_1\\"}" }],
  "flow": [{ "name": "Patient token", "tech": "SMS + QR", "role": "ingest" }],
  "moat": "2 sentences on the data or distribution advantage that compounds",
  "risks": ["2 to 4 concrete risks with the mitigation folded into the sentence"],
  "notes": "2-3 sentences on the key architectural decision and why"
}`

export const PROMPT_A4 = `You are Agent 04 — Code Scaffolder inside ITCH-SOLVER ZERO.

You receive the full architecture. Emit runnable boilerplate.

${JSON_RULES}

Hard rules:
- Return 4 to 6 files. Prefer quality over quantity.
- Always include: "server/index.js" (Express ES module, every endpoint implemented with realistic sample JSON responses), "db/schema.sql" (PostgreSQL 16, CREATE TABLE IF NOT EXISTS, PKs, FKs, indexes), and "README.md".
- Code must be syntactically valid and runnable with: npm install && npm start.
- Escape newlines properly inside JSON strings (\\n). No unescaped control characters.
- Do not wrap file contents in markdown fences.

Schema:
{
  "files": [{ "path": "server/index.js", "content": "..." }]
}`

/* ------------------------------------------------------------------ */
/* Lenient JSON parsing                                               */
/* ------------------------------------------------------------------ */

export function parseJson<T>(raw: string): T {
  let text = raw.trim()

  // Strip ```json fences if the model added them anyway.
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fence) text = fence[1].trim()

  // Take the outermost object literal.
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start !== -1 && end > start) text = text.slice(start, end + 1)

  const attempt = (candidate: string) => JSON.parse(candidate) as T

  try {
    return attempt(text)
  } catch {
    const repaired = text
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/,\s*([}\]])/g, '$1')
      .replace(/([{,]\s*)([A-Za-z_$][\w$]*)\s*:/g, '$1"$2":')
    try {
      return attempt(repaired)
    } catch (error) {
      throw new Error(
        `The model did not return parseable JSON (${(error as Error).message}). Try again, lower the temperature, or pick a stronger model.`,
      )
    }
  }
}

/* ------------------------------------------------------------------ */
/* Normalisers — keep the UI safe even if a model drifts              */
/* ------------------------------------------------------------------ */

const num = (value: unknown, fallback = 50) => {
  const parsed = typeof value === 'number' ? value : Number.parseFloat(String(value))
  return Number.isFinite(parsed) ? Math.max(0, Math.min(100, Math.round(parsed))) : fallback
}

const str = (value: unknown, fallback = '') =>
  typeof value === 'string' && value.trim() ? value.trim() : fallback

const arr = <T,>(value: unknown, fallback: T[] = []): T[] => (Array.isArray(value) ? (value as T[]) : fallback)

export function normaliseRoot(raw: unknown): RootCause {
  const data = (raw ?? {}) as Record<string, any>
  const sentiment = (data.sentiment ?? {}) as Record<string, unknown>
  return {
    bottleneck: str(data.bottleneck, 'The workflow has no shared system of record.'),
    drivers: arr<string>(data.drivers).map((d) => str(d)).filter(Boolean).slice(0, 6),
    noise: str(data.noise, ''),
    signal: str(data.signal, ''),
    sentiment: {
      frustration: num(sentiment.frustration, 75),
      urgency: num(sentiment.urgency, 70),
      fatigue: num(sentiment.fatigue, 65),
    },
  }
}

export function normaliseScore(raw: unknown): { score: Score; business: Business } {
  const data = (raw ?? {}) as Record<string, any>
  const tam = (data.tam ?? {}) as Record<string, unknown>
  const businessRaw = (data.business ?? {}) as Record<string, any>

  const score: Score = {
    verdict: str(data.verdict, 'BUILD — recurring pain with no owner'),
    verdictText: str(data.verdictText, ''),
    severity: num(data.severity, 78),
    frequency: num(data.frequency, 74),
    whitespace: num(data.whitespace, 72),
    wtp: num(data.wtp, 68),
    feasibility: num(data.feasibility, 80),
    tam: {
      value: str(tam.value, '₹1,200 Cr'),
      market: str(tam.market, 'target segment'),
      sam: str(tam.sam, '₹400 Cr serviceable'),
      pen: str(tam.pen, '10% reachable in 24 months'),
    },
    wtpBand: str(data.wtpBand, '₹499–1,499 / month'),
    ninety: str(data.ninety, '12'),
    systemicLine: str(data.systemicLine, ''),
  }

  const business: Business = {
    verdict: str(businessRaw.verdict, ''),
    rows: arr<Record<string, unknown>>(businessRaw.rows)
      .map((row) => ({ label: str(row.label), value: str(row.value) }))
      .filter((row) => row.label && row.value),
    wedge: arr<Record<string, unknown>>(businessRaw.wedge)
      .map((row) => ({ window: str(row.window), move: str(row.move) }))
      .filter((row) => row.move),
    whyNow: str(businessRaw.whyNow, ''),
  }

  return { score, business }
}

export function normaliseArch(raw: unknown): Arch {
  const data = (raw ?? {}) as Record<string, any>

  const tables = arr<Record<string, any>>(data.tables)
    .filter((table) => str(table?.name))
    .map((table) => ({
      name: str(table.name).replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase(),
      purpose: str(table.purpose, ''),
      columns: arr<Record<string, any>>(table.columns)
        .filter((column) => str(column?.name))
        .map((column) => ({
          name: str(column.name).replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase(),
          type: str(column.type, 'text').toLowerCase(),
          key: column.key === 'pk' || column.key === 'fk' ? String(column.key) : undefined,
        })),
    }))
    .filter((table) => table.columns.length > 0)

  const endpoints = arr<Record<string, any>>(data.endpoints)
    .filter((endpoint) => str(endpoint?.path))
    .map((endpoint) => ({
      method: str(endpoint.method, 'GET').toUpperCase(),
      path: str(endpoint.path).startsWith('/') ? str(endpoint.path) : `/${str(endpoint.path)}`,
      description: str(endpoint.description, ''),
      sample: str(endpoint.sample, ''),
    }))

  return {
    stack: arr<Record<string, unknown>>(data.stack)
      .map((layer) => ({ layer: str(layer.layer), choice: str(layer.choice) }))
      .filter((layer) => layer.layer && layer.choice),
    tables,
    endpoints,
    flow: arr<Record<string, unknown>>(data.flow)
      .map((node) => ({ name: str(node.name), tech: str(node.tech), role: str(node.role) }))
      .filter((node) => node.name),
    moat: str(data.moat, ''),
    risks: arr<string>(data.risks).map((risk) => str(risk)).filter(Boolean),
    notes: str(data.notes, ''),
  }
}
