import { useMemo, useState } from 'react'
import { MUTANTS, SUITE, run, subjectFor } from '../engine'
import type { Mutant } from '../engine'
import { Button } from '../components/Observation'

const muted = { color: 'var(--ink-muted)' }
const faint = { color: 'var(--ink-faint)' }
const rule = { borderColor: 'var(--rule)' }

export default function MutantHunt() {
  const [id, setId] = useState<string | null>(null)
  const mutant: Mutant | null = MUTANTS.find((m) => m.id === id) ?? null

  const report = useMemo(() => run(subjectFor(mutant), SUITE), [mutant])
  const broken = report.results.filter((r) => !r.passed)
  const targetCaught = mutant ? broken.some((b) => b.assertion === mutant.target) : false

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-2 text-[11px] uppercase tracking-[0.14em]" style={faint}>
          Break the implementation
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Button active={id === null} onClick={() => setId(null)}>
            <span className="font-medium">Nothing broken</span>
            <span className="mt-0.5 block text-[11px] opacity-80">The faithful subject</span>
          </Button>
          {MUTANTS.map((m) => (
            <Button key={m.id} active={id === m.id} onClick={() => setId(m.id)}>
              <span className="font-medium">{m.label}</span>
              <span className="mt-0.5 block text-[11px] opacity-80">must be caught by {m.target}</span>
            </Button>
          ))}
        </div>
      </div>

      {mutant && (
        <div className="rounded-sm border p-4 text-sm leading-relaxed" style={rule}>
          <div style={muted}>{mutant.edit}</div>
          <div className="mt-2" style={faint}>
            Why anyone would: {mutant.plausible}
          </div>
        </div>
      )}

      <div>
        <div className="mb-3 flex flex-wrap items-baseline gap-3">
          <span className="font-mono text-2xl tabular-nums">
            {report.results.length - broken.length} / {report.results.length}
          </span>
          <span className="text-sm" style={muted}>
            assertions pass &middot; {report.observations} observations
          </span>
        </div>

        <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-5">
          {report.results.map((r) => {
            const isTarget = mutant?.target === r.assertion
            const failed = !r.passed
            return (
              <div
                key={r.assertion}
                title={r.detail}
                className="rounded-sm border px-2 py-1.5 text-center font-mono text-[11px]"
                style={{
                  borderColor: failed ? 'var(--ink)' : 'var(--rule)',
                  background: failed ? 'var(--ink)' : 'transparent',
                  color: failed ? 'var(--ground)' : 'var(--ink-faint)',
                  outline: isTarget ? '2px solid var(--ink)' : undefined,
                  outlineOffset: isTarget ? '2px' : undefined,
                }}
              >
                {r.assertion.replace('AD-', '')}
              </div>
            )
          })}
        </div>
        <div className="mt-2 text-[11px]" style={faint}>
          Filled = failing. Outlined = the assertion this mutant is supposed to trip.
        </div>
      </div>

      {mutant && (
        <div className="rounded-sm border p-4" style={rule}>
          <div className="text-sm">
            {targetCaught ? (
              <>
                <strong>{mutant.target} caught it.</strong> The others that also fail are
                cross-detection: one broken behaviour is visible from more than one angle. That is a
                characterisation of the assertions, not a score &mdash; it is deliberately not tuned.
              </>
            ) : (
              <>
                <strong>{mutant.target} did not catch it.</strong> That would be a finding about the
                assertion rather than about the mutant.
              </>
            )}
          </div>
          {broken.length > 0 && (
            <ul className="mt-3 space-y-1.5 text-xs" style={muted}>
              {broken.map((b) => (
                <li key={b.assertion} className="break-words">
                  <span className="font-mono">{b.assertion}</span> &mdash; {b.detail}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {!mutant && (
        <p className="text-sm leading-relaxed" style={muted}>
          Nothing is broken, so all fifteen pass over {report.observations} observations. Break
          something above and watch which assertion notices &mdash; the contract is not that
          <em> some </em> assertion fails, but that the one named for the defect does.
        </p>
      )}
    </div>
  )
}
