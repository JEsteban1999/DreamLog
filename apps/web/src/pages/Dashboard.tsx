import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { SleepEntry, UserProfile } from "@dreamlog/shared";
import { apiClient } from "../lib/api-client";
import { DashboardCharts } from "../components/dashboard/DashboardCharts";
import { btnPrimary } from "../lib/ui";

interface SummaryStats {
  period_days: number;
  entries_count: number;
  avg_quality: number | null;
  avg_duration_hours: number | null;
  current_streak: number;
}

interface Kpi {
  label: string;
  value: string;
  unit?: string;
  sub?: string;
  dot: "--warm" | "--cool";
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Buenos días";
  if (h < 19) return "Buenas tardes";
  return "Buenas noches";
}

function todayLabel(): string {
  return new Date().toLocaleDateString("es", { weekday: "long", day: "numeric", month: "long" });
}

export function Dashboard() {
  const [stats, setStats] = useState<SummaryStats | null>(null);
  const [entries, setEntries] = useState<SleepEntry[] | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      apiClient.get<SummaryStats>("/sleep/stats/summary"),
      apiClient.get<{ entries: SleepEntry[] }>("/sleep?limit=90"),
      apiClient.get<UserProfile>("/user/profile"),
    ])
      .then(([summary, sleepRes, prof]) => {
        setStats(summary);
        setEntries(sleepRes.entries);
        setProfile(prof);
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  const goalHours = profile?.goal_hours ?? 8;
  const chronologicalEntries = (entries ?? []).slice().reverse(); // la API devuelve desc
  const name = profile?.name?.trim();

  const kpis: Kpi[] = stats
    ? [
        {
          label: "Horas promedio",
          value: stats.avg_duration_hours != null ? stats.avg_duration_hours.toFixed(1) : "--",
          unit: "h",
          sub: "esta semana",
          dot: "--warm",
        },
        {
          label: "Calidad promedio",
          value: stats.avg_quality != null ? stats.avg_quality.toFixed(1) : "--",
          unit: "/10",
          sub: "esta semana",
          dot: "--warm",
        },
        {
          label: "Registros",
          value: String(stats.entries_count),
          unit: "/7 noches",
          sub: "esta semana",
          dot: "--cool",
        },
        {
          label: "Racha",
          value: String(stats.current_streak),
          unit: stats.current_streak === 1 ? "noche" : "noches",
          sub: stats.current_streak > 0 ? "🎯 sigue así" : "empieza hoy",
          dot: "--cool",
        },
      ]
    : [];

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2 className="font-serif text-[26px] font-semibold leading-tight tracking-tight md:text-[28px]">
            {greeting()}
            {name ? `, ${name}` : ""}
          </h2>
          <p className="mt-1 text-[13px] capitalize text-muted">{todayLabel()}</p>
        </div>
        <Link to="/log/new" className={`${btnPrimary} hidden shrink-0 md:inline-flex`}>
          <span className="text-[15px]">🌙</span>Registrar noche
        </Link>
      </div>

      {error && <p className="mb-4 text-sm text-danger">Error al cargar datos: {error}</p>}

      {/* KPIs */}
      <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {(kpis.length ? kpis : [null, null, null, null]).map((kpi, i) => (
          <div key={i} className="rounded-2xl border border-hair bg-card p-4">
            {kpi ? (
              <>
                <div className="flex items-center gap-1.5 text-[11.5px] font-medium text-muted">
                  <span className="h-[7px] w-[7px] rounded-sm" style={{ background: `var(${kpi.dot})` }} />
                  {kpi.label}
                </div>
                <div className="mt-2 font-serif text-3xl font-semibold leading-none tnum">
                  {kpi.value}
                  {kpi.unit && <span className="font-sans text-[15px] text-faint">{kpi.unit}</span>}
                </div>
                {kpi.sub && <div className="mt-1.5 text-[11px] text-faint">{kpi.sub}</div>}
              </>
            ) : (
              <div className="text-2xl text-faint">…</div>
            )}
          </div>
        ))}
      </div>

      {stats && stats.entries_count === 0 && (
        <p className="mb-6 text-sm text-muted">
          Aún no hay registros. Toca <span className="font-semibold text-ink">Registrar noche</span> para tu primera
          noche.
        </p>
      )}

      <DashboardCharts entries={chronologicalEntries} goalHours={goalHours} />
    </div>
  );
}
