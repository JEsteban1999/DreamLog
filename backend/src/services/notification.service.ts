import { prisma } from "../lib/prisma.js";
import { webpush } from "../lib/webpush.js";

interface LocalParts {
  date: string; // YYYY-MM-DD en la zona horaria del usuario
  hhmm: string; // HH:MM en la zona horaria del usuario
}

function getLocalParts(timezone: string, now = new Date()): LocalParts {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return { date: `${get("year")}-${get("month")}-${get("day")}`, hhmm: `${get("hour")}:${get("minute")}` };
}

function minutesOfDay(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

// ¿El momento configurado cayó dentro de los últimos `windowMin` minutos?
// Usa aritmética modular para manejar el cruce de medianoche correctamente.
function isWithinWindow(currentHHMM: string, configuredHHMM: string, windowMin = 15): boolean {
  const diff = ((minutesOfDay(currentHHMM) - minutesOfDay(configuredHHMM)) % 1440 + 1440) % 1440;
  return diff < windowMin;
}

// ¿Ya pasó la hora configurada (sin importar cuánto)? Para condiciones tipo
// "avisar si a esta hora del día todavía no pasó X", no solo "avisar justo a esta hora".
function isPastTimeOfDay(currentHHMM: string, configuredHHMM: string): boolean {
  return minutesOfDay(currentHHMM) >= minutesOfDay(configuredHHMM);
}

async function sendToUser(userId: string, payload: { title: string; body: string }) {
  const subscriptions = await prisma.pushSubscription.findMany({ where: { user_id: userId } });

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify(payload)
        );
      } catch (err) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          // Suscripción expirada o revocada por el navegador
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        }
      }
    })
  );
}

async function computeWeeklySleepDebt(userId: string, goalHours: number, todayLocal: string): Promise<number> {
  const from = new Date(todayLocal);
  from.setDate(from.getDate() - 7);

  const entries = await prisma.sleepEntry.findMany({
    where: { user_id: userId, deleted_at: null, is_complete: true, sleep_date: { gte: from } },
  });

  return entries.reduce((debt, e) => debt + Math.max(0, goalHours - (e.duration_hours ?? goalHours)), 0);
}

async function hasActiveStreak(userId: string, todayLocal: string): Promise<boolean> {
  const entries = await prisma.sleepEntry.findMany({
    where: { user_id: userId, deleted_at: null, is_complete: true },
    orderBy: { sleep_date: "desc" },
    take: 30,
  });

  const loggedDates = new Set(entries.map((e) => e.sleep_date.toISOString().slice(0, 10)));

  // Racha "activa" = al menos ayer tiene registro completo.
  const yesterday = new Date(todayLocal);
  yesterday.setDate(yesterday.getDate() - 1);
  return loggedDates.has(yesterday.toISOString().slice(0, 10));
}

export async function checkAndSendReminders() {
  const users = await prisma.user.findMany({
    include: { preferences: true, push_subscriptions: true },
  });

  for (const user of users) {
    const prefs = user.preferences;
    if (!prefs || user.push_subscriptions.length === 0) continue;

    const { date, hhmm } = getLocalParts(user.timezone);

    if (
      prefs.bedtime_reminder &&
      isWithinWindow(hhmm, prefs.bedtime_time) &&
      prefs.last_bedtime_sent_date !== date
    ) {
      await sendToUser(user.id, {
        title: "🌙 ¿Listo para dormir?",
        body: "Registra tus factores del día antes de acostarte.",
      });
      await prisma.notificationSettings.update({
        where: { user_id: user.id },
        data: { last_bedtime_sent_date: date },
      });
    }

    if (
      prefs.wakeup_reminder &&
      isWithinWindow(hhmm, prefs.wakeup_time) &&
      prefs.last_wakeup_sent_date !== date
    ) {
      await sendToUser(user.id, {
        title: "☀️ Buenos días",
        body: "¿Cómo dormiste? Toma 1 minuto para registrarlo.",
      });
      await prisma.notificationSettings.update({
        where: { user_id: user.id },
        data: { last_wakeup_sent_date: date },
      });
    }

    if (prefs.sleep_debt_alert && prefs.last_debt_sent_date !== date) {
      const debt = await computeWeeklySleepDebt(user.id, user.goal_hours, date);
      if (debt > prefs.sleep_debt_threshold) {
        await sendToUser(user.id, {
          title: "⚠️ Deuda de sueño alta",
          body: `Llevas ${debt.toFixed(1)}h de deuda de sueño esta semana. Tu cuerpo lo necesita.`,
        });
        await prisma.notificationSettings.update({
          where: { user_id: user.id },
          data: { last_debt_sent_date: date },
        });
      }
    }

    // Racha en riesgo: solo tiene sentido avisar después de la hora de acostarse,
    // cuando ya casi se cierra la ventana para registrar la noche y mantener la racha.
    if (
      prefs.streak_reminder &&
      isPastTimeOfDay(hhmm, prefs.bedtime_time) &&
      prefs.last_streak_sent_date !== date
    ) {
      const [todayEntry, streakActive] = await Promise.all([
        prisma.sleepEntry.findFirst({ where: { user_id: user.id, deleted_at: null, sleep_date: new Date(date) } }),
        hasActiveStreak(user.id, date),
      ]);

      if (!todayEntry && streakActive) {
        await sendToUser(user.id, {
          title: "📝 No pierdas tu racha",
          body: "No olvides registrar tu sueño de esta noche.",
        });
        await prisma.notificationSettings.update({
          where: { user_id: user.id },
          data: { last_streak_sent_date: date },
        });
      }
    }
  }
}
