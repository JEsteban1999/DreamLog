interface DayCell {
  date: string;
  quality: number | null;
}

// Rampa "noche → alba": frío (baja) → cálido (alta). Usa los tokens --heat0..4.
function qualityColorVar(quality: number | null): string {
  if (quality === null) return "var(--heat0)";
  if (quality <= 3) return "var(--heat1)";
  if (quality <= 6) return "var(--heat2)";
  if (quality <= 8) return "var(--heat3)";
  return "var(--heat4)";
}

export function QualityCalendarHeatmap({ data }: { data: DayCell[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-faint">Aún no hay registros para mostrar.</p>;
  }

  // Agrupar por semana (columnas), empezando el domingo de la primera fecha.
  const first = new Date(data[0].date);
  const startOffset = first.getDay();
  const padded: (DayCell | null)[] = [...Array(startOffset).fill(null), ...data];
  const weeks: (DayCell | null)[][] = [];
  for (let i = 0; i < padded.length; i += 7) {
    weeks.push(padded.slice(i, i + 7));
  }

  return (
    <div>
      <div className="flex gap-1 overflow-x-auto pb-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((day, di) =>
              day ? (
                <div
                  key={di}
                  title={`${day.date}${day.quality !== null ? ` · calidad ${day.quality}/10` : " · sin datos"}`}
                  className="h-3.5 w-3.5 rounded-[3px]"
                  style={{ background: qualityColorVar(day.quality) }}
                />
              ) : (
                <div key={di} className="h-3.5 w-3.5" />
              )
            )}
          </div>
        ))}
      </div>
      <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-faint">
        <span>noche</span>
        {(["--heat1", "--heat2", "--heat3", "--heat4"] as const).map((v) => (
          <span key={v} className="h-3 w-3 rounded-[3px]" style={{ background: `var(${v})` }} />
        ))}
        <span>alba</span>
      </div>
    </div>
  );
}
