// A sealed block, cut open along one red incision.
export function Mark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
      <path d="M5 6.5 L19.5 6.5 L10.5 25.5 L5 25.5 Z" fill="currentColor" fillOpacity="0.9" />
      <path d="M23 6.5 L27 6.5 L27 25.5 L14 25.5 Z" fill="currentColor" fillOpacity="0.35" />
      <path d="M21.5 3 L10 29" stroke="var(--red)" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}
