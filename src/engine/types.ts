// Types for the conformance interface, transcribed from
// `agentic_dataset_conformance/interface.py`. Nothing here is invented: the
// Observation fields are the whole observable surface the contract defines,
// and a property that cannot be established from one is not part of it.

export type Decision = 'GRANTED' | 'REFUSED' | 'INDETERMINATE'

export const DECISIONS: readonly Decision[] = ['GRANTED', 'REFUSED', 'INDETERMINATE']

export interface CapabilitySpec {
  name: string
  effect?: string
  sensitivity?: string
  policy?: string | null
  arguments?: string[]
  description?: string
}

export interface Descriptor {
  dataset: string
  revision?: string
  version?: string
  schema_version?: string | number
  capabilities?: CapabilitySpec[]
  prohibited?: string[]
  age_s?: number
  freshness?: { maximum_age_s?: number }
  policies?: string[]
  endpoints?: Record<string, string>
  description?: string
}

export interface PrincipalSpec {
  principal_class: string
  clearance: string
  grants: Record<string, string[]>
}

export interface World {
  datasets: Descriptor[]
  principals: Record<string, PrincipalSpec>
  policy_version?: string
  policy_budget_s?: number
}

export interface ScopeDict {
  principal_class: string
  dataset: string
  capabilities: string[]
  max_sensitivity: string
}

export interface Step {
  op: string
  prohibited?: boolean
  expect?: Record<string, unknown>
  [key: string]: unknown
}

export type EvidenceRow = Record<string, unknown>

export interface Observation {
  decision: Decision
  reason: string
  policy_id: string | null
  rationale: string | null
  granted: boolean
  grant_scope: ScopeDict | null
  executed_scope: ScopeDict | null
  dataset: string | null
  capability: string | null
  tool_calls: string[]
  mcp_calls: string[]
  a2a_calls: string[]
  cache_hit: boolean
  result_present: boolean
  evidence: EvidenceRow[]
  errors: string[]
}

/** Python exposes this as a property on Observation; TypeScript gets a function
 *  so the record stays plain data that can be structurally cloned or logged. */
export function executed(o: Observation): boolean {
  return o.tool_calls.length > 0 || o.mcp_calls.length > 0 || o.a2a_calls.length > 0
}

export interface RegisteredCapability {
  dataset: string
  name: string
  effect: string
  sensitivity: string
  policy: string | null
}

/** The four methods that make an implementation conformance-testable. */
export interface ConformanceSubject {
  name: string
  loadWorld(world: World): void
  capabilities(): RegisteredCapability[]
  step(step: Step): Observation | null
  reset(): void
}
