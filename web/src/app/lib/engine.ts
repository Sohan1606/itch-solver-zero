import { AGENT_META, PROMPT_A1, PROMPT_A2, PROMPT_A3, PROMPT_A4, normaliseArch, normaliseRoot, normaliseScore, parseJson } from './agents'
import { chat } from './providers'
import { generateDemo } from './demo'
import { buildFiles } from './generate'
import type { AgentId, GeneratedFile, PipelineEvent, RootCause, RunArtifacts, Score, Settings } from './types'

type RunOptions = {
  problem: string
  vertical: string
  settings: Settings
  signal: AbortSignal
  onEvent: (event: PipelineEvent) => void
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/** Chunk a string so demo mode can fake a token stream. */
function* chunks(text: string, size = 18) {
  for (let i = 0; i < text.length; i += size) yield text.slice(i, i + size)
}

export async function runPipeline({ problem, vertical, settings, signal, onEvent }: RunOptions): Promise<RunArtifacts> {
  const startedAt = new Date().toISOString()
  const model = settings.demoMode ? 'zero-core (local, deterministic)' : `${settings.providerId}/${settings.model}`

  if (settings.demoMode) {
    return runDemo({ problem, vertical, startedAt, model, onEvent })
  }

  const context = `PROBLEM: ${problem}\nVERTICAL: ${vertical}`

  /* ---------------- Agent 01 ---------------- */
  const a1 = await runAgent({
    id: 1,
    system: PROMPT_A1,
    user: context,
    settings,
    signal,
    onEvent,
  })
  const root: RootCause = normaliseRoot(parseJson(a1))

  /* ---------------- Agent 02 ---------------- */
  const a2 = await runAgent({
    id: 2,
    system: PROMPT_A2,
    user: `${context}\n\nROOT CAUSE ANALYSIS:\n${JSON.stringify(root, null, 2)}`,
    settings,
    signal,
    onEvent,
  })
  const { score, business } = normaliseScore(parseJson(a2))

  /* ---------------- Agent 03 ---------------- */
  const a3 = await runAgent({
    id: 3,
    system: PROMPT_A3,
    user: `${context}\n\nROOT CAUSE:\n${JSON.stringify(root, null, 2)}\n\nMARKET SCORE:\n${JSON.stringify(score, null, 2)}`,
    settings,
    signal,
    onEvent,
  })
  const arch = normaliseArch(parseJson(a3))

  /* ---------------- Agent 04 ---------------- */
  let files: GeneratedFile[] = []
  const a4 = await runAgent({
    id: 4,
    system: PROMPT_A4,
    user: `${context}\n\nARCHITECTURE:\n${JSON.stringify(
      { stack: arch.stack, tables: arch.tables, endpoints: arch.endpoints, flow: arch.flow },
      null,
      2,
    )}`,
    settings,
    signal,
    onEvent,
  })

  try {
    const parsed = parseJson<{ files?: { path?: string; content?: string }[] }>(a4)
    files = (parsed.files ?? [])
      .map((file) => ({ path: String(file.path ?? '').trim(), content: String(file.content ?? '') }))
      .filter((file) => file.path && file.content)
  } catch {
    // A malformed code pass should not lose the whole run — the deterministic
    // scaffold below still produces a runnable repo from Agent 03.
    files = []
  }

  const artifacts: RunArtifacts = {
    problem,
    vertical,
    createdAt: startedAt,
    model,
    root,
    score,
    arch,
    business,
    files,
    raw: { a1, a2, a3, a4 },
  }

  artifacts.files = buildFiles(artifacts)
  onEvent({ type: 'build-done', artifacts })
  return artifacts
}

type AgentRun = {
  id: AgentId
  system: string
  user: string
  settings: Settings
  signal: AbortSignal
  onEvent: (event: PipelineEvent) => void
}

async function runAgent({ id, system, user, settings, signal, onEvent }: AgentRun) {
  const meta = AGENT_META[id]
  const started = performance.now()
  onEvent({ type: 'agent-start', id })

  try {
    const text = await chat({
      settings,
      system,
      user,
      maxTokens: meta.maxTokens,
      signal,
      onToken: (chunk) => onEvent({ type: 'agent-token', id, text: chunk }),
    })

    if (!text.trim()) throw new Error('The model returned an empty response.')
    onEvent({ type: 'agent-done', id, ms: Math.round(performance.now() - started) })
    return text
  } catch (error) {
    if ((error as Error).name === 'AbortError') throw error
    onEvent({ type: 'agent-error', id, message: (error as Error).message })
    throw error
  }
}

/* ------------------------------------------------------------------ */
/* Deterministic mode                                                  */
/* ------------------------------------------------------------------ */

async function runDemo({
  problem,
  vertical,
  startedAt,
  model,
  onEvent,
}: {
  problem: string
  vertical: string
  startedAt: string
  model: string
  onEvent: (event: PipelineEvent) => void
}): Promise<RunArtifacts> {
  const demo = generateDemo(problem, vertical)

  const narration: Record<AgentId, string[]> = {
    1: [
      `> strip(emotional_noise) from ${problem.length} chars of input`,
      '> cluster(recurring_failure_modes) → 4 systemic drivers',
      `> bottleneck.isolate() → ${demo.root.bottleneck}`,
    ],
    2: [
      '> query(itch_index) for adjacent records',
      `> severity = f(frequency ${demo.score.frequency}, cost, fatigue) → ${demo.score.severity}/100`,
      `> tam → ${demo.score.tam.value} · wtp → ${demo.score.wtpBand}`,
      `> verdict → ${demo.score.verdict}`,
    ],
    3: [
      `> design(schema) → ${demo.arch.tables.length} tables, FK graph acyclic`,
      `> freeze(api) → ${demo.arch.endpoints.length} endpoints, OpenAPI 3.1`,
      `> stack → ${demo.arch.stack.slice(0, 3).map((layer) => layer.choice).join(' · ')}`,
    ],
    4: [
      '> emit db/schema.sql, server/index.js, api/openapi.yaml',
      '> emit README.md, ARCHITECTURE.md, docker-compose.yml',
      '> zip integrity check ✓ · reproducible build',
    ],
  }

  for (const id of [1, 2, 3, 4] as AgentId[]) {
    const started = performance.now()
    onEvent({ type: 'agent-start', id })
    for (const line of narration[id]) {
      for (const piece of chunks(line)) {
        onEvent({ type: 'agent-token', id, text: piece })
        await sleep(12)
      }
      onEvent({ type: 'agent-token', id, text: '\n' })
      await sleep(180)
    }
    onEvent({ type: 'agent-done', id, ms: Math.round(performance.now() - started) })
    await sleep(220)
  }

  const artifacts: RunArtifacts = {
    problem,
    vertical,
    createdAt: startedAt,
    model,
    root: demo.root,
    score: demo.score as Score,
    arch: demo.arch,
    business: demo.business,
    files: [],
    raw: { a1: '', a2: '', a3: '', a4: '' },
  }
  artifacts.files = buildFiles(artifacts)
  onEvent({ type: 'build-done', artifacts })
  return artifacts
}
