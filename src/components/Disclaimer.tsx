/**
 * The warranty notice, in the same terms this author's other public sites
 * carry it.
 *
 * Deliberately smaller and dimmer than the licensing line above it: it has to
 * be present and readable, and it is not what anyone came here to read. The
 * substantive "what is not claimed" statements are sections of the page, not
 * footer text -- those are research claims and belong where they can be read.
 * This is the legal one.
 */
export default function Disclaimer({ ownership }: { ownership: React.ReactNode }) {
  return (
    <div className="mt-6 border-t pt-6" style={{ borderColor: 'var(--rule)' }}>
      <p className="text-xs leading-relaxed" style={{ color: 'var(--ink-faint)' }}>
        Provided <strong style={{ color: 'var(--ink-muted)' }}>as is</strong>, for demonstration and
        research only. No warranty of any kind, express or implied, including without limitation any
        warranty of merchantability, fitness for a particular purpose, accuracy, availability or
        non-infringement. No claim is made that it is complete, correct, reliable or continuously
        available, and it may change or be withdrawn without notice. It is a personal project,
        unaffiliated with the author&rsquo;s employer, and nothing here represents anyone&rsquo;s
        views but the author&rsquo;s. Use is entirely at your own risk, and to the fullest extent
        permitted by law the author accepts no liability or responsibility for any loss or damage
        whatsoever arising from its use.
      </p>
      <p className="mt-4 text-xs leading-relaxed" style={{ color: 'var(--ink-faint)' }}>
        {ownership}
      </p>
    </div>
  )
}
