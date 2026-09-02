// A TypeScript transcription of `agentic_dataset_conformance/toy.py`, the
// worked example that ships inside the conformance distribution.
//
// It is deliberately boring, and deliberately faithful: grants are integers in
// a map, the cache is a map, and the interpreter is nine keywords. Everything
// interesting about the reference implementation is absent, which is the point
// -- if this passes the same vectors, the vectors are testing the contract and
// not an implementation's internals.
//
// Being a transcription rather than a fresh reading is the honest description.
// It establishes that the vectors execute outside Python. It does NOT establish
// interpretive independence, which needs a second person, not a second
// language.

import { Scope, SENSITIVITY } from './scope'
import type {
  CapabilitySpec,
  ConformanceSubject,
  Decision,
  Descriptor,
  EvidenceRow,
  Observation,
  PrincipalSpec,
  RegisteredCapability,
  ScopeDict,
  Step,
  World,
} from './types'

/** `execute` is the only door; refusing to open it throws, as in the original. */
export class PermissionError extends Error {}

export const POLICY_IDS: Record<string, string> = {
  MISSING_DESCRIPTOR: 'AD-POL-001',
  DESCRIPTOR_INVALID: 'AD-POL-002',
  UNREGISTERED_CAPABILITY: 'AD-POL-003',
  PROHIBITED_OPERATION: 'AD-POL-004',
  INSUFFICIENT_PRIVILEGE: 'AD-POL-005',
  CLASSIFICATION_EXCEEDS_CLEARANCE: 'AD-POL-006',
  SCHEMA_VERSION_MISMATCH: 'AD-POL-007',
  FRESHNESS_UNSATISFIABLE: 'AD-POL-008',
}

const KEYWORDS: ReadonlyArray<readonly [string, string]> = [
  ['compare', 'compare_batches'],
  ['outlier', 'detect_outliers'],
  ['yield', 'calculate_yield'],
  ['recovery', 'calculate_yield'],
  ['aggregate', 'aggregate'],
  ['search', 'search'],
  ['find', 'search'],
]

const STOPWORDS = new Set(['the', 'a', 'an', 'of', 'for', 'in', 'on', 'at', 'to'])

function intentKey(text: string): string[] {
  const words = text.toLowerCase().match(/[a-z0-9]+/g) ?? []
  return words.filter((w) => !STOPWORDS.has(w)).sort()
}

function capabilityOf(
  descriptor: Descriptor | null | undefined,
  name: string | null,
): CapabilitySpec | null {
  if (!descriptor || name === null) return null
  return (descriptor.capabilities ?? []).find((c) => c.name === name) ?? null
}

function copyPrincipal(spec: PrincipalSpec): PrincipalSpec {
  const grants: Record<string, string[]> = {}
  for (const [k, v] of Object.entries(spec.grants)) grants[k] = [...v]
  return { ...spec, grants }
}

/** Python's `min(a, b, key=SENSITIVITY.index)` -- the weaker of two levels. */
function weaker(a: string, b: string): string {
  return SENSITIVITY.indexOf(a as never) <= SENSITIVITY.indexOf(b as never) ? a : b
}

interface Grant {
  dataset: string
  revision: string
  capability: string
  scope: Scope
  expires_at: number
}

/**
 * Hooks a mutant can override. Each is the smallest edit that breaks exactly
 * one property, matching `mutations.py`, which is what makes "caught by the
 * assertion named for it" a meaningful claim rather than "caught by some
 * assertion".
 */
export interface ToyOverrides {
  /** AD-003: hand back a result without an authorization artifact. */
  executeWithoutGrant?: boolean
  /** AD-004: keep minting authority on a refusal. */
  refusalKeepsGrant?: boolean
  /** AD-006: treat an unregistered capability as allowed. */
  allowUnknownCapability?: boolean
  /** AD-008: drop the policy scope from the cache key. */
  cacheIgnoresPrincipal?: boolean
  /** AD-010: stop writing evidence for refusals. */
  refusalLeavesNoEvidence?: boolean
  /** AD-012: stop recording which rules applied. */
  omitPolicyVersion?: boolean
  /** AD-013 / AD-014: let a delegation execute a wider scope than was admitted. */
  delegationWidensScope?: boolean
}

export class ToyImplementation implements ConformanceSubject {
  name: string

  private nextId = 1
  private datasets: Record<string, Descriptor> = {}
  private implemented = new Set<string>()
  private principals: Record<string, PrincipalSpec> = {}
  private policyVersion = '0'
  private budgetS = 0.25

  private cache = new Map<string, unknown>()
  private grants = new Map<number, Grant>()
  private last: { grant: number; scope: Scope } | null = null

  constructor(
    name = 'toy-ts',
    private readonly overrides: ToyOverrides = {},
  ) {
    this.name = name
    this.reset()
  }

