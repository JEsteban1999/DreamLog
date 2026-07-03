import { useState } from "react";
import type { WeeklyReport, MonthlyReport } from "@dreamlog/shared";
import { apiClient } from "../lib/api-client";
import { btnPrimary, card, pageTitle } from "../lib/ui";

const TREND_LABELS: Record<WeeklyReport["trend"], string> = {
  improving: "📈 Mejorando",
  declining: "📉 Empeorando",
  stable: "➡️ Estable",
};

const PRIORITY_STYLE: Record<string, string> = {
  alta: "bg-warmsoft text-warm",
  media: "bg-coolsoft text-cool",
  baja: "bg-card2 text-faint",
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
    <section className={`p-5 ${card}`}>
      <div className="mb-3 flex items-center justify-between gap-4">
        <h3 className="font-serif text-lg font-semibold text-ink">Reporte semanal</h3>
        <button type="button" onClick={load} disabled={loading} className={btnPrimary}>
          {loading ? "Generando…" : report ? "Actualizar" : "Generar"}
        </button>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      {report && (
        <div className="space-y-4 text-sm">
          <p className="leading-relaxed text-ink">{report.summary}</p>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-coolsoft px-2.5 py-1 text-[11px] font-semibold text-cool">
              {TREND_LABELS[report.trend]}
            </span>
            <span className="rounded-full bg-warmsoft px-2.5 py-1 text-[11px] font-semibold text-warm">
              🌟 Mejor: {report.best_day}
            </span>
            <span className="rounded-full bg-card2 px-2.5 py-1 text-[11px] font-semibold text-faint">
              Peor: {report.worst_day}
            </span>
          </div>

          {report.patterns_detected.length > 0 && (
            <div>
              <p className="mb-1.5 font-semibold text-ink">Patrones detectados</p>
              <ul className="space-y-1.5">
                {report.patterns_detected.map((p, i) => (
                  <li key={i} className="text-muted">
                    <span className="text-ink">{p.pattern}</span>{" "}
                    <span className="text-[11px] text-faint">(confianza: {p.confidence})</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {report.recommendations.length > 0 && (
            <div>
              <p className="mb-1.5 font-semibold text-ink">Recomendaciones</p>
              <ul className="space-y-2">
                {report.recommendations.map((r, i) => (
                  <li key={i} className="rounded-xl border border-hairsoft bg-card2 p-3">
                    <div className="mb-1 flex items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                          PRIORITY_STYLE[r.priority] ?? PRIORITY_STYLE.baja
                        }`}
                      >
                        {r.priority}
                      </span>
                      <span className="text-[12px] font-semibold text-ink">{r.category}</span>
                    </div>
                    <p className="text-ink">{r.recommendation}</p>
                    <p className="mt-1 text-[11px] text-faint">{r.evidence}</p>
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
    <section className={`mt-5 p-5 ${card}`}>
      <div className="mb-3 flex items-center justify-between gap-4">
        <h3 className="font-serif text-lg font-semibold text-ink">Reporte mensual</h3>
        <button type="button" onClick={load} disabled={loading} className={btnPrimary}>
          {loading ? "Generando…" : report ? "Actualizar" : "Generar"}
        </button>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      {report && (
        <div className="space-y-4 text-sm">
          <p className="leading-relaxed text-ink">{report.summary}</p>
          <p className="text-muted">{report.comparison_with_previous_month}</p>

          {report.top_factors.length > 0 && (
            <div>
              <p className="mb-1.5 font-semibold text-ink">Factores más influyentes</p>
              <ul className="space-y-1.5">
                {report.top_factors.map((f, i) => (
                  <li key={i} className="text-muted">
                    {f.impact === "positive" ? "✅" : "⚠️"} <span className="font-medium text-ink">{f.factor}</span> —{" "}
                    {f.description}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {report.highlights.length > 0 && (
            <div>
              <p className="mb-1.5 font-semibold text-ink">Logros destacados</p>
              <ul className="list-inside list-disc space-y-1 text-muted">
                {report.highlights.map((h, i) => (
                  <li key={i}>{h}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="rounded-xl border border-hair border-l-[3px] border-l-warm bg-warmsoft px-4 py-3 text-ink">
            🎯 {report.suggested_goal}
          </div>
        </div>
      )}
    </section>
  );
}

export function Reports() {
  return (
    <div className="mx-auto max-w-lg">
      <h2 className={`mb-5 ${pageTitle}`}>Reportes</h2>
      <WeeklyReportCard />
      <MonthlyReportCard />
    </div>
  );
}
