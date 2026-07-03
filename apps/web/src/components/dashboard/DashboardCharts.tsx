import { forwardRef } from "react";
import type { SleepEntry } from "@dreamlog/shared";
import { QualityLineChart } from "../charts/QualityLineChart";
import { DurationBarChart } from "../charts/DurationBarChart";
import { MoodDonutChart } from "../charts/MoodDonutChart";
import { QualityCalendarHeatmap } from "../charts/QualityCalendarHeatmap";
import { CorrelationScatter } from "../charts/CorrelationScatter";
import { ExerciseComparisonChart } from "../charts/ExerciseComparisonChart";

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-hair bg-card p-4 md:p-[18px]">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h3 className="text-[13px] font-semibold text-ink">{title}</h3>
        {subtitle && <span className="text-[11px] text-faint">{subtitle}</span>}
      </div>
      {children}
    </div>
  );
}

function GroupHeader({ dot, title, note }: { dot: string; title: string; note: string }) {
  return (
    <div className="mb-3.5 flex items-center gap-2.5">
      <span className="h-2 w-2 rounded-full" style={{ background: `var(${dot})` }} />
      <span className="text-[13px] font-semibold text-ink">{title}</span>
      <span className="hidden text-[12px] text-faint sm:inline">— {note}</span>
      <span className="h-px flex-1 bg-hairsoft" />
    </div>
  );
}

interface DashboardChartsProps {
  /** Entradas en orden cronológico ascendente (más vieja primero). */
  entries: SleepEntry[];
  goalHours: number;
}

export const DashboardCharts = forwardRef<HTMLDivElement, DashboardChartsProps>(function DashboardCharts(
  { entries, goalHours },
  ref
) {
  const completeEntries = entries.filter((e) => e.is_complete);

  const qualityData = completeEntries.map((e) => ({
    date: e.sleep_date.slice(5, 10),
    quality: e.sleep_quality ?? 0,
  }));

  const durationData = completeEntries.map((e) => ({
    date: e.sleep_date.slice(5, 10),
    duration: e.duration_hours ?? 0,
  }));

  const moodCounts = completeEntries.reduce<Record<string, number>>((acc, e) => {
    if (!e.mood_on_wake) return acc;
    acc[e.mood_on_wake] = (acc[e.mood_on_wake] ?? 0) + 1;
    return acc;
  }, {});
  const moodData = Object.entries(moodCounts).map(([mood, count]) => ({ mood, count }));

  const heatmapData = entries.map((e) => ({
    date: e.sleep_date.slice(0, 10),
    quality: e.is_complete ? e.sleep_quality ?? null : null,
  }));

  const caffeineData = completeEntries
    .filter((e) => e.sleep_quality != null)
    .map((e) => ({ x: e.caffeine_cups ?? 0, y: e.sleep_quality as number }));

  const stressData = completeEntries
    .filter((e) => e.sleep_quality != null && e.stress_level != null)
    .map((e) => ({ x: e.stress_level as number, y: e.sleep_quality as number }));

  const qualityWithExercise = average(
    completeEntries.filter((e) => e.exercise && e.sleep_quality != null).map((e) => e.sleep_quality as number)
  );
  const qualityWithoutExercise = average(
    completeEntries.filter((e) => !e.exercise && e.sleep_quality != null).map((e) => e.sleep_quality as number)
  );

  return (
    <div ref={ref} className="bg-canvas">
      {/* GRUPO A — resultados (lo que obtuviste al despertar) */}
      <GroupHeader dot="--warm" title="Tu descanso" note="lo que obtuviste al despertar" />
      <div className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ChartCard title="Calidad del sueño" subtitle="últimos días · objetivo 8">
            <QualityLineChart data={qualityData} />
          </ChartCard>
        </div>
        <ChartCard title="Ánimo al despertar">
          <MoodDonutChart data={moodData} />
        </ChartCard>
        <div className="lg:col-span-3">
          <ChartCard title="Calendario de calidad" subtitle="últimos 90 días">
            <QualityCalendarHeatmap data={heatmapData} />
          </ChartCard>
        </div>
        <div className="lg:col-span-3">
          <ChartCard title="Duración vs. objetivo" subtitle={`objetivo ${goalHours}h`}>
            <DurationBarChart data={durationData} goalHours={goalHours} />
          </ChartCard>
        </div>
      </div>

      {/* GRUPO B — factores (lo que registras antes de dormir) */}
      <GroupHeader dot="--cool" title="Qué lo afecta" note="factores que registras antes de dormir" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard title="Con vs. sin ejercicio">
          <ExerciseComparisonChart withExercise={qualityWithExercise} withoutExercise={qualityWithoutExercise} />
        </ChartCard>
        <ChartCard title="Café vs. calidad" subtitle="↘ más tazas, peor">
          <CorrelationScatter data={caffeineData} xLabel="Tazas de café" />
        </ChartCard>
        <ChartCard title="Estrés vs. calidad" subtitle="↘ más estrés, peor">
          <CorrelationScatter data={stressData} xLabel="Nivel de estrés" />
        </ChartCard>
      </div>
    </div>
  );
});

export function getCompleteEntries(entries: SleepEntry[]): SleepEntry[] {
  return entries.filter((e) => e.is_complete);
}