  private id(): number {
    return this.nextId++
  }

  private static key(dataset: string, capability: string): string {
    return dataset + ' ' + capability
  }

  // -- interface ----------------------------------------------------------

  loadWorld(world: World): void {
    this.datasets = {}
    for (const d of world.datasets ?? []) this.datasets[d.dataset] = { ...d }
    // What this implementation actually has code for, fixed at load time.
    // Deriving it from the descriptors instead would make every advertised
    // capability executable by construction -- the defect AD-002 caught on the
    // original's first run.
    this.implemented = new Set(
      (world.datasets ?? []).flatMap((d) =>
        (d.capabilities ?? []).map((c) => ToyImplementation.key(d.dataset, c.name)),
      ),
    )
    this.principals = {}
    for (const [k, v] of Object.entries(world.principals ?? {})) {
      this.principals[k] = copyPrincipal(v)
    }
    this.policyVersion = world.policy_version ?? '0'
    this.budgetS = world.policy_budget_s ?? 0.25
    this.reset()
  }

  /**
   * Reported from `implemented`, not from the descriptors. Advertising a
   * capability and having one are different facts, and AD-002 is the assertion
   * that notices when they are conflated.
   */
  capabilities(): RegisteredCapability[] {
    const out: RegisteredCapability[] = []
    for (const [datasetId, d] of Object.entries(this.datasets)) {
      for (const c of d.capabilities ?? []) {
        if (!this.implemented.has(ToyImplementation.key(datasetId, c.name))) continue
        out.push({
          dataset: datasetId,
          name: c.name,
          effect: c.effect ?? 'read',
          sensitivity: c.sensitivity ?? 'internal',
          policy: c.policy ?? null,
        })
      }
    }
    return out
  }

  reset(): void {
    this.cache = new Map()
    this.grants = new Map()
    this.last = null
  }

  step(step: Step): Observation | null {
    switch (step.op) {
      case 'request':
        return this.opRequest(step)
      case 'delegate':
        return this.opDelegate(step)
      case 'grant':
        return this.opGrant(step)
      case 'revoke':
        return this.opRevoke(step)
      case 'set_revision':
        return this.opSetRevision(step)
      case 'set_policy_version':
        return this.opSetPolicyVersion(step)
      case 'register_descriptor':
        return this.opRegisterDescriptor(step)
      case 'reset':
        this.reset()
        return null
      default:
        throw new Error('unknown control verb: ' + step.op)
    }
  }

  // -- verbs --------------------------------------------------------------

  private opRequest(step: Step): Observation {
    const principal = this.principals[step.principal as string]
    const [datasetId, capabilityName] = this.resolve(step, principal)
    const descriptor = datasetId ? this.datasets[datasetId] : undefined

    const evaluator = (step.evaluator as { reachable?: boolean; latency_s?: number }) ?? {}
    if (evaluator.reachable === false) {
      return this.terminal(
        'INDETERMINATE',
        'EVALUATOR_UNAVAILABLE',
        principal,
        descriptor,
        capabilityName,
        'the policy authority could not be reached',
      )
    }
    if ((evaluator.latency_s ?? 0) > this.budgetS) {
      return this.terminal(
        'INDETERMINATE',
        'EVALUATOR_TIMEOUT',
        principal,
        descriptor,
        capabilityName,
        'the policy authority did not answer within the budget',
      )
    }

    const refusal = this.evaluate(step, principal, descriptor, capabilityName)
    if (refusal !== null) {
      return this.terminal('REFUSED', refusal, principal, descriptor, capabilityName)
    }

    const capability = capabilityOf(descriptor, capabilityName) as CapabilitySpec
    const scope = new Scope(
      principal.principal_class,
      datasetId as string,
      new Set([capabilityName as string]),
      weaker(capability.sensitivity ?? 'internal', principal.clearance),
    )
    const ttl = step.grant_ttl_s as number | undefined | null
    const grantId = this.id()
    this.grants.set(grantId, {
      dataset: datasetId as string,
      revision: descriptor!.revision as string,
      capability: capabilityName as string,
      scope,
      expires_at: Date.now() / 1000 + (ttl === undefined || ttl === null ? 300 : ttl),
    })
    this.last = { grant: grantId, scope }

    const cacheKey = JSON.stringify([
      intentKey(step.text as string),
      datasetId,
      descriptor!.revision,
      capabilityName,
      // A mutant that drops these three is AD-008: the cached answer stops
      // being scoped to the authorization that produced it.
      this.overrides.cacheIgnoresPrincipal ? null : scope.principal_class,
      this.overrides.cacheIgnoresPrincipal ? null : [...scope.capabilities].sort(),
      this.overrides.cacheIgnoresPrincipal ? null : scope.max_sensitivity,
      String(descriptor!.schema_version ?? '1'),
      step.freshness ?? null,
      this.policyVersion,
    ])

    const errors: string[] = []
    const executedCalls: string[] = []
    const cacheHit = this.cache.has(cacheKey)
    let result: unknown = this.cache.get(cacheKey)
    if (!cacheHit) {
      try {
        result = this.execute(grantId, datasetId as string, capabilityName as string)
        executedCalls.push(datasetId + '.' + capabilityName)
        this.cache.set(cacheKey, result)
      } catch (exc) {
        if (!(exc instanceof PermissionError)) throw exc
        errors.push(exc.message)
        result = undefined
      }
    }

    return this.observe({
      decision: 'GRANTED',
      reason: 'PRINCIPAL_AUTHORIZED',
      principal,
      descriptor,
      capabilityName,
      policyId: capability.policy ?? null,
      grantScope: scope,
      executedScope: executedCalls.length ? scope : null,
      toolCalls: executedCalls,
      cacheHit,
      resultPresent: result !== undefined && result !== null,
      errors,
    })
  }

