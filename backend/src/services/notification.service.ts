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
  }
}
