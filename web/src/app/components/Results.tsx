import { useMemo, useState } from 'react'
import { buildArchitectureMd, buildOpenApi, buildSchemaSql, makeZip, slugify } from '../lib/generate'
import type { RunArtifacts } from '../lib/types'

type Props = {
  artifacts: RunArtifacts
}

const TABS = ['Overview', 'Architecture', 'Schema', 'API', 'Files'] as const
type Tab = (typeof TABS)[number]

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 4000)
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex items-baseline justify-between text-xs">
        <span className="text-[#191919]/60">{label}</span>
        <span className="font-mono text-[11px] text-[#191919]">{value}</span>
      </div>
      <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-[#F4F3F3]">
        <div className="h-full rounded-full bg-[#191919]" style={{ width: `${Math.max(2, Math.min(100, value))}%` }} />
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-gray-200 p-5">
      <h3 className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#191919]/40">{title}</h3>
      <div className="mt-3">{children}</div>
    </section>
  )
}

export default function Results({ artifacts }: Props) {
  const [tab, setTab] = useState<Tab>('Overview')
  const [copied, setCopied] = useState(false)
  const [activeFile, setActiveFile] = useState<string>(artifacts.files[0]?.path ?? '')

  const markdown = useMemo(() => buildArchitectureMd(artifacts), [artifacts])
  const schemaSql = useMemo(() => buildSchemaSql(artifacts.arch), [artifacts.arch])
  const openapi = useMemo(() => buildOpenApi(artifacts), [artifacts])
  const slug = useMemo(() => slugify(artifacts.problem), [artifacts.problem])

  const currentFile = artifacts.files.find((file) => file.path === activeFile) ?? artifacts.files[0]

  const copyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(markdown)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      download(new Blob([markdown], { type: 'text/markdown' }), `${slug}-architecture.md`)
    }
  }

  const { root, score, business, arch } = artifacts

  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-gray-200 px-5 py-5 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#191919]/40">Generated MVP</p>
            <h2 className="mt-1.5 font-serif text-2xl leading-tight tracking-tight text-[#191919]">{artifacts.problem}</h2>
            <p className="mt-1 text-xs text-[#191919]/50">
              {artifacts.vertical} · {artifacts.model} · {artifacts.files.length} files
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => download(makeZip(artifacts.files), `itch-solver-${slug}.zip`)}
              className="rounded-lg bg-[#191919] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#191919]/90"
            >
              Download boilerplate ZIP
            </button>
            <button
              type="button"
              onClick={copyMarkdown}
              className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-[#191919]/70 transition-colors hover:bg-[#F4F3F3] hover:text-[#191919]"
            >
              {copied ? 'Copied ✓' : 'Copy architecture MD'}
            </button>
            <button
              type="button"
              onClick={() => download(new Blob([JSON.stringify(artifacts, null, 2)], { type: 'application/json' }), `${slug}-run.json`)}
              className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-[#191919]/70 transition-colors hover:bg-[#F4F3F3] hover:text-[#191919]"
            >
              JSON
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="no-scrollbar -mb-5 flex gap-1 overflow-x-auto">
          {TABS.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => setTab(name)}
              className={`whitespace-nowrap border-b-2 px-3 pb-3 pt-1 text-xs transition-colors ${
                tab === name
                  ? 'border-[#191919] text-[#191919]'
                  : 'border-transparent text-[#191919]/45 hover:text-[#191919]/70'
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4 p-5 sm:p-6">
        {tab === 'Overview' && (
          <>
            <div className="grid gap-4 lg:grid-cols-[1.15fr_1fr]">
              <Section title="Root cause">
                <p className="font-serif text-lg leading-snug tracking-tight text-[#191919]">{root.bottleneck}</p>
                <ul className="mt-3 space-y-1.5">
                  {root.drivers.map((driver, index) => (
                    <li key={index} className="flex gap-2 text-xs leading-relaxed text-[#191919]/70">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#191919]/30" />
                      {driver}
                    </li>
                  ))}
                </ul>
                <div className="mt-4 grid gap-2 text-xs sm:grid-cols-2">
                  <p className="rounded-lg bg-[#F4F3F3] px-3 py-2 text-[#191919]/60">
                    <span className="block text-[10px] uppercase tracking-[0.14em] text-[#191919]/40">Noise stripped</span>
                    {root.noise || '—'}
                  </p>
                  <p className="rounded-lg bg-[#F4F3F3] px-3 py-2 text-[#191919]/60">
                    <span className="block text-[10px] uppercase tracking-[0.14em] text-[#191919]/40">Signal retained</span>
                    {root.signal || '—'}
                  </p>
                </div>
              </Section>

              <Section title="Market score">
                <div className="flex items-end gap-3">
                  <p className="font-serif text-5xl leading-none tracking-tight text-[#191919]">{score.severity}</p>
                  <div className="pb-1">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-[#191919]/40">Severity / 100</p>
                    <p className="text-sm font-medium text-[#191919]">{score.verdict}</p>
                  </div>
                </div>
                <p className="mt-3 text-xs leading-relaxed text-[#191919]/60">{score.verdictText}</p>
                <div className="mt-4 space-y-2.5">
                  <ScoreBar label="Frequency" value={score.frequency} />
                  <ScoreBar label="Whitespace" value={score.whitespace} />
                  <ScoreBar label="Willingness to pay" value={score.wtp} />
                  <ScoreBar label="Build feasibility" value={score.feasibility} />
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg bg-[#F4F3F3] px-3 py-2">
                    <dt className="text-[10px] uppercase tracking-[0.14em] text-[#191919]/40">TAM</dt>
                    <dd className="mt-0.5 font-medium text-[#191919]">{score.tam.value}</dd>
                  </div>
                  <div className="rounded-lg bg-[#F4F3F3] px-3 py-2">
                    <dt className="text-[10px] uppercase tracking-[0.14em] text-[#191919]/40">Willing to pay</dt>
                    <dd className="mt-0.5 font-medium text-[#191919]">{score.wtpBand}</dd>
                  </div>
                  <div className="rounded-lg bg-[#F4F3F3] px-3 py-2">
                    <dt className="text-[10px] uppercase tracking-[0.14em] text-[#191919]/40">Serviceable</dt>
                    <dd className="mt-0.5 text-[#191919]/80">{score.tam.sam}</dd>
                  </div>
                  <div className="rounded-lg bg-[#F4F3F3] px-3 py-2">
                    <dt className="text-[10px] uppercase tracking-[0.14em] text-[#191919]/40">Reach</dt>
                    <dd className="mt-0.5 text-[#191919]/80">{score.tam.pen}</dd>
                  </div>
                </dl>
              </Section>
            </div>

            <Section title="Business case">
              <p className="text-sm leading-relaxed text-[#191919]/75">{business.verdict}</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {business.rows.map((row) => (
                  <div key={row.label} className="rounded-lg border border-gray-200 px-3 py-2">
                    <p className="text-[10px] uppercase tracking-[0.14em] text-[#191919]/40">{row.label}</p>
                    <p className="mt-0.5 text-sm font-medium text-[#191919]">{row.value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {business.wedge.map((step) => (
                  <div key={step.window} className="rounded-lg bg-[#F4F3F3] px-3 py-2">
                    <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#191919]/50">{step.window}</p>
                    <p className="mt-1 text-xs leading-relaxed text-[#191919]/75">{step.move}</p>
                  </div>
                ))}
              </div>
              {business.whyNow && <p className="mt-3 text-xs leading-relaxed text-[#191919]/55">Why now: {business.whyNow}</p>}
            </Section>
          </>
        )}

        {tab === 'Architecture' && (
          <div className="grid gap-4 lg:grid-cols-2">
            <Section title="Stack">
              <ul className="space-y-1.5">
                {arch.stack.map((layer) => (
                  <li key={layer.layer} className="flex justify-between gap-4 border-b border-gray-100 pb-1.5 text-xs last:border-0">
                    <span className="text-[#191919]/50">{layer.layer}</span>
                    <span className="text-right font-medium text-[#191919]">{layer.choice}</span>
                  </li>
                ))}
              </ul>
            </Section>
            <Section title="Request flow">
              <ol className="space-y-2">
                {arch.flow.map((node, index) => (
                  <li key={node.name} className="flex items-start gap-2 text-xs">
                    <span className="mt-0.5 font-mono text-[10px] text-[#191919]/35">0{index + 1}</span>
                    <span>
                      <span className="font-medium text-[#191919]">{node.name}</span>
                      <span className="text-[#191919]/45"> · {node.tech} · {node.role}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </Section>
            <Section title="Moat">
              <p className="text-sm leading-relaxed text-[#191919]/75">{arch.moat || '—'}</p>
              {arch.notes && <p className="mt-3 text-xs leading-relaxed text-[#191919]/55">{arch.notes}</p>}
            </Section>
            <Section title="Risks">
              <ul className="space-y-2">
                {arch.risks.map((risk, index) => (
                  <li key={index} className="flex gap-2 text-xs leading-relaxed text-[#191919]/70">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-amber-500" />
                    {risk}
                  </li>
                ))}
              </ul>
            </Section>
          </div>
        )}

        {tab === 'Schema' && (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {arch.tables.map((table) => (
                <div key={table.name} className="rounded-lg border border-gray-200">
                  <div className="flex items-baseline justify-between gap-2 border-b border-gray-200 bg-[#F4F3F3] px-3 py-2">
                    <span className="font-mono text-xs text-[#191919]">{table.name}</span>
                    <span className="truncate text-[10px] text-[#191919]/40">{table.purpose}</span>
                  </div>
                  <ul className="divide-y divide-gray-100">
                    {table.columns.map((column) => (
                      <li key={column.name} className="flex items-center justify-between gap-2 px-3 py-1.5 font-mono text-[11px]">
                        <span className="text-[#191919]/80">{column.name}</span>
                        <span className="flex items-center gap-1.5">
                          <span className="text-[10px] text-[#191919]/35">{column.type}</span>
                          {column.key && (
                            <span className="rounded bg-[#191919]/8 px-1 text-[9px] uppercase text-[#191919]/60">{column.key}</span>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <pre className="no-scrollbar max-h-80 overflow-auto rounded-lg bg-[#F4F3F3] p-4 font-mono text-[11px] leading-relaxed text-[#191919]/80">
              {schemaSql}
            </pre>
          </>
        )}

        {tab === 'API' && (
          <>
            <ul className="space-y-2">
              {arch.endpoints.map((endpoint) => (
                <li key={`${endpoint.method} ${endpoint.path}`} className="rounded-lg border border-gray-200 px-3 py-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded bg-[#191919] px-1.5 py-0.5 font-mono text-[10px] text-white">{endpoint.method}</span>
                    <span className="font-mono text-xs text-[#191919]">{endpoint.path}</span>
                    <span className="text-[11px] text-[#191919]/45">{endpoint.description}</span>
                  </div>
                  {endpoint.sample && (
                    <pre className="mt-2 overflow-x-auto rounded bg-[#F4F3F3] px-3 py-2 font-mono text-[10.5px] text-[#191919]/70">
                      {endpoint.sample}
                    </pre>
                  )}
                </li>
              ))}
            </ul>
            <pre className="no-scrollbar max-h-72 overflow-auto rounded-lg bg-[#F4F3F3] p-4 font-mono text-[11px] leading-relaxed text-[#191919]/80">
              {openapi}
            </pre>
          </>
        )}

        {tab === 'Files' && currentFile && (
          <div className="grid gap-3 lg:grid-cols-[minmax(0,220px)_1fr]">
            <ul className="no-scrollbar max-h-[420px] space-y-0.5 overflow-y-auto rounded-lg border border-gray-200 p-1.5">
              {artifacts.files.map((file) => (
                <li key={file.path}>
                  <button
                    type="button"
                    onClick={() => setActiveFile(file.path)}
                    className={`w-full truncate rounded px-2 py-1.5 text-left font-mono text-[11px] transition-colors ${
                      file.path === currentFile.path ? 'bg-[#191919] text-white' : 'text-[#191919]/65 hover:bg-[#F4F3F3]'
                    }`}
                  >
                    {file.path}
                  </button>
                </li>
              ))}
            </ul>
            <pre className="no-scrollbar max-h-[420px] overflow-auto rounded-lg bg-[#F4F3F3] p-4 font-mono text-[11px] leading-relaxed text-[#191919]/80">
              {currentFile.content}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}
