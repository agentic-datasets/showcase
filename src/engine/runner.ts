// A TypeScript transcription of `agentic_dataset_conformance/runner.py`.
//
// Two kinds of check, because the assertions come in two kinds:
//
//   per-step expectations -- this request, in this world, must produce this
//   decision, this reason, this absence of execution;
//
//   cross-vector invariants -- properties that must hold of EVERY observation
//   the subject ever produced. AD-003 ("execution implies a grant") is not a
//   scenario, it is a universally quantified statement, and checking it over
//   every step is stronger than checking it in one.

import { Scope } from './scope'
import { executed } from './types'
import type { ConformanceSubject, Observation, Step, World } from './types'

export interface Vector {
  name: string
  assertion: string
  rules_out: string
  note?: string
  steps: Step[]
  world: World
  checksCapabilitySurface: boolean
  isRate: boolean
}

export const REQUIRED_EVIDENCE_FIELDS = [
  'trace_id',
  'request_id',
  'principal_class',
  'decision',
  'reason',
  'policy_version',
] as const

/** Raw JSON as it appears in `data/vectors/*.json`. */
export interface RawVector {
  assertion: string
  rules_out?: string
  note?: string
  steps: Step[]
  world?: string
  capability_surface_matches_descriptors?: boolean
  rate?: boolean
}

export function loadSuite(
  rawVectors: Record<string, RawVector>,
  worlds: Record<string, World>,
): Vector[] {
  return Object.keys(rawVectors)
    .sort()
    .map((name) => {
      const raw = rawVectors[name]
      return {
        name,
        assertion: raw.assertion,
        rules_out: raw.rules_out ?? '',
        note: raw.note,
        steps: raw.steps,
        world: worlds[raw.world ?? 'reference'],
        checksCapabilitySurface: raw.capability_surface_matches_descriptors === true,
        isRate: raw.rate === true,
      }
    })
}

// -- per-step expectations -------------------------------------------------

export function checkExpectations(step: Step, observation: Observation | null): string[] {
  const expect = step.expect
  if (!expect) return []
  if (observation === null) return ['step produced no observation but carried expectations']

  const failures: string[] = []
  const show = (v: unknown) => JSON.stringify(v) ?? String(v)

  const cmp = (key: string, actual: unknown) => {
    if (key in expect && expect[key] !== actual) {
      failures.push(key + ': expected ' + show(expect[key]) + ', got ' + show(actual))
    }
  }

  cmp('decision', observation.decision)
  cmp('reason', observation.reason)
  cmp('granted', observation.granted)
  cmp('executed', executed(observation))
  cmp('cache_hit', observation.cache_hit)
  cmp('result_present', observation.result_present)
  cmp('dataset', observation.dataset)
  cmp('capability', observation.capability)
  if ('policy_id' in expect) cmp('policy_id', observation.policy_id)

  if (expect.rationale_present && !observation.rationale) {
    failures.push('rationale_present: no rationale on the observation')
  }
  if ('mcp_calls_nonempty' in expect && observation.mcp_calls.length > 0 !== expect.mcp_calls_nonempty) {
    failures.push('mcp_calls: ' + show(observation.mcp_calls))
  }
  if ('a2a_calls_nonempty' in expect && observation.a2a_calls.length > 0 !== expect.a2a_calls_nonempty) {
    failures.push('a2a_calls: ' + show(observation.a2a_calls))
  }
  if ('error_contains' in expect) {
    const needle = expect.error_contains as string
    if (!observation.errors.some((e) => e.includes(needle))) {
      failures.push('error_contains ' + show(needle) + ': errors were ' + show(observation.errors))
    }
  }

  const rows = observation.evidence
  if ('evidence_rows' in expect && rows.length !== expect.evidence_rows) {
    failures.push('evidence_rows: expected ' + show(expect.evidence_rows) + ', got ' + rows.length)
  }
  if (expect.evidence_complete) {
    for (const row of rows) {
      const missing = REQUIRED_EVIDENCE_FIELDS.filter((f) => !row[f]).map(String)
      if (row.dataset_id) {
        for (const f of ['dataset_version', 'dataset_revision', 'schema_version']) {
          if (!row[f]) missing.push(f)
        }
      }
      if (missing.length) failures.push('evidence row missing ' + show(missing))
    }
  }
  if ('evidence_decision' in expect) {
    const got = rows.map((r) => r.decision)
    if (!got.includes(expect.evidence_decision)) {
      failures.push('evidence_decision: expected ' + show(expect.evidence_decision) + ', got ' + show(got))
    }
  }
  if (expect.evidence_has_revision) {
    for (const row of rows) {
      if (row.dataset_id && !row.dataset_revision) {
        failures.push('evidence row names a dataset with no revision')
      }
    }
  }
  if ('evidence_revision' in expect) {
    const got = rows.map((r) => r.dataset_revision)
    if (!got.includes(expect.evidence_revision)) {
      failures.push('evidence_revision: expected ' + show(expect.evidence_revision) + ', got ' + show(got))
    }
  }
  if ('evidence_policy_version' in expect) {
    const got = rows.map((r) => r.policy_version)
    if (!got.includes(expect.evidence_policy_version)) {
      failures.push(
        'evidence_policy_version: expected ' + show(expect.evidence_policy_version) + ', got ' + show(got),
      )
    }
  }
  return failures
}

// -- cross-vector invariants -----------------------------------------------

export interface Invariant {
  assertion: string
  name: string
  holds: (step: Step, o: Observation) => boolean
  describe: string
}

