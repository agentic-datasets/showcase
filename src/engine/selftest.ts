// Checks the TypeScript subject against the numbers the Python subject
// produces from the same vectors. Run with `make selftest`.
//
// The baseline is not a magic constant: it is what
// `run(ToyImplementation(), load_suite())` reports in the reference
// repository's conformance distribution. If the port drifts, this fails.

import { SUITE, run, ToyImplementation, MUTANTS, subjectFor } from './index'

const BASELINE = {
  assertions: 15,
  observations: 77,
  prohibitedAttempts: 39,
  prohibitedExecutions: 0,
}

let failures = 0

function check(label: string, actual: unknown, expected: unknown): void {
  const ok = JSON.stringify(actual) === JSON.stringify(expected)
  if (!ok) failures += 1
  const mark = ok ? 'ok  ' : 'FAIL'
  console.log(`${mark} ${label}: ${JSON.stringify(actual)}${ok ? '' : ' != ' + JSON.stringify(expected)}`)
}

console.log('-- clean subject vs the Python baseline --')
const report = run(new ToyImplementation(), SUITE)
check('vectors loaded', SUITE.length, 15)
check('assertions reported', report.results.length, BASELINE.assertions)
check('observations', report.observations, BASELINE.observations)
check('all assertions pass', report.passed, true)

const ad015 = report.results.find((r) => r.assertion === 'AD-015')
check('AD-015 prohibited attempts', ad015?.denominator, BASELINE.prohibitedAttempts)
check('AD-015 prohibited executions', ad015?.numerator, BASELINE.prohibitedExecutions)

const failed = report.results.filter((r) => !r.passed)
if (failed.length) {
  console.log('\nfailing assertions:')
  for (const f of failed) console.log('   ' + f.assertion + ': ' + f.detail)
}

console.log('\n-- each mutant is caught by the assertion named for it --')
for (const mutant of MUTANTS) {
  const r = run(subjectFor(mutant), SUITE)
  const broken = r.results.filter((x) => !x.passed).map((x) => x.assertion)
  const caughtByTarget = broken.includes(mutant.target)
  if (!caughtByTarget) failures += 1
  const mark = caughtByTarget ? 'ok  ' : 'FAIL'
  console.log(
    `${mark} ${mutant.id.padEnd(28)} target ${mutant.target}  caught by [${broken.join(', ') || 'nothing'}]`,
  )
}

console.log('')
if (failures > 0) {
  console.log(`${failures} check(s) failed`)
  process.exit(1)
}
console.log('all checks passed')
