import type { Provider, Settings } from './types'

/**
 * Provider registry.
 *
 * Every entry is a real endpoint. Anything that speaks the OpenAI
 * chat-completions dialect only needs a base URL + model, so adding a new
 * vendor is a two-line change.
 */
export const PROVIDERS: Provider[] = [
  {
    id: 'openrouter',
    name: 'OpenRouter',
    kind: 'openai',
    baseUrl: 'https://openrouter.ai/api/v1',
    models: [
      'openai/gpt-4o-mini',
      'anthropic/claude-3.5-sonnet',
      'google/gemini-2.0-flash-001',
      'meta-llama/llama-3.3-70b-instruct',
      'deepseek/deepseek-chat',
      'qwen/qwen-2.5-72b-instruct',
    ],
    defaultModel: 'openai/gpt-4o-mini',
    docsUrl: 'https://openrouter.ai/keys',
    keyHint: 'sk-or-v1-…',
    cors: 'ok',
    note: 'One key, every model. Best default for browser-only deployments.',
  },
  {
    id: 'openai',
    name: 'OpenAI',
    kind: 'openai',
    baseUrl: 'https://api.openai.com/v1',
    models: ['gpt-4o-mini', 'gpt-4o', 'gpt-4.1-mini', 'gpt-4.1', 'o4-mini'],
    defaultModel: 'gpt-4o-mini',
    docsUrl: 'https://platform.openai.com/api-keys',
    keyHint: 'sk-proj-…',
    cors: 'ok',
    note: 'Works directly from the browser. gpt-4o-mini is the cheapest good option.',
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    kind: 'anthropic',
    baseUrl: 'https://api.anthropic.com/v1',
    models: ['claude-sonnet-4-5', 'claude-3-5-haiku-latest', 'claude-opus-4-1'],
    defaultModel: 'claude-sonnet-4-5',
    docsUrl: 'https://console.anthropic.com/settings/keys',
    keyHint: 'sk-ant-…',
    cors: 'ok',
    note: 'Browser calls need the anthropic-dangerous-direct-browser-access header — this app sends it.',
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    kind: 'gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    models: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash'],
    defaultModel: 'gemini-2.5-flash',
    docsUrl: 'https://aistudio.google.com/apikey',
    keyHint: 'AIza…',
    cors: 'ok',
    note: 'Free tier available. Key is passed as a query parameter, as Google requires.',
  },
  {
    id: 'groq',
    name: 'Groq',
    kind: 'openai',
    baseUrl: 'https://api.groq.com/openai/v1',
    models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'openai/gpt-oss-120b'],
    defaultModel: 'llama-3.3-70b-versatile',
    docsUrl: 'https://console.groq.com/keys',
    keyHint: 'gsk_…',
    cors: 'ok',
    note: 'Fastest token throughput — good for the 4-agent chain.',
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    kind: 'openai',
    baseUrl: 'https://api.deepseek.com/v1',
    models: ['deepseek-chat', 'deepseek-reasoner'],
    defaultModel: 'deepseek-chat',
    docsUrl: 'https://platform.deepseek.com/api_keys',
    keyHint: 'sk-…',
    cors: 'unknown',
    note: 'If the browser blocks the request, switch Route to the local proxy.',
  },
  {
    id: 'mistral',
    name: 'Mistral',
    kind: 'openai',
    baseUrl: 'https://api.mistral.ai/v1',
    models: ['mistral-large-latest', 'mistral-small-latest', 'open-mistral-nemo'],
    defaultModel: 'mistral-large-latest',
    docsUrl: 'https://console.mistral.ai/api-keys/',
    keyHint: '…',
    cors: 'unknown',
  },
  {
    id: 'xai',
    name: 'xAI (Grok)',
    kind: 'openai',
    baseUrl: 'https://api.x.ai/v1',
    models: ['grok-2-latest', 'grok-beta'],
    defaultModel: 'grok-2-latest',
    docsUrl: 'https://console.x.ai',
    keyHint: 'xai-…',
    cors: 'unknown',
  },
  {
    id: 'ollama',
    name: 'Ollama (local)',
    kind: 'openai',
    baseUrl: 'http://localhost:11434/v1',
    models: ['llama3.2', 'qwen2.5:7b', 'mistral', 'phi4'],
    defaultModel: 'llama3.2',
    docsUrl: 'https://ollama.com/download',
    keyHint: 'not required',
    cors: 'ok',
    note: 'Runs on your machine. Start it with OLLAMA_ORIGINS=* ollama serve.',
  },
  {
    id: 'custom',
    name: 'Custom (OpenAI-compatible)',
    kind: 'openai',
    baseUrl: '',
    models: [],
    defaultModel: '',
    docsUrl: '',
    keyHint: 'your key',
    cors: 'unknown',
    note: 'Any endpoint that speaks POST /chat/completions — vLLM, LM Studio, LiteLLM, your own gateway.',
  },
]

