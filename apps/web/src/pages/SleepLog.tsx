import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { SleepEntry } from "@dreamlog/shared";
import { apiClient } from "../lib/api-client";

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
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Registro de sueño</h2>
        <Link
          to="/log/new"
          className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white dark:bg-slate-100 dark:text-slate-900"
        >
          + Nueva noche
        </Link>
      </div>

      {error && <p className="text-sm text-red-500">Error: {error}</p>}
      {!entries && !error && <p className="text-sm text-slate-500">Cargando...</p>}
      {entries?.length === 0 && <p className="text-sm text-slate-500">Aún no hay registros.</p>}

      <div className="space-y-2">
        {entries?.map((entry) => (
          <div
            key={entry.id}
            className="flex items-center justify-between rounded-lg border border-slate-200 p-4 dark:border-slate-800"
          >
            <Link to={`/log/${entry.id}`}>
              <p className="font-medium hover:underline">{entry.sleep_date.slice(0, 10)}</p>
              <p className="text-sm text-slate-500">
                {entry.is_complete
                  ? `${entry.duration_hours ?? "--"}h · Calidad ${entry.sleep_quality ?? "--"}/10`
                  : "Falta completar el registro matutino"}
              </p>
            </Link>
            <div className="flex items-center gap-3">
              {!entry.is_complete && (
                <Link to={`/log/${entry.id}/morning`} className="text-sm text-slate-900 underline dark:text-slate-100">
                  Completar mañana
                </Link>
              )}
              <button
                type="button"
                onClick={() => handleDelete(entry.id)}
                className="text-sm text-red-500 hover:underline"
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
