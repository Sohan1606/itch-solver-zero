#!/usr/bin/env node
/**
 * Local CORS proxy for providers that refuse browser requests.
 *
 *   npm run proxy          # listens on http://localhost:8787
 *
 * The browser posts { url, headers, body } here, this server forwards it with
 * the same shape and returns the provider's JSON verbatim. No keys are stored:
 * they travel in the request, exactly as they do on the direct route.
 *
 * Set PROXY_ORIGIN to lock it down, or PROXY_TOKEN to require a bearer token.
 */
import { createServer } from 'node:http'

const PORT = Number(process.env.PORT || 8787)
const ALLOWED_ORIGIN = process.env.PROXY_ORIGIN || '*'
const REQUIRED_TOKEN = process.env.PROXY_TOKEN || ''

const ALLOWED_HOSTS = [
  'api.openai.com',
  'api.anthropic.com',
  'generativelanguage.googleapis.com',
  'api.groq.com',
  'api.deepseek.com',
  'api.mistral.ai',
  'api.x.ai',
  'openrouter.ai',
  'localhost',
  '127.0.0.1',
]

function json(res, status, payload) {
  const body = JSON.stringify(payload)
  res.writeHead(status, {
    'content-type': 'application/json',
    'access-control-allow-origin': ALLOWED_ORIGIN,
    'access-control-allow-headers': 'content-type, authorization',
    'access-control-allow-methods': 'POST, OPTIONS',
    'content-length': Buffer.byteLength(body),
  })
  res.end(body)
}

function isAllowed(url) {
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false
    return ALLOWED_HOSTS.some((host) => parsed.hostname === host || parsed.hostname.endsWith(`.${host}`))
  } catch {
    return false
  }
}

const server = createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'access-control-allow-origin': ALLOWED_ORIGIN,
      'access-control-allow-headers': 'content-type, authorization',
      'access-control-allow-methods': 'POST, OPTIONS',
      'access-control-max-age': '86400',
    })
    res.end()
    return
  }

  if (req.method !== 'POST' || req.url !== '/api/chat') {
    json(res, 404, { error: 'POST /api/chat only' })
    return
  }

  if (REQUIRED_TOKEN && req.headers.authorization !== `Bearer ${REQUIRED_TOKEN}`) {
    json(res, 401, { error: 'Unauthorized' })
    return
  }

  const chunks = []
  let size = 0
  req.on('data', (chunk) => {
    size += chunk.length
    if (size > 4 * 1024 * 1024) {
      json(res, 413, { error: 'Payload too large' })
      req.destroy()
      return
    }
    chunks.push(chunk)
  })

  req.on('end', async () => {
    let payload
    try {
      payload = JSON.parse(Buffer.concat(chunks).toString('utf8'))
    } catch {
      json(res, 400, { error: 'Invalid JSON body' })
      return
    }

    const { url, headers = {}, body } = payload ?? {}
    if (typeof url !== 'string' || !isAllowed(url)) {
      json(res, 400, { error: 'Target URL is missing or not in the allow-list' })
      return
    }

    try {
      const upstream = await fetch(url, {
        method: 'POST',
        headers: { ...headers, 'content-type': 'application/json' },
        body: JSON.stringify(body ?? {}),
      })
      const text = await upstream.text()
      res.writeHead(upstream.status, {
        'content-type': upstream.headers.get('content-type') || 'application/json',
        'access-control-allow-origin': ALLOWED_ORIGIN,
        'cache-control': 'no-store',
      })
      res.end(text)
    } catch (error) {
      json(res, 502, { error: `Upstream request failed: ${error.message}` })
    }
  })
})

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[proxy] listening on http://localhost:${PORT}/api/chat`)
  console.log(`[proxy] allow-list: ${ALLOWED_HOSTS.join(', ')}`)
})
