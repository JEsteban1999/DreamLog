interface DayCell {
  date: string;
  quality: number | null;
}

function qualityColorClass(quality: number | null): string {
  if (quality === null) return "bg-slate-100 dark:bg-slate-800";
  if (quality <= 3) return "bg-red-400 dark:bg-red-600";
  if (quality <= 6) return "bg-amber-300 dark:bg-amber-500";
  if (quality <= 8) return "bg-green-300 dark:bg-green-600";
  return "bg-green-500 dark:bg-green-400";
}

export function QualityCalendarHeatmap({ data }: { data: DayCell[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-slate-500">Aún no hay registros para mostrar.</p>;
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
      <div className="flex gap-1 overflow-x-auto pb-2">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((day, di) =>
              day ? (
                <div
                  key={di}
                  title={`${day.date}${day.quality !== null ? ` · calidad ${day.quality}/10` : " · sin datos"}`}
                  className={`h-3.5 w-3.5 rounded-sm ${qualityColorClass(day.quality)}`}
                />
              ) : (
                <div key={di} className="h-3.5 w-3.5" />
              )
            )}
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
        <span>Baja</span>
        <span className="h-3 w-3 rounded-sm bg-red-400 dark:bg-red-600" />
        <span className="h-3 w-3 rounded-sm bg-amber-300 dark:bg-amber-500" />
        <span className="h-3 w-3 rounded-sm bg-green-300 dark:bg-green-600" />
        <span className="h-3 w-3 rounded-sm bg-green-500 dark:bg-green-400" />
        <span>Alta</span>
      </div>
    </div>
  );
}
