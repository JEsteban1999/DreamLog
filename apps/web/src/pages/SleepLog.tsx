import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { SleepEntry } from "@dreamlog/shared";
import { apiClient } from "../lib/api-client";
import { btnPrimary, pageTitle } from "../lib/ui";

export function SleepLog() {
  const [entries, setEntries] = useState<SleepEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  function reload() {
    apiClient
      .get<{ entries: SleepEntry[] }>("/sleep")
      .then((res) => setEntries(res.entries))
      .catch((e: Error) => setError(e.message));
  }

  useEffect(reload, []);

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este registro?")) return;
    await apiClient.delete(`/sleep/${id}`);
    reload();
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 className={pageTitle}>Historial</h2>
        <Link to="/log/new" className={btnPrimary}>
          <span>🌙</span>Nueva noche
        </Link>
      </div>

      {error && <p className="text-sm text-danger">Error: {error}</p>}
      {!entries && !error && <p className="text-sm text-faint">Cargando…</p>}
      {entries?.length === 0 && (
        <div className="rounded-2xl border border-hair bg-card p-8 text-center text-sm text-muted">
          Aún no hay registros. Empieza con tu primera noche.
        </div>
      )}

      <div className="space-y-2.5">
        {entries?.map((entry) => (
          <div
            key={entry.id}
            className="flex items-center justify-between gap-4 rounded-2xl border border-hair bg-card p-4"
          >
            <Link to={`/log/${entry.id}`} className="min-w-0 flex-1">
              <div className="flex items-center gap-2.5">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ background: entry.is_complete ? "var(--warm)" : "var(--fg3)" }}
                />
                <p className="font-medium text-ink">{entry.sleep_date.slice(0, 10)}</p>
              </div>
              <p className="mt-1 pl-[18px] text-[13px] text-muted">
                {entry.is_complete ? (
                  <>
                    <span className="font-serif tnum">{entry.duration_hours ?? "--"}</span>h · Calidad{" "}
                    <span className="font-serif tnum">{entry.sleep_quality ?? "--"}</span>/10
                  </>
                ) : (
                  "Falta completar el registro matutino"
                )}
              </p>
            </Link>
            <div className="flex shrink-0 items-center gap-3">
              {!entry.is_complete && (
                <Link to={`/log/${entry.id}/morning`} className="text-[13px] font-semibold text-cool hover:opacity-80">
                  Completar ☀️
                </Link>
              )}
              <button
                type="button"
                onClick={() => handleDelete(entry.id)}
                className="text-[13px] text-faint hover:text-danger"
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
