// The canonical mark, inlined so it inherits text colour and inverts in dark
// mode with no second asset — the mechanism brand/README.md specifies. Kept
// byte-faithful to brand/agentic-dataset-mark.svg: two shapes, no gradient.
export default function Mark({ size = 64, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      width={size}
      height={size}
      role="img"
      aria-label="Agentic Dataset"
      className={className}
    >
      <title>Agentic Dataset</title>
      <g fill="none" stroke="currentColor" strokeWidth={6} strokeLinecap="butt">
        <path d="M24 11 H11 V53 H53 V11 H40" />
      </g>
      <rect x={24} y={24} width={16} height={16} fill="currentColor" />
    </svg>
  )
}
