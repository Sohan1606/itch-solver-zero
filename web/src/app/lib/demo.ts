import type { Arch, Business, GeneratedFile, RootCause, Score } from './types'

/**
 * Deterministic offline engine.
 *
 * Powers the "Run without a key" path so the product is always demoable —
 * on a plane, in the sandboxed preview, or before a visitor has signed up
 * for a provider. Same output contract as the LLM path.
 */

export type DemoBundle = {
  root: RootCause
  score: Score
  business: Business
  arch: Arch
  files: GeneratedFile[]
}

const hash = (value: string) => {
  let h = 2166136261
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return Math.abs(h)
}

const clamp = (value: number, min = 55, max = 97) => Math.min(max, Math.max(min, Math.round(value)))

const jitter = (base: number, spread: number, seed: number) =>
  clamp(base + (seed % spread) - Math.floor(spread / 2))

export const SAMPLE_PROBLEMS = [
  {
    label: 'Tier-2 hospital OPD queue chaos',
    vertical: 'Healthcare ops',
    quote:
      'I reached at 7:10 AM, token 41. At 12:40 PM the doctor said "next". Nobody ever called my number.',
  },
  {
    label: 'Freelancer GST & invoice reconciliation nightmare',
    vertical: 'Fintech · Compliance',
    quote:
      'GSTR-2B never matches my invoices, the client says they paid, and I lose ₹41,000 of ITC at 1 AM.',
  },
  {
    label: 'Apartment society EV charger overload',
    vertical: 'ClimateTech · PropTech',
    quote:
      'Four EVs plug in at 9 PM, the society mains trip, and the WhatsApp group declares war on early adopters.',
  },
  {
    label: 'D2C return fraud detection',
    vertical: 'E-commerce · Risk',
    quote:
      '380 of 4,200 orders came back last month. Six were empty boxes. One had a brick in it.',
  },
]

type Curated = Omit<DemoBundle, 'score'> & { score: Omit<Score, 'systemicLine'> & { systemicLine?: string } }

