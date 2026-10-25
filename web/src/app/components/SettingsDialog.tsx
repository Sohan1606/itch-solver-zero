import { useEffect, useMemo, useState } from 'react'
import { PROVIDERS, getProvider, testConnection } from '../lib/providers'
import type { Settings } from '../lib/types'

type Props = {
  open: boolean
  settings: Settings
  onClose: () => void
  onSave: (settings: Settings) => void
}

export default function SettingsDialog({ open, settings, onClose, onSave }: Props) {
  const [draft, setDraft] = useState<Settings>(settings)
  const [showKey, setShowKey] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null)

  useEffect(() => {
    if (open) {
      setDraft(settings)
      setTestResult(null)
      setShowKey(false)
    }
  }, [open, settings])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const provider = useMemo(() => getProvider(draft.providerId), [draft.providerId])
  const isCustom = provider.id === 'custom'
  const isLocal = provider.id === 'ollama'
  const needsKey = !isLocal

  if (!open) return null

  const patch = (next: Partial<Settings>) => setDraft((current) => ({ ...current, ...next }))

  const onProviderChange = (providerId: string) => {
    const next = getProvider(providerId)
    patch({ providerId, model: next.defaultModel, baseUrl: next.id === 'custom' ? draft.baseUrl : '' })
    setTestResult(null)
  }

  const runTest = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const reply = await testConnection(draft)
      setTestResult({ ok: true, message: `Connected — model replied “${reply.slice(0, 40)}”` })
    } catch (error) {
      setTestResult({ ok: false, message: (error as Error).message })
    } finally {
      setTesting(false)
    }
  }

  const save = () => {
    onSave({ ...draft, demoMode: draft.demoMode })
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-[#191919]/30 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-2xl bg-white p-6 shadow-2xl sm:rounded-2xl sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="settings-title" className="font-serif text-2xl tracking-tight text-[#191919]">
              Connect your model
            </h2>
            <p className="mt-1 text-sm text-[#191919]/60">
              Your key is stored only in this browser and is sent only to the provider you pick.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings"
            className="rounded-lg border border-gray-200 px-2.5 py-1 text-sm text-[#191919]/60 transition-colors hover:bg-[#F4F3F3] hover:text-[#191919]"
          >
            ✕
          </button>
        </div>

        <div className="mt-6 space-y-5">
          <div>
            <label htmlFor="provider" className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#191919]/50">
              Provider
            </label>
            <select
              id="provider"
              value={draft.providerId}
              onChange={(event) => onProviderChange(event.target.value)}
              className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-[#191919] outline-none focus:border-[#191919]/40"
            >
              {PROVIDERS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
            {provider.note && <p className="mt-2 text-xs leading-relaxed text-[#191919]/50">{provider.note}</p>}
          </div>

          <div>
            <div className="flex items-end justify-between gap-3">
              <label htmlFor="apiKey" className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#191919]/50">
                API key {needsKey ? '' : '(not required)'}
              </label>
              {provider.docsUrl && (
                <a
                  href={provider.docsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-[#191919]/60 underline-offset-2 hover:text-[#191919] hover:underline"
                >
                  Get a key ↗
                </a>
              )}
            </div>
            <div className="mt-2 flex gap-2">
              <input
                id="apiKey"
                type={showKey ? 'text' : 'password'}
                value={draft.apiKey}
                onChange={(event) => patch({ apiKey: event.target.value })}
                placeholder={provider.keyHint}
                spellCheck={false}
                autoComplete="off"
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 font-mono text-sm text-[#191919] outline-none focus:border-[#191919]/40"
              />
              <button
                type="button"
                onClick={() => setShowKey((value) => !value)}
                className="shrink-0 rounded-lg border border-gray-200 px-3 text-xs text-[#191919]/60 transition-colors hover:bg-[#F4F3F3] hover:text-[#191919]"
              >
                {showKey ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {isCustom && (
            <div>
              <label htmlFor="baseUrl" className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#191919]/50">
                Base URL
              </label>
              <input
                id="baseUrl"
                value={draft.baseUrl}
                onChange={(event) => patch({ baseUrl: event.target.value })}
                placeholder="https://your-gateway.example.com/v1"
                spellCheck={false}
                className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 font-mono text-sm outline-none focus:border-[#191919]/40"
              />
            </div>
          )}

          <div>
            <label htmlFor="model" className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#191919]/50">
              Model
            </label>
            {provider.models.length > 0 ? (
              <select
                id="model"
                value={draft.model}
                onChange={(event) => patch({ model: event.target.value })}
                className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#191919]/40"
              >
                {provider.models.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id="model"
                value={draft.model}
                onChange={(event) => patch({ model: event.target.value })}
                placeholder="model-name"
                spellCheck={false}
                className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 font-mono text-sm outline-none focus:border-[#191919]/40"
              />
            )}
          </div>

          <div>
            <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#191919]/50">Request route</span>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {(['direct', 'proxy'] as const).map((route) => (
                <button
                  key={route}
                  type="button"
                  onClick={() => patch({ route })}
                  className={`rounded-lg border px-3 py-2.5 text-left text-xs transition-colors ${
                    draft.route === route
                      ? 'border-[#191919] bg-[#191919] text-white'
                      : 'border-gray-200 text-[#191919]/70 hover:bg-[#F4F3F3]'
                  }`}
                >
                  <span className="block font-medium">{route === 'direct' ? 'Browser (direct)' : 'Local proxy'}</span>
                  <span className={`mt-0.5 block text-[11px] ${draft.route === route ? 'text-white/70' : 'text-[#191919]/45'}`}>
                    {route === 'direct' ? 'No server needed' : 'npm run proxy · :8787'}
                  </span>
                </button>
              ))}
            </div>
            {draft.route === 'proxy' && (
              <>
                <input
                  id="proxyUrl"
                  value={draft.proxyUrl}
                  onChange={(event) => patch({ proxyUrl: event.target.value })}
                  spellCheck={false}
                  className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 font-mono text-xs outline-none focus:border-[#191919]/40"
                />
                <input
                  id="proxyToken"
                  value={draft.proxyToken}
                  onChange={(event) => patch({ proxyToken: event.target.value })}
                  placeholder="Proxy token (optional — only if PROXY_TOKEN is set)"
                  spellCheck={false}
                  className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 font-mono text-xs outline-none focus:border-[#191919]/40"
                />
              </>
            )}
          </div>

          <div className="flex items-center justify-between gap-4 rounded-lg bg-[#F4F3F3] px-4 py-3">
            <div>
              <p className="text-sm font-medium text-[#191919]">Demo mode (no key)</p>
              <p className="text-xs text-[#191919]/55">Run the deterministic engine — instant, offline, no API calls.</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={draft.demoMode}
              onClick={() => patch({ demoMode: !draft.demoMode })}
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                draft.demoMode ? 'bg-[#191919]' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
                  draft.demoMode ? 'left-[22px]' : 'left-0.5'
                }`}
              />
            </button>
          </div>

          {testResult && (
            <p
              className={`rounded-lg px-3 py-2 text-xs leading-relaxed ${
                testResult.ok ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-700'
              }`}
            >
              {testResult.message}
            </p>
          )}
        </div>

        <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={runTest}
            disabled={testing || (!isLocal && !draft.apiKey.trim()) || draft.demoMode}
            className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-[#191919]/70 transition-colors hover:bg-[#F4F3F3] hover:text-[#191919] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {testing ? 'Testing…' : 'Test connection'}
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2.5 text-sm text-[#191919]/60 transition-colors hover:text-[#191919]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={save}
              className="rounded-lg bg-[#191919] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#191919]/90"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
