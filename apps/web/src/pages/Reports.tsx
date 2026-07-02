import { useState } from "react";
import type { WeeklyReport, MonthlyReport } from "@dreamlog/shared";
import { apiClient } from "../lib/api-client";

const TREND_LABELS: Record<WeeklyReport["trend"], string> = {
  improving: "📈 Mejorando",
  declining: "📉 Empeorando",
  stable: "➡️ Estable",
};

function WeeklyReportCard() {
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<WeeklyReport>("/ai/report/weekly");
      setReport(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold">Reporte semanal</h3>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900"
        >
          {loading ? "Generando..." : report ? "Actualizar" : "Generar"}
        </button>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {report && (
        <div className="space-y-3 text-sm">
          <p>{report.summary}</p>
          <p className="text-slate-500">{TREND_LABELS[report.trend]}</p>
          <div className="grid grid-cols-2 gap-2">
            <p>
              <span className="text-slate-500">Mejor día:</span> {report.best_day}
            </p>
            <p>
              <span className="text-slate-500">Peor día:</span> {report.worst_day}
            </p>
          </div>

          {report.patterns_detected.length > 0 && (
            <div>
              <p className="font-medium">Patrones detectados</p>
              <ul className="mt-1 list-inside list-disc space-y-1">
                {report.patterns_detected.map((p, i) => (
                  <li key={i}>
                    {p.pattern} <span className="text-xs text-slate-500">(confianza: {p.confidence})</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {report.recommendations.length > 0 && (
            <div>
              <p className="font-medium">Recomendaciones</p>
              <ul className="mt-1 space-y-2">
                {report.recommendations.map((r, i) => (
                  <li key={i} className="rounded-md bg-slate-100 p-2 dark:bg-slate-800">
                    <p className="font-medium">
                      [{r.priority}] {r.category}
                    </p>
                    <p>{r.recommendation}</p>
                    <p className="text-xs text-slate-500">{r.evidence}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function MonthlyReportCard() {
  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<MonthlyReport>("/ai/report/monthly");
      setReport(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-6 rounded-lg border border-slate-200 p-4 dark:border-slate-800">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold">Reporte mensual</h3>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900"
        >
          {loading ? "Generando..." : report ? "Actualizar" : "Generar"}
        </button>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {report && (
        <div className="space-y-3 text-sm">
          <p>{report.summary}</p>
          <p className="text-slate-500">{report.comparison_with_previous_month}</p>

          {report.top_factors.length > 0 && (
            <div>
              <p className="font-medium">Factores más influyentes</p>
              <ul className="mt-1 space-y-1">
                {report.top_factors.map((f, i) => (
                  <li key={i}>
                    {f.impact === "positive" ? "✅" : "⚠️"} <span className="font-medium">{f.factor}</span> —{" "}
                    {f.description}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {report.highlights.length > 0 && (
            <div>
              <p className="font-medium">Logros destacados</p>
              <ul className="mt-1 list-inside list-disc">
                {report.highlights.map((h, i) => (
                  <li key={i}>{h}</li>
                ))}
              </ul>
            </div>
          )}

          <p className="rounded-md bg-slate-100 p-3 dark:bg-slate-800">🎯 {report.suggested_goal}</p>
        </div>
      )}
    </section>
  );
}

export function Reports() {
  return (
    <div className="mx-auto max-w-lg">
      <h2 className="mb-4 text-2xl font-semibold">Reportes</h2>
      <WeeklyReportCard />
      <MonthlyReportCard />
    </div>
  );
}
