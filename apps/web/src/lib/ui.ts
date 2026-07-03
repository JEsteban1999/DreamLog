// Clases Tailwind compartidas del sistema "Ocaso → Alba".
// Centralizadas para consistencia entre pantallas.

export const card = "rounded-2xl border border-hair bg-card";

export const input =
  "w-full rounded-[10px] border border-hair bg-canvas px-3 py-2.5 text-sm text-ink " +
  "placeholder:text-faint focus:border-cool focus:outline-none focus:ring-2 focus:ring-cool/30";

export const label = "mb-1.5 block text-[13px] font-medium text-muted";

export const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-[11px] bg-primary px-4 py-2.5 " +
  "text-sm font-semibold text-primaryfg transition hover:opacity-90 disabled:opacity-50";

export const btnSecondary =
  "inline-flex items-center justify-center gap-2 rounded-[11px] border border-hair bg-transparent " +
  "px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-card2 disabled:opacity-50";

export const btnGhost =
  "inline-flex items-center justify-center gap-1.5 rounded-[11px] px-3 py-2 text-sm font-semibold " +
  "text-cool transition hover:opacity-80 disabled:opacity-50";

/** Título de página en serif. */
export const pageTitle = "font-serif text-2xl font-semibold tracking-tight text-ink";

/** Cifra grande en serif (KPIs, calidad). */
export const statNumber = "font-serif text-3xl font-semibold leading-none tnum text-ink";
