import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { dreamTypeSchema, moodOnWakeSchema, type MorningEntryInput, type SleepEntry } from "@dreamlog/shared";
import { apiClient } from "../lib/api-client";

const formSchema = z.object({
  wake_time: z.string().min(1, "Requerido"),
  sleep_quality: z.coerce.number().int().min(1).max(10),
  mood_on_wake: moodOnWakeSchema,
  energy_level: z.coerce.number().int().min(1).max(10),
  dream_had: z.boolean().default(false),
  dream_notes: z.string().optional(),
  dream_type: dreamTypeSchema.optional(),
  awakenings: z.coerce.number().int().min(0).default(0),
  notes_morning: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

function toWakeISODateTime(sleepDate: string, sleepTime: string | null | undefined, wakeHHMM: string): string {
  const base = new Date(sleepDate);
  const [h, m] = wakeHHMM.split(":").map(Number);
  const wake = new Date(base);
  wake.setHours(h, m, 0, 0);

  if (sleepTime && wake.getTime() <= new Date(sleepTime).getTime()) {
    wake.setDate(wake.getDate() + 1);
  }
  return wake.toISOString();
}

const inputClass =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900";
const labelClass = "mb-1 block text-sm text-slate-500";

export function MorningEntry() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [entry, setEntry] = useState<SleepEntry | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { dream_had: false, awakenings: 0 },
  });

  const dreamHad = watch("dream_had");

  useEffect(() => {
    if (!id) return;
    apiClient
      .get<{ entry: SleepEntry }>(`/sleep/${id}`)
      .then((res) => setEntry(res.entry))
      .catch((e: Error) => setLoadError(e.message));
  }, [id]);

  async function onSubmit(values: FormValues) {
    if (!id || !entry) {
      setSubmitError("La entrada aún no ha cargado. Espera un momento e intenta de nuevo.");
      return;
    }
    setSubmitError(null);

    const payload: MorningEntryInput = {
      wake_time: toWakeISODateTime(entry.sleep_date, entry.sleep_time, values.wake_time),
      sleep_quality: values.sleep_quality,
      mood_on_wake: values.mood_on_wake,
      energy_level: values.energy_level,
      dream_had: values.dream_had,
      dream_notes: values.dream_had ? values.dream_notes : undefined,
      dream_type: values.dream_had ? values.dream_type : undefined,
      awakenings: values.awakenings,
      notes_morning: values.notes_morning || undefined,
    };

    try {
      await apiClient.patch(`/sleep/${id}/morning`, payload);
      navigate("/log", { replace: true });
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Error desconocido");
    }
  }

  function onInvalid(formErrors: typeof errors) {
    const messages = Object.entries(formErrors)
      .map(([field, err]) => `${field}: ${err?.message ?? "inválido"}`)
      .join(" · ");
    setSubmitError(messages || "El formulario tiene errores");
  }

  if (loadError) {
    return <p className="text-sm text-red-500">Error al cargar la entrada: {loadError}</p>;
  }

  if (!entry) {
    return <p className="text-sm text-slate-500">Cargando...</p>;
  }

  return (
    <div className="mx-auto max-w-lg">
      <h2 className="mb-1 text-2xl font-semibold">☀️ Registro matutino</h2>
      <p className="mb-4 text-sm text-slate-500">
        Noche del {entry.sleep_date.slice(0, 10)}
        {entry.sleep_time && ` · Te acostaste a las ${new Date(entry.sleep_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
      </p>

      <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-4">
        <div>
          <label className={labelClass} htmlFor="wake_time">
            Hora en que despertaste
          </label>
          <input id="wake_time" type="time" className={inputClass} {...register("wake_time")} />
          {errors.wake_time && <p className="mt-1 text-xs text-red-500">{errors.wake_time.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass} htmlFor="sleep_quality">
              Calidad del sueño (1-10)
            </label>
            <input
              id="sleep_quality"
              type="number"
              min={1}
              max={10}
              className={inputClass}
              {...register("sleep_quality")}
            />
            {errors.sleep_quality && <p className="mt-1 text-xs text-red-500">{errors.sleep_quality.message}</p>}
          </div>
          <div>
            <label className={labelClass} htmlFor="energy_level">
              Nivel de energía (1-10)
            </label>
            <input
              id="energy_level"
              type="number"
              min={1}
              max={10}
              className={inputClass}
              {...register("energy_level")}
            />
            {errors.energy_level && <p className="mt-1 text-xs text-red-500">{errors.energy_level.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass} htmlFor="mood_on_wake">
              Estado de ánimo al despertar
            </label>
            <select id="mood_on_wake" className={inputClass} {...register("mood_on_wake")}>
              <option value="rested">Descansado</option>
              <option value="neutral">Neutral</option>
              <option value="groggy">Aturdido</option>
              <option value="anxious">Ansioso</option>
              <option value="happy">Feliz</option>
              <option value="sad">Triste</option>
              <option value="irritable">Irritable</option>
            </select>
            {errors.mood_on_wake && <p className="mt-1 text-xs text-red-500">{errors.mood_on_wake.message}</p>}
          </div>
          <div>
            <label className={labelClass} htmlFor="awakenings">
              Veces que despertaste
            </label>
            <input id="awakenings" type="number" min={0} className={inputClass} {...register("awakenings")} />
          </div>
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register("dream_had")} />
            ¿Tuviste sueños?
          </label>
        </div>

        {dreamHad && (
          <div className="space-y-4 pl-6">
            <div>
              <label className={labelClass} htmlFor="dream_type">
                Tipo de sueño
              </label>
              <select id="dream_type" className={inputClass} {...register("dream_type")}>
                <option value="">--</option>
                <option value="neutral">Neutral</option>
                <option value="pleasant">Agradable</option>
                <option value="nightmare">Pesadilla</option>
                <option value="lucid">Lúcido</option>
                <option value="recurring">Recurrente</option>
                <option value="forgot">No lo recuerdo</option>
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor="dream_notes">
                Descripción del sueño
              </label>
              <textarea id="dream_notes" rows={3} className={inputClass} {...register("dream_notes")} />
            </div>
          </div>
        )}

        <div>
          <label className={labelClass} htmlFor="notes_morning">
            Notas de la mañana
          </label>
          <textarea id="notes_morning" rows={3} className={inputClass} {...register("notes_morning")} />
        </div>

        {submitError && <p className="text-sm text-red-500">{submitError}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900"
        >
          {isSubmitting ? "Guardando..." : "Guardar registro matutino"}
        </button>
      </form>
    </div>
  );
}
