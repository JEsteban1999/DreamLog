import { useId } from "react";

/** Marca "ocaso → alba": círculo con gradiente frío→cálido y una mordida (luna). */
export function Logo({ size = 26 }: { size?: number }) {
  const gradId = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 26 26" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={gradId} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="var(--cool)" />
          <stop offset="1" stopColor="var(--warm)" />
        </linearGradient>
      </defs>
      <circle cx="13" cy="13" r="11" fill={`url(#${gradId})`} />
      <circle cx="9" cy="10" r="8" fill="var(--bg2)" />
    </svg>
  );
}
