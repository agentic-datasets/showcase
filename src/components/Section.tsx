import type { ReactNode } from 'react'

export default function Section({
  id,
  title,
  children,
  alt = false,
}: {
  id: string
  title: string
  children: ReactNode
  alt?: boolean
}) {
  return (
    <section
      id={id}
      style={alt ? { background: 'var(--ground-alt)' } : undefined}
      className="border-t"
    >
      <div className="mx-auto w-full max-w-prose px-6 py-14 sm:py-20">
        <h2 className="mb-6 text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--ink-faint)' }}>
          {title}
        </h2>
        {children}
      </div>
    </section>
  )
}
