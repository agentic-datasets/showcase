import { useMemo } from 'react'
import Mark from './components/Mark'
import Disclaimer from './components/Disclaimer'
import HowItWorks from './components/HowItWorks'
import ThemeToggle from './components/ThemeToggle'
import Admission from './showcases/Admission'
import LoadBearing from './showcases/LoadBearing'
import Boundary from './showcases/Boundary'
import Cache from './showcases/Cache'
import MutantHunt from './showcases/MutantHunt'
import { SUITE, ToyImplementation, run } from './engine'

const muted = { color: 'var(--ink-muted)' }
const faint = { color: 'var(--ink-faint)' }
const rule = { borderColor: 'var(--rule)' }

const ORG = 'https://github.com/agentic-datasets'
const DOCS = 'https://agentic-datasets.github.io/reference/'
const SITE = 'https://agentic-datasets.github.io/'

/** What the Python subject reports from the same vectors, in the reference
 *  repository. The point of this page is that the numbers below match. */
const PYTHON_BASELINE = { assertions: 15, observations: 77, prohibited: '0/39' }

const SHOWCASES = [
  {
    id: 'admission',
    n: '01',
    title: 'Admission',
    assertions: 'AD-001, AD-009, AD-010',
    lede: 'The decision to act is the unit of governance. Change who is asking, and watch the verdict, the deciding clause and the evidence row change with it.',
    Component: Admission,
  },
  {
    id: 'load-bearing',
    n: '02',
    title: 'The load-bearing four',
    assertions: 'AD-003, AD-004, AD-005, AD-006',
    lede: 'Six things an agent might try, none of them a prompt trick. If these four hold, a misbehaving model can produce a bad answer but not a policy violation.',
    Component: LoadBearing,
  },
  {
    id: 'boundary',
    n: '03',
    title: 'Scope across a boundary',
    assertions: 'AD-007, AD-013, AD-014',
    lede: 'Delegation over MCP or to another agent is the obvious escalation path. Ask the far side to run under a wider scope than was admitted and watch it refuse.',
    Component: Boundary,
  },
  {
    id: 'cache',
    n: '04',
    title: 'A cache that respects policy',
    assertions: 'AD-008',
    lede: 'Two principals, one question, one revision. The broken version is the tempting one, because it raises the hit rate and the answer looks identical.',
    Component: Cache,
  },
  {
    id: 'mutants',
    n: '05',
    title: 'Mutant hunt',
    assertions: 'all fifteen',
    lede: 'Break the implementation on purpose and run the whole suite. The claim is not that some assertion fails, but that the one named for the defect does.',
    Component: MutantHunt,
  },
]