  private opDelegate(step: Step): Observation {
    const requested = Scope.fromDict(step.scope as ScopeDict) as Scope
    const parent = this.last
    const errors: string[] = []
    const calls: string[] = []
    const widens = parent === null || !parent.scope.covers(requested)

    if (widens && !this.overrides.delegationWidensScope) {
      errors.push(step.channel + ' delegation widens the authorization scope')
    } else if (parent !== null) {
      try {
        this.execute(parent.grant, step.dataset as string, step.capability as string)
        calls.push(step.channel + '-target:' + step.dataset + '.' + step.capability)
      } catch (exc) {
        if (!(exc instanceof PermissionError)) throw exc
        errors.push(exc.message)
      }
    }

    return {
      decision: 'GRANTED',
      reason: 'PRINCIPAL_AUTHORIZED',
      policy_id: null,
      rationale: null,
      granted: parent !== null,
      grant_scope: parent !== null ? parent.scope.toDict() : null,
      executed_scope: calls.length ? requested.toDict() : null,
      dataset: step.dataset as string,
      capability: step.capability as string,
      tool_calls: [],
      mcp_calls: step.channel === 'mcp' ? [...calls] : [],
      a2a_calls: step.channel === 'a2a' ? [...calls] : [],
      cache_hit: false,
      result_present: false,
      evidence: [],
      errors,
    }
  }

  private opGrant(step: Step): null {
    const p = this.principals[step.principal as string]
    const dataset = step.dataset as string
    if (!p.grants[dataset]) p.grants[dataset] = []
    p.grants[dataset].push(step.capability as string)
    return null
  }

  private opRevoke(step: Step): null {
    delete this.principals[step.principal as string].grants[step.dataset as string]
    return null
  }

  private opSetRevision(step: Step): null {
    this.datasets[step.dataset as string].revision = step.revision as string
    return null
  }

  private opSetPolicyVersion(step: Step): null {
    this.policyVersion = step.version as string
    return null
  }

  private opRegisterDescriptor(step: Step): null {
    const d = step.descriptor as Descriptor
    this.datasets[d.dataset] = { ...d }
    return null
  }

  // -- the rules ----------------------------------------------------------

  private resolve(step: Step, principal: PrincipalSpec): [string | null, string | null] {
    let capability = (step.capability as string | undefined) ?? null
    if (capability === null) {
      const lowered = ' ' + (step.text as string).toLowerCase() + ' '
      const hit = KEYWORDS.find(([word]) => lowered.includes(word))
      capability = hit ? hit[1] : null
    }
    let dataset = (step.dataset as string | undefined) ?? null
    if (dataset === null) {
      const candidates = Object.entries(this.datasets)
        .filter(([, spec]) => (spec.capabilities ?? []).some((c) => c.name === capability))
        .map(([d]) => d)
      const allowed = candidates.filter((d) => (principal.grants[d] ?? []).length > 0)
      dataset = (allowed.length ? allowed : candidates)[0] ?? null
    }
    return [dataset, capability]
  }

