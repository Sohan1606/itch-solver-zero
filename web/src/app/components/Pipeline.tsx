import { useEffect, useRef } from 'react'
import { AGENT_META } from '../lib/agents'
import type { AgentState } from '../lib/types'

type Props = {
  agents: AgentState[]
  running: boolean
  error: string | null
}

const STATUS_LABEL: Record<AgentState['status'], string> = {
  queued: 'Queued',
  running: 'Running',
  done: 'Done',
  error: 'Failed',
}

const DOT: Record<AgentState['status'], string> = {
  queued: 'bg-gray-300',
  running: 'bg-amber-500',
  done: 'bg-[#191919]',
  error: 'bg-red-500',
}

export default function Pipeline({ agents, running, error }: Props) {
  const active = agents.find((agent) => agent.status === 'running')
  const streamRef = useRef<HTMLPreElement | null>(null)

  useEffect(() => {
    if (streamRef.current) streamRef.current.scrollTop = streamRef.current.scrollHeight
  }, [active?.stream])

  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
        <div className="flex items-center gap-2">
          <span className={`h-1.5 w-1.5 rounded-full ${running ? 'animate-pulse bg-amber-500' : error ? 'bg-red-500' : 'bg-[#191919]'}`} />
          <h2 className="text-sm font-medium text-[#191919]">Four-agent pipeline</h2>
        </div>
        <span className="text-[11px] uppercase tracking-[0.14em] text-[#191919]/40">
          {running ? 'Working' : error ? 'Stopped' : agents.every((agent) => agent.status === 'done') ? 'Complete' : 'Idle'}
        </span>
      </div>

      <ol className="divide-y divide-gray-100">
        {agents.map((agent) => (
          <li key={agent.id} className="px-5 py-4">
            <div className="flex items-start gap-3">
              <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${DOT[agent.status]}`} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <p className="text-sm text-[#191919]">
                    <span className="mr-2 font-mono text-[11px] text-[#191919]/40">0{agent.id}</span>
                    {AGENT_META[agent.id as 1 | 2 | 3 | 4].title}
                  </p>
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#191919]/40">
                    {STATUS_LABEL[agent.status]}
                    {agent.ms ? ` · ${(agent.ms / 1000).toFixed(1)}s` : ''}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-[#191919]/50">
                  {AGENT_META[agent.id as 1 | 2 | 3 | 4].subtitle}
                </p>

                {agent.status === 'running' && (
                  <pre
                    ref={streamRef}
                    className="no-scrollbar mt-3 max-h-40 overflow-y-auto rounded-lg bg-[#F4F3F3] p-3 font-mono text-[11px] leading-relaxed text-[#191919]/70"
                  >
                    {agent.stream || 'connecting…'}
                  </pre>
                )}

                {agent.status === 'error' && agent.error && (
                  <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs leading-relaxed text-red-700">{agent.error}</p>
                )}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