export default function App() {
  const report = useMemo(() => run(new ToyImplementation(), SUITE), [])
  const ad015 = report.results.find((r) => r.assertion === 'AD-015')
  const matches =
    report.results.length === PYTHON_BASELINE.assertions &&
    report.observations === PYTHON_BASELINE.observations &&
    `${ad015?.numerator}/${ad015?.denominator}` === PYTHON_BASELINE.prohibited

  return (
    <div className="min-h-screen font-sans antialiased">
      <header className="mx-auto w-full max-w-3xl px-6 pb-12 pt-16 sm:pt-24">
        <div className="mb-8 flex items-start justify-between gap-6">
          <Mark size={72} />
          <ThemeToggle />
        </div>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Showcases</h1>
        <p className="mt-5 text-lg leading-relaxed" style={muted}>
          Five demonstrations of the agentic dataset contract, running the normative conformance
          vectors in this page. No server, no model, no network call &mdash; the decisions below are
          computed here as you click.
        </p>
        <nav className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <a href="#how">How this works</a>
          <a href={SITE}>Agentic Datasets</a>
          <a href={DOCS}>Reference documentation</a>
          <a href={ORG}>Repositories</a>
        </nav>
      </header>

      {/* The result that makes the rest of the page worth reading. */}
      <section className="border-t" style={{ ...rule, background: 'var(--ground-alt)' }}>
        <div className="mx-auto w-full max-w-3xl px-6 py-14">
          <h2
            className="mb-6 text-xs font-semibold uppercase tracking-[0.18em]"
            style={faint}
          >
            Live conformance run
          </h2>
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            <Stat figure={`${report.results.length}/${report.results.length}`} label="assertions pass" />
            <Stat figure={String(report.observations)} label="observations" />
            <Stat figure={`${ad015?.numerator}/${ad015?.denominator}`} label="prohibited steps executed" />
            <Stat figure={String(SUITE.length)} label="normative vectors" />
          </div>

          <div className="mt-8 grid grid-cols-5 gap-1.5 sm:grid-cols-15">
            {report.results.map((r) => (
              <div
                key={r.assertion}
                title={`${r.assertion}: ${r.detail}`}
                className="rounded-sm border px-1 py-1.5 text-center font-mono text-[11px]"
                style={{
                  borderColor: r.passed ? 'var(--rule)' : 'var(--ink)',
                  background: r.passed ? 'transparent' : 'var(--ink)',
                  color: r.passed ? 'var(--ink-muted)' : 'var(--ground)',
                }}
              >
                {r.assertion.replace('AD-', '')}
              </div>
            ))}
          </div>

          <p className="mt-8 text-sm leading-relaxed" style={muted}>
            The subject is a TypeScript transcription of the worked example that ships inside the
            conformance distribution. It is driven by the <strong>same CC0 vectors</strong>, copied
            unmodified, and it reproduces what the Python subject reports in the reference
            repository: {PYTHON_BASELINE.assertions} assertions,{' '}
            {PYTHON_BASELINE.observations} observations, {PYTHON_BASELINE.prohibited} prohibited
            steps executed.{' '}
            {matches ? (
              <>The numbers above were computed in your browser just now and they match.</>
            ) : (
              <>The numbers above were computed in your browser just now and they do not match.</>
            )}
          </p>
        </div>
      </section>

      <section id="how" className="border-t" style={rule}>
        <div className="mx-auto w-full max-w-3xl px-6 py-14 sm:py-20">
          <h2 className="mb-6 text-xs font-semibold uppercase tracking-[0.18em]" style={faint}>
            How this works
          </h2>
          <HowItWorks />
        </div>
      </section>

      {SHOWCASES.map(({ id, n, title, assertions, lede, Component }, i) => (
        <section
          key={id}
          id={id}
          className="border-t"
          style={i % 2 === 0 ? { ...rule, background: 'var(--ground-alt)' } : rule}
        >
          <div className="mx-auto w-full max-w-3xl px-6 py-14 sm:py-20">
            <div className="mb-2 flex items-baseline gap-3">
              <span className="font-mono text-xs" style={faint}>
                {n}
              </span>
              <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
            </div>
            <div className="mb-5 font-mono text-[11px] uppercase tracking-[0.14em]" style={faint}>
              {assertions}
            </div>
            <p className="mb-8 leading-relaxed" style={muted}>
              {lede}
            </p>
            <Component />
          </div>
        </section>
      ))}

      <section className="border-t" style={{ ...rule, background: 'var(--ground-alt)' }}>
        <div className="mx-auto w-full max-w-3xl px-6 py-14">
          <h2 className="mb-6 text-xs font-semibold uppercase tracking-[0.18em]" style={faint}>
            What this page is not evidence of
          </h2>
          <div className="space-y-5 leading-relaxed" style={muted}>
            <p>
              <strong>Not interpretive independence.</strong> The subject here is a transcription of
              the Python worked example, not a fresh reading of the specification, and the same
              person is behind both. It establishes that the vectors execute outside Python. It does
              not establish that two people reading the contract would build the same thing, which
              needs a second person and remains the contribution the project most needs.
            </p>
            <p>
              <strong>Not a security result.</strong> A subject&rsquo;s capability report is its own
              account of itself. One that under-reports passes the discovery assertion while
              concealing a tool. Conformance is a claim an implementation makes about itself, made
              checkable &mdash; not an adversarial audit.
            </p>
            <p>
              <strong>Not a performance or quality measurement.</strong> Latency, cost, and whether
              the right dataset was chosen are all unasserted here, deliberately. Governance is
              tested as an invariant; semantic quality is tested statistically. Running the two
              through one number destroys both.
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t" style={rule}>
        <div className="mx-auto w-full max-w-3xl px-6 py-10 text-sm leading-relaxed" style={faint}>
          <p>
            <a href={SITE}>agentic-datasets.github.io</a>
          </p>
          <Disclaimer
            ownership={
              <>
                Showcase source and all original code{' '}
                <strong style={{ color: 'var(--ink-muted)' }}>&copy; 2026 Alexander Chernov</strong>,
                MIT. The worlds and conformance vectors are CC0 1.0, copied unmodified from the{' '}
                <a href={`${ORG}/reference`}>reference</a> distribution; Roboto Slab is Apache 2.0.
                The mark is covered by none of those and is all rights reserved &mdash; see the{' '}
                <a href={`${ORG}/reference/blob/main/brand/README.md`}>brand notes</a>.
              </>
            }
          />
        </div>
      </footer>
    </div>
  )
}

function Stat({ figure, label }: { figure: string; label: string }) {
  return (
    <div>
      <div className="font-mono text-2xl font-medium tabular-nums">{figure}</div>
      <div className="mt-1 text-sm leading-relaxed" style={muted}>
        {label}
      </div>
    </div>
  )
}