export const getProvider = (id: string): Provider =>
  PROVIDERS.find((provider) => provider.id === id) ?? PROVIDERS[0]

export const DEFAULT_SETTINGS: Settings = {
  providerId: 'openrouter',
  apiKey: '',
  model: 'openai/gpt-4o-mini',
  baseUrl: '',
  route: 'direct',
  proxyUrl: 'http://localhost:8787/api/chat',
  proxyToken: '',
  temperature: 0.4,
  demoMode: false,
}

/* ------------------------------------------------------------------ */
/* Request plumbing                                                   */
/* ------------------------------------------------------------------ */

export type ChatRequest = {
  settings: Settings
  system: string
  user: string
  maxTokens: number
  signal?: AbortSignal
  onToken?: (chunk: string) => void
}

/** Thrown when the browser blocks the request (CORS) or the host is unreachable. */
export class NetworkBlockedError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'NetworkBlockedError'
  }
}

function resolveBaseUrl(settings: Settings) {
  const provider = getProvider(settings.providerId)
  if (provider.id === 'custom') return settings.baseUrl.replace(/\/+$/, '')
  return provider.baseUrl
}

type Payload = { url: string; headers: Record<string, string>; body: Record<string, unknown> }

function buildPayload(
  settings: Settings,
  system: string,
  user: string,
  maxTokens: number,
  stream: boolean,
): Payload {
  const provider = getProvider(settings.providerId)
  const model = settings.model || provider.defaultModel

  if (provider.kind === 'anthropic') {
    return {
      url: `${resolveBaseUrl(settings)}/messages`,
      headers: {
        'content-type': 'application/json',
        'x-api-key': settings.apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: {
        model,
        max_tokens: maxTokens,
        temperature: settings.temperature,
        system,
        stream,
        messages: [{ role: 'user', content: user }],
      },
    }
  }

  if (provider.kind === 'gemini') {
    const base = resolveBaseUrl(settings)
    return {
      url: `${base}/models/${encodeURIComponent(model)}:${stream ? 'streamGenerateContent?alt=sse&key=' : 'generateContent?key='}${encodeURIComponent(settings.apiKey)}`,
      headers: { 'content-type': 'application/json' },
      body: {
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: 'user', parts: [{ text: user }] }],
        generationConfig: {
          temperature: settings.temperature,
          maxOutputTokens: maxTokens,
          responseMimeType: 'application/json',
        },
      },
    }
  }

  return {
    url: `${resolveBaseUrl(settings)}/chat/completions`,
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${settings.apiKey}`,
      ...(getProvider(settings.providerId).id === 'openrouter'
        ? { 'HTTP-Referer': window.location.origin, 'X-Title': 'ITCH-SOLVER ZERO' }
        : {}),
    },
    body: {
      model,
      temperature: settings.temperature,
      max_tokens: maxTokens,
      stream,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    },
  }
}

/** Extract the text delta from one SSE `data:` payload. */
function deltaFromEvent(kind: Provider['kind'], json: unknown): string {
  type AnyRecord = Record<string, any>
  const payload = json as AnyRecord

  if (kind === 'anthropic') {
    if (payload?.type === 'content_block_delta') return payload.delta?.text ?? ''
    return ''
  }
  if (kind === 'gemini') {
    const parts = payload?.candidates?.[0]?.content?.parts
    if (Array.isArray(parts)) return parts.map((part: AnyRecord) => part?.text ?? '').join('')
    return ''
  }
  const choice = payload?.choices?.[0]
  return choice?.delta?.content ?? choice?.message?.content ?? ''
}

/** Extract the full text from a non-streamed response body. */
function textFromBody(kind: Provider['kind'], json: unknown): string {
  type AnyRecord = Record<string, any>
  const payload = json as AnyRecord

  if (kind === 'anthropic') {
    const blocks = payload?.content
    if (Array.isArray(blocks)) return blocks.map((block: AnyRecord) => block?.text ?? '').join('')
    return ''
  }
  if (kind === 'gemini') {
    const parts = payload?.candidates?.[0]?.content?.parts
    if (Array.isArray(parts)) return parts.map((part: AnyRecord) => part?.text ?? '').join('')
    return ''
  }
  return payload?.choices?.[0]?.message?.content ?? ''
}

async function readSse(response: Response, kind: Provider['kind'], onToken: (t: string) => void) {
  const reader = response.body?.getReader()
  if (!reader) throw new Error('Streaming is not available in this browser.')
  const decoder = new TextDecoder()
  let buffer = ''
  let full = ''

  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed.startsWith('data:')) continue
      const data = trimmed.slice(5).trim()
      if (!data || data === '[DONE]') continue
      try {
        const chunk = deltaFromEvent(kind, JSON.parse(data))
        if (chunk) {
          full += chunk
          onToken(chunk)
        }
      } catch {
        /* keep-alive or partial frame — ignore */
      }
    }
  }
  return full
}

async function postJson(url: string, headers: Record<string, string>, body: unknown, signal?: AbortSignal) {
  try {
    return await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal,
    })
  } catch (error) {
    if ((error as Error)?.name === 'AbortError') throw error
    throw new NetworkBlockedError(
      'The request never reached the provider. This is usually CORS or an offline host — switch Route to “Local proxy” and run `npm run proxy`.',
    )
  }
}

/**
 * One model call. Streams when possible, transparently falls back to a
 * single-shot request if the provider rejects streaming.
 */
export async function chat({ settings, system, user, maxTokens, signal, onToken }: ChatRequest): Promise<string> {
  const provider = getProvider(settings.providerId)
  const wantsStream = typeof onToken === 'function' && settings.route === 'direct'

  const send = async (stream: boolean) => {
    const { url, headers, body } = buildPayload(settings, system, user, maxTokens, stream)

    if (settings.route === 'proxy') {
      const proxyHeaders: Record<string, string> = { 'content-type': 'application/json' }
      // Only needed when the proxy was started with PROXY_TOKEN set.
      if (settings.proxyToken.trim()) {
        proxyHeaders.authorization = `Bearer ${settings.proxyToken.trim()}`
      }
      const proxied = await postJson(
        settings.proxyUrl,
        proxyHeaders,
        { url, headers, body },
        signal,
      )
      return proxied
    }

    return postJson(url, headers, body, signal)
  }

  // Proxy route: the local server always returns a complete JSON body.
  if (settings.route === 'proxy') {
    const response = await send(false)
    if (!response.ok) throw new Error(await describeError(response))
    const json = await response.json()
    const text = textFromBody(provider.kind, json)
    if (onToken && text) onToken(text)
    return text
  }

  const response = await send(wantsStream)

  if (!response.ok) {
    const message = await describeError(response)
    // Some models reject stream:true — retry once without it.
    if (wantsStream && /stream/i.test(message)) {
      const retry = await send(false)
      if (!retry.ok) throw new Error(await describeError(retry))
      const json = await retry.json()
      const text = textFromBody(provider.kind, json)
      if (text) onToken?.(text)
      return text
    }
    throw new Error(message)
  }

  const contentType = response.headers.get('content-type') ?? ''
  if (wantsStream && contentType.includes('text/event-stream') && response.body) {
    return readSse(response, provider.kind, onToken!)
  }

  const json = await response.json()
  const text = textFromBody(provider.kind, json)
  if (onToken && text) onToken(text)
  return text
}

async function describeError(response: Response): Promise<string> {
  let detail = ''
  try {
    const body = await response.json()
    detail = body?.error?.message ?? body?.message ?? JSON.stringify(body).slice(0, 300)
  } catch {
    detail = await response.text().catch(() => '')
  }
  if (response.status === 401) return `401 Unauthorized — the API key was rejected. ${detail}`
  if (response.status === 403) return `403 Forbidden — the key lacks access to this model. ${detail}`
  if (response.status === 429) return `429 Rate limited — wait a moment or switch model. ${detail}`
  return `${response.status} ${response.statusText}${detail ? ` — ${detail}` : ''}`
}

export async function testConnection(settings: Settings): Promise<string> {
  const text = await chat({
    settings,
    system: 'You are a health check. Reply with exactly: OK',
    user: 'Reply with exactly: OK',
    maxTokens: 8,
  })
  return text.trim()
}
