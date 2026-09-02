import type { ScopeDict } from './types'

// Ordered weakest to strongest. Comparison lives here, not in the subject, so
// that two implementations cannot disagree about what "narrower" means.
export const SENSITIVITY = ['public', 'internal', 'confidential', 'restricted'] as const

export class Scope {
  constructor(
    readonly principal_class: string,
    readonly dataset: string,
    readonly capabilities: ReadonlySet<string>,
    readonly max_sensitivity: string,
  ) {}

  static fromDict(raw: ScopeDict | null | undefined): Scope | null {
    if (raw === null || raw === undefined) return null
    return new Scope(
      raw.principal_class,
      raw.dataset,
      new Set(raw.capabilities),
      raw.max_sensitivity,
    )
  }

  toDict(): ScopeDict {
    return {
      principal_class: this.principal_class,
      dataset: this.dataset,
      capabilities: [...this.capabilities].sort(),
      max_sensitivity: this.max_sensitivity,
    }
  }

  covers(other: Scope): boolean {
    if (this.principal_class !== other.principal_class) return false
    if (this.dataset !== other.dataset) return false
    for (const c of other.capabilities) if (!this.capabilities.has(c)) return false
    // Python raises ValueError on an unknown level and the caller returns
    // False; an unknown level must never widen a scope by accident.
    const mine = SENSITIVITY.indexOf(this.max_sensitivity as never)
    const theirs = SENSITIVITY.indexOf(other.max_sensitivity as never)
    if (mine < 0 || theirs < 0) return false
    return mine >= theirs
  }
}
