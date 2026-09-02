// Generated index of the normative suite. The vectors and worlds are CC0
// (see ./LICENSE) and are copied verbatim from the `reference` repository's
// conformance distribution -- not re-typed, not adapted. Regenerate with
// `make vectors` after copying a newer set in.

import v_ad_001_descriptor_valid from './vectors/ad-001-descriptor-valid.json'
import v_ad_002_capability_registered from './vectors/ad-002-capability-registered.json'
import v_ad_003_grant_required_for_execution from './vectors/ad-003-grant-required-for-execution.json'
import v_ad_004_refusal_has_no_grant from './vectors/ad-004-refusal-has-no-grant.json'
import v_ad_005_indeterminate_has_no_grant from './vectors/ad-005-indeterminate-has-no-grant.json'
import v_ad_006_unknown_capability_denied from './vectors/ad-006-unknown-capability-denied.json'
import v_ad_007_authorization_scope_preserved from './vectors/ad-007-authorization-scope-preserved.json'
import v_ad_008_cache_is_policy_scoped from './vectors/ad-008-cache-is-policy-scoped.json'
import v_ad_009_provenance_complete from './vectors/ad-009-provenance-complete.json'
import v_ad_010_refusal_recorded from './vectors/ad-010-refusal-recorded.json'
import v_ad_011_dataset_revision_recorded from './vectors/ad-011-dataset-revision-recorded.json'
import v_ad_012_policy_version_recorded from './vectors/ad-012-policy-version-recorded.json'
import v_ad_013_mcp_preserves_scope from './vectors/ad-013-mcp-preserves-scope.json'
import v_ad_014_a2a_preserves_scope from './vectors/ad-014-a2a-preserves-scope.json'
import v_ad_015_prohibited_execution_rate_zero from './vectors/ad-015-prohibited-execution-rate-zero.json'
import w_reference from './worlds/reference.json'

import type { RawVector } from '../runner'
import type { World } from '../types'

export const RAW_VECTORS: Record<string, RawVector> = {
  'ad-001-descriptor-valid': v_ad_001_descriptor_valid as RawVector,
  'ad-002-capability-registered': v_ad_002_capability_registered as RawVector,
  'ad-003-grant-required-for-execution': v_ad_003_grant_required_for_execution as RawVector,
  'ad-004-refusal-has-no-grant': v_ad_004_refusal_has_no_grant as RawVector,
  'ad-005-indeterminate-has-no-grant': v_ad_005_indeterminate_has_no_grant as RawVector,
  'ad-006-unknown-capability-denied': v_ad_006_unknown_capability_denied as RawVector,
  'ad-007-authorization-scope-preserved': v_ad_007_authorization_scope_preserved as RawVector,
  'ad-008-cache-is-policy-scoped': v_ad_008_cache_is_policy_scoped as RawVector,
  'ad-009-provenance-complete': v_ad_009_provenance_complete as RawVector,
  'ad-010-refusal-recorded': v_ad_010_refusal_recorded as RawVector,
  'ad-011-dataset-revision-recorded': v_ad_011_dataset_revision_recorded as RawVector,
  'ad-012-policy-version-recorded': v_ad_012_policy_version_recorded as RawVector,
  'ad-013-mcp-preserves-scope': v_ad_013_mcp_preserves_scope as RawVector,
  'ad-014-a2a-preserves-scope': v_ad_014_a2a_preserves_scope as RawVector,
  'ad-015-prohibited-execution-rate-zero': v_ad_015_prohibited_execution_rate_zero as RawVector,
}

export const WORLDS: Record<string, World> = {
  'reference': w_reference as unknown as World,
}
