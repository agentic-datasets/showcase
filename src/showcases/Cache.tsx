import { useMemo, useState } from 'react'
import { ToyImplementation, WORLDS } from '../engine'
import type { Observation } from '../engine'
import { Button, DecisionChip, Flag } from '../components/Observation'

const muted = { color: 'var(--ink-muted)' }
const faint = { color: 'var(--ink-faint)' }
const rule = { borderColor: 'var(--rule)' }

const QUERY = 'Find batches run last week'

/**
 * Two principals ask the same question of the same dataset at the same
 * revision, and both are entitled to `search`. With the scope in the cache key
 * the second is a miss; without it, the second is a hit -- and a hit is an
 * answer produced under someone else's authorization.
 *
 * The pair has to be two principals who are BOTH granted, or the comparison
 * never happens: the external auditor's clearance is below the capability's
 * sensitivity, so it is refused before the cache is ever consulted.
 */
export default function Cache() {
  const [scoped, setScoped] = useState(true)

  const runs = useMemo(() => {
    const subject = new ToyImplementation('toy-ts', { cacheIgnoresPrincipal: !scoped })
    subject.loadWorld(WORLDS.reference)
    const first = subject.step({
      op: 'request',
      principal: 'process_engineer',
      text: QUERY,
    }) as Observation
    const second = subject.step({
      op: 'request',
      principal: 'analyst',
      text: QUERY,
    }) as Observation
    // A third principal, run on its own, for the row that never reaches the cache.
    const alone = new ToyImplementation()
    alone.loadWorld(WORLDS.reference)
    const auditor = alone.step({
      op: 'request',
      principal: 'external_auditor',
      text: QUERY,
    }) as Observation
    return { first, second, auditor }
  }, [scoped])

  const crossed = runs.second.cache_hit

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Button active={scoped} onClick={() => setScoped(true)}>
          Cache key includes the scope
        </Button>
        <Button active={!scoped} onClick={() => setScoped(false)}>
          Cache key drops the scope
        </Button>
      </div>

      <div className="rounded-sm border p-4 font-mono text-xs" style={rule}>
        <div style={faint}>both principals ask</div>
        <div className="mt-1" style={muted}>
          &ldquo;{QUERY}&rdquo;
        </div>
        <div className="mt-2" style={faint}>
          same dataset, same revision, both entitled to search
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {[
          { who: 'Process engineer', sub: 'asks first', o: runs.first },
          { who: 'Analyst', sub: 'asks second', o: runs.second },
        ].map((r) => (
          <div key={r.who} className="rounded-sm border p-3" style={rule}>
            <div className="text-sm font-medium">{r.who}</div>
            <div className="mt-0.5 text-[11px]" style={faint}>
              {r.sub}
            </div>
            <div className="mt-3">
              <DecisionChip decision={r.o.decision} />
            </div>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
              <Flag label="cache hit" on={r.o.cache_hit} />
              <Flag label="executed" on={r.o.tool_calls.length > 0} />
            </div>
            <div className="mt-2 font-mono text-[11px]" style={faint}>
              {r.o.grant_scope
                ? `${r.o.grant_scope.principal_class} ≤ ${r.o.grant_scope.max_sensitivity}`
                : 'no scope'}
            </div>
          </div>
        ))}
      </div>

      <div
        className="rounded-sm border p-4"
        style={{ borderColor: crossed ? 'var(--ink)' : 'var(--rule)' }}
      >
        <div className="text-sm leading-relaxed">
          {crossed ? (
            <>
              The analyst&rsquo;s answer was{' '}
              <strong>served from the engineer&rsquo;s cache entry</strong> &mdash; a cache hit, and
              nothing executed. Nothing about the decision looks wrong: both were GRANTED, both hold{' '}
              <code className="font-mono text-xs">search</code>. The failure is that the second answer
              was produced under an authorization that was never the analyst&rsquo;s.
            </>
          ) : (
            <>
              The analyst&rsquo;s request is a <strong>cache miss</strong> and executes under its own
              scope. The two entries are identical but for the authorization that produced them,
              which is exactly what AD-008 requires the key to carry.
            </>
          )}
        </div>
      </div>

      <div className="rounded-sm border p-3" style={rule}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm">External auditor, same question</div>
            <div className="mt-1 text-xs" style={faint}>
              {runs.auditor.reason} &mdash; public clearance is below the sensitivity of{' '}
              <code className="font-mono">search</code> on this dataset
            </div>
          </div>
          <DecisionChip decision={runs.auditor.decision} />
        </div>
        <div className="mt-2 text-xs" style={faint}>
          Refused before the cache is consulted at all, in either mode. A cache cannot leak what
          admission never approved.
        </div>
      </div>

      <p className="text-sm leading-relaxed" style={muted}>
        This is the one where the broken version is more tempting than the correct one: dropping the
        scope raises the hit rate, and the answer to the same question really does look identical. It
        is a governance boundary and not a performance choice, which is why it is an assertion rather
        than a benchmark.
      </p>
    </div>
  )
}
