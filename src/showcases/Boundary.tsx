import { useMemo, useState } from 'react'
import { Scope, ToyImplementation, WORLDS } from '../engine'
import type { Observation, ScopeDict } from '../engine'
import { Button, ObservationCard } from '../components/Observation'

const muted = { color: 'var(--ink-muted)' }
const faint = { color: 'var(--ink-faint)' }
const rule = { borderColor: 'var(--rule)' }

/** The scope actually admitted by the request this showcase always runs first. */
const ADMITTED: ScopeDict = {
  principal_class: 'process-engineer',
  dataset: 'purification-batches',
  capabilities: ['compare_batches'],
  max_sensitivity: 'internal',
}

const ASKS: Array<{ id: string; label: string; note: string; scope: ScopeDict }> = [
  {
    id: 'same',
    label: 'The same scope',
    note: 'Delegation asks for exactly what was admitted.',
    scope: ADMITTED,
  },
  {
    id: 'extra-capability',
    label: 'One extra capability',
    note: 'Adds detect_outliers, which was never admitted.',
    scope: { ...ADMITTED, capabilities: ['compare_batches', 'detect_outliers'] },
  },
  {
    id: 'higher-sensitivity',
    label: 'A higher sensitivity ceiling',
    note: 'Same capability, but confidential rather than internal.',
    scope: { ...ADMITTED, max_sensitivity: 'confidential' },
  },
  {
    id: 'other-dataset',
    label: 'A different dataset',
    note: 'Same shape, different data behind it.',
    scope: { ...ADMITTED, dataset: 'clinical-private' },
  },
]

export default function Boundary() {
  const [askId, setAskId] = useState('same')
  const [channel, setChannel] = useState<'mcp' | 'a2a'>('mcp')
  const ask = ASKS.find((a) => a.id === askId) as (typeof ASKS)[number]

  const result = useMemo(() => {
    const subject = new ToyImplementation()
    subject.loadWorld(WORLDS.reference)
    // The delegation always follows a real, admitted request -- delegation
    // borrows the previous grant, it does not mint one.
    const first = subject.step({
      op: 'request',
      principal: 'process_engineer',
      text: 'Compare the recovery of batches B001 and B002',
    }) as Observation
    const delegated = subject.step({
      op: 'delegate',
      channel,
      dataset: ask.scope.dataset,
      capability: ask.scope.capabilities[ask.scope.capabilities.length - 1],
      scope: ask.scope,
    }) as Observation
    const admitted = Scope.fromDict(first.grant_scope)
    const requested = Scope.fromDict(ask.scope)
    return {
      first,
      delegated,
      covers: admitted && requested ? admitted.covers(requested) : false,
    }
  }, [askId, channel, ask])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {(['mcp', 'a2a'] as const).map((c) => (
          <Button key={c} active={channel === c} onClick={() => setChannel(c)}>
            {c === 'mcp' ? 'Across MCP (AD-013)' : 'Agent handoff (AD-014)'}
          </Button>
        ))}
      </div>

      <div>
        <div className="mb-2 text-[11px] uppercase tracking-[0.14em]" style={faint}>
          What the far side asks to run under
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {ASKS.map((a) => (
            <Button key={a.id} active={askId === a.id} onClick={() => setAskId(a.id)}>
              <span className="font-medium">{a.label}</span>
              <span className="mt-0.5 block text-[11px] opacity-80">{a.note}</span>
            </Button>
          ))}
        </div>
      </div>

      <div className="rounded-sm border p-4 font-mono text-xs" style={rule}>
        <div style={faint}>admitted</div>
        <div className="mt-1 break-words" style={muted}>
          {ADMITTED.principal_class} @ {ADMITTED.dataset} [{ADMITTED.capabilities.join(', ')}] &le;{' '}
          {ADMITTED.max_sensitivity}
        </div>
        <div className="mt-3" style={faint}>
          requested
        </div>
        <div className="mt-1 break-words" style={muted}>
          {ask.scope.principal_class} @ {ask.scope.dataset} [{ask.scope.capabilities.join(', ')}] &le;{' '}
          {ask.scope.max_sensitivity}
        </div>
        <div className="mt-3 border-t pt-3" style={rule}>
          <span style={faint}>admitted.covers(requested) = </span>
          <span className="font-medium">{String(result.covers)}</span>
        </div>
      </div>

      <ObservationCard o={result.delegated} title={`Delegation over ${channel.toUpperCase()}`} />

      <p className="text-sm leading-relaxed" style={muted}>
        Delegation is the obvious escalation path: the far side is trusted, so why not pass through
        the scope it asks for? Every widening ask above is refused at the boundary, and the
        comparison that decides it lives in the contract rather than in either implementation, so two
        subjects cannot disagree about what &ldquo;narrower&rdquo; means.
      </p>
    </div>
  )
}
