import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { notificationSettingsSchema, type NotificationSettings, type UserProfile } from "@dreamlog/shared";
import { apiClient } from "../lib/api-client";
import { getExistingSubscription, isPushSupported, subscribeToPush, unsubscribeFromPush } from "../lib/push";

const profileFormSchema = z.object({
  name: z.string().max(100).optional(),
  timezone: z.string().min(1),
  goal_hours: z.coerce.number().min(1).max(24),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;
type NotificationFormValues = z.infer<typeof notificationSettingsSchema>;

const inputClass =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900";
const labelClass = "mb-1 block text-sm text-slate-500";

function ProfileForm() {
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<ProfileFormValues>({ resolver: zodResolver(profileFormSchema) });

  useEffect(() => {
    apiClient
      .get<UserProfile>("/user/profile")
      .then((profile) =>
        reset({ name: profile.name, timezone: profile.timezone, goal_hours: profile.goal_hours })
      )
      .catch((e: Error) => setError(e.message));
  }, [reset]);

  async function onSubmit(values: ProfileFormValues) {
    setSavedMsg(null);
    setError(null);
    try {
      await apiClient.patch("/user/profile", values);
      setSavedMsg("Perfil actualizado");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-lg border border-slate-200 p-4 dark:border-slate-800">
      <h3 className="font-semibold">Perfil</h3>

      <div>
        <label className={labelClass} htmlFor="name">
          Nombre
        </label>
        <input id="name" type="text" className={inputClass} {...register("name")} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass} htmlFor="timezone">
            Zona horaria
          </label>
          <input id="timezone" type="text" className={inputClass} {...register("timezone")} />
        </div>
        <div>
          <label className={labelClass} htmlFor="goal_hours">
            Objetivo de horas
          </label>
          <input
            id="goal_hours"
            type="number"
            step={0.5}
            min={1}
            max={24}
            className={inputClass}
            {...register("goal_hours")}
          />
        </div>
      </div>

      {savedMsg && <p className="text-sm text-green-600">{savedMsg}</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900"
      >
        {isSubmitting ? "Guardando..." : "Guardar perfil"}
      </button>
    </form>
  );
}

function NotificationsForm() {
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { isSubmitting },
  } = useForm<NotificationFormValues>({
    resolver: zodResolver(notificationSettingsSchema),
    defaultValues: {
      bedtime_reminder: true,
      bedtime_time: "22:00",
      wakeup_reminder: true,
      wakeup_time: "07:30",
      weekly_report: true,
      sleep_debt_alert: true,
      sleep_debt_threshold: 5,
      streak_reminder: true,
    },
  });

  useEffect(() => {
    apiClient
      .get<NotificationSettings | null>("/user/notifications")
      .then((settings) => {
        if (settings) reset(settings);
      })
      .catch((e: Error) => setError(e.message));
  }, [reset]);

  async function onSubmit(values: NotificationFormValues) {
    setSavedMsg(null);
    setError(null);
    try {
      await apiClient.patch("/user/notifications", values);
      setSavedMsg("Preferencias actualizadas");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    }
  }

  const bedtimeReminder = watch("bedtime_reminder");
  const wakeupReminder = watch("wakeup_reminder");
  const sleepDebtAlert = watch("sleep_debt_alert");

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="mt-6 space-y-4 rounded-lg border border-slate-200 p-4 dark:border-slate-800"
    >
      <h3 className="font-semibold">Notificaciones</h3>

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" {...register("bedtime_reminder")} />
          Recordatorio nocturno
        </label>
        {bedtimeReminder && <input type="time" className="w-32 rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-900" {...register("bedtime_time")} />}
      </div>

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" {...register("wakeup_reminder")} />
          Recordatorio matutino
        </label>
        {wakeupReminder && <input type="time" className="w-32 rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-900" {...register("wakeup_time")} />}
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" {...register("weekly_report")} />
        Reporte semanal
      </label>

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" {...register("sleep_debt_alert")} />
          Alerta de deuda de sueño
        </label>
        {sleepDebtAlert && (
          <input
            type="number"
            min={0}
            step={0.5}
            className="w-24 rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-900"
            {...register("sleep_debt_threshold")}
          />
        )}
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" {...register("streak_reminder")} />
        Recordatorio de racha
      </label>

      {savedMsg && <p className="text-sm text-green-600">{savedMsg}</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900"
      >
        {isSubmitting ? "Guardando..." : "Guardar notificaciones"}
      </button>
    </form>
  );
}

function PushToggle() {
  const [status, setStatus] = useState<"checking" | "subscribed" | "unsubscribed" | "unsupported">("checking");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isPushSupported()) {
      setStatus("unsupported");
      return;
    }
    getExistingSubscription().then((sub) => setStatus(sub ? "subscribed" : "unsubscribed"));
  }, []);

  async function handleEnable() {
    setBusy(true);
    setError(null);
    try {
      await subscribeToPush();
      setStatus("subscribed");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setBusy(false);
    }
  }

  async function handleDisable() {
    setBusy(true);
    setError(null);
    try {
      await unsubscribeFromPush();
      setStatus("unsubscribed");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-6 rounded-lg border border-slate-200 p-4 dark:border-slate-800">
      <h3 className="mb-2 font-semibold">Notificaciones push en este dispositivo</h3>
      <p className="mb-3 text-sm text-slate-500">
        Los horarios de arriba solo se disparan si activas las notificaciones push en este navegador.
      </p>

      {status === "unsupported" && (
        <p className="text-sm text-red-500">Este navegador no soporta notificaciones push.</p>
      )}
      {status === "checking" && <p className="text-sm text-slate-500">Verificando...</p>}
      {status === "subscribed" && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-green-600">✓ Activas en este dispositivo</span>
          <button
            type="button"
            onClick={handleDisable}
            disabled={busy}
            className="text-sm text-red-500 hover:underline disabled:opacity-50"
          >
            Desactivar
          </button>
        </div>
      )}
      {status === "unsubscribed" && (
        <button
          type="button"
          onClick={handleEnable}
          disabled={busy}
          className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900"
        >
          {busy ? "Activando..." : "Activar notificaciones"}
        </button>
      )}

      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
    </div>
  );
}

export function Settings() {
  return (
    <div className="mx-auto max-w-lg">
      <h2 className="mb-4 text-2xl font-semibold">Ajustes</h2>
      <ProfileForm />
      <NotificationsForm />
      <PushToggle />
    </div>
  );
}
