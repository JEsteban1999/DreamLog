import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { SleepEntry } from "@dreamlog/shared";
import { apiClient } from "../lib/api-client";
import { btnPrimary, card, pageTitle } from "../lib/ui";

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "--";
  return new Date(value).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

function formatTime(value: string | null | undefined): string {
  if (!value) return "--";
  return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-hairsoft py-2.5 text-sm last:border-0">
      <span className="text-muted">{label}</span>
      <span className="text-right font-medium text-ink">{value ?? "--"}</span>
    </div>
  );
}

export function EntryDetail() {
  const { id } = useParams<{ id: string }>();
  const [entry, setEntry] = useState<SleepEntry | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    apiClient
      .get<{ entry: SleepEntry }>(`/sleep/${id}`)
      .then((res) => setEntry(res.entry))
      .catch((e: Error) => setError(e.message));
  }, [id]);

  if (error) return <p className="text-sm text-danger">Error: {error}</p>;
  if (!entry) return <p className="text-sm text-faint">Cargando…</p>;

  return (
    <div className="mx-auto max-w-lg">
      <Link to="/log" className="mb-4 inline-block text-sm text-muted hover:text-ink">
        ← Volver al historial
      </Link>
      <h2 className={`mb-5 ${pageTitle}`}>Noche del {entry.sleep_date.slice(0, 10)}</h2>

      <section className={`mb-4 p-5 ${card}`}>
        <h3 className="mb-2 font-semibold text-ink">🌙 Nocturno</h3>
        <Row label="Hora de acostarse" value={formatDateTime(entry.sleep_time)} />
        <Row label="Tazas de café" value={entry.caffeine_cups} />
        <Row label="Último café" value={formatTime(entry.caffeine_last_hour)} />
        <Row label="Ejercicio" value={entry.exercise ? `Sí (${entry.exercise_type ?? "?"})` : "No"} />
        {entry.exercise && <Row label="Hora de ejercicio" value={formatTime(entry.exercise_hour)} />}
        <Row label="Horas de pantalla" value={entry.screen_time_hours} />
        <Row label="Pantalla antes de dormir" value={entry.screen_before_sleep ? "Sí" : "No"} />
        <Row label="Nivel de estrés" value={entry.stress_level ?? "--"} />
        <Row label="Fuente de estrés" value={entry.stress_source ?? "--"} />
        <Row label="Alcohol" value={entry.alcohol ? `Sí (${entry.alcohol_drinks} bebidas)` : "No"} />
        <Row label="Comida pesada" value={entry.heavy_meal ? "Sí" : "No"} />
        <Row label="Siesta" value={entry.nap_today ? `Sí (${entry.nap_duration_min} min)` : "No"} />
        {entry.notes_before && <Row label="Notas" value={entry.notes_before} />}
      </section>

      {entry.is_complete ? (
        <section className={`mb-4 p-5 ${card}`}>
          <h3 className="mb-2 font-semibold text-ink">☀️ Matutino</h3>
          <Row label="Hora de despertar" value={formatDateTime(entry.wake_time)} />
          <Row label="Duración" value={entry.duration_hours ? `${entry.duration_hours}h` : "--"} />
          <Row label="Eficiencia" value={entry.sleep_efficiency ? `${entry.sleep_efficiency}%` : "--"} />
          <Row label="Calidad" value={entry.sleep_quality ? `${entry.sleep_quality}/10` : "--"} />
          <Row label="Energía" value={entry.energy_level ? `${entry.energy_level}/10` : "--"} />
          <Row label="Ánimo al despertar" value={entry.mood_on_wake ?? "--"} />
          <Row label="Veces que despertó" value={entry.awakenings} />
          <Row label="¿Tuvo sueños?" value={entry.dream_had ? `Sí (${entry.dream_type ?? "?"})` : "No"} />
          {entry.dream_notes && <Row label="Descripción del sueño" value={entry.dream_notes} />}
          {entry.notes_morning && <Row label="Notas de la mañana" value={entry.notes_morning} />}
        </section>
      ) : (
        <Link to={`/log/${entry.id}/morning`} className={`${btnPrimary} w-full`}>
          ☀️ Completar registro matutino
        </Link>
      )}
    </div>
  );
}
