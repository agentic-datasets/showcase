import type { Observation, ScopeDict } from '../engine'
import { executed } from '../engine'

const muted = { color: 'var(--ink-muted)' }
const faint = { color: 'var(--ink-faint)' }
const rule = { borderColor: 'var(--rule)' }

/** Decisions are rendered as themselves, never as a colour alone: the whole
 *  point of the contract is that the verdict is a value, not a vibe. */
export function DecisionChip({ decision }: { decision: string }) {
  const isGrant = decision === 'GRANTED'
  return (
    <span
      className="inline-block rounded-sm px-2 py-0.5 font-mono text-[11px] uppercase tracking-[0.12em]"
      style={{
        background: isGrant ? 'var(--ink)' : 'transparent',
        color: isGrant ? 'var(--ground)' : 'var(--ink)',
        border: isGrant ? '1px solid var(--ink)' : '1px solid var(--ink-faint)',
      }}
    >
      {decision}
    </span>
  )
}

export function Flag({ label, on, invert = false }: { label: string; on: boolean; invert?: boolean }) {
  // `invert` marks a flag where *false* is the good news, e.g. "executed" on a
  // refusal. The mark is the same either way; only the emphasis differs.
  const good = invert ? !on : on
  return (
    <span className="font-mono text-[11px]" style={good ? muted : faint}>
      {on ? '■' : '□'} {label}
    </span>
  )
}

function scopeText(s: ScopeDict | null): string {
  if (!s) return 'none'
  return `${s.principal_class} @ ${s.dataset} [${s.capabilities.join(', ')}] ≤ ${s.max_sensitivity}`
}

export function ObservationCard({ o, title }: { o: Observation; title?: string }) {
  const ran = executed(o)
  return (
    <div className="rounded-sm border p-4" style={rule}>
      {title && (
        <div className="mb-3 text-[11px] uppercase tracking-[0.14em]" style={faint}>
          {title}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <DecisionChip decision={o.decision} />
        <span className="font-mono text-xs" style={muted}>
          {o.reason}
        </span>
        {o.policy_id && (
          <span className="font-mono text-xs" style={faint}>
            {o.policy_id}
          </span>
        )}
      </div>

      {o.rationale && (
        <p className="mt-3 text-sm leading-relaxed" style={muted}>
          {o.rationale}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
        <Flag label="granted" on={o.granted} />
        <Flag label="executed" on={ran} />
        <Flag label="result" on={o.result_present} />
        <Flag label="cache hit" on={o.cache_hit} />
      </div>

      <dl className="mt-4 space-y-1.5 border-t pt-3 text-xs" style={rule}>
        <Row k="dataset" v={o.dataset ?? 'none'} />
        <Row k="capability" v={o.capability ?? 'none'} />
        <Row k="admitted scope" v={scopeText(o.grant_scope)} />
        <Row k="executed scope" v={scopeText(o.executed_scope)} />
        {(o.tool_calls.length > 0 || o.mcp_calls.length > 0 || o.a2a_calls.length > 0) && (
          <Row
            k="calls"
            v={[...o.tool_calls, ...o.mcp_calls, ...o.a2a_calls].join(', ')}
          />
        )}
        {o.errors.length > 0 && <Row k="errors" v={o.errors.join('; ')} />}
      </dl>

      {o.evidence.length > 0 && (
        <details className="mt-3">
          <summary className="cursor-pointer text-xs" style={faint}>
            evidence &mdash; {o.evidence.length} row{o.evidence.length === 1 ? '' : 's'}
          </summary>
          <pre
            className="mt-2 overflow-x-auto rounded-sm p-3 font-mono text-[11px] leading-relaxed"
            style={{ background: 'var(--ground-alt)', color: 'var(--ink-muted)' }}
          >
            {JSON.stringify(o.evidence, null, 2)}
          </pre>
        </details>
      )}
      {o.evidence.length === 0 && (
        <p className="mt-3 font-mono text-[11px]" style={faint}>
          evidence &mdash; no rows
        </p>
      )}
    </div>
  )
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="sm:flex sm:gap-3">
      <dt className="font-mono sm:w-32 sm:shrink-0" style={faint}>
        {k}
      </dt>
      <dd className="break-words font-mono" style={muted}>
        {v}
      </dd>
    </div>
  )
}

export function Button({
  children,
  onClick,
  active = false,
  title,
}: {
  children: React.ReactNode
  onClick: () => void
  active?: boolean
  title?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="rounded-sm border px-3 py-1.5 text-left text-xs transition-colors"
      style={{
        borderColor: active ? 'var(--ink)' : 'var(--rule)',
        background: active ? 'var(--ink)' : 'transparent',
        color: active ? 'var(--ground)' : 'var(--ink-muted)',
      }}
    >
      {children}
    </button>
  )
}
