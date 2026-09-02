import { ToyImplementation } from './toy'
import type { ToyOverrides } from './toy'
import type { ConformanceSubject } from './types'

/**
 * Deliberately broken variants, and the assertion that must notice.
 *
 * The contract is not "some assertion fails". It is that the assertion NAMED
 * here is the one that catches it -- which is what makes the suite diagnostic
 * rather than merely sensitive. The upstream `mutations.py` carries seventeen;
 * these seven are the subset whose breakage is legible in a browser, one per
 * distinct failure mode.
 */
export interface Mutant {
  id: string
  label: string
  /** The assertion that must catch this, and no other. */
  target: string
  /** What was changed, in one sentence. */
  edit: string
  /** Why an implementation might plausibly do this. */
  plausible: string
  overrides: ToyOverrides
}

export const MUTANTS: readonly Mutant[] = [
  {
    id: 'execute-without-grant',
    label: 'Execute without a grant',
    target: 'AD-003',
    edit: 'The execution path stops checking for an authorization artifact and just runs.',
    plausible:
      'The check looks redundant: admission already decided, so why re-verify at the door?',
    overrides: { executeWithoutGrant: true },
  },
  {
    id: 'refusal-keeps-grant',
    label: 'Refusal still mints authority',
    target: 'AD-004',
    edit: 'A REFUSED decision continues to attach a grant to its observation.',
    plausible:
      'The grant is built before the decision branch, and nothing clears it on the refusal path.',
    overrides: { refusalKeepsGrant: true },
  },
  {
    id: 'allow-unknown-capability',
    label: 'Default-allow on an unknown tool',
    target: 'AD-006',
    edit: 'A capability with no descriptor entry is treated as permitted instead of refused.',
    plausible: 'The registry lookup returns null and the code reads null as "no restriction".',
    overrides: { allowUnknownCapability: true },
  },
  {
    id: 'cache-ignores-principal',
    label: 'Cache key drops the scope',
    target: 'AD-008',
    edit: 'The cache key keeps the query and the revision but forgets who asked and under what scope.',
    plausible: 'It raises the hit rate, and the answer for the same question does look identical.',
    overrides: { cacheIgnoresPrincipal: true },
  },
  {
    id: 'refusal-leaves-no-evidence',
    label: 'Refusals leave no evidence',
    target: 'AD-010',
    edit: 'Evidence rows are written for grants but not for refusals.',
    plausible: 'Nothing happened, so there is nothing to record -- the most natural mistake here.',
    overrides: { refusalLeavesNoEvidence: true },
  },
  {
    id: 'omit-policy-version',
    label: 'Evidence omits the policy version',
    target: 'AD-012',
    edit: 'The evidence row stops naming which version of the rules decided.',
    plausible: 'The current version is implicit -- until the rules change and the record cannot say which applied.',
    overrides: { omitPolicyVersion: true },
  },
  {
    id: 'delegation-widens-scope',
    label: 'Delegation widens the scope',
    target: 'AD-013',
    edit: 'A cross-boundary call executes the scope it asked for rather than the one it was admitted under.',
    plausible: 'The remote side is trusted, so the requested scope is passed straight through.',
    overrides: { delegationWidensScope: true },
  },
]

export function subjectFor(mutant: Mutant | null): ConformanceSubject {
  if (mutant === null) return new ToyImplementation('toy-ts')
  return new ToyImplementation('toy-ts/' + mutant.id, mutant.overrides)
}
