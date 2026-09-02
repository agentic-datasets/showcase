/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // The mark is two shapes, monochrome, no gradient. The palette holds to
      // that: one ink, one ground, one rule colour, and a single accent used
      // only for the admitted path.
      colors: {
        ink:    { DEFAULT: '#111111', muted: '#5b5b5b', faint: '#8a8a8a' },
        ground: { DEFAULT: '#ffffff', alt: '#f6f6f4' },
        rule:   '#e2e2de',
      },
      fontFamily: {
        sans: ['"Roboto Slab"', 'Charter', 'Georgia', 'ui-serif', 'serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      maxWidth: { prose: '46rem' },
      // Fifteen assertions want fifteen columns; the default scale stops at 12.
      gridTemplateColumns: { 15: 'repeat(15, minmax(0, 1fr))' },
    },
  },
  plugins: [],
}