function clinicDemo(): Curated {
  return {
    root: {
      bottleneck: 'Token issuance is decoupled from doctor throughput and room availability.',
      drivers: [
        'Walk-ins are batched at 08:00 because registration has no slotting logic.',
        'No-shows and VIP walk-ins consume the same queue with no signal.',
        'Reception arbitrates order verbally; the live queue exists only in a register.',
        'Consultation overruns are never fed back into the wait estimate.',
      ],
      noise: '“Doctor ne paanch minute mein bhej diya, ghanta bhar intezaar ke baad.”',
      signal: 'A four-hour wait for a four-minute consult — a wait-to-value mismatch, not a doctor shortage.',
      sentiment: { frustration: 88, urgency: 91, fatigue: 83 },
    },
    score: {
      verdict: 'BUILD — painful, frequent, unloved',
      verdictText:
        'Every clinic competes on the OPD experience and every one runs it on a paper register. Incumbents sell ₹40L HIS suites; the ₹5k queue brain is unclaimed.',
      severity: 92,
      frequency: 96,
      whitespace: 87,
      wtp: 78,
      feasibility: 84,
      tam: { value: '₹4,180 Cr', market: '3.1L private clinics, 42k nursing homes', sam: '₹1,140 Cr serviceable', pen: '11% reachable in 24 months' },
      wtpBand: '₹1,200–4,500 per clinic / month',
      ninety: '14',
      systemicLine: 'Token issuance is decoupled from throughput — a scheduling gap, not a staffing gap.',
    },
    business: {
      verdict: '₹54k ACV, 86% gross margin, 2-month payback. The wedge is the queue; the business is the OPD operating layer.',
      rows: [
        { label: 'Pilot price', value: '₹4,500 / clinic / mo' },
        { label: 'Annual contract value', value: '₹54,000' },
        { label: 'Gross margin', value: '86%' },
        { label: 'Target CAC', value: '₹2,200' },
        { label: 'Payback', value: '2.1 months' },
        { label: 'Break-even', value: '410 clinics' },
      ],
      wedge: [
        { window: 'Month 0–6', move: 'Token + wait ETA for single-speciality clinics' },
        { window: 'Month 6–18', move: 'Lab, pharmacy and billing queues on the same event spine' },
        { window: 'Month 18–36', move: 'District networks + ABDM-ready records' },
      ],
      whyNow:
        'ABDM health IDs, UPI at reception and ₹4k Android tablets removed the infrastructure excuse. Tier-2 clinics want software that installs in an afternoon, not a six-month HIS rollout.',
    },
    arch: {
      stack: [
        { layer: 'Frontend', choice: 'Next.js 14 + Tailwind' },
        { layer: 'API', choice: 'Fastify (Node 20)' },
        { layer: 'Database', choice: 'PostgreSQL 16' },
        { layer: 'Queue state', choice: 'Redis sorted sets' },
        { layer: 'Messaging', choice: 'MSG91 / Twilio SMS' },
        { layer: 'Deploy', choice: 'Vercel + Neon' },
      ],
      tables: [
        { name: 'clinics', purpose: 'tenant root', columns: [{ name: 'id', type: 'uuid', key: 'pk' }, { name: 'name', type: 'text' }, { name: 'city', type: 'text' }, { name: 'created_at', type: 'timestamptz' }] },
        { name: 'doctors', purpose: 'throughput source of truth', columns: [{ name: 'id', type: 'uuid', key: 'pk' }, { name: 'clinic_id', type: 'uuid', key: 'fk' }, { name: 'name', type: 'text' }, { name: 'room_no', type: 'text' }, { name: 'shift_start', type: 'time' }] },
        { name: 'tokens', purpose: 'live queue state', columns: [{ name: 'id', type: 'uuid', key: 'pk' }, { name: 'clinic_id', type: 'uuid', key: 'fk' }, { name: 'patient_name', type: 'text' }, { name: 'phone', type: 'text' }, { name: 'token_no', type: 'integer' }, { name: 'state', type: 'text' }, { name: 'issued_at', type: 'timestamptz' }] },
        { name: 'queue_events', purpose: 'append-only audit', columns: [{ name: 'id', type: 'bigserial', key: 'pk' }, { name: 'token_id', type: 'uuid', key: 'fk' }, { name: 'event', type: 'text' }, { name: 'latency_ms', type: 'integer' }, { name: 'created_at', type: 'timestamptz' }] },
        { name: 'leads', purpose: 'pilot pipeline', columns: [{ name: 'id', type: 'uuid', key: 'pk' }, { name: 'name', type: 'text' }, { name: 'email', type: 'text' }, { name: 'org', type: 'text' }, { name: 'created_at', type: 'timestamptz' }] },
      ],
      endpoints: [
        { method: 'POST', path: '/v1/tokens', description: 'Issue a token with a predicted wait', sample: '{"id":"tkn_8f21c","token_no":42,"state":"waiting","eta_minutes":96}' },
        { method: 'PATCH', path: '/v1/tokens/:id', description: 'Advance token state', sample: '{"id":"tkn_8f21c","state":"in_consult","wait_actual_min":71}' },
        { method: 'GET', path: '/v1/queue/:clinicId', description: 'Live queue and wait estimate', sample: '{"waiting":17,"in_consult":2,"p50_minutes":64,"p90_minutes":121}' },
        { method: 'POST', path: '/v1/leads', description: 'Capture a pilot request', sample: '{"id":"led_k92ab","status":"created"}' },
      ],
      flow: [
        { name: 'Patient token', tech: 'SMS + QR', role: 'ingest' },
        { name: 'Queue brain', tech: 'Fastify + Redis ZSET', role: 'core' },
        { name: 'Audit ledger', tech: 'PostgreSQL 16', role: 'store' },
        { name: 'Clinic board', tech: 'Next.js + SSE', role: 'surface' },
      ],
      moat: 'Queue-event density per clinic. At 1,000 clinics the wait model becomes the product; a competitor starting today begins at zero data.',
      risks: [
        'Reception adoption — must work one-thumbed on a ₹6,000 Android phone.',
        'Power cuts are routine, so the queue must survive offline and reconcile on reconnect.',
      ],
      notes: 'Edge-cached read model so a 3G clinic tablet still renders in under 400ms. Tokens are append-only events; current state is a projection.',
    },
    files: [],
  }
}

