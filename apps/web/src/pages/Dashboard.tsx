import { useEffect, useState } from "react";
import type { SleepEntry, UserProfile } from "@dreamlog/shared";
import { apiClient } from "../lib/api-client";
import { DashboardCharts } from "../components/dashboard/DashboardCharts";

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

  const chronologicalEntries = (entries ?? []).slice().reverse(); // la API devuelve desc

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

      <DashboardCharts entries={chronologicalEntries} goalHours={goalHours} />
    </div>
  );
}
