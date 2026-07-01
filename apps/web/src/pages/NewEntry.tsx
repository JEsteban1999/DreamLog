import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { exerciseTypeSchema, stressSourceSchema, type EveningEntryInput } from "@dreamlog/shared";
import { apiClient } from "../lib/api-client";

const formSchema = z.object({
  sleep_date: z.string().min(1, "Requerido"),
  sleep_time: z.string().min(1, "Requerido"),
  notes_before: z.string().optional(),
  caffeine_cups: z.coerce.number().int().min(0).default(0),
  caffeine_last_hour: z.string().optional(),
  exercise: z.boolean().default(false),
  exercise_type: exerciseTypeSchema.optional(),
  exercise_hour: z.string().optional(),
  screen_time_hours: z.coerce.number().min(0).default(0),
  screen_before_sleep: z.boolean().default(false),
  stress_level: z.coerce.number().int().min(1).max(10).optional(),
  stress_source: stressSourceSchema.optional(),
  alcohol: z.boolean().default(false),
  alcohol_drinks: z.coerce.number().int().min(0).default(0),
  heavy_meal: z.boolean().default(false),
  nap_today: z.boolean().default(false),
  nap_duration_min: z.coerce.number().int().min(0).default(0),
});

type FormValues = z.infer<typeof formSchema>;

function toISODateTime(date: string, time: string): string {
  return new Date(`${date}T${time}`).toISOString();
}

// La hora de acostarse suele caer después de medianoche (ej: te acuestas "la
// noche del 30" pero el reloj ya marca 01:00 del 1). Si la hora es de
// madrugada (antes de mediodía), se interpreta como el día siguiente a
// `sleep_date`. Los demás factores (café, ejercicio) sí ocurren el mismo
// `sleep_date` y no se desplazan.
function toBedtimeISODateTime(date: string, time: string): string {
  const [hours, minutes] = time.split(":").map(Number);
  const bedtime = new Date(date);
  bedtime.setHours(hours, minutes, 0, 0);
  if (hours < 12) {
    bedtime.setDate(bedtime.getDate() + 1);
  }
  return bedtime.toISOString();
}

function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

const inputClass =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900";
const labelClass = "mb-1 block text-sm text-slate-500";

