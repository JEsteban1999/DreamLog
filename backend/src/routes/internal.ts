import { Hono } from "hono";
import { timingSafeEqual } from "node:crypto";
import { checkAndSendReminders } from "../services/notification.service.js";

// Comparación en tiempo constante para el secreto del cron.
// Falla cerrado si el secreto no está configurado o las longitudes difieren.
function secretMatches(provided: string | undefined): boolean {
  const expected = process.env.CRON_SECRET;
  if (!provided || !expected) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export const internalRoutes = new Hono();

internalRoutes.post("/notifications/check", async (c) => {
  const token = c.req.header("Authorization")?.replace("Bearer ", "");

  if (!secretMatches(token)) {
    return c.json({ error: "No autorizado" }, 401);
  }

  await checkAndSendReminders();
  return c.json({ ok: true });
});
