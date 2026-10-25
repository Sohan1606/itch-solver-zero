import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Logo from '../components/Logo'
import Pipeline from './components/Pipeline'
import Results from './components/Results'
import SettingsDialog from './components/SettingsDialog'
import { SAMPLE_PROBLEMS } from './lib/demo'
import { runPipeline } from './lib/engine'
import { getProvider } from './lib/providers'
import { loadProblem, loadSettings, saveProblem, saveSettings } from './lib/storage'
import type { AgentState, RunArtifacts, Settings } from './lib/types'

const VERTICALS = [
  'Auto-detect',
  'Healthcare ops',
  'Fintech · Compliance',
  'ClimateTech · PropTech',
  'E-commerce · Risk',
  'Logistics · Mobility',
  'Education · Skilling',
  'General consumer',
]

const freshAgents = (): AgentState[] => [
  { id: 1, title: '', subtitle: '', status: 'queued', stream: '' },
  { id: 2, title: '', subtitle: '', status: 'queued', stream: '' },
  { id: 3, title: '', subtitle: '', status: 'queued', stream: '' },
  { id: 4, title: '', subtitle: '', status: 'queued', stream: '' },
]

export default function App() {
  const [settings, setSettings] = useState<Settings>(() => loadSettings())
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [problem, setProblem] = useState<string>(() => loadProblem())
  const [vertical, setVertical] = useState(VERTICALS[0])
  const [agents, setAgents] = useState<AgentState[]>(freshAgents)
  const [artifacts, setArtifacts] = useState<RunArtifacts | null>(null)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const provider = useMemo(() => getProvider(settings.providerId), [settings.providerId])
  const keyMissing = !settings.demoMode && provider.id !== 'ollama' && !settings.apiKey.trim()
  const configured = settings.demoMode || provider.id === 'ollama' || Boolean(settings.apiKey.trim())

  const statusLabel = settings.demoMode
    ? 'Demo mode · no API calls'
    : configured
      ? `${provider.name} · ${settings.model}`
      : 'No API key yet'

  const persist = useCallback((next: Settings) => {
    setSettings(next)
    saveSettings(next)
  }, [])

  const run = useCallback(async () => {
    if (running) return
    if (!problem.trim() || problem.trim().length < 12) {
      setError('Describe the frustration in at least a sentence — that is the only input the agents get.')
      return
    }
    if (!configured) {
      setSettingsOpen(true)
      return
    }

    setError(null)
    setArtifacts(null)
    setAgents(freshAgents())
    setRunning(true)
    saveProblem(problem)

    const controller = new AbortController()
    abortRef.current = controller

    try {
      await runPipeline({
        problem: problem.trim(),
        vertical: vertical === 'Auto-detect' ? 'Auto-detect' : vertical,
        settings,
        signal: controller.signal,
        onEvent: (event) => {
          setAgents((current) => {
            const next = current.map((agent) => ({ ...agent }))
            if (event.type === 'agent-start') {
              const agent = next.find((item) => item.id === event.id)
              if (agent) agent.status = 'running'
            }
            if (event.type === 'agent-token') {
              const agent = next.find((item) => item.id === event.id)
              if (agent) agent.stream += event.text
            }
            if (event.type === 'agent-done') {
              const agent = next.find((item) => item.id === event.id)
              if (agent) {
                agent.status = 'done'
                agent.ms = event.ms
              }
            }
            if (event.type === 'agent-error') {
              const agent = next.find((item) => item.id === event.id)
              if (agent) {
                agent.status = 'error'
                agent.error = event.message
              }
            }
            return next
          })

          if (event.type === 'build-done') setArtifacts(event.artifacts)
        },
      })
    } catch (caught) {
      if ((caught as Error).name !== 'AbortError') {
        setError((caught as Error).message)
      }
    } finally {
      setRunning(false)
      abortRef.current = null
      setAgents((current) =>
        current.map((agent) => (agent.status === 'running' ? { ...agent, status: 'error', error: agent.error ?? 'Stopped' } : agent)),
      )
    }
  }, [configured, problem, running, settings, vertical])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault()
        void run()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [run])

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3.5 sm:px-8">
          <a href="/" className="flex items-center gap-2.5">
            <Logo className="h-5 w-5 text-[#191919]" />
            <span className="text-sm font-semibold tracking-tight text-[#191919]">Boomerang</span>
            <span className="hidden text-xs text-[#191919]/35 sm:inline">/ ITCH-SOLVER ZERO</span>
          </a>

          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-2 rounded-full border border-gray-200 px-3 py-1.5 text-[11px] text-[#191919]/60 sm:flex">
              <span className={`h-1.5 w-1.5 rounded-full ${configured ? 'bg-green-500' : 'bg-amber-500'}`} />
              {statusLabel}
            </span>
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              className="rounded-lg border border-gray-200 px-3.5 py-2 text-xs text-[#191919]/70 transition-colors hover:bg-[#F4F3F3] hover:text-[#191919]"
            >
              API key
            </button>
            <a
              href="/"
              className="hidden rounded-lg px-3 py-2 text-xs text-[#191919]/50 transition-colors hover:text-[#191919] sm:block"
            >
              ← Site
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 pb-24 pt-10 sm:px-8">
        {/* Intro */}
        <div className="max-w-2xl">
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#191919]/40">The engine</p>
          <h1 className="mt-3 font-serif text-4xl leading-[1.08] tracking-tight text-[#191919] sm:text-5xl">
            One frustration in.
            <br />
            A working MVP out.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-[#191919]/60 sm:text-base">
            Four agents decompose the problem, score the market, design the system, and write the
            boilerplate. Bring your own model key — it stays in this browser.
          </p>
        </div>

        {/* Run grid */}
        <div className="mt-10 grid gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
          {/* Input */}
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <label htmlFor="problem" className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#191919]/50">
                The itch
              </label>
              <span className="font-mono text-[10px] text-[#191919]/35">{problem.length}/1200</span>
            </div>

            <textarea
              id="problem"
              value={problem}
              maxLength={1200}
              onChange={(event) => setProblem(event.target.value)}
              placeholder="e.g. My society’s water tanker never arrives on time and nobody in the WhatsApp group knows when it will."
              className="mt-2 h-36 w-full resize-y rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm leading-relaxed text-[#191919] outline-none placeholder:text-[#191919]/30 focus:border-[#191919]/40"
            />

            <div className="mt-2 flex flex-wrap gap-1.5">
              {SAMPLE_PROBLEMS.map((sample) => (
                <button
                  key={sample.label}
                  type="button"
                  onClick={() => {
                    setProblem(sample.quote)
                    setVertical(sample.vertical)
                  }}
                  className="rounded-full border border-gray-200 px-2.5 py-1 text-[11px] text-[#191919]/60 transition-colors hover:border-[#191919]/30 hover:text-[#191919]"
                >
                  {sample.label}
                </button>
              ))}
            </div>

            <div className="mt-4">
              <label htmlFor="vertical" className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#191919]/50">
                Vertical
              </label>
              <select
                id="vertical"
                value={vertical}
                onChange={(event) => setVertical(event.target.value)}
                className="mt-1.5 w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-[#191919] outline-none focus:border-[#191919]/40"
              >
                {VERTICALS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => void run()}
              disabled={running}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-[#191919] px-5 py-3.5 text-sm font-medium text-white transition-colors hover:bg-[#191919]/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {running ? 'Agents working…' : keyMissing ? 'Add an API key to run' : 'Run the 4-agent pipeline'}
              {!running && <span className="hidden font-mono text-[10px] opacity-50 sm:inline">⌘↵</span>}
            </button>

            {running && (
              <button
                type="button"
                onClick={() => abortRef.current?.abort()}
                className="mt-2 w-full rounded-lg border border-gray-200 px-4 py-2 text-xs text-[#191919]/60 transition-colors hover:bg-[#F4F3F3] hover:text-[#191919]"
              >
                Stop
              </button>
            )}

            <p className="mt-3 text-[11px] leading-relaxed text-[#191919]/45">
              {settings.demoMode
                ? 'Demo mode is on — the deterministic engine runs locally, no key, no network.'
                : keyMissing
                  ? 'Add a key from OpenAI, Anthropic, Gemini, Groq, OpenRouter or any OpenAI-compatible endpoint.'
                  : 'Your key never leaves this browser except to call the provider you selected.'}
            </p>

            {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs leading-relaxed text-red-700">{error}</p>}
          </div>

          <Pipeline agents={agents} running={running} error={error} />
        </div>

        {/* Results */}
        {artifacts && (
          <div className="mt-6">
            <Results artifacts={artifacts} />
          </div>
        )}

        {/* Footer */}
        <footer className="mt-16 flex flex-col gap-2 border-t border-gray-200 pt-6 text-[11px] text-[#191919]/40 sm:flex-row sm:items-center sm:justify-between">
          <p>ITCH-SOLVER ZERO · your keys, your browser, your build. Nothing is sent anywhere else.</p>
          <p className="font-mono">MIT · zero-core</p>
        </footer>
      </main>

      <SettingsDialog
        open={settingsOpen}
        settings={settings}
        onClose={() => setSettingsOpen(false)}
        onSave={persist}
      />
    </div>
  )
}
