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
    <div ref={ref} className="bg-white dark:bg-slate-950">
      <div className="mb-6 rounded-lg border border-slate-200 p-4 dark:border-slate-800">
        <h3 className="mb-2 text-sm font-semibold text-slate-500">Calidad por día (últimos 90 días)</h3>
        <QualityCalendarHeatmap data={heatmapData} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
          <h3 className="mb-2 text-sm font-semibold text-slate-500">Calidad de sueño</h3>
          <QualityLineChart data={qualityData} />
        </div>
        <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
          <h3 className="mb-2 text-sm font-semibold text-slate-500">Duración vs. objetivo ({goalHours}h)</h3>
          <DurationBarChart data={durationData} goalHours={goalHours} />
        </div>
        <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
          <h3 className="mb-2 text-sm font-semibold text-slate-500">Ánimo al despertar</h3>
          <MoodDonutChart data={moodData} />
        </div>
        <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
          <h3 className="mb-2 text-sm font-semibold text-slate-500">Ejercicio: con vs. sin</h3>
          <ExerciseComparisonChart withExercise={qualityWithExercise} withoutExercise={qualityWithoutExercise} />
        </div>
        <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
          <h3 className="mb-2 text-sm font-semibold text-slate-500">Cafeína vs. calidad</h3>
          <CorrelationScatter data={caffeineData} xLabel="Tazas de café" />
        </div>
        <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
          <h3 className="mb-2 text-sm font-semibold text-slate-500">Estrés vs. calidad</h3>
          <CorrelationScatter data={stressData} xLabel="Nivel de estrés" />
        </div>
      </div>
    </div>
  );
});

export function getCompleteEntries(entries: SleepEntry[]): SleepEntry[] {
  return entries.filter((e) => e.is_complete);
}
