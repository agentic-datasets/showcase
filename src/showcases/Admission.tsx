import { useMemo, useState } from 'react'
import { ToyImplementation, WORLDS } from '../engine'
import type { Observation } from '../engine'
import { Button, ObservationCard } from '../components/Observation'

const muted = { color: 'var(--ink-muted)' }
const faint = { color: 'var(--ink-faint)' }

const PRINCIPALS = [
  { id: 'process_engineer', label: 'Process engineer', note: 'confidential clearance, four capabilities' },
  { id: 'analyst', label: 'Analyst', note: 'internal clearance, search and compare' },
  { id: 'clinical_reviewer', label: 'Clinical reviewer', note: 'restricted clearance, but only search here' },
  { id: 'external_auditor', label: 'External auditor', note: 'public clearance, search only' },
]

const REQUESTS = [
  'Compare the recovery of batches B001 and B002',
  'Calculate the yield for batch B003',
  'Flag anomalous batches by recovery',
  'Find batches run last week',
]

export default function Admission() {
  const [principal, setPrincipal] = useState('process_engineer')
  const [text, setText] = useState(REQUESTS[0])

  // A fresh subject per render keeps each run independent: this showcase is
  // about one decision, and a cache surviving between them would confuse it.
  const observation = useMemo<Observation | null>(() => {
    const subject = new ToyImplementation()
    subject.loadWorld(WORLDS.reference)
    return subject.step({ op: 'request', principal, text })
  }, [principal, text])

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-2 text-[11px] uppercase tracking-[0.14em]" style={faint}>
          Principal
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {PRINCIPALS.map((p) => (
            <Button key={p.id} active={principal === p.id} onClick={() => setPrincipal(p.id)}>
              <span className="font-medium">{p.label}</span>
              <span className="mt-0.5 block text-[11px] opacity-80">{p.note}</span>
            </Button>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-2 text-[11px] uppercase tracking-[0.14em]" style={faint}>
          Request
        </div>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full rounded-sm border bg-transparent px-3 py-2 text-sm"
          style={{ borderColor: 'var(--rule)', color: 'var(--ink)' }}
          aria-label="Request text"
        />
        <div className="mt-2 flex flex-wrap gap-2">
          {REQUESTS.map((r) => (
            <Button key={r} active={text === r} onClick={() => setText(r)}>
              {r}
            </Button>
          ))}
        </div>
        <p className="mt-3 text-xs leading-relaxed" style={faint}>
          The interpreter is nine keywords, not a model. Which capability a phrase resolves to is
          deliberately dull, so that what you are watching is the admission decision and not a
          language model&rsquo;s opinion of it.
        </p>
      </div>

      {observation && <ObservationCard o={observation} title="Observation" />}

      <p className="text-sm leading-relaxed" style={muted}>
        Change the principal without changing the request. The verdict changes, the deciding clause
        is named, and an evidence row exists either way &mdash; including for the refusals, which is
        AD-010.
      </p>
    </div>
  )
}
