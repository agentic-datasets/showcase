import { useEffect, useState } from 'react'

type Theme = 'system' | 'light' | 'dark'

const KEY = 'theme'

const OPTIONS: { value: Theme; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
]

// Storage throws, not just returns null, in some contexts — a browser set to
// block site data, or a privacy mode. A theme choice is a convenience, so
// every access fails soft: the control still works for the session, it just
// does not persist.
function readStored(): Theme {
  try {
    const v = localStorage.getItem(KEY)
    return v === 'light' || v === 'dark' ? v : 'system'
  } catch {
    return 'system'
  }
}

// 'system' removes the attribute rather than setting one, which hands the
// decision back to the prefers-color-scheme rule in index.css. That is also
// why no media-query listener is needed: the CSS follows the OS on its own.
function applyTheme(theme: Theme) {
  const root = document.documentElement
  if (theme === 'system') root.removeAttribute('data-theme')
  else root.setAttribute('data-theme', theme)
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(readStored)

  useEffect(() => {
    applyTheme(theme)
    try {
      if (theme === 'system') localStorage.removeItem(KEY)
      else localStorage.setItem(KEY, theme)
    } catch {
      /* not persisted; the page is still correct for this session */
    }
  }, [theme])

  return (
    <div
      role="radiogroup"
      aria-label="Colour theme"
      className="flex overflow-hidden rounded-sm border text-[10px] uppercase tracking-[0.14em]"
      style={{ borderColor: 'var(--rule)' }}
    >
      {OPTIONS.map((o, i) => {
        const active = theme === o.value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setTheme(o.value)}
            className="px-2.5 py-1.5 transition-colors"
            style={{
              background: active ? 'var(--ink)' : 'transparent',
              color: active ? 'var(--ground)' : 'var(--ink-faint)',
              borderLeft: i === 0 ? undefined : '1px solid var(--rule)',
            }}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