export function NewEntry() {
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sleep_date: todayDate(),
      caffeine_cups: 0,
      exercise: false,
      screen_time_hours: 0,
      screen_before_sleep: false,
      alcohol: false,
      alcohol_drinks: 0,
      heavy_meal: false,
      nap_today: false,
      nap_duration_min: 0,
    },
  });

  const exercise = watch("exercise");
  const alcohol = watch("alcohol");
  const napToday = watch("nap_today");

  async function onSubmit(values: FormValues) {
    setSubmitError(null);
    const payload: EveningEntryInput = {
      sleep_date: values.sleep_date,
      sleep_time: toBedtimeISODateTime(values.sleep_date, values.sleep_time),
      notes_before: values.notes_before || undefined,
      caffeine_cups: values.caffeine_cups,
      caffeine_last_hour: values.caffeine_last_hour
        ? toISODateTime(values.sleep_date, values.caffeine_last_hour)
        : undefined,
      exercise: values.exercise,
      exercise_type: values.exercise ? values.exercise_type : undefined,
      exercise_hour:
        values.exercise && values.exercise_hour ? toISODateTime(values.sleep_date, values.exercise_hour) : undefined,
      screen_time_hours: values.screen_time_hours,
      screen_before_sleep: values.screen_before_sleep,
      stress_level: values.stress_level,
      stress_source: values.stress_source,
      alcohol: values.alcohol,
      alcohol_drinks: values.alcohol ? values.alcohol_drinks : 0,
      heavy_meal: values.heavy_meal,
      nap_today: values.nap_today,
      nap_duration_min: values.nap_today ? values.nap_duration_min : 0,
    };

    try {
      await apiClient.post("/sleep", payload);
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

  return (
    <div className="mx-auto max-w-lg">
      <h2 className="mb-1 text-2xl font-semibold">🌙 Registro nocturno</h2>
      <p className="mb-4 text-xs text-slate-500">
        "Fecha de la noche" es el día que estás cerrando (aunque te acuestes después de medianoche). Ej: si hoy es 1
        de julio y te acuestas a la 1 a.m., la fecha sigue siendo 30 de junio — los factores del día (café, ejercicio)
        se registran en esa fecha, y la hora de acostarse se ajusta sola al cruzar medianoche.
      </p>

      <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass} htmlFor="sleep_date">
              Fecha de la noche
            </label>
            <input id="sleep_date" type="date" className={inputClass} {...register("sleep_date")} />
            {errors.sleep_date && <p className="mt-1 text-xs text-red-500">{errors.sleep_date.message}</p>}
          </div>
          <div>
            <label className={labelClass} htmlFor="sleep_time">
              Hora de acostarse
            </label>
            <input id="sleep_time" type="time" className={inputClass} {...register("sleep_time")} />
            {errors.sleep_time && <p className="mt-1 text-xs text-red-500">{errors.sleep_time.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass} htmlFor="caffeine_cups">
              Tazas de café
            </label>
            <input
              id="caffeine_cups"
              type="number"
              min={0}
              className={inputClass}
              {...register("caffeine_cups")}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="caffeine_last_hour">
              Hora del último café
            </label>
            <input id="caffeine_last_hour" type="time" className={inputClass} {...register("caffeine_last_hour")} />
          </div>
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register("exercise")} />
            ¿Hiciste ejercicio hoy?
          </label>
        </div>

        {exercise && (
          <div className="grid grid-cols-2 gap-4 pl-6">
            <div>
              <label className={labelClass} htmlFor="exercise_type">
                Tipo
              </label>
              <select id="exercise_type" className={inputClass} {...register("exercise_type")}>
                <option value="">--</option>
                <option value="cardio">Cardio</option>
                <option value="weights">Pesas</option>
                <option value="yoga">Yoga</option>
                <option value="walk">Caminata</option>
                <option value="other">Otro</option>
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor="exercise_hour">
                Hora
              </label>
              <input id="exercise_hour" type="time" className={inputClass} {...register("exercise_hour")} />
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass} htmlFor="screen_time_hours">
              Horas frente a pantallas
            </label>
            <input
              id="screen_time_hours"
              type="number"
              min={0}
              step={0.5}
              className={inputClass}
              {...register("screen_time_hours")}
            />
          </div>
          <div className="flex items-end pb-2">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...register("screen_before_sleep")} />
              Pantalla en los últimos 60 min
            </label>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass} htmlFor="stress_level">
              Nivel de estrés (1-10)
            </label>
            <input
              id="stress_level"
              type="number"
              min={1}
              max={10}
              className={inputClass}
              {...register("stress_level")}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="stress_source">
              Fuente de estrés
            </label>
            <select id="stress_source" className={inputClass} {...register("stress_source")}>
              <option value="">--</option>
              <option value="work">Trabajo</option>
              <option value="personal">Personal</option>
              <option value="health">Salud</option>
              <option value="other">Otro</option>
            </select>
          </div>
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register("alcohol")} />
            ¿Consumiste alcohol?
          </label>
        </div>

        {alcohol && (
          <div className="pl-6">
            <label className={labelClass} htmlFor="alcohol_drinks">
              Número de bebidas
            </label>
            <input
              id="alcohol_drinks"
              type="number"
              min={0}
              className={inputClass}
              {...register("alcohol_drinks")}
            />
          </div>
        )}

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" {...register("heavy_meal")} />
          Comida pesada en las últimas 3h
        </label>

        <div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register("nap_today")} />
            ¿Tomaste siesta hoy?
          </label>
        </div>

        {napToday && (
          <div className="pl-6">
            <label className={labelClass} htmlFor="nap_duration_min">
              Duración de la siesta (min)
            </label>
            <input
              id="nap_duration_min"
              type="number"
              min={0}
              className={inputClass}
              {...register("nap_duration_min")}
            />
          </div>
        )}

        <div>
          <label className={labelClass} htmlFor="notes_before">
            Notas antes de dormir
          </label>
          <textarea id="notes_before" rows={3} className={inputClass} {...register("notes_before")} />
        </div>

        {submitError && <p className="text-sm text-red-500">{submitError}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900"
        >
          {isSubmitting ? "Guardando..." : "Guardar registro nocturno"}
        </button>
      </form>
    </div>
  );
}
