export * from './types'
export * from './scope'
export * from './toy'
export * from './runner'
export * from './mutants'

import { RAW_VECTORS, WORLDS } from './data'
import { loadSuite } from './runner'
import type { Vector } from './runner'

/** The normative suite, loaded once. */
export const SUITE: Vector[] = loadSuite(RAW_VECTORS, WORLDS)

export { RAW_VECTORS, WORLDS }
