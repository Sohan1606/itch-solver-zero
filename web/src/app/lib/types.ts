/** Shared contracts for the ITCH-SOLVER ZERO engine. */

export type ProviderKind = 'openai' | 'anthropic' | 'gemini'

export type Provider = {
  id: string
  name: string
  kind: ProviderKind
  /** Base URL used for browser / proxy requests. */
  baseUrl: string
  models: string[]
  defaultModel: string
  /** Where the user gets a key. */
  docsUrl: string
  keyHint: string
  /**
   * CORS posture for direct-from-browser calls.
   * 'blocks' providers need the bundled local proxy (npm run proxy).
   */
  cors: 'ok' | 'blocks' | 'unknown'
  note?: string
}

export type Settings = {
  providerId: string
  apiKey: string
  model: string
  /** Only used by the "custom" provider. */
  baseUrl: string
  /** 'direct' calls the provider from the browser; 'proxy' routes via :8787. */
  route: 'direct' | 'proxy'
  proxyUrl: string
  /** Optional shared secret; must match PROXY_TOKEN on the proxy server. */
  proxyToken: string
  temperature: number
  demoMode: boolean
}

export type RootCause = {
  bottleneck: string
  drivers: string[]
  noise: string
  signal: string
  sentiment: { frustration: number; urgency: number; fatigue: number }
}

export type Score = {
  verdict: string
  verdictText: string
  severity: number
  frequency: number
  whitespace: number
  wtp: number
  feasibility: number
  tam: { value: string; market: string; sam: string; pen: string }
  wtpBand: string
  ninety: string
  systemicLine: string
}

export type SchemaColumn = { name: string; type: string; key?: string }
export type SchemaTable = { name: string; purpose: string; columns: SchemaColumn[] }
export type Endpoint = { method: string; path: string; description: string; sample?: string }
export type FlowNode = { name: string; tech: string; role: string }
export type StackLayer = { layer: string; choice: string }

export type Arch = {
  stack: StackLayer[]
  tables: SchemaTable[]
  endpoints: Endpoint[]
  flow: FlowNode[]
  moat: string
  risks: string[]
  notes: string
}

export type Business = {
  verdict: string
  rows: { label: string; value: string }[]
  wedge: { window: string; move: string }[]
  whyNow: string
}

export type GeneratedFile = { path: string; content: string }

export type RunArtifacts = {
  problem: string
  vertical: string
  createdAt: string
  model: string
  root: RootCause
  score: Score
  arch: Arch
  business: Business
  files: GeneratedFile[]
  /** Raw model output per agent, for debugging / copy. */
  raw: { a1: string; a2: string; a3: string; a4: string }
}

export type AgentId = 1 | 2 | 3 | 4

export type AgentState = {
  id: AgentId
  title: string
  subtitle: string
  status: 'queued' | 'running' | 'done' | 'error'
  stream: string
  error?: string
  ms?: number
}

export type PipelineEvent =
  | { type: 'agent-start'; id: AgentId }
  | { type: 'agent-token'; id: AgentId; text: string }
  | { type: 'agent-done'; id: AgentId; ms: number }
  | { type: 'agent-error'; id: AgentId; message: string }
  | { type: 'build-done'; artifacts: RunArtifacts }