function genericDemo(problem: string, vertical: string): Curated {
  const clean = problem.replace(/\s+/g, ' ').trim()
  const short = clean.length > 90 ? `${clean.slice(0, 88)}…` : clean
  return {
    root: {
      bottleneck: 'There is no shared system of record, so every participant re-solves the same coordination problem by hand.',
      drivers: [
        `The workflow behind “${short}” is coordinated across at least three informal channels.`,
        'State lives in someone’s memory or an unread group chat.',
        'Each participant duplicates effort just to stay in sync.',
        'Nothing feeds back, so the same failure recurs every week.',
      ],
      noise: '“Koi sunta hi nahi hai, sab apna hi dekhte hain.”',
      signal: 'Repeated coordination failure across participants — a missing system of record, not a motivation problem.',
      sentiment: { frustration: 84, urgency: 76, fatigue: 79 },
    },
    score: {
      verdict: 'BUILD — recurring pain with no owner',
      verdictText:
        'The frustration repeats often enough to become a habit and has no credible, affordable owner today. That is exactly the gap a two-person team can hold.',
      severity: 81,
      frequency: 86,
      whitespace: 84,
      wtp: 72,
      feasibility: 88,
      tam: { value: '₹1,860 Cr', market: '42M affected users · 1.4M small operators', sam: '₹540 Cr serviceable', pen: '12% reachable in 24 months' },
      wtpBand: '₹399–1,499 per account / month',
      ninety: '15',
      systemicLine: 'No system of record exists, so the coordination cost is paid manually every single week.',
    },
    business: {
      verdict: 'Small ACV, high frequency, low support cost. The first 50 accounts prove whether this is a product or a feature.',
      rows: [
        { label: 'Pilot price', value: '₹999 / account / mo' },
        { label: 'Annual contract value', value: '₹11,988' },
        { label: 'Gross margin', value: '84%' },
        { label: 'Target CAC', value: '₹1,900' },
        { label: 'Payback', value: '2.0 months' },
        { label: 'Break-even', value: '1,600 accounts' },
      ],
      wedge: [
        { window: 'Month 0–6', move: 'One workflow, one segment, manual onboarding' },
        { window: 'Month 6–18', move: 'Notifications, payments and analytics on the same spine' },
        { window: 'Month 18–36', move: 'API + white-label for aggregators' },
      ],
      whyNow:
        'Smartphone penetration, UPI rails and cheap managed Postgres dropped the cost of serving a 50-person operator to near zero. The only missing piece was a system of record.',
    },
    arch: {
      stack: [
        { layer: 'Frontend', choice: 'Next.js 14 + Tailwind' },
        { layer: 'API', choice: 'Fastify (Node 20)' },
        { layer: 'Database', choice: 'PostgreSQL 16' },
        { layer: 'Jobs', choice: 'BullMQ on Redis' },
        { layer: 'Deploy', choice: 'Vercel + Neon' },
      ],
      tables: [
        { name: 'accounts', purpose: 'tenant root', columns: [{ name: 'id', type: 'uuid', key: 'pk' }, { name: 'name', type: 'text' }, { name: 'segment', type: 'text' }, { name: 'created_at', type: 'timestamptz' }] },
        { name: 'requests', purpose: 'canonical work items', columns: [{ name: 'id', type: 'uuid', key: 'pk' }, { name: 'account_id', type: 'uuid', key: 'fk' }, { name: 'title', type: 'text' }, { name: 'status', type: 'text' }, { name: 'priority', type: 'integer' }, { name: 'created_at', type: 'timestamptz' }] },
        { name: 'participants', purpose: 'people and roles', columns: [{ name: 'id', type: 'uuid', key: 'pk' }, { name: 'account_id', type: 'uuid', key: 'fk' }, { name: 'name', type: 'text' }, { name: 'role', type: 'text' }] },
        { name: 'events', purpose: 'append-only audit', columns: [{ name: 'id', type: 'bigserial', key: 'pk' }, { name: 'request_id', type: 'uuid', key: 'fk' }, { name: 'type', type: 'text' }, { name: 'payload', type: 'jsonb' }, { name: 'created_at', type: 'timestamptz' }] },
        { name: 'leads', purpose: 'pilot pipeline', columns: [{ name: 'id', type: 'uuid', key: 'pk' }, { name: 'name', type: 'text' }, { name: 'email', type: 'text' }, { name: 'org', type: 'text' }, { name: 'created_at', type: 'timestamptz' }] },
      ],
      endpoints: [
        { method: 'POST', path: '/v1/requests', description: 'Create a tracked request', sample: '{"id":"req_7a21","status":"open","sla_minutes":240}' },
        { method: 'PATCH', path: '/v1/requests/:id', description: 'Advance state with an audit event', sample: '{"id":"req_7a21","status":"resolved"}' },
        { method: 'GET', path: '/v1/metrics/throughput', description: 'Weekly resolution trend', sample: '{"window":"7d","resolved":46,"delta":0.18}' },
        { method: 'POST', path: '/v1/leads', description: 'Capture a pilot request', sample: '{"id":"led_z13k","status":"created"}' },
      ],
      flow: [
        { name: 'Participant input', tech: 'WhatsApp / web', role: 'ingest' },
        { name: 'Core API', tech: 'Fastify', role: 'core' },
        { name: 'System of record', tech: 'PostgreSQL', role: 'store' },
        { name: 'Shared board', tech: 'Next.js', role: 'surface' },
      ],
      moat: 'Workflow data incumbents cannot see because they only own one side of the transaction.',
      risks: [
        'Two-sided cold start — seed the supply side manually for the first 20 accounts.',
        'Adoption tax: if it adds a step before removing three, it dies in week two.',
      ],
      notes: `Scope: ${vertical}. Built for “${short}”. Ship the smallest system of record every side can see; everything else hangs off that spine.`,
    },
    files: [],
  }
}

export function generateDemo(problem: string, vertical: string): DemoBundle {
  const lower = problem.toLowerCase()
  const curated = /hospital|opd|clinic|patient|doctor|queue|health/.test(lower)
  const base = curated ? clinicDemo() : genericDemo(problem, vertical)

  const seed = hash(problem)
  const drift = curated ? 0 : 0
  const score: Score = {
    ...base.score,
    severity: jitter(base.score.severity + drift, 7, seed),
    frequency: jitter(base.score.frequency, 5, seed >> 3),
    whitespace: jitter(base.score.whitespace, 9, seed >> 5),
    wtp: jitter(base.score.wtp, 7, seed >> 7),
    feasibility: jitter(base.score.feasibility, 5, seed >> 9),
    systemicLine: base.score.systemicLine ?? base.root.bottleneck,
  }

  return {
    root: base.root,
    score,
    business: base.business,
    arch: base.arch,
    files: base.files,
  }
}
