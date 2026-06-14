/** Monogram logo: code brackets with an accent stroke "in French blue/red". */
export function BrandMark({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect width="64" height="64" rx="14" fill="#16171d" />
      <rect x="0.5" y="0.5" width="63" height="63" rx="13.5" stroke="#2a2c38" />
      <path
        d="M16 24L10 32L16 40"
        stroke="#e8b24a"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M48 24L54 32L48 40"
        stroke="#e8b24a"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M36 18L28 46" stroke="#e5484d" strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  );
}
