const muted = { color: 'var(--ink-muted)' }
const faint = { color: 'var(--ink-faint)' }
const rule = { borderColor: 'var(--rule)' }

const ORG = 'https://github.com/agentic-datasets'

const INTERFACE: Array<[string, string]> = [
  ['loadWorld(world)', 'adopt descriptors, principals and a policy version'],
  ['capabilities()', 'report every operation it will actually execute'],
  ['step(step)', 'run one control verb, return an Observation'],
  ['reset()', 'forget cache and evidence'],
]

const OBSERVATION_FIELDS = [
  'decision',
  'reason',
  'policy_id',
  'rationale',
  'granted',
  'grant_scope',
  'executed_scope',
  'dataset',
  'capability',
  'tool_calls',
  'mcp_calls',
  'a2a_calls',
  'cache_hit',
  'result_present',
  'evidence',
  'errors',
]

const VERBS = [
  'request',
  'delegate',
  'grant',
  'revoke',
  'set_revision',
  'set_policy_version',
  'register_descriptor',
  'reset',
]

const BASELINE: Array<[string, string, string]> = [
  ['assertions passing', '15 / 15', '15 / 15'],
  ['observations produced', '77', '77'],
  ['prohibited steps executed', '0 / 39', '0 / 39'],
]

function Sub({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-3 mt-10 text-sm font-semibold first:mt-0">{children}</h3>
}

function Code({ children }: { children: React.ReactNode }) {
  return <code className="font-mono text-[0.92em]">{children}</code>
}

export default function HowItWorks() {
  return (
    <div>
      <Sub>The interface a subject implements</Sub>
      <p className="leading-relaxed" style={muted}>
        Four methods. Every one is something a governed data service would already have to do; none
        of them exists only for the test.
      </p>
      <dl className="mt-4 space-y-2 rounded-sm border p-4 text-xs" style={rule}>
        {INTERFACE.map(([sig, meaning]) => (
          <div key={sig} className="sm:flex sm:gap-4">
            <dt className="font-mono sm:w-52 sm:shrink-0">{sig}</dt>
            <dd style={muted}>{meaning}</dd>
          </div>
        ))}
      </dl>

      <Sub>What a vector is</Sub>
      <p className="leading-relaxed" style={muted}>
        A vector is a <strong>world</strong> plus a sequence of <strong>steps</strong>. The world is
        JSON: three datasets with their descriptors, four principals with a clearance and a set of
        standing entitlements, and a policy version. Each step is one of eight control verbs, and may
        carry an <Code>expect</Code> block stating what the resulting Observation must contain.
      </p>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {VERBS.map((v) => (
          <span
            key={v}
            className="rounded-sm border px-2 py-1 font-mono text-[11px]"
            style={{ ...rule, ...muted }}
          >
            {v}
          </span>
        ))}
      </div>
      <p className="mt-4 leading-relaxed" style={muted}>
        Fifteen vectors, one per assertion, totalling 85 steps. They are JSON files, not code, which
        is what makes them runnable by an implementation in any language.
      </p>

      <Sub>What an Observation is</Sub>
      <p className="leading-relaxed" style={muted}>
        The entire observable surface of a subject after one step. There is no handle to a policy
        object, a ledger or a capability registry, because an implementation in another language
        would not have those and the contract must not require them.
      </p>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {OBSERVATION_FIELDS.map((f) => (
          <span
            key={f}
            className="rounded-sm border px-2 py-1 font-mono text-[11px]"
            style={{ ...rule, ...faint }}
          >
            {f}
          </span>
        ))}
      </div>
      <p className="mt-4 leading-relaxed" style={muted}>
        This is the load-bearing design decision:{' '}
        <strong>
          if a property cannot be established from an Observation, a world and a sequence of steps,
          it is not part of the portable contract
        </strong>
        . Everything the showcases below display is read off one of these records.
      </p>

      <Sub>What is running on this page</Sub>
      <p className="leading-relaxed" style={muted}>
        A TypeScript transcription of <Code>toy.py</Code>, the worked example that ships inside the
        conformance distribution, implementing the four methods above. It is driven by the{' '}
        <strong>same vectors</strong>, copied byte-for-byte from{' '}
        <a href={`${ORG}/reference`}>reference</a> and never edited here &mdash; they are CC0, and the
        copy travels with its licence.
      </p>
      <p className="mt-4 leading-relaxed" style={muted}>
        Everything is computed in this page. No server, no model, no network call after load. The
        interpreter that turns a phrase into a capability is nine keywords, deliberately, so that
        what you are watching is the admission decision and not a language model&rsquo;s opinion of
        it.
      </p>

      <Sub>Two kinds of check</Sub>
      <p className="leading-relaxed" style={muted}>
        The assertions come in two kinds, and both run above.
      </p>
      <ul className="mt-4 space-y-3 leading-relaxed" style={muted}>
        <li>
          <strong>Per-step expectations.</strong> This request, in this world, must produce this
          decision, this reason, this absence of execution. A step&rsquo;s <Code>expect</Code> block
          is compared field by field against the Observation &mdash; including{' '}
          <Code>policy_id: null</Code>, which is asserted rather than skipped.
        </li>
        <li>
          <strong>Cross-vector invariants.</strong> Properties that must hold of{' '}
          <em>every</em> Observation the subject ever produced. AD-003 &mdash; execution implies a
          grant &mdash; is not a scenario but a universally quantified statement, and checking it
          over all 77 observations is stronger than checking it in one.
        </li>
      </ul>

      <Sub>What the checks are pinned against</Sub>
      <p className="leading-relaxed" style={muted}>
        The numbers at the top of this page are not printed constants. They are computed here, and
        they are pinned against what the Python subject reports from the same vectors in the
        reference repository.
      </p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr>
              <th className="border-b py-2 pr-4 text-left font-semibold" style={rule}></th>
              <th className="border-b py-2 pr-4 text-left font-mono font-normal" style={{ ...rule, ...faint }}>
                Python
              </th>
              <th className="border-b py-2 text-left font-mono font-normal" style={{ ...rule, ...faint }}>
                TypeScript, here
              </th>
            </tr>
          </thead>
          <tbody>
            {BASELINE.map(([label, py, ts]) => (
              <tr key={label}>
                <td className="border-b py-2 pr-4" style={{ ...rule, ...muted }}>
                  {label}
                </td>
                <td className="border-b py-2 pr-4 font-mono tabular-nums" style={rule}>
                  {py}
                </td>
                <td className="border-b py-2 font-mono tabular-nums" style={rule}>
                  {ts}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 leading-relaxed" style={muted}>
        A second check covers the mutants: each of the seven deliberate defects must be caught by the
        assertion <em>named for it</em>, not merely by some assertion. Both checks run as{' '}
        <Code>make selftest</Code>, and CI runs them before every build &mdash; a port that drifts
        quietly from the baseline is the one failure this repository exists to rule out.
      </p>

      <Sub>Why a second language is the point</Sub>
      <p className="leading-relaxed" style={muted}>
        <Code>CONFORMANCE.md</Code> says an implementation in Rust, Go, TypeScript or Java can be
        checked without reproducing Python object semantics, because Python is one runner and not the
        specification. Every subject measured so far is Python, so that sentence has been an argument
        rather than a result. This page is the first subject that is not.
      </p>
      <p className="mt-4 leading-relaxed" style={muted}>
        What that is worth, and what it is not, is set out at the foot of this page.
      </p>
    </div>
  )
}
