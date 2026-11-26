export function Logo({ compact = false }) {
  return (
    <span className="logo">
      <svg viewBox="0 0 64 64" width="28" height="28" aria-hidden="true">
        <rect width="64" height="64" rx="16" fill="#143A7A" />
        <path d="M14 46V18l18 20 18-20v28" fill="none" stroke="#E9F0FF" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="50" cy="13" r="4" fill="#FFB86B" />
      </svg>
      {compact ? <span className="sr-only">Mirai</span> : <span className="logo__word">Mirai</span>}
    </span>
  );
}
