import { useEffect, useState } from "react";
import type { SleepEntry, UserProfile } from "@dreamlog/shared";
import { apiClient } from "../lib/api-client";
import { QualityLineChart } from "../components/charts/QualityLineChart";
import { DurationBarChart } from "../components/charts/DurationBarChart";
import { MoodDonutChart } from "../components/charts/MoodDonutChart";

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

export function Dashboard() {
  const [stats, setStats] = useState<SummaryStats | null>(null);
  const [entries, setEntries] = useState<SleepEntry[] | null>(null);
  const [goalHours, setGoalHours] = useState(8);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      apiClient.get<SummaryStats>("/sleep/stats/summary"),
      apiClient.get<{ entries: SleepEntry[] }>("/sleep?limit=30"),
      apiClient.get<UserProfile>("/user/profile"),
    ])
      .then(([summary, sleepRes, profile]) => {
        setStats(summary);
        setEntries(sleepRes.entries);
        setGoalHours(profile.goal_hours ?? 8);
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  const completeEntries = (entries ?? [])
    .filter((e) => e.is_complete)
    .slice()
    .reverse(); // la API devuelve desc, los gráficos quieren orden cronológico

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

  return (
    <div>
      <h2 className="mb-4 text-2xl font-semibold">Dashboard</h2>

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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
          <h3 className="mb-2 text-sm font-semibold text-slate-500">Calidad de sueño (últimos 30 días)</h3>
          <QualityLineChart data={qualityData} />
        </div>
        <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
          <h3 className="mb-2 text-sm font-semibold text-slate-500">Duración vs. objetivo ({goalHours}h)</h3>
          <DurationBarChart data={durationData} goalHours={goalHours} />
        </div>
        <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800 lg:col-span-2">
          <h3 className="mb-2 text-sm font-semibold text-slate-500">Ánimo al despertar</h3>
          <MoodDonutChart data={moodData} />
        </div>
      </div>
    </div>
  );
}
