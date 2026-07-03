import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { notificationSettingsSchema, type NotificationSettings, type SleepEntry, type UserProfile } from "@dreamlog/shared";
import { apiClient, downloadFile } from "../lib/api-client";
import { getExistingSubscription, isPushSupported, subscribeToPush, unsubscribeFromPush } from "../lib/push";
import { DashboardCharts, getCompleteEntries } from "../components/dashboard/DashboardCharts";
import { exportDashboardToPdf } from "../lib/pdf-export";
import { btnPrimary, btnSecondary, card, input as inputClass, label as labelClass, pageTitle } from "../lib/ui";

const profileFormSchema = z.object({
  name: z.string().max(100).optional(),
  timezone: z.string().min(1),
  goal_hours: z.coerce.number().min(1).max(24),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;
type NotificationFormValues = z.infer<typeof notificationSettingsSchema>;

const sectionCard = `mt-5 space-y-4 p-5 ${card}`;
const sectionTitle = "font-serif text-lg font-semibold text-ink";
const checkboxClass = "h-4 w-4 accent-[var(--primary)]";
const toggleLabel = "flex items-center gap-2.5 text-sm text-ink";
const smallInput =
  "rounded-[10px] border border-hair bg-canvas px-2.5 py-1.5 text-sm text-ink focus:border-cool focus:outline-none";

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
      .then((profile) => reset({ name: profile.name, timezone: profile.timezone, goal_hours: profile.goal_hours }))
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
    <form onSubmit={handleSubmit(onSubmit)} className={sectionCard}>
      <h3 className={sectionTitle}>Perfil</h3>

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

      {savedMsg && <p className="text-sm text-success">{savedMsg}</p>}
      {error && <p className="text-sm text-danger">{error}</p>}

      <button type="submit" disabled={isSubmitting} className={btnPrimary}>
        {isSubmitting ? "Guardando…" : "Guardar perfil"}
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
    <form onSubmit={handleSubmit(onSubmit)} className={sectionCard}>
      <h3 className={sectionTitle}>Notificaciones</h3>

      <div className="flex items-center justify-between gap-3">
        <label className={toggleLabel}>
          <input type="checkbox" className={checkboxClass} {...register("bedtime_reminder")} />🌙 Recordatorio nocturno
        </label>
        {bedtimeReminder && <input type="time" className={`w-32 ${smallInput}`} {...register("bedtime_time")} />}
      </div>

      <div className="flex items-center justify-between gap-3">
        <label className={toggleLabel}>
          <input type="checkbox" className={checkboxClass} {...register("wakeup_reminder")} />☀️ Recordatorio matutino
        </label>
        {wakeupReminder && <input type="time" className={`w-32 ${smallInput}`} {...register("wakeup_time")} />}
      </div>

      <label className={toggleLabel}>
        <input type="checkbox" className={checkboxClass} {...register("weekly_report")} />📊 Reporte semanal
      </label>

      <div className="flex items-center justify-between gap-3">
        <label className={toggleLabel}>
          <input type="checkbox" className={checkboxClass} {...register("sleep_debt_alert")} />⚠️ Alerta de deuda de sueño
        </label>
        {sleepDebtAlert && (
          <input type="number" min={0} step={0.5} className={`w-24 ${smallInput}`} {...register("sleep_debt_threshold")} />
        )}
      </div>

      <label className={toggleLabel}>
        <input type="checkbox" className={checkboxClass} {...register("streak_reminder")} />🔥 Recordatorio de racha
      </label>

      {savedMsg && <p className="text-sm text-success">{savedMsg}</p>}
      {error && <p className="text-sm text-danger">{error}</p>}

      <button type="submit" disabled={isSubmitting} className={btnPrimary}>
        {isSubmitting ? "Guardando…" : "Guardar notificaciones"}
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
    <div className={`mt-5 p-5 ${card}`}>
      <h3 className={`mb-2 ${sectionTitle}`}>Push en este dispositivo</h3>
      <p className="mb-3 text-sm text-muted">
        Los horarios de arriba solo se disparan si activas las notificaciones push en este navegador.
      </p>

      {status === "unsupported" && <p className="text-sm text-danger">Este navegador no soporta notificaciones push.</p>}
      {status === "checking" && <p className="text-sm text-faint">Verificando…</p>}
      {status === "subscribed" && (
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-success">✓ Activas en este dispositivo</span>
          <button
            type="button"
            onClick={handleDisable}
            disabled={busy}
            className="text-sm text-faint hover:text-danger disabled:opacity-50"
          >
            Desactivar
          </button>
        </div>
      )}
      {status === "unsubscribed" && (
        <button type="button" onClick={handleEnable} disabled={busy} className={btnPrimary}>
          {busy ? "Activando…" : "Activar notificaciones"}
        </button>
      )}

      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
    </div>
  );
}

function ExportSection() {
  const [busy, setBusy] = useState<"csv" | "json" | "pdf" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pdfData, setPdfData] = useState<{ entries: SleepEntry[]; goalHours: number } | null>(null);
  const pdfChartsRef = useRef<HTMLDivElement>(null);

  async function handleExport(format: "csv" | "json") {
    setBusy(format);
    setError(null);
    try {
      await downloadFile(`/user/export?format=${format}`, `dreamlog-export.${format}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setBusy(null);
    }
  }

  async function handleExportPdf() {
    setBusy("pdf");
    setError(null);
    try {
      const [{ entries }, profile] = await Promise.all([
        apiClient.get<{ entries: SleepEntry[] }>("/sleep?limit=90"),
        apiClient.get<UserProfile>("/user/profile"),
      ]);
      // Monta las gráficas ocultas fuera de pantalla; se capturan en el efecto de abajo.
      setPdfData({ entries: entries.slice().reverse(), goalHours: profile.goal_hours ?? 8 });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
      setBusy(null);
    }
  }

  useEffect(() => {
    if (!pdfData) return;
    // Pequeño margen para que Recharts termine de medir y dibujar antes de capturar.
    const timer = setTimeout(async () => {
      try {
        if (pdfChartsRef.current) {
          await exportDashboardToPdf(pdfChartsRef.current, getCompleteEntries(pdfData.entries));
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error al generar el PDF");
      } finally {
        setPdfData(null);
        setBusy(null);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [pdfData]);

  return (
    <div className={`mt-5 p-5 ${card}`}>
      <h3 className={`mb-2 ${sectionTitle}`}>Exportar datos</h3>
      <p className="mb-3 text-sm text-muted">Descarga todo tu historial de sueño.</p>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => handleExport("csv")} disabled={busy !== null} className={btnPrimary}>
          {busy === "csv" ? "Descargando…" : "CSV"}
        </button>
        <button type="button" onClick={() => handleExport("json")} disabled={busy !== null} className={btnSecondary}>
          {busy === "json" ? "Descargando…" : "JSON"}
        </button>
        <button type="button" onClick={handleExportPdf} disabled={busy !== null} className={btnSecondary}>
          {busy === "pdf" ? "Generando PDF…" : "PDF"}
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}

      {pdfData && (
        <div className="fixed -left-[9999px] top-0 w-[800px]">
          <DashboardCharts ref={pdfChartsRef} entries={pdfData.entries} goalHours={pdfData.goalHours} />
        </div>
      )}
    </div>
  );
}

export function Settings() {
  return (
    <div className="mx-auto max-w-lg">
      <h2 className={pageTitle}>Ajustes</h2>
      <ProfileForm />
      <NotificationsForm />
      <PushToggle />
      <ExportSection />
    </div>
  );
}