  private evaluate(
    step: Step,
    principal: PrincipalSpec,
    descriptor: Descriptor | undefined,
    capabilityName: string | null,
  ): string | null {
    if (!descriptor) return 'MISSING_DESCRIPTOR'
    if (!descriptor.revision || !(descriptor.capabilities ?? []).length) {
      return 'DESCRIPTOR_INVALID'
    }
    if (capabilityName === null) {
      return this.overrides.allowUnknownCapability ? null : 'UNREGISTERED_CAPABILITY'
    }
    if ((descriptor.prohibited ?? []).includes(capabilityName)) return 'PROHIBITED_OPERATION'
    const capability = capabilityOf(descriptor, capabilityName)
    if (!capability) {
      return this.overrides.allowUnknownCapability ? null : 'UNREGISTERED_CAPABILITY'
    }
    const expected = step.expected_schema_version as string | undefined
    if (expected !== undefined && expected !== String(descriptor.schema_version ?? '1')) {
      return 'SCHEMA_VERSION_MISMATCH'
    }
    const held = principal.grants[descriptor.dataset] ?? []
    if (!held.includes(capabilityName)) return 'INSUFFICIENT_PRIVILEGE'
    if (
      SENSITIVITY.indexOf(principal.clearance as never) <
      SENSITIVITY.indexOf((capability.sensitivity ?? 'internal') as never)
    ) {
      return 'CLASSIFICATION_EXCEEDS_CLEARANCE'
    }
    const freshness = step.freshness as number | undefined
    if (freshness !== undefined && (descriptor.age_s ?? 0) > freshness) {
      return 'FRESHNESS_UNSATISFIABLE'
    }
    return null
  }

  /** No grant, no execution. The only door. */
  private execute(grantId: number, dataset: string, capability: string): unknown {
    if (this.overrides.executeWithoutGrant) {
      return { dataset, capability, rows: 2 }
    }
    const grant = this.grants.get(grantId)
    if (!grant) throw new PermissionError('no approval token: execution is unreachable')
    if (Date.now() / 1000 > grant.expires_at) {
      throw new PermissionError('approval token has expired')
    }
    if (grant.dataset !== dataset || grant.capability !== capability) {
      throw new PermissionError('approval token is for a different dataset or capability')
    }
    if (grant.revision !== this.datasets[dataset].revision) {
      throw new PermissionError('approval token is for a different dataset revision')
    }
    if (!this.implemented.has(ToyImplementation.key(dataset, capability))) {
      throw new PermissionError(dataset + '.' + capability + ' is not a registered capability')
    }
    return { dataset, capability, rows: 2 }
  }

  // -- evidence -----------------------------------------------------------

  private terminal(
    decision: Decision,
    reason: string,
    principal: PrincipalSpec,
    descriptor: Descriptor | undefined,
    capabilityName: string | null,
    rationale: string | null = null,
  ): Observation {
    return this.observe({
      decision,
      reason,
      principal,
      descriptor,
      capabilityName,
      policyId: decision === 'REFUSED' ? (POLICY_IDS[reason] ?? null) : null,
      rationale,
      // AD-004's mutant: a refusal that still mints authority.
      grantScope:
        this.overrides.refusalKeepsGrant && decision === 'REFUSED' && descriptor
          ? new Scope(
              principal.principal_class,
              descriptor.dataset,
              new Set(capabilityName ? [capabilityName] : []),
              principal.clearance,
            )
          : null,
    })
  }

  private observe(args: {
    decision: Decision
    reason: string
    principal: PrincipalSpec
    descriptor: Descriptor | undefined
    capabilityName: string | null
    policyId?: string | null
    rationale?: string | null
    grantScope?: Scope | null
    executedScope?: Scope | null
    toolCalls?: string[]
    cacheHit?: boolean
    resultPresent?: boolean
    errors?: string[]
  }): Observation {
    const {
      decision,
      reason,
      principal,
      descriptor,
      capabilityName,
      policyId = null,
      rationale = null,
      grantScope = null,
      executedScope = null,
      toolCalls = [],
      cacheHit = false,
      resultPresent = false,
      errors = [],
    } = args

    const row: EvidenceRow = {
      trace_id: 'tr-' + this.id(),
      request_id: 'req-' + this.id(),
      principal_class: principal.principal_class,
      decision,
      reason,
      policy_version: this.overrides.omitPolicyVersion ? null : this.policyVersion,
      policy_id: policyId,
      rationale,
      capability: capabilityName,
      recorded_at: Date.now() / 1000,
    }
    if (descriptor && descriptor.revision) {
      row.dataset_id = descriptor.dataset
      row.dataset_version = descriptor.version
      row.dataset_revision = descriptor.revision
      row.schema_version = String(descriptor.schema_version ?? '1')
    }

    const suppress = this.overrides.refusalLeavesNoEvidence === true && decision === 'REFUSED'

    return {
      decision,
      reason,
      policy_id: policyId,
      rationale,
      granted: grantScope !== null,
      grant_scope: grantScope ? grantScope.toDict() : null,
      executed_scope: executedScope ? executedScope.toDict() : null,
      dataset: descriptor ? descriptor.dataset : null,
      capability: capabilityName,
      tool_calls: [...toolCalls],
      mcp_calls: [],
      a2a_calls: [],
      cache_hit: cacheHit,
      result_present: resultPresent,
      evidence: suppress ? [] : [row],
      errors: [...errors],
    }
  }
}
