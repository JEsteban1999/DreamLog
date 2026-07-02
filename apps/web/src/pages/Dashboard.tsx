import { useEffect, useRef, useState } from "react";
import type { SleepEntry, UserProfile } from "@dreamlog/shared";
import { apiClient } from "../lib/api-client";
import { QualityLineChart } from "../components/charts/QualityLineChart";
import { DurationBarChart } from "../components/charts/DurationBarChart";
import { MoodDonutChart } from "../components/charts/MoodDonutChart";
import { QualityCalendarHeatmap } from "../components/charts/QualityCalendarHeatmap";
import { CorrelationScatter } from "../components/charts/CorrelationScatter";
import { ExerciseComparisonChart } from "../components/charts/ExerciseComparisonChart";
import { exportDashboardToPdf } from "../lib/pdf-export";

interface SummaryStats {
  period_days: number;
  entries_count: number;
  avg_quality: number | null;
  avg_duration_hours: number | null;
}

const KPI_LABELS: Record<string, string> = {
  avg_duration_hours: "Horas promedio",
  avg_quality: "Calidad promedio",
  entries_count: "Registros (7 días)",
};

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
}

export function Dashboard() {
  const [stats, setStats] = useState<SummaryStats | null>(null);
  const [entries, setEntries] = useState<SleepEntry[] | null>(null);
  const [goalHours, setGoalHours] = useState(8);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const chartsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([
      apiClient.get<SummaryStats>("/sleep/stats/summary"),
      apiClient.get<{ entries: SleepEntry[] }>("/sleep?limit=90"),
      apiClient.get<UserProfile>("/user/profile"),
    ])
      .then(([summary, sleepRes, profile]) => {
        setStats(summary);
        setEntries(sleepRes.entries);
        setGoalHours(profile.goal_hours ?? 8);
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  const allEntries = (entries ?? [])
    .slice()
    .reverse(); // la API devuelve desc, los gráficos quieren orden cronológico

  const completeEntries = allEntries.filter((e) => e.is_complete);

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

  const heatmapData = allEntries.map((e) => ({
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

  async function handleExportPdf() {
    if (!chartsRef.current) return;
    setExporting(true);
    try {
      await exportDashboardToPdf(chartsRef.current, completeEntries);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al generar el PDF");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Dashboard</h2>
        <button
          type="button"
          onClick={handleExportPdf}
          disabled={exporting || completeEntries.length === 0}
          className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900"
        >
          {exporting ? "Generando PDF..." : "Descargar PDF"}
        </button>
      </div>

      {error && <p className="mb-4 text-sm text-red-500">Error al cargar datos: {error}</p>}

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {(Object.keys(KPI_LABELS) as Array<keyof typeof KPI_LABELS>).map((key) => (
          <div key={key} className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
            <p className="text-sm text-slate-500">{KPI_LABELS[key]}</p>
            <p className="mt-1 text-2xl font-semibold">
              {stats ? (stats[key as keyof SummaryStats] ?? "--") : "..."}
            </p>
          </div>
        ))}
      </div>

      {stats && stats.entries_count === 0 && (
        <p className="mb-6 text-sm text-slate-500">
          Aún no hay registros. Ve a "Registro" para tu primera noche.
        </p>
      )}

      <div ref={chartsRef} className="bg-white dark:bg-slate-950">
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
    </div>
  );
}