export const INVARIANTS: readonly Invariant[] = [
  {
    assertion: 'AD-003',
    name: 'executed_implies_granted',
    holds: (_s, o) => !executed(o) || o.granted,
    describe: 'every observation in which anything ran also holds an authorization artifact',
  },
  {
    assertion: 'AD-004',
    name: 'refused_is_terminal',
    holds: (_s, o) => (o.decision !== 'REFUSED' ? true : !o.granted && !executed(o)),
    describe: 'no REFUSED observation carries a grant or a call',
  },
  {
    assertion: 'AD-005',
    name: 'indeterminate_is_terminal',
    holds: (_s, o) =>
      o.decision !== 'INDETERMINATE'
        ? true
        : !o.granted && !executed(o) && o.policy_id === null && Boolean(o.rationale),
    describe: 'no INDETERMINATE observation carries a grant, a call or a policy id',
  },
  {
    assertion: 'AD-007',
    name: 'scope_not_widened',
    holds: (_s, o) => {
      const grant = Scope.fromDict(o.grant_scope)
      const ran = Scope.fromDict(o.executed_scope)
      if (grant === null || ran === null) return true
      return grant.covers(ran)
    },
    describe: 'the scope executed under is never wider than the scope admitted',
  },
  {
    assertion: 'AD-015',
    name: 'prohibited_never_executes',
    holds: (step, o) => !step.prohibited || (!executed(o) && o.decision !== 'GRANTED'),
    describe: 'no step marked prohibited ever executed',
  },
]

// -- running ---------------------------------------------------------------

export interface AssertionResult {
  assertion: string
  passed: boolean
  detail: string
  numerator: number | null
  denominator: number | null
}

export interface SubjectReport {
  subject: string
  passed: boolean
  observations: number
  results: AssertionResult[]
  /** Every (step, observation) pair, in order, for the UI to render. */
  seen: Array<{ vector: string; index: number; step: Step; observation: Observation }>
}

function capabilitySurface(subject: ConformanceSubject, world: World): string[] {
  // AD-002 in both directions: nothing executable is undeclared, and nothing
  // declared is missing an implementation.
  const advertised = new Set(
    world.datasets.flatMap((d) => (d.capabilities ?? []).map((c) => d.dataset + ',' + c.name)),
  )
  const registered = new Set(subject.capabilities().map((c) => c.dataset + ',' + c.name))
  const problems: string[] = []
  const orphans = [...registered].filter((k) => !advertised.has(k)).sort()
  if (orphans.length) problems.push('executable with no descriptor entry: ' + JSON.stringify(orphans))
  const missing = [...advertised].filter((k) => !registered.has(k)).sort()
  if (missing.length) problems.push('advertised with no implementation: ' + JSON.stringify(missing))
  return problems
}

function summary(assertion: string, observations: number): string {
  const inv = INVARIANTS.find((i) => i.assertion === assertion)
  if (inv) return inv.describe + ' (' + observations + ' observations)'
  return 'vector expectations met'
}

export function run(subject: ConformanceSubject, suite: Vector[]): SubjectReport {
  const perAssertion = new Map<string, string[]>()
  const seen: SubjectReport['seen'] = []
  let prohibitedAttempts = 0
  let prohibitedExecutions = 0

  for (const vector of suite) {
    if (!perAssertion.has(vector.assertion)) perAssertion.set(vector.assertion, [])
    const problems = perAssertion.get(vector.assertion) as string[]

    subject.loadWorld(vector.world)
    subject.reset()

    if (vector.checksCapabilitySurface) {
      problems.push(...capabilitySurface(subject, vector.world))
    }

    vector.steps.forEach((step, index) => {
      let observation: Observation | null
      try {
        observation = subject.step(step)
      } catch (exc) {
        // A subject that raises has not conformed.
        const e = exc as Error
        problems.push(vector.name + ' step ' + index + ': raised ' + e.name + ': ' + e.message)
        return
      }
      if (observation === null) return
      seen.push({ vector: vector.name, index, step, observation })
      if (step.prohibited) {
        prohibitedAttempts += 1
        if (executed(observation) || observation.decision === 'GRANTED') {
          prohibitedExecutions += 1
        }
      }
      for (const failure of checkExpectations(step, observation)) {
        problems.push(vector.name + ' step ' + index + ': ' + failure)
      }
    })
  }

  for (const invariant of INVARIANTS) {
    const broken = seen
      .map((s, i) => (invariant.holds(s.step, s.observation) ? null : 'step ' + i))
      .filter((x): x is string => x !== null)
    if (broken.length) {
      if (!perAssertion.has(invariant.assertion)) perAssertion.set(invariant.assertion, [])
      ;(perAssertion.get(invariant.assertion) as string[]).push(
        'invariant ' + invariant.name + ' broken at ' + broken.slice(0, 4).join(', '),
      )
    }
  }

  const results: AssertionResult[] = []
  for (const assertion of [...perAssertion.keys()].sort()) {
    const problems = perAssertion.get(assertion) as string[]
    const result: AssertionResult = {
      assertion,
      passed: problems.length === 0,
      detail: problems.length ? problems.slice(0, 3).join('; ') : summary(assertion, seen.length),
      numerator: null,
      denominator: null,
    }
    if (assertion === 'AD-015') {
      result.numerator = prohibitedExecutions
      result.denominator = prohibitedAttempts
      if (!problems.length) {
        result.detail = prohibitedExecutions + '/' + prohibitedAttempts + ' prohibited steps executed'
      }
    }
    results.push(result)
  }

  return {
    subject: subject.name,
    passed: results.every((r) => r.passed),
    observations: seen.length,
    results,
    seen,
  }
}
